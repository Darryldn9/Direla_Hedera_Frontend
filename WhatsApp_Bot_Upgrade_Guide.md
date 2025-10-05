
# WhatsApp Bot Upgrade Guide

This guide outlines how to upgrade the existing command-based WhatsApp bot to a more interactive and user-friendly experience. The new bot will feature interactive menus, multi-account support, payment requests with QR codes, and transaction history.

**Status: ✅ REVIEWED & APPROVED**
- Architecture is sound and scalable
- Integrates well with existing Hedera backend
- Clear implementation phases defined

## 1. Enhanced User Flow

The new user flow will be menu-driven, providing a more intuitive experience than the current command-based system.

**Initial Interaction:**

1.  When a new user messages the bot, they receive a welcome message and are prompted to link their Hedera account.
2.  Once an account is linked, the user is presented with a main menu of options.

**Main Menu:**

*   **Send Payment:** Initiates the process of sending HBAR to another account.
*   **Request Payment:** Allows the user to generate a payment request (with a QR code).
*   **View Transaction History:** Fetches and displays the user's recent transactions.
*   **Switch Account:** For users with multiple linked accounts, this option allows them to switch between them.
*   **Check Balance:** Displays the current balance of the selected account.

## 2. Technical Implementation

This section details the technical changes required to implement the enhanced WhatsApp bot. We will use a state machine to manage the user's conversation state and WhatsApp's interactive messages for the UI.

### 2.1. State Management

To manage the conversation flow, we'll introduce a simple state machine. We can add a `whatsapp_state` column to the `users` table (or a new table to track user state) to store the user's current state.

**Example States:**

*   `main_menu`
*   `awaiting_payment_amount`
*   `awaiting_payment_recipient`
*   `awaiting_request_amount`

### 2.2. Interactive Messages with Twilio

We will use Twilio's support for WhatsApp interactive messages (buttons and lists).

**Example of a button-based menu:**

```javascript
await twilioClient.messages.create({
  from: process.env.TWILIO_WHATSAPP_NUMBER,
  to: From,
  body: 'Welcome to the main menu. Please choose an option:',
  persistentAction: [
    'main_menu',
  ],
  contentSid: 'HX..._SID_...', // Replace with your Content Template SID
  contentVariables: {
    1: 'Send Payment',
    2: 'Request Payment',
    3: 'Transaction History',
  },
});
```

### 2.3. Refactoring `whatsapp.routes.ts`

The existing `whatsapp.routes.ts` will be refactored to handle the new interactive flow. The main webhook endpoint will now look something like this:

```typescript
// src/routes/whatsapp.routes.ts

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { From, Body, Button } = req.body;
    const phoneNumber = From.replace('whatsapp:', '');
    const message = Body.toLowerCase().trim();
    const buttonPayload = Button ? Button.Payload : null;

    const user = await getUserByPhoneNumber(phoneNumber);

    if (!user) {
      // Handle new user, prompt to link account
    } else {
      switch (user.whatsapp_state) {
        case 'main_menu':
          await handleMainMenu(user, buttonPayload);
          break;
        case 'awaiting_payment_amount':
          await handlePaymentAmount(user, message);
          break;
        // ... other states
        default:
          await sendMainMenu(user);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2.4. Account Management

**Account Switching:**

If a user has multiple accounts linked to their phone number, they can be presented with a list of accounts to choose from.

```typescript
// Function to send account selection menu
async function sendAccountSelectionMenu(user) {
  const accounts = await getAccountsByPhoneNumber(user.phone_number);
  // Use Twilio's list messages to display accounts
}
```

### 2.5. Payment Flows

**Sending a Payment:**

1.  User selects "Send Payment" from the main menu.
2.  Bot asks for the recipient's account ID.
3.  Bot asks for the amount.
4.  Bot asks for confirmation.
5.  Upon confirmation, the payment is processed.

**Requesting a Payment:**

1.  User selects "Request Payment" from the main menu.
2.  Bot asks for the amount.
3.  Bot generates a payment link and a QR code.
4.  Bot sends the QR code image and the payment link to the user.

### 2.6. QR Code Generation

We can use a library like `qrcode` to generate QR codes. **Note:** WhatsApp requires images to be hosted publicly.

**Example of generating a QR code:**

```typescript
// In your payment request handler
import * as QRCode from 'qrcode';

// Use same payment data format as frontend app
const paymentData = {
  toAccountId: user.account_id,
  amount: parseFloat(amount),
  currency: 'HBAR',
  accountAlias: user.alias || `Account ${user.account_id}`,
  memo: `Payment to ${user.alias || user.account_id}`,
  merchant_user_id: user.user_id,
  timestamp: new Date().toISOString(),
};

// Generate QR code with payment data
const qrBuffer = await QRCode.toBuffer(JSON.stringify(paymentData));

// Upload to cloud storage (Cloudinary, AWS S3, etc.)
const imageUrl = await uploadToCloudStorage(qrBuffer);

// Send QR code via WhatsApp
await twilioClient.messages.create({
  from: process.env.TWILIO_WHATSAPP_NUMBER,
  to: phoneNumber,
  body: `💳 Payment Request: ${amount} HBAR\n\nScan this QR code with your Direla app to pay instantly!`,
  mediaUrl: [imageUrl]
});
```

### 2.7. Transaction History

1.  User selects "Transaction History" from the main menu.
2.  The bot fetches the user's recent transactions from the database or the Hedera network.
3.  The transactions are formatted and sent to the user as a message.

## 3. Recommended Project Structure

To keep the code organized, we can create a new `whatsapp` directory inside the `services` directory.

```
src/
├── services/
│   ├── whatsapp/
│   │   ├── whatsapp.service.ts   // Core bot logic
│   │   ├── state.service.ts      // State management
│   │   └── menu.service.ts       // Menu generation
│   └── ...
└── routes/
    └── whatsapp.routes.ts      // Webhook endpoint
```

## 4. Database Schema Changes

### 4.1. Enhanced Session Management

Instead of just adding a state column, create a dedicated sessions table for better management:

```sql
-- Create WhatsApp sessions table
CREATE TABLE whatsapp_sessions (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id),
  current_state VARCHAR(50) DEFAULT 'main_menu',
  state_data JSONB DEFAULT '{}', -- Store temporary data like amount, recipient
  selected_account_id VARCHAR(255), -- Current active account
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour') -- Auto-cleanup
);

-- Add index for faster lookups
CREATE INDEX idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number);
CREATE INDEX idx_whatsapp_sessions_expires ON whatsapp_sessions(expires_at);

-- Optional: Add WhatsApp state to existing users table
ALTER TABLE users ADD COLUMN whatsapp_linked BOOLEAN DEFAULT FALSE;
```

### 4.2. Cloud Storage Configuration

For QR code image hosting, you'll need cloud storage setup:

```typescript
// Example with Cloudinary
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudStorage(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'whatsapp-qr' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    ).end(buffer);
  });
}
```

## 5. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up database schema (whatsapp_sessions table)
- [ ] Create basic state management system
- [ ] Implement welcome flow and account linking
- [ ] Set up interactive button menus

### Phase 2: Core Features (Week 3-4)
- [ ] Balance checking functionality
- [ ] Basic send payment flow
- [ ] Payment request generation
- [ ] Integration with existing Hedera API services

### Phase 3: Advanced Features (Week 5-6)
- [ ] QR code generation and cloud hosting
- [ ] Transaction history display
- [ ] Multi-account support
- [ ] Error handling and session timeouts

### Phase 4: Polish & Testing (Week 7-8)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security audit (webhook verification, rate limiting)
- [ ] User experience refinements

## 6. Security & Best Practices

### 6.1. Webhook Verification
```typescript
import { validateRequest } from 'twilio';

// Verify Twilio webhook authenticity
const signature = req.headers['x-twilio-signature'] as string;
const isValid = validateRequest(
  process.env.TWILIO_AUTH_TOKEN!,
  signature,
  `${process.env.BASE_URL}/api/whatsapp/webhook`,
  req.body
);

if (!isValid) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### 6.2. Rate Limiting & Validation
```typescript
// Rate limiting per phone number
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(phoneNumber: string): boolean {
  const now = Date.now();
  const userLimit = rateLimiter.get(phoneNumber);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(phoneNumber, { count: 1, resetTime: now + 60000 }); // 1 minute
    return true;
  }

  if (userLimit.count >= 10) { // Max 10 requests per minute
    return false;
  }

  userLimit.count++;
  return true;
}

// Input validation for amounts
function validateAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 10000; // Max 10,000 HBAR
}
```

### 6.3. Session Cleanup
```typescript
// Automatic session cleanup
setInterval(async () => {
  await db.query('DELETE FROM whatsapp_sessions WHERE expires_at < NOW()');
}, 5 * 60 * 1000); // Every 5 minutes
```

## 7. Integration with Existing Services

### 7.1. API Service Integration
```typescript
// Connect to your existing API services
import { api } from '../api';

async function getUserBalance(accountId: string) {
  const response = await api.hedera.getAccountBalance(accountId);
  return response.success ? response.data.balance : 0;
}

async function processPayment(fromAccount: string, toAccount: string, amount: number) {
  const paymentRequest = {
    fromAccountId: fromAccount,
    toAccountId: toAccount,
    amount: amount,
    memo: 'WhatsApp payment'
  };

  return await api.payment.processPayment(paymentRequest);
}
```

### 7.2. Consistent Data Formats
```typescript
// Use same payment data structure as frontend
interface WhatsAppPaymentData {
  toAccountId: string;
  amount: number;
  currency: 'HBAR';
  accountAlias?: string;
  memo?: string;
  merchant_user_id?: string;
  timestamp: string;
}
```

This comprehensive guide provides a solid foundation for building an interactive, secure, and user-friendly WhatsApp bot that integrates seamlessly with your existing Hedera payment system.
