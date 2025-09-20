# Hedera Express Backend API Documentation

## Overview

This API provides comprehensive Hedera blockchain integration with user authentication and account management. The system separates user creation from Hedera account creation for better control and security.

## Features

- **Separated User & Account Management**: Create users first, then Hedera accounts
- **Supabase Auth Integration**: Secure user authentication and management
- **Hedera Blockchain Operations**: Create accounts, transfer HBAR, check balances
- **User Validation**: Hedera accounts can only be created for existing users
- **Comprehensive API Documentation**: Interactive Swagger UI available

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API uses a two-step process:

### 1. User Creation
First, create a user account using email and password. This creates both a Supabase Auth user and a database user record.

### 2. Hedera Account Creation
Then, create Hedera accounts for existing users by providing their user ID.

## Workflow

### Step 1: Create User (with automatic Hedera account)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Note**: This automatically creates a default Hedera account with alias "user's Account".

### Step 2: Create Additional Hedera Accounts (optional)
```bash
curl -X POST http://localhost:3000/api/hedera-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "alias": "My Business Account",
    "initial_balance": 100
  }'
```

### Step 3: Check Account Balance
```bash
curl -X GET http://localhost:3000/api/hedera-accounts/balance/0.0.123456
```

### Step 4: Transfer HBAR
```bash
curl -X POST http://localhost:3000/api/hedera/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "0.0.123456",
    "toAccountId": "0.0.789012",
    "amount": 50.0
  }'
```

## API Endpoints

### Health Check

#### GET /health
Check API health status.

**Response:**
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### User Management

#### POST /users
Create a new user account with automatic Hedera account creation.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Note**: When a user is created, a default Hedera account is automatically created with an alias based on the user's email address (e.g., "user's Account" for "user@example.com").

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "balance": 0,
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

#### GET /users
Get all users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "balance": 0,
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Found 1 users"
}
```

#### GET /users/{id}
Get user by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "balance": 0,
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Hedera Account Management

#### POST /hedera-accounts
Create a new Hedera account for an existing user.

**Request Body:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "alias": "My Hedera Account",
  "initial_balance": 100
}
```

**Note**: The `alias` field is optional. If provided, it will be set as the account memo on the Hedera blockchain, making it visible when querying the account information.

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "account_id": "0.0.123456",
    "private_key": "private_key_for_0.0.123456",
    "public_key": "302a300506032b6570032100...",
    "alias": "My Hedera Account",
    "balance": 100,
    "is_active": true,
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Hedera account created successfully"
}
```

#### GET /hedera-accounts/balance/{accountId}
Get the balance of a Hedera account.

**Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "0.0.123456",
    "balance": 100.5
  },
  "message": "Account balance: 100.5 HBAR"
}
```

#### GET /hedera-accounts/info/{accountId}
Get detailed information about a Hedera account.

**Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "0.0.123456",
    "accountInfo": {
      "accountId": "0.0.123456",
      "key": "302a300506032b6570032100...",
      "balance": 100.5
    }
  },
  "message": "Account info retrieved successfully"
}
```

**Error Responses:**

- **400 Bad Request**: Missing user_id or invalid initial_balance
- **404 Not Found**: User with specified user_id does not exist
- **500 Internal Server Error**: Server error

### Hedera Operations

#### POST /hedera/transfer
Transfer HBAR between accounts.

**Request Body:**
```json
{
  "fromAccountId": "0.0.123456",
  "toAccountId": "0.0.789012",
  "amount": 50.5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "SUCCESS",
    "transactionId": "0.0.123456@1234567890.123456789"
  },
  "message": "Transfer completed successfully"
}
```

#### POST /hedera/payment
Process a payment between accounts with validation.

**Request Body:**
```json
{
  "fromAccountId": "0.0.123456",
  "toAccountId": "0.0.789012",
  "amount": 25.0,
  "memo": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "SUCCESS",
    "transactionId": "0.0.123456@1234567890.123456789"
  },
  "message": "Payment processed successfully"
}
```

#### GET /hedera-accounts
Get all Hedera accounts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "account_id": "0.0.123456",
      "alias": "My Account",
      "balance": 100,
      "is_active": true,
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Found 1 Hedera accounts"
}
```

#### GET /hedera-accounts/active
Get all active Hedera accounts.

#### GET /hedera-accounts/{id}
Get a specific Hedera account by ID.

#### PUT /hedera-accounts/{id}
Update a Hedera account.

**Request Body:**
```json
{
  "alias": "Updated Account Name",
  "isActive": true
}
```

#### DELETE /hedera-accounts/{id}
Delete a Hedera account.

### Hedera Blockchain Operations

#### GET /hedera/balance/{accountId}
Get the balance of a Hedera account.

**Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "0.0.123456",
    "balance": 100.5
  }
}
```

#### POST /hedera/payment
Transfer HBAR between accounts.

**Request Body:**
```json
{
  "fromAccountId": "0.0.123456",
  "toAccountId": "0.0.789012",
  "amount": 25.5,
  "memo": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "0.0.123456@1640995200.123456789",
    "status": "SUCCESS",
    "message": "Transfer completed successfully"
  }
}
```

### User Management

#### GET /users
Get all users.

#### GET /users/{id}
Get a specific user by ID.

#### PUT /users/{id}
Update a user's balance.

**Request Body:**
```json
{
  "balance": 150.75
}
```

## Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

- **400 Bad Request**: Invalid request data or missing required fields
- **401 Unauthorized**: Authentication failed or invalid credentials
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

## Authentication Flow

### New User Signup Flow

1. **API Call**: POST `/hedera-accounts` with email and password
2. **Supabase Signup**: User account created in Supabase Auth
3. **Database User Creation**: User record created in local database
4. **Hedera Account Creation**: Account created on Hedera blockchain
5. **Response**: Complete account information returned

### Existing User Flow

1. **API Call**: POST `/hedera-accounts` with existing user_id
2. **User Validation**: Check if user exists in database
3. **User Creation**: Create user record if needed
4. **Hedera Account Creation**: Account created on Hedera blockchain
5. **Response**: Complete account information returned

## Security Considerations

- **Password Requirements**: Minimum 6 characters (configurable)
- **Email Validation**: Proper email format required
- **JWT Tokens**: Supabase handles secure token management
- **Private Keys**: Actual Hedera private keys are generated and stored securely
- **Rate Limiting**: Configured in Supabase Auth settings

## Environment Variables

Required environment variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Hedera Configuration
HEDERA_ACCOUNT_ID=0.0.XXX
HEDERA_PRIVATE_KEY=302XXX
HEDERA_NETWORK=testnet

# Database Configuration
DATABASE_URL=postgresql://postgres:XXX@db.XXX.supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://XXX.supabase.co
SUPABASE_ANON_KEY=eyXXX
```

## Interactive Documentation

Complete interactive API documentation is available via Swagger UI:

- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/api/health`

## Examples

### Creating Your First Hedera Account

```bash
# Create account with new user signup
curl -X POST http://localhost:3000/api/hedera-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "My First Account",
    "initial_balance": 100,
    "email": "alice@example.com",
    "password": "securePassword123"
  }'
```

### Transferring HBAR

```bash
# Transfer HBAR between accounts
curl -X POST http://localhost:3000/api/hedera/payment \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "0.0.123456",
    "toAccountId": "0.0.789012",
    "amount": 25.5,
    "memo": "Payment for services"
  }'
```

### Checking Account Balance

```bash
# Check account balance
curl -X GET http://localhost:3000/api/hedera/balance/0.0.123456
```

## Support

For API support and questions:
- **Email**: support@example.com
- **Documentation**: Available at `/api-docs`
- **Health Check**: Available at `/api/health`

## License

MIT License - see LICENSE file for details.
