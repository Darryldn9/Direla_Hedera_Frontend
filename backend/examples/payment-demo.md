# Payment Demo

This document demonstrates how to use the new Hedera account management and payment functionality.

## API Documentation

The complete API documentation is available via Swagger UI at: `http://localhost:3000/api-docs`

## 1. Create Hedera Accounts

Create Hedera accounts with automatic user creation. You can use either an existing user ID or provide email/password for new user signup:

### Option A: Using Email and Password (Recommended for new users)

```bash
# Create first account with email/password signup
curl -X POST http://localhost:3000/api/hedera-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "Alice Account",
    "initial_balance": 100,
    "email": "alice@example.com",
    "password": "securePassword123"
  }'

# Create second account with email/password signup
curl -X POST http://localhost:3000/api/hedera-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "Bob Account", 
    "initial_balance": 50,
    "email": "bob@example.com",
    "password": "securePassword456"
  }'
```

### Option B: Using Existing User ID

```bash
# Create account with existing user ID
curl -X POST http://localhost:3000/api/hedera-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "Existing User Account",
    "initial_balance": 25,
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

**Note**: 
- When using email/password, a new user will be created in Supabase Auth and automatically linked to a user record in your database
- When using an existing user_id, the system will check if the user exists in your database and create one if needed
- All users start with a balance of 0, which can be updated separately if needed

## 2. List All Accounts

View all stored Hedera accounts:

```bash
curl -X GET http://localhost:3000/api/hedera-accounts
```

## 3. Check Account Balances

Check the balance of a specific account:

```bash
curl -X GET http://localhost:3000/api/hedera/balance/0.0.123456
```

## 4. Process a Payment

Transfer HBAR between two stored accounts:

```bash
curl -X POST http://localhost:3000/api/hedera/payment \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "0.0.123456",
    "toAccountId": "0.0.789012", 
    "amount": 25.5,
    "memo": "Payment for services rendered"
  }'
```

## 5. Verify Updated Balances

After the payment, check the updated balances:

```bash
# Check sender balance
curl -X GET http://localhost:3000/api/hedera/balance/0.0.123456

# Check receiver balance  
curl -X GET http://localhost:3000/api/hedera/balance/0.0.789012
```

## 6. List Active Accounts

View only active accounts:

```bash
curl -X GET http://localhost:3000/api/hedera-accounts/active
```

## 7. Update Account

Update an account's alias or status:

```bash
curl -X PUT http://localhost:3000/api/hedera-accounts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "Alice Main Account",
    "isActive": true
  }'
```

## 8. API Documentation

The complete API documentation with interactive testing is available via Swagger UI:

- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/api/health`

## Error Handling

The API includes comprehensive error handling:

- **Account not found**: Returns 404 if account doesn't exist in database
- **User not found**: Users are automatically created when creating Hedera accounts
- **Missing required fields**: Returns 400 if required fields are missing
- **Insufficient balance**: Returns 400 if sender doesn't have enough HBAR
- **Inactive account**: Returns 400 if account is marked as inactive
- **Invalid amount**: Returns 400 if amount is not positive
- **Same account**: Returns 400 if trying to transfer to the same account
- **Invalid user ID**: Returns 400 if user_id is not provided for account creation

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "data": {...}, // Present on success
  "message": "Description of the operation",
  "error": "Error message" // Present on error
}
```

## Security Notes

- Private keys are stored in the database (in production, consider encryption)
- All accounts must be created through the API to be stored
- Account validation happens before any Hedera network operations
- Balance checks are performed against the live Hedera network
- Users are automatically created when creating Hedera accounts if they don't exist
