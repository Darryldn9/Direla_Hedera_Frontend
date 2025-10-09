# NFC Payment Implementation Guide for Direla

## Table of Contents
1. [Overview](#overview)
2. [How NFC Payments Work](#how-nfc-payments-work)
3. [Technical Architecture](#technical-architecture)
4. [iOS NFC Capabilities](#ios-nfc-capabilities)
5. [🚀 QUICK START: Receive Payments Flow](#-quick-start-receive-payments-flow)
6. [📱 How to Link NFC Tag to Your Hedera Account](#-how-to-link-nfc-tag-to-your-hedera-account)
7. [Implementation Steps](#implementation-steps)
8. [User Flows](#user-flows)
9. [Code Examples](#code-examples)
10. [Security Considerations](#security-considerations)
11. [Testing & Deployment](#testing--deployment)
12. [Limitations & Best Practices](#limitations--best-practices)

---

## Overview

NFC (Near Field Communication) payments in Direla will enable users to:
- **Tap to Pay**: Scan NFC tags or devices to make instant payments
- **Tap to Request**: Write payment requests to NFC tags for others to scan
- **Peer-to-Peer Transfers**: Exchange payment information by tapping two phones together
- **Merchant Point of Sale**: Merchants can create NFC payment tags for customers to tap and pay

### Why NFC for Payments?

- **Speed**: Transactions complete in 1-2 seconds
- **Convenience**: No need to manually enter account IDs or amounts
- **Offline-Capable**: Payment data can be read offline, then processed when online
- **Secure**: Short-range communication (max 4cm) reduces interception risk
- **Familiar UX**: Similar to Apple Pay, Google Pay contactless payments

---

## How NFC Payments Work

### Basic Flow

```
┌─────────────────┐                    ┌─────────────────┐
│   Merchant      │                    │   Customer      │
│   (Receiver)    │                    │   (Payer)       │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │ 1. Create Payment Request            │
         │    (Amount, Account, Currency)       │
         │                                      │
         │ 2. Write to NFC Tag/Device          │
         │    ─────────────────────────────>    │
         │                                      │
         │                      3. Customer taps phone to tag
         │                         (NFC Read)   │
         │                                      │
         │                      4. App reads payment data
         │                         & shows confirmation
         │                                      │
         │                      5. User approves payment
         │                                      │
         │ 6. Payment processed on Hedera      │
         │    <─────────────────────────────    │
         │                                      │
         │ 7. Both parties receive confirmation │
         │                                      │
```

### NFC Tag Types

1. **Static NFC Tags** (Physical stickers/cards)
   - Merchant places tags at checkout counter
   - Contains merchant's account ID and business info
   - Customer taps to pay, enters amount on their device

2. **Dynamic NFC Tags** (Phone-to-Phone)
   - Merchant's phone generates NFC signal with payment request
   - Customer taps their phone to merchant's phone
   - Full payment details (amount, account, currency) included

3. **Writable NFC Tags**
   - Merchant writes payment request with specific amount
   - Customer taps, sees amount, approves payment
   - Tag can be rewritten for next transaction

---

## Technical Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Direla App UI Layer                     │
│  (pay.tsx - Payment Screen with NFC Button)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 NFC Manager Hook (useNFC)                    │
│  - Initialize NFC                                            │
│  - Read NFC Tags                                             │
│  - Write NFC Tags                                            │
│  - Handle Background NFC (iOS)                               │
│  - Validate Payment Data                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              react-native-nfc-manager Library                │
│  - Native iOS NFC Bridges                                    │
│  - NDEF (NFC Data Exchange Format) Handling                  │
│  - CoreNFC Framework Interface                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    iOS CoreNFC Framework                     │
│  - NFCNDEFReaderSession (Read Tags)                         │
│  - NFCNDEFWriterSession (Write Tags - iOS 13+)              │
│  - NFCTagReaderSession (Advanced Tag Operations)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      NFC Hardware                            │
│  (iPhone 7+ for reading, iPhone XS+ for writing)            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
NFC Tag/Device
    │
    │ Contains NDEF Message
    │ ┌─────────────────────────────────────┐
    │ │  Record Type: "application/json"    │
    │ │  Payload: {                         │
    │ │    toAccountId: "0.0.12345",       │
    │ │    amount: 100.50,                 │
    │ │    currency: "HBAR",               │
    │ │    accountAlias: "Mama Thandi",    │
    │ │    memo: "Payment for groceries",  │
    │ │    merchant_user_id: "uuid-123",   │
    │ │    timestamp: "2025-01-04T...",    │
    │ │    fromCurrency: "USD",            │
    │ │    toCurrency: "HBAR",             │
    │ │    quoteId: "quote-456"            │
    │ │  }                                 │
    │ └─────────────────────────────────────┘
    │
    ▼
App reads & parses NDEF message
    │
    ▼
Validates payment data structure
    │
    ▼
Shows confirmation dialog to user
    │
    ▼
User approves → Calls processNFCPayment()
    │
    ▼
Same payment flow as QR code payments
(Handles currency conversion, DID logging, Hedera transaction)
```

---

## iOS NFC Capabilities

### Device Support

| Device | NFC Read | NFC Write | Background Read |
|--------|----------|-----------|-----------------|
| iPhone 6/6 Plus | ❌ | ❌ | ❌ |
| iPhone 7/7 Plus | ✅ | ❌ | ✅ (iOS 12+) |
| iPhone 8/8 Plus | ✅ | ❌ | ✅ (iOS 12+) |
| iPhone X | ✅ | ❌ | ✅ (iOS 12+) |
| iPhone XR/XS/XS Max | ✅ | ✅ | ✅ |
| iPhone 11/11 Pro | ✅ | ✅ | ✅ |
| iPhone 12/13/14/15/16 | ✅ | ✅ | ✅ |

### iOS NFC Modes

1. **Foreground Reading** (iOS 11+)
   - User opens app and taps NFC button
   - App explicitly starts NFC scanning session
   - User brings phone near NFC tag
   - Session automatically ends after read

2. **Background Tag Reading** (iOS 12+)
   - User doesn't need to open app
   - Tapping NFC tag opens app automatically
   - App receives tag data in background
   - Requires specific NDEF record format

3. **NDEF Writing** (iOS 13+)
   - App can write data to writable NFC tags
   - Useful for merchants creating payment tags
   - Limited to NDEF format tags (NFC Forum Type 2, 4, 5)

---

## 🚀 QUICK START: Receive Payments Flow

This section will walk you through implementing the **Receive Payment via NFC** feature step-by-step. This lets merchants/users write payment requests to NFC tags that customers can tap to pay.

### What You'll Build

By the end of this section, you'll be able to:
1. Press a "Request via NFC" button in the Direla app
2. See your iPhone activate NFC write mode
3. Hold an NFC tag near your iPhone
4. Write your Hedera account details + payment amount to the tag
5. Test by scanning the tag with another phone (or same phone later)

### Prerequisites

- ✅ iPhone XS or newer (iOS 13+ for NFC writing)
- ✅ Expo project with `react-native-nfc-manager` installed
- ✅ Physical NFC tags (NTAG213/215/216 recommended)
- ✅ Hedera account ID (e.g., `0.0.4804396`)
- ✅ Development environment set up

### Step-by-Step Implementation

---

#### **STEP 1: Install Dependencies**

```bash
cd frontend
npm install react-native-nfc-manager
```

---

#### **STEP 2: Configure iOS for NFC**

Update `frontend/app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.direla.app",
      "supportsTablet": true,
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["whatsapp"],
        "NFCReaderUsageDescription": "This app uses NFC to read payment information from tags and other devices for quick and secure payments on the Hedera network.",
        "com.apple.developer.nfc.readersession.formats": [
          "NDEF",
          "TAG"
        ]
      },
      "entitlements": {
        "com.apple.developer.nfc.readersession.formats": [
          "NDEF"
        ]
      }
    }
  }
}
```

Then rebuild native code:

```bash
npx expo prebuild --clean
```

---

#### **STEP 3: Create the NFC Hook**

Create `frontend/hooks/useNFC.ts`:

```typescript
import { useState, useEffect } from 'react';
import NfcManager, { NfcTech, Ndef, NfcEvents } from 'react-native-nfc-manager';
import { Platform, Alert } from 'react-native';

export interface NFCPaymentData {
  toAccountId: string;
  amount: number;
  currency: string;
  accountAlias?: string;
  memo?: string;
  merchant_user_id?: string;
  timestamp: string;
  fromCurrency?: string;
  toCurrency?: string;
  quoteId?: string;
}

export function useNFC() {
  const [isNFCSupported, setIsNFCSupported] = useState(false);
  const [isNFCEnabled, setIsNFCEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    async function checkNFC() {
      if (Platform.OS === 'ios') {
        try {
          const supported = await NfcManager.isSupported();
          setIsNFCSupported(supported);

          if (supported) {
            await NfcManager.start();
            const enabled = await NfcManager.isEnabled();
            setIsNFCEnabled(enabled);
          }
        } catch (error) {
          console.error('NFC check error:', error);
          setIsNFCSupported(false);
        }
      }
    }

    checkNFC();

    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const writeNFCTag = async (
    paymentData: NFCPaymentData,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    if (!isNFCSupported) {
      Alert.alert('NFC Not Supported', 'Your device does not support NFC writing.');
      return;
    }

    // Check iOS version for write support
    if (Platform.OS === 'ios' && Platform.Version < 13) {
      Alert.alert(
        'NFC Writing Not Supported',
        'NFC writing requires iOS 13 or later. Your device can only read NFC tags.'
      );
      return;
    }

    try {
      setIsScanning(true);

      // Request NFC technology for writing
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Hold your phone near a writable NFC tag',
      });

      // Convert payment data to JSON string
      const paymentJson = JSON.stringify(paymentData);

      // Create NDEF text record
      const textRecord = Ndef.textRecord(paymentJson);

      // Write to tag
      await NfcManager.ndefHandler.writeNdefMessage([textRecord]);

      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);
      onSuccess();
    } catch (error: any) {
      console.error('NFC write error:', error);
      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);

      if (error.message?.includes('cancelled')) {
        return;
      }

      onError(error.message || 'Failed to write to NFC tag');
    }
  };

  const cancelNFCScan = async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);
    } catch (error) {
      console.error('Error cancelling NFC scan:', error);
    }
  };

  return {
    isNFCSupported,
    isNFCEnabled,
    isScanning,
    writeNFCTag,
    cancelNFCScan,
  };
}
```

---

#### **STEP 4: Add NFC to pay.tsx (Receive Tab)**

Open `frontend/app/(tabs)/pay.tsx` and add the following:

**4.1 Import the hook at the top:**

```typescript
import { useNFC, NFCPaymentData } from '../../hooks/useNFC';
```

**4.2 Initialize the hook in the component:**

```typescript
export default function PayScreen() {
  // ... existing state ...

  // Add NFC hook
  const { isNFCSupported, isNFCEnabled, isScanning, writeNFCTag, cancelNFCScan } = useNFC();

  // ... rest of component ...
}
```

**4.3 Create the NFC write handler:**

Add this function inside the `PayScreen` component:

```typescript
// Handle NFC Payment Request (Write to tag)
const handleNFCPaymentRequest = () => {
  if (!selectedAccount) {
    Alert.alert('No Account', 'No payment account selected. Please select an account in settings.');
    return;
  }

  if (!amount || parseFloat(amount) <= 0) {
    Alert.alert('Invalid Amount', 'Please enter a valid amount first');
    return;
  }

  const paymentAmount = parseFloat(amount);
  const nfcPaymentData: NFCPaymentData = {
    toAccountId: selectedAccount.account_id,
    amount: paymentAmount,
    currency: receiverCurrency,
    accountAlias: selectedAccount.alias || `Account ${selectedAccount.account_id}`,
    memo: `Payment to ${selectedAccount.alias || selectedAccount.account_id}`,
    merchant_user_id: currentUser?.user_id,
    timestamp: new Date().toISOString(),
    fromCurrency: senderCurrency,
    toCurrency: receiverCurrency,
  };

  console.log('Writing NFC payment request:', nfcPaymentData);

  writeNFCTag(
    nfcPaymentData,
    () => {
      showSuccess(
        'NFC Tag Written',
        `Payment request for ${paymentAmount.toFixed(2)} ${receiverCurrency} has been written to the NFC tag.`,
        5000
      );
    },
    (error: string) => {
      showError('NFC Write Error', error, 5000);
    }
  );
};
```

**4.4 Find the "Request via NFC" button (around line 981-985) and update it:**

```typescript
<TouchableOpacity
  style={styles.requestMethodButton}
  onPress={handleNFCPaymentRequest}
>
  <Nfc size={20} color="#3498DB" />
  <Text style={styles.requestMethodText}>Request via NFC</Text>
  <ArrowRight size={16} color="#BDC3C7" />
</TouchableOpacity>
```

---

#### **STEP 5: Build and Run on iPhone**

```bash
# Build for iOS
npx expo run:ios --device

# Or if using EAS
eas build --platform ios --profile development
```

⚠️ **Important**: NFC **cannot** be tested in the iOS Simulator. You **must** use a physical iPhone XS or newer.

---

#### **STEP 6: Test the Receive Payment Flow**

1. **Open the Direla app** on your iPhone
2. **Go to the "Pay" tab** → **"Receive" sub-tab**
3. **Enter an amount** (e.g., `150.00`)
4. **Select currency** (e.g., `HBAR`)
5. **Tap "Request via NFC"** button
6. **You should see**:
   - iOS NFC system dialog appears: _"Hold your phone near a writable NFC tag"_
   - Top of iPhone screen shows NFC animation
7. **Hold a blank NFC tag** to the top back of your iPhone (near the camera)
8. **Wait 2-3 seconds** until you hear a success sound
9. **Success!** The tag now contains your payment request

**What happens next:**
- The NFC tag is now "linked" to your Hedera account
- It contains: your account ID, amount, currency, timestamp
- Anyone with an NFC-enabled phone can tap this tag and pay you

---

#### **STEP 7: Verify the Tag Works**

To verify the tag was written correctly:

1. **Download a free NFC reader app** (e.g., "NFC Tools" on App Store)
2. **Scan the tag** you just wrote
3. **You should see** JSON data like:

```json
{
  "toAccountId": "0.0.4804396",
  "amount": 150.00,
  "currency": "HBAR",
  "accountAlias": "Mama Thandi",
  "memo": "Payment to Mama Thandi",
  "timestamp": "2025-01-04T14:30:00.000Z"
}
```

If you see this data, **your NFC tag is successfully linked to your Hedera account!** 🎉

---

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "NFC Not Supported" alert | iPhone 7+ required for reading, iPhone XS+ for writing |
| NFC dialog doesn't appear | Check `app.json` has NFC entitlements, rebuild with `npx expo prebuild --clean` |
| "Session timeout" error | Hold phone closer to tag, keep steady for 2-3 seconds |
| Write fails silently | Tag may be locked/read-only, try a new tag |
| App crashes on button press | Ensure `NfcManager.start()` is called in useEffect |

---

## 📱 How to Link NFC Tag to Your Hedera Account

This section explains how to permanently link an NFC tag to your Hedera account so you can place it at your store/business for customers to tap and pay.

### What You'll Need

- ✅ NFC tags (buy on Amazon: "NTAG213 NFC Stickers")
- ✅ Your Hedera account ID (from Direla app settings)
- ✅ iPhone XS or newer (for writing)
- ✅ Direla app installed and configured

### Two Types of NFC Tags for Hedera Payments

#### 1. **Static Payment Tag** (Recommended for Merchants)

Contains only your account ID and business info. Customer enters the amount when they tap.

**Use Case**: Restaurant table, store counter, business card

**Pros**:
- Flexible - works for any payment amount
- One-time setup
- Never needs updating

**Cons**:
- Customer must manually enter amount

#### 2. **Dynamic Payment Tag** (Rewritable)

Contains account ID + specific payment amount. Customer just approves the preset amount.

**Use Case**: Fixed-price items, bills, invoices

**Pros**:
- Fastest checkout (no amount entry needed)
- Great for fixed prices

**Cons**:
- Must rewrite tag for different amounts
- Requires unlocked/writable tags

---

### Step-by-Step: Create a Static Payment Tag (Recommended)

#### **Step 1: Prepare Your Tag Data**

You need:
- Your Hedera account ID (e.g., `0.0.4804396`)
- Your business/personal name
- Preferred currency (optional)

#### **Step 2: Write "Amount: 0" to Tag**

In the Direla app:

1. Go to **Pay → Receive**
2. Enter amount: `0.01` (minimum required, but customer will change this)
3. Tap **"Request via NFC"**
4. Hold tag to iPhone until write completes

> **Note**: The `0.01` is just a placeholder. When customers scan this tag, they'll be prompted to enter their own amount.

#### **Step 3: (Optional) Write-Protect the Tag**

To prevent others from overwriting your tag:

1. Download **"NFC Tools"** app (free on App Store)
2. Scan your tag
3. Go to **"Other"** → **"Lock Tag"**
4. Confirm lock (⚠️ this is irreversible!)

Now your tag is permanently linked to your Hedera account and cannot be changed.

#### **Step 4: Place the Tag**

Stick the NFC tag:
- On your store counter
- On your business card
- On table tents at restaurant
- On product packaging
- On your office door

Add a sign: **"Tap Phone Here to Pay"** or **"NFC Payment Accepted"**

---

### Step-by-Step: Create a Dynamic Payment Tag (For Fixed Amounts)

Use this for specific invoices, bills, or fixed-price items.

#### **Step 1: Enter the Exact Amount**

In Direla app:

1. Go to **Pay → Receive**
2. Enter the **exact amount** you want to charge (e.g., `150.00`)
3. Select currency (e.g., `HBAR`)
4. Tap **"Request via NFC"**
5. Hold tag to iPhone

#### **Step 2: Tag is Ready**

Now when someone taps this tag, they'll see:

```
Pay 150.00 HBAR to Mama Thandi?
[Cancel] [Pay Now]
```

No need to enter amount - it's preset!

#### **Step 3: Update Tag for New Amounts**

When you need to change the amount:

1. Repeat Step 1 with new amount
2. Tap the **same tag** again
3. It will overwrite with new data

⚠️ **Note**: Don't lock these tags - you need to keep them writable for updates.

---

### Best Practices for NFC Tags

#### **Where to Place Tags**

✅ **Good Locations**:
- Store checkout counters
- Restaurant tables
- Business cards
- Product displays
- Office reception desks
- Market stalls

❌ **Avoid**:
- Near metal surfaces (interferes with NFC)
- Direct sunlight (degrades adhesive)
- Wet environments (unless waterproof tags)

#### **Tag Types to Buy**

| Tag Type | Storage | Best For | Price |
|----------|---------|----------|-------|
| NTAG213 | 144 bytes | Basic payment data | $0.30-0.50 |
| NTAG215 | 504 bytes | Payment + metadata | $0.50-0.80 |
| NTAG216 | 888 bytes | Rich payment data | $0.80-1.20 |

**Recommendation**: Start with **NTAG213** - plenty of space for payment data.

#### **Where to Buy**

- Amazon: Search "NTAG213 NFC stickers" (~$15 for 30 tags)
- AliExpress: Cheaper ($8 for 50 tags) but slower shipping
- Local electronics stores

#### **Tag Security**

1. **Write-protect static tags** (prevents tampering)
2. **Keep dynamic tags unlocked** (so you can update amounts)
3. **Use tamper-evident stickers** (shows if tag was replaced)
4. **Regularly audit tags** (scan to verify data is correct)
5. **Keep backup tags** (in case one fails)

---

### Multi-Tag Strategy for Merchants

**Setup 1: Coffee Shop**
- Counter tag: Static (any amount)
- Menu tags: Dynamic ($5 coffee, $8 latte, etc.)
- Tip jar tag: Static (customer chooses tip amount)

**Setup 2: Spaza Shop**
- Main counter tag: Static (for any purchase)
- Pricing tags on shelves: Dynamic (per product)
- Bulk purchase tag: Static (for large orders)

**Setup 3: Freelancer/Consultant**
- Business card tag: Static (client enters amount)
- Invoice tags: Dynamic (specific amounts per project)

---

### Advanced: Using Your Phone as an NFC Tag (HCE)

Instead of physical tags, you can turn your phone into a temporary NFC payment tag:

**Coming Soon**: Phone-to-phone payment using Host Card Emulation (HCE)
- Merchant opens Direla → "Request via NFC"
- Customer opens Direla → "Tap to Pay"
- Both phones tap together
- Payment data transfers wirelessly

*This feature is planned for Phase 2 of NFC implementation.*

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
cd frontend
npm install react-native-nfc-manager
npx expo prebuild --clean
```

### Step 2: Configure iOS Entitlements

Update `frontend/app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.direla.app",
      "supportsTablet": true,
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["whatsapp"],
        "NFCReaderUsageDescription": "This app uses NFC to read payment information from tags and other devices for quick and secure payments on the Hedera network.",
        "com.apple.developer.nfc.readersession.formats": [
          "NDEF",
          "TAG"
        ]
      },
      "entitlements": {
        "com.apple.developer.nfc.readersession.formats": [
          "NDEF"
        ]
      }
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-web-browser"
    ]
  }
}
```

### Step 3: Create NFC Hook

Create `frontend/hooks/useNFC.ts`:

```typescript
import { useState, useEffect } from 'react';
import NfcManager, { NfcTech, Ndef, NfcEvents } from 'react-native-nfc-manager';
import { Platform, Alert } from 'react-native';

export interface NFCPaymentData {
  toAccountId: string;
  amount: number;
  currency: string;
  accountAlias?: string;
  memo?: string;
  merchant_user_id?: string;
  timestamp: string;
  fromCurrency?: string;
  toCurrency?: string;
  quoteId?: string;
}

export function useNFC() {
  const [isNFCSupported, setIsNFCSupported] = useState(false);
  const [isNFCEnabled, setIsNFCEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    async function checkNFC() {
      if (Platform.OS === 'ios') {
        try {
          const supported = await NfcManager.isSupported();
          setIsNFCSupported(supported);

          if (supported) {
            await NfcManager.start();
            const enabled = await NfcManager.isEnabled();
            setIsNFCEnabled(enabled);
          }
        } catch (error) {
          console.error('NFC check error:', error);
          setIsNFCSupported(false);
        }
      }
    }

    checkNFC();

    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const readNFCTag = async (
    onSuccess: (data: NFCPaymentData) => void,
    onError: (error: string) => void
  ) => {
    if (!isNFCSupported) {
      Alert.alert('NFC Not Supported', 'Your device does not support NFC reading.');
      return;
    }

    if (!isNFCEnabled) {
      Alert.alert('NFC Disabled', 'Please enable NFC in your device settings.');
      return;
    }

    try {
      setIsScanning(true);

      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Hold your phone near an NFC payment tag',
      });

      // Read NDEF message
      const tag = await NfcManager.getTag();

      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        // Parse NDEF records
        const ndefRecords = tag.ndefMessage;

        for (const record of ndefRecords) {
          try {
            // Decode the payload
            const payloadText = Ndef.text.decodePayload(record.payload);

            // Try to parse as JSON
            const paymentData: NFCPaymentData = JSON.parse(payloadText);

            // Validate required fields
            if (paymentData.toAccountId && paymentData.amount && paymentData.currency) {
              await NfcManager.cancelTechnologyRequest();
              setIsScanning(false);
              onSuccess(paymentData);
              return;
            }
          } catch (parseError) {
            console.error('Failed to parse NDEF record:', parseError);
            continue;
          }
        }

        // No valid payment data found
        await NfcManager.cancelTechnologyRequest();
        setIsScanning(false);
        onError('NFC tag does not contain valid payment information');
      } else {
        await NfcManager.cancelTechnologyRequest();
        setIsScanning(false);
        onError('NFC tag is empty or unreadable');
      }
    } catch (error: any) {
      console.error('NFC read error:', error);
      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);

      if (error.message?.includes('cancelled')) {
        // User cancelled, don't show error
        return;
      }

      onError(error.message || 'Failed to read NFC tag');
    }
  };

  const writeNFCTag = async (
    paymentData: NFCPaymentData,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    if (!isNFCSupported) {
      Alert.alert('NFC Not Supported', 'Your device does not support NFC writing.');
      return;
    }

    // Check iOS version for write support
    if (Platform.OS === 'ios' && Platform.Version < 13) {
      Alert.alert(
        'NFC Writing Not Supported',
        'NFC writing requires iOS 13 or later. Your device can only read NFC tags.'
      );
      return;
    }

    try {
      setIsScanning(true);

      // Request NFC technology for writing
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Hold your phone near a writable NFC tag',
      });

      // Convert payment data to JSON string
      const paymentJson = JSON.stringify(paymentData);

      // Create NDEF text record
      const textRecord = Ndef.textRecord(paymentJson);

      // Write to tag
      await NfcManager.ndefHandler.writeNdefMessage([textRecord]);

      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);
      onSuccess();
    } catch (error: any) {
      console.error('NFC write error:', error);
      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);

      if (error.message?.includes('cancelled')) {
        return;
      }

      onError(error.message || 'Failed to write to NFC tag');
    }
  };

  const cancelNFCScan = async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);
    } catch (error) {
      console.error('Error cancelling NFC scan:', error);
    }
  };

  return {
    isNFCSupported,
    isNFCEnabled,
    isScanning,
    readNFCTag,
    writeNFCTag,
    cancelNFCScan,
  };
}
```

### Step 4: Update pay.tsx

Add NFC functionality to the existing payment screen:

```typescript
// Add import at top of file
import { useNFC, NFCPaymentData } from '../../hooks/useNFC';

// Inside PayScreen component, add:
const { isNFCSupported, isNFCEnabled, isScanning, readNFCTag, writeNFCTag, cancelNFCScan } = useNFC();

// Update handleMethodSelect function to handle NFC:
const handleMethodSelect = async (method: 'qr' | 'whatsapp' | 'tap' | 'contacts') => {
  console.log('Method selected:', method);

  if (method === 'tap') {
    // Start NFC scanning
    if (!isNFCSupported) {
      Alert.alert(
        'NFC Not Available',
        'Your device does not support NFC payments. Please use QR code or another payment method.'
      );
      return;
    }

    if (!isNFCEnabled) {
      Alert.alert(
        'Enable NFC',
        'Please enable NFC in your device settings to use tap to pay.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('App-Prefs:');
              }
            }
          }
        ]
      );
      return;
    }

    setPaymentMethod(method);

    // Start NFC reading
    readNFCTag(
      (paymentData: NFCPaymentData) => {
        // Handle successful NFC read - same as QR code flow
        handleNFCPaymentData(paymentData);
      },
      (error: string) => {
        Alert.alert('NFC Read Error', error);
        setPaymentMethod(null);
      }
    );
  } else if (method === 'qr') {
    // Existing QR code logic...
  } else {
    setPaymentMethod(method);
  }
};

// Add new function to handle NFC payment data
const handleNFCPaymentData = async (paymentData: NFCPaymentData) => {
  // Validate that we have a selected account to send from
  if (!selectedAccount) {
    Alert.alert(
      'No Account Selected',
      'Please select an account to send from in the settings.',
      [{ text: 'OK' }]
    );
    setPaymentMethod(null);
    return;
  }

  // Determine currencies
  const fromCurrency = paymentData.fromCurrency || selectedAccount?.currency || 'HBAR';
  const toCurrency = paymentData.toCurrency || paymentData.currency;

  let confirmationMessage = `Pay ${paymentData.amount.toFixed(2)} ${paymentData.currency} to ${paymentData.accountAlias || paymentData.toAccountId}?`;

  // If currencies are different, fetch and show quote
  if (fromCurrency !== toCurrency && selectedAccount) {
    try {
      const quote = await generateQuote({
        fromAccountId: selectedAccount.account_id,
        toAccountId: paymentData.toAccountId,
        amount: paymentData.amount,
        fromCurrency,
        toCurrency
      });

      if (quote) {
        confirmationMessage = `Pay ${quote.fromAmount.toFixed(2)} ${quote.fromCurrency} to ${paymentData.accountAlias || paymentData.toAccountId}?\n\nThey will receive: ${quote.toAmount.toFixed(2)} ${quote.toCurrency}`;
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      confirmationMessage += `\n\nNote: Unable to fetch exchange rate for ${fromCurrency} to ${toCurrency}. Payment will proceed with estimated conversion.`;
    }
  }

  // Display payment confirmation
  Alert.alert(
    'NFC Payment Request',
    confirmationMessage,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          setPaymentMethod(null);
        }
      },
      {
        text: 'Pay Now',
        onPress: () => {
          // Reuse existing QR payment processing logic
          processQRPayment(paymentData);
        }
      }
    ]
  );
};

// Add function for "Request via NFC" button in receive tab
const handleNFCPaymentRequest = () => {
  if (!selectedAccount) {
    Alert.alert('No Account', 'No payment account selected. Please select an account in settings.');
    return;
  }

  if (!amount || parseFloat(amount) <= 0) {
    Alert.alert('Invalid Amount', 'Please enter a valid amount first');
    return;
  }

  const paymentAmount = parseFloat(amount);
  const nfcPaymentData: NFCPaymentData = {
    toAccountId: selectedAccount.account_id,
    amount: paymentAmount,
    currency: receiverCurrency,
    accountAlias: selectedAccount.alias || `Account ${selectedAccount.account_id}`,
    memo: `Payment to ${selectedAccount.alias || selectedAccount.account_id}`,
    merchant_user_id: currentUser?.user_id,
    timestamp: new Date().toISOString(),
    fromCurrency: senderCurrency,
    toCurrency: receiverCurrency,
  };

  writeNFCTag(
    nfcPaymentData,
    () => {
      showSuccess(
        'NFC Tag Written',
        `Payment request for ${paymentAmount.toFixed(2)} ${receiverCurrency} has been written to the NFC tag.`,
        5000
      );
    },
    (error: string) => {
      showError('NFC Write Error', error, 5000);
    }
  );
};
```

Update the "Request via NFC" button (line 981-985):

```typescript
<TouchableOpacity
  style={styles.requestMethodButton}
  onPress={handleNFCPaymentRequest}
>
  <Nfc size={20} color="#3498DB" />
  <Text style={styles.requestMethodText}>Request via NFC</Text>
  <ArrowRight size={16} color="#BDC3C7" />
</TouchableOpacity>
```

---

## User Flows

### Flow 1: Customer Pays Merchant (Read NFC Tag)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Customer opens Direla app → Pay tab                      │
│                                                              │
│ 2. Taps "Tap to Pay" button                                 │
│    - App checks NFC support & permissions                   │
│    - Shows "Hold near NFC tag" message                      │
│                                                              │
│ 3. Customer brings phone near merchant's NFC tag            │
│    - Haptic feedback indicates successful read              │
│    - App parses payment data from tag                       │
│                                                              │
│ 4. App displays payment confirmation dialog:                │
│    ┌──────────────────────────────────────────────┐        │
│    │  NFC Payment Request                         │        │
│    │                                              │        │
│    │  Pay 150.00 HBAR to Mama Thandi's Spaza?   │        │
│    │                                              │        │
│    │  [Cancel]              [Pay Now]            │        │
│    └──────────────────────────────────────────────┘        │
│                                                              │
│ 5. Customer taps "Pay Now"                                  │
│    - App processes payment via Hedera                       │
│    - Shows processing toast                                 │
│                                                              │
│ 6. Payment confirmed                                        │
│    - Success toast displayed                                │
│    - Both parties receive confirmation                      │
│    - Transaction appears in history                         │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: Merchant Creates Payment Request (Write NFC Tag)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Merchant opens Direla app → Pay tab → "Request Payment" │
│                                                              │
│ 2. Enters payment amount: 150.00 HBAR                       │
│    - Selects currency (HBAR, USD, EUR, etc.)               │
│                                                              │
│ 3. Taps "Request via NFC" button                            │
│    - App shows "Hold near writable NFC tag" message        │
│                                                              │
│ 4. Merchant places phone on blank NFC sticker/card          │
│    - App writes payment data to tag                         │
│    - Haptic feedback confirms write                         │
│                                                              │
│ 5. Success message: "NFC tag written successfully"          │
│    - Tag now contains payment request                       │
│    - Can be placed on counter, table, or menu              │
│                                                              │
│ 6. Customer later taps tag → Payment flows as in Flow 1     │
└─────────────────────────────────────────────────────────────┘
```

### Flow 3: Phone-to-Phone Payment (Dynamic NFC)

```
┌────────────────────────────────┐  ┌────────────────────────────────┐
│        Merchant Phone          │  │        Customer Phone          │
│                                │  │                                │
│ 1. Opens "Request Payment"     │  │                                │
│    Enters amount: 150 HBAR     │  │                                │
│                                │  │                                │
│ 2. Taps "Request via NFC"      │  │                                │
│    Phone enters NFC write mode │  │                                │
│    (Emulating NFC tag)         │  │                                │
│         ║                      │  │                                │
│         ║                      │  │ 3. Opens "Tap to Pay"          │
│         ║                      │  │    Phone enters NFC read mode  │
│         ║                      │  │         ║                      │
│         ╚══════════════════════╬══╬═════════╝                      │
│    4. Phones tap together      │  │    NFC communication occurs    │
│       (< 4cm apart)            │  │    Payment data transferred    │
│         ╔══════════════════════╬══╬═════════╗                      │
│         ║                      │  │         ║                      │
│ 5. Write successful            │  │ 6. Read successful             │
│    Shows confirmation          │  │    Shows payment dialog        │
│                                │  │                                │
│                                │  │ 7. Customer approves payment   │
│                                │  │    Transaction processed       │
│                                │  │         │                      │
│                                │  │         ▼                      │
│ 8. Merchant receives payment   │◄─┼─────────┘                      │
│    notification                │  │                                │
└────────────────────────────────┘  └────────────────────────────────┘
```

---

## Code Examples

### Example 1: Reading NFC Payment Tag

```typescript
// User taps "Tap to Pay" button
const handleTapToPay = () => {
  readNFCTag(
    // Success callback
    (paymentData: NFCPaymentData) => {
      console.log('Payment data read from NFC:', paymentData);

      // Show confirmation dialog
      Alert.alert(
        'Confirm Payment',
        `Send ${paymentData.amount} ${paymentData.currency} to ${paymentData.accountAlias}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pay',
            onPress: () => processPayment(paymentData)
          }
        ]
      );
    },
    // Error callback
    (error: string) => {
      Alert.alert('NFC Error', error);
    }
  );
};
```

### Example 2: Writing Payment Request to NFC Tag

```typescript
// Merchant creates payment request
const createNFCPaymentRequest = () => {
  const paymentData: NFCPaymentData = {
    toAccountId: selectedAccount.account_id,
    amount: parseFloat(amount),
    currency: 'HBAR',
    accountAlias: 'Mama Thandi\'s Spaza Shop',
    memo: 'Payment for groceries',
    merchant_user_id: currentUser.user_id,
    timestamp: new Date().toISOString(),
  };

  writeNFCTag(
    paymentData,
    // Success callback
    () => {
      Alert.alert(
        'Success',
        'Payment request written to NFC tag. Customers can now tap to pay!'
      );
    },
    // Error callback
    (error: string) => {
      Alert.alert('Write Failed', error);
    }
  );
};
```

### Example 3: NFC Payment Data Structure

```json
{
  "toAccountId": "0.0.4804396",
  "amount": 150.00,
  "currency": "HBAR",
  "accountAlias": "Mama Thandi's Spaza Shop",
  "memo": "Payment for groceries - 2025-01-04",
  "merchant_user_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-04T14:30:00.000Z",
  "fromCurrency": "USD",
  "toCurrency": "HBAR",
  "quoteId": "quote-550e8400"
}
```

This JSON is:
1. Converted to string
2. Encoded as NDEF text record
3. Written to NFC tag
4. Read by customer's phone
5. Parsed back to JSON object
6. Validated and displayed for confirmation

---

## Security Considerations

### 1. Data Validation

```typescript
function validateNFCPaymentData(data: any): data is NFCPaymentData {
  // Check required fields
  if (!data.toAccountId || typeof data.toAccountId !== 'string') {
    return false;
  }

  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    return false;
  }

  if (!data.currency || typeof data.currency !== 'string') {
    return false;
  }

  // Validate Hedera account ID format
  const accountRegex = /^\d+\.\d+\.\d+$/;
  if (!accountRegex.test(data.toAccountId)) {
    return false;
  }

  // Check timestamp freshness (reject if older than 24 hours)
  if (data.timestamp) {
    const tagTime = new Date(data.timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - tagTime.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      console.warn('NFC tag data is stale (>24 hours old)');
      return false;
    }
  }

  return true;
}
```

### 2. Amount Limits

```typescript
const MAX_NFC_PAYMENT_AMOUNT = 10000; // Max HBAR per NFC transaction

function checkPaymentLimits(amount: number, currency: string): boolean {
  if (currency === 'HBAR' && amount > MAX_NFC_PAYMENT_AMOUNT) {
    Alert.alert(
      'Amount Too High',
      `NFC payments are limited to ${MAX_NFC_PAYMENT_AMOUNT} HBAR. Please use QR code for larger amounts.`
    );
    return false;
  }
  return true;
}
```

### 3. User Confirmation Required

- **Never auto-execute payments** from NFC reads
- Always show confirmation dialog with:
  - Recipient name/alias
  - Payment amount
  - Currency
  - Exchange rate (if applicable)
- Require explicit "Pay Now" tap

### 4. Replay Attack Prevention

```typescript
// Store processed payment hashes to prevent replay
const processedPayments = new Set<string>();

function generatePaymentHash(data: NFCPaymentData): string {
  return `${data.toAccountId}-${data.amount}-${data.timestamp}`;
}

function isPaymentProcessed(data: NFCPaymentData): boolean {
  const hash = generatePaymentHash(data);
  return processedPayments.has(hash);
}

function markPaymentProcessed(data: NFCPaymentData) {
  const hash = generatePaymentHash(data);
  processedPayments.add(hash);

  // Clear after 1 hour
  setTimeout(() => {
    processedPayments.delete(hash);
  }, 60 * 60 * 1000);
}
```

### 5. Physical Security

- NFC requires very close proximity (< 4cm)
- Unlike QR codes, can't be photographed from distance
- Harder to intercept than wireless payments
- Still vulnerable to physical tag tampering

**Best Practices:**
- Merchants should use tamper-evident NFC stickers
- Replace tags if physical damage suspected
- Regularly audit tag contents
- Use holographic or branded NFC tags

---

## Testing & Deployment

### Local Testing

1. **Install on Physical Device**
   ```bash
   cd frontend
   npx expo run:ios --device
   ```

   Note: NFC cannot be tested in simulator - requires real iPhone

2. **Get Test NFC Tags**
   - Buy NFC stickers/cards (NFC Forum Type 2 recommended)
   - NTAG213, NTAG215, NTAG216 work well
   - Available on Amazon for $10-20 per 10 tags

3. **Test Write → Read Flow**
   - Use app to write payment request to tag
   - Use same or different phone to read tag
   - Verify payment data matches

### Apple Developer Setup

1. **Enable NFC Capability**
   - Log into [developer.apple.com](https://developer.apple.com)
   - Go to Certificates, Identifiers & Profiles
   - Select your App ID
   - Enable "NFC Tag Reading" capability
   - Regenerate provisioning profile

2. **Update Xcode Project** (after `npx expo prebuild`)
   ```
   1. Open ios/YourApp.xcworkspace in Xcode
   2. Select project in navigator
   3. Go to "Signing & Capabilities" tab
   4. Click "+ Capability"
   5. Add "Near Field Communication Tag Reading"
   6. Verify entitlements file includes NFC
   ```

3. **Build & Deploy**
   ```bash
   # For development
   npx expo run:ios --device

   # For TestFlight/App Store
   eas build --platform ios
   ```

### TestFlight Testing

```bash
# Configure EAS
eas build:configure

# Build for TestFlight
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios
```

Once in TestFlight:
1. Install on test devices (iPhone 7+)
2. Test NFC read functionality
3. Test NFC write functionality (iPhone XS+)
4. Verify permission prompts appear correctly
5. Test error handling (disabled NFC, unsupported device, etc.)

---

## Limitations & Best Practices

### iOS Limitations

| Feature | Limitation | Workaround |
|---------|-----------|------------|
| Background Reading | Requires specific NDEF format | Use standard NDEF text records |
| Session Timeout | Auto-closes after 60s | Show clear timer to user |
| Write Support | iOS 13+ only | Gracefully degrade to read-only |
| Simultaneous Sessions | Only one NFC session at a time | Cancel previous before starting new |
| App Clips | Limited NFC access | Full app required for NFC |

### Best Practices

#### 1. User Experience

```typescript
// Show clear instructions
const showNFCInstructions = () => {
  Alert.alert(
    'How to Use NFC Payments',
    '1. Tap the "Tap to Pay" button\n' +
    '2. Hold your phone near the NFC tag\n' +
    '3. Keep phones together until you feel a vibration\n' +
    '4. Review and confirm the payment\n\n' +
    'Note: Your phone must be within 4cm of the tag.',
    [{ text: 'Got It' }]
  );
};
```

#### 2. Error Handling

```typescript
// Provide helpful error messages
const handleNFCError = (error: any) => {
  let userMessage = 'Failed to read NFC tag.';

  if (error.message?.includes('not supported')) {
    userMessage = 'Your device does not support NFC. Please use QR code instead.';
  } else if (error.message?.includes('disabled')) {
    userMessage = 'NFC is disabled. Enable it in Settings → NFC.';
  } else if (error.message?.includes('timeout')) {
    userMessage = 'NFC read timed out. Please try again and hold your phone closer.';
  } else if (error.message?.includes('cancelled')) {
    // User cancelled - don't show error
    return;
  }

  Alert.alert('NFC Error', userMessage, [
    { text: 'Try Again', onPress: () => retryNFC() },
    { text: 'Use QR Code', onPress: () => switchToQR() }
  ]);
};
```

#### 3. Fallback to QR Code

```typescript
// If NFC fails or unsupported, offer QR alternative
const PaymentMethodSelector = () => {
  if (!isNFCSupported) {
    return (
      <View>
        <Text>NFC not available on this device</Text>
        <Button title="Use QR Code Instead" onPress={switchToQR} />
      </View>
    );
  }

  return (
    <View>
      <Button title="Tap to Pay (NFC)" onPress={startNFC} />
      <Button title="Scan QR Code" onPress={switchToQR} />
    </View>
  );
};
```

#### 4. Merchant Setup Guide

For merchants using NFC tags:

1. **Buy Quality Tags**
   - Use NFC Forum Type 2 tags (NTAG series)
   - Avoid cheap/generic tags that may fail
   - Consider waterproof tags for outdoor use

2. **Tag Placement**
   - Eye-level or counter-height
   - Clear "Tap Here to Pay" signage
   - Protected from weather/damage
   - Away from metal surfaces (interferes with NFC)

3. **Tag Management**
   - Write-protect tags after creating payment request
   - Keep backup tags ready
   - Audit tags monthly
   - Replace if damaged or unresponsive

4. **Dynamic vs Static**
   - **Static tags**: Contains only merchant account ID (customer enters amount)
   - **Dynamic tags**: Contains specific amount (faster checkout)
   - **Rewritable**: Update amount as needed (requires unprotected tags)

#### 5. Performance Optimization

```typescript
// Preload NFC manager on app start
useEffect(() => {
  async function initNFC() {
    if (Platform.OS === 'ios') {
      try {
        await NfcManager.start();
        console.log('NFC manager initialized');
      } catch (error) {
        console.warn('NFC init failed:', error);
      }
    }
  }

  initNFC();
}, []);

// Cleanup on unmount
useEffect(() => {
  return () => {
    NfcManager.cancelTechnologyRequest().catch(() => {});
  };
}, []);
```

---

## Summary

### What You'll Get

✅ **Fast Payments**: 1-2 second tap-to-pay experience
✅ **Merchant Tools**: Create NFC payment tags for customers
✅ **Offline Reading**: Read payment data even without internet
✅ **Currency Conversion**: Automatic quote generation for cross-currency payments
✅ **Secure**: Close-range communication with user confirmation
✅ **Familiar UX**: Similar to Apple Pay contactless experience

### Implementation Checklist

- [ ] Install `react-native-nfc-manager`
- [ ] Update `app.json` with NFC entitlements
- [ ] Create `useNFC` hook
- [ ] Update `pay.tsx` with NFC handlers
- [ ] Enable NFC capability in Apple Developer account
- [ ] Test on physical iOS device (iPhone 7+)
- [ ] Purchase NFC test tags
- [ ] Test write functionality (iPhone XS+)
- [ ] Handle errors gracefully
- [ ] Add user instructions/help screen
- [ ] Submit to TestFlight for beta testing
- [ ] Deploy to App Store

### Next Steps

1. **Implement basic NFC read** - Get tap-to-pay working first
2. **Add NFC write** - Enable merchants to create payment tags
3. **Test with real tags** - Validate end-to-end flow
4. **Polish UX** - Add animations, haptics, better error messages
5. **Deploy to production** - Release to users

---

**Need help implementing? Let me know and I can:**
- Install dependencies and configure the app
- Create the `useNFC` hook
- Update `pay.tsx` with NFC functionality
- Add error handling and UX improvements
- Help with Apple Developer account setup
- Guide you through testing and deployment
