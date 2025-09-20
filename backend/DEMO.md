# Hedera DID Demo

This demo shows how to create merchant DIDs and log transactions to the Hedera Consensus Service (HCS).

## Prerequisites

1. Hedera testnet account with HBAR balance
2. Supabase database with `users` table that includes a `did` column
3. Environment variables configured (see `.env` file)

## API Endpoints

### 1. Create Merchant DID

Creates a DID for a merchant and publishes a DID creation event to HCS.

```bash
# Create a merchant DID
curl -X POST http://localhost:3000/api/did/users \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "did": "did:hedera:testnet:550e8400-e29b-41d4-a716-446655440000",
    "hcs_transaction_id": "0.0.12345@1234567890.123456789",
    "hcs_explorer_link": "https://hashscan.io/testnet/transaction/0.0.12345@1234567890.123456789"
  }
}
```

### 2. Process Payment with DID Logging

Process a Hedera payment and optionally log it under a merchant's DID.

```bash
# Process payment with DID logging
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "0.0.12345",
    "toAccountId": "0.0.67890",
    "amount": 10.5,
    "memo": "Payment for services",
    "merchant_user_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "hedera_transaction": {
      "transactionId": "0.0.12345@1234567890.123456789",
      "status": "SUCCESS"
    },
    "did_logging": {
      "hcs_transaction_id": "0.0.12346@1234567890.123456790",
      "hcs_explorer_link": "https://hashscan.io/testnet/transaction/0.0.12346@1234567890.123456790"
    }
  },
  "message": "Payment processed successfully"
}
```

### 3. Log Transaction to DID (Direct)

Directly log a transaction under a merchant's DID without processing payment.

```bash
# Log transaction to DID
curl -X POST http://localhost:3000/api/did/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "hedera_account": "0.0.67890",
    "txn_id": "0.0.12345@1234567890.123456789",
    "amount": "150 ZAR"
  }'
```

### 4. Get User DID

Retrieve the DID for a specific user.

```bash
# Get user DID
curl -X GET http://localhost:3000/api/did/users/550e8400-e29b-41d4-a716-446655440000
```

## Environment Setup

Add these to your `.env` file:

```env
# Hedera Configuration
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=your_private_key_here
HEDERA_NETWORK=testnet

# Optional: HCS Topic ID (if not provided, a new topic will be created)
HCS_TOPIC_ID=0.0.TOPIC_ID

# Database Configuration
DATABASE_URL=your_supabase_url
```

## Database Schema

Make sure your `users` table includes the `did` column:

```sql
ALTER TABLE users ADD COLUMN did TEXT;
```

## HCS Message Formats

### DID Creation Event
```json
{
  "event": "did_creation",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "did": "did:hedera:testnet:550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-09-14T10:30:00.000Z",
  "platform_issuer": "did:hedera:testnet:platform-0.0.9999"
}
```

### Transaction Event
```json
{
  "event": "transaction",
  "merchant_did": "did:hedera:testnet:550e8400-e29b-41d4-a716-446655440000",
  "hedera_account": "0.0.67890",
  "txn_id": "0.0.12345@1234567890.123456789",
  "amount": "150 ZAR",
  "timestamp": "2024-09-14T10:35:00.000Z",
  "platform_issuer": "did:hedera:testnet:platform-0.0.9999"
}
```

## Verification

All HCS messages include an explorer link so judges can verify the messages on the Hedera network:

- Hedera Explorer: https://hashscan.io/testnet/transaction/{transactionId}

## Demo Flow

1. **Setup**: Start the server with `npm run dev`
2. **Create Merchant**: POST to `/api/did/users` with a user_id
3. **Verify DID Creation**: Check the HCS explorer link to see the DID creation message
4. **Process Payment**: POST to `/api/transactions` with merchant_user_id to log transaction
5. **Verify Transaction Log**: Check the HCS explorer link to see the transaction message

## Error Handling

- If a user already has a DID, the API returns a 409 Conflict
- If a merchant doesn't have a DID, transaction logging is skipped gracefully
- All HCS operations include proper error handling and fallback behavior
