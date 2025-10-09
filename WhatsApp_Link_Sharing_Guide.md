# WhatsApp Payment Request Integration Guide

## Overview
This guide shows how to implement WhatsApp payment request functionality in the pay screen, allowing users to send payment requests via WhatsApp with embedded payment data.

## Implementation Steps

### 1. Add Required Import
**File:** `frontend/app/(tabs)/pay.tsx`

Add `Linking` to the existing React Native imports:
```typescript
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Linking, // Add this
} from 'react-native';
```

### 2. Create WhatsApp Link Generator Function
**File:** `frontend/app/(tabs)/pay.tsx`

Add this function inside the `PayScreen` component (around line 171, after `onPaymentSuccess`):

```typescript
const generateWhatsAppPaymentLink = () => {
  if (!amount || parseFloat(amount) <= 0) {
    Alert.alert('Invalid Amount', 'Please enter a valid amount first');
    return;
  }

  if (!selectedAccount) {
    Alert.alert('No Account', 'No payment account selected');
    return;
  }

  // Create payment data (same as QR code)
  const paymentData = {
    toAccountId: selectedAccount.account_id,
    amount: parseFloat(amount) / 100,
    currency: 'HBAR',
    accountAlias: selectedAccount.alias || `Account ${selectedAccount.account_id}`,
    memo: `Payment to ${selectedAccount.alias || selectedAccount.account_id}`,
    merchant_user_id: currentUser?.user_id,
    timestamp: new Date().toISOString(),
  };

  // Create a readable message for WhatsApp
  const merchantName = mode === 'business' ? businessName : personalName;
  const message = `💳 Payment Request from ${merchantName}\n\n` +
    `Amount: ${paymentData.amount.toFixed(2)} HBAR\n` +
    `To: ${paymentData.accountAlias}\n\n` +
    `To pay, use this payment data in your Direla app:\n` +
    `${JSON.stringify(paymentData)}\n\n` +
    `Or scan the QR code when we meet! 📱`;

  // Create WhatsApp URL
  const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

  // Try to open WhatsApp
  Linking.canOpenURL(whatsappUrl)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          'WhatsApp Not Found',
          'WhatsApp is not installed on this device. Please install WhatsApp to send payment requests.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open App Store',
              onPress: () => {
                const appStoreUrl = Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/whatsapp-messenger/id310633997'
                  : 'https://play.google.com/store/apps/details?id=com.whatsapp';
                Linking.openURL(appStoreUrl);
              }
            }
          ]
        );
      }
    })
    .catch((err) => {
      console.error('Error opening WhatsApp:', err);
      Alert.alert('Error', 'Could not open WhatsApp. Please try again.');
    });
};
```

### 3. Add Platform Import
**File:** `frontend/app/(tabs)/pay.tsx`

Add `Platform` to the React Native imports:
```typescript
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Linking,
  Platform, // Add this
} from 'react-native';
```

### 4. Update WhatsApp Button
**File:** `frontend/app/(tabs)/pay.tsx`

Replace the existing WhatsApp button (around line 753-757) with:

```typescript
<TouchableOpacity
  style={styles.requestMethodButton}
  onPress={generateWhatsAppPaymentLink}
>
  <MessageCircle size={20} color="#25D366" />
  <Text style={styles.requestMethodText}>Send via WhatsApp</Text>
  <ArrowRight size={16} color="#BDC3C7" />
</TouchableOpacity>
```

### 5. Enhanced WhatsApp Integration (Optional)

For better user experience, you can also add:

#### A. Contact Selection Modal
Add state for contact selection:
```typescript
const [showContactModal, setShowContactModal] = useState(false);
const [selectedContact, setSelectedContact] = useState<QuickContact | null>(null);
```

#### B. Direct Contact WhatsApp Function
```typescript
const sendWhatsAppToContact = (contact: QuickContact) => {
  if (!amount || parseFloat(amount) <= 0) {
    Alert.alert('Invalid Amount', 'Please enter a valid amount first');
    return;
  }

  const paymentData = {
    toAccountId: selectedAccount.account_id,
    amount: parseFloat(amount) / 100,
    currency: 'HBAR',
    accountAlias: selectedAccount.alias || `Account ${selectedAccount.account_id}`,
    memo: `Payment to ${selectedAccount.alias || selectedAccount.account_id}`,
    merchant_user_id: currentUser?.user_id,
    timestamp: new Date().toISOString(),
  };

  const merchantName = mode === 'business' ? businessName : personalName;
  const message = `💳 Payment Request from ${merchantName}\n\n` +
    `Amount: ${paymentData.amount.toFixed(2)} HBAR\n` +
    `To: ${paymentData.accountAlias}\n\n` +
    `To pay, use this payment data in your Direla app:\n` +
    `${JSON.stringify(paymentData)}\n\n` +
    `Or scan the QR code when we meet! 📱`;

  // WhatsApp URL with specific phone number
  const whatsappUrl = `whatsapp://send?phone=${contact.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(message)}`;

  Linking.openURL(whatsappUrl).catch(() => {
    Alert.alert('Error', 'Could not open WhatsApp for this contact.');
  });
};
```

### 6. Additional Features

#### A. Copy Payment Link Button
Add this function for users who want to share via other apps:
```typescript
const copyPaymentData = async () => {
  if (!amount || parseFloat(amount) <= 0) {
    Alert.alert('Invalid Amount', 'Please enter a valid amount first');
    return;
  }

  const paymentData = {
    toAccountId: selectedAccount.account_id,
    amount: parseFloat(amount) / 100,
    currency: 'HBAR',
    accountAlias: selectedAccount.alias || `Account ${selectedAccount.account_id}`,
    memo: `Payment to ${selectedAccount.alias || selectedAccount.account_id}`,
    merchant_user_id: currentUser?.user_id,
    timestamp: new Date().toISOString(),
  };

  const merchantName = mode === 'business' ? businessName : personalName;
  const message = `💳 Payment Request from ${merchantName}\n\n` +
    `Amount: ${paymentData.amount.toFixed(2)} HBAR\n` +
    `To: ${paymentData.accountAlias}\n\n` +
    `Payment Data: ${JSON.stringify(paymentData)}`;

  // Copy to clipboard (requires @react-native-clipboard/clipboard)
  // Clipboard.setString(message);

  // For now, show alert with data
  Alert.alert(
    'Payment Request Data',
    message,
    [
      { text: 'OK' }
    ]
  );
};
```

## User Flow

1. User enters payment amount in "Request Payment" tab
2. User taps "Send via WhatsApp" button
3. Function generates payment data (same as QR code)
4. Creates formatted WhatsApp message with:
   - Payment amount
   - Recipient account info
   - JSON payment data for app integration
   - Instructions
5. Opens WhatsApp with pre-filled message
6. User selects contact and sends

## Technical Notes

- **Payment Data Format**: Uses same JSON structure as QR codes for consistency
- **WhatsApp URL Scheme**: Uses `whatsapp://send` protocol
- **Fallback Handling**: Detects if WhatsApp is installed, shows App Store link if not
- **Cross-Platform**: Works on both iOS and Android
- **Error Handling**: Graceful fallbacks for various failure scenarios

## Security Considerations

- Payment data is transmitted via WhatsApp (encrypted by WhatsApp)
- No sensitive keys or credentials are shared
- Payment still requires recipient to have Direla app to process
- Consider adding expiration timestamps to payment requests

## Testing

1. Test on device with WhatsApp installed
2. Test on device without WhatsApp (should show install prompt)
3. Verify payment data format matches QR code generation
4. Test with various contact phone number formats
5. Verify message formatting appears correctly in WhatsApp

This implementation provides a seamless way for users to send payment requests via WhatsApp while maintaining the same payment data structure used throughout the app.