# Hedera Express Backend

A TypeScript Express backend with Hedera SDK integration, featuring integrated user authentication and account management with a clean layered architecture.

## Architecture

This project follows a clean layered architecture:

- **Routes Layer**: Thin Express controllers handling HTTP requests/responses
- **Services Layer**: Business logic orchestration with integrated authentication
- **Infrastructure Layer**: Hedera SDK calls, Supabase Auth, and external API integrations
- **Database Layer**: Supabase PostgreSQL with automatic user management

## Features

- ✅ Express.js with TypeScript
- ✅ ES6 modules throughout
- ✅ Hedera SDK integration (testnet)
- ✅ Supabase PostgreSQL database with automatic user management
- ✅ **Integrated Authentication**: Email/password signup with Supabase Auth
- ✅ **Automatic User Creation**: Users created automatically when creating Hedera accounts
- ✅ Clean layered architecture
- ✅ Comprehensive logging
- ✅ Environment configuration
- ✅ External API integration stubs
- ✅ **Interactive API Documentation**: Swagger UI with comprehensive examples

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your Hedera testnet and Supabase credentials
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Access the API**:
   - **API Base URL**: `http://localhost:3000/api`
   - **Interactive Documentation**: `http://localhost:3000/api-docs`
   - **Health Check**: `http://localhost:3000/api/health`

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Hedera Configuration
HEDERA_ACCOUNT_ID=0.0.123456
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
HEDERA_NETWORK=testnet

# Database Configuration
DATABASE_URL=postgresql://postgres:XXX@db.XXX.supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://XXX.supabase.co
SUPABASE_ANON_KEY=eyXXX
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Hedera Accounts Management (with Integrated Authentication)
- `GET /api/hedera-accounts` - Get all Hedera accounts
- `GET /api/hedera-accounts/active` - Get active Hedera accounts
- `GET /api/hedera-accounts/:id` - Get Hedera account by ID
- `POST /api/hedera-accounts` - **Create new Hedera account with automatic user creation**
  - Supports email/password signup for new users
  - Supports existing user_id for existing users
  - Automatically creates user in Supabase Auth and database
- `PUT /api/hedera-accounts/:id` - Update Hedera account
- `DELETE /api/hedera-accounts/:id` - Delete Hedera account

### Hedera Operations
- `GET /api/hedera/balance/:accountId` - Get account balance
- `POST /api/hedera/transfer` - Transfer HBAR (legacy)
- `POST /api/hedera/payment` - Process payment between stored accounts
- `POST /api/hedera/account` - Create new account (legacy)
- `GET /api/hedera/account/:accountId` - Get account info

## Project Structure

```
src/
├── config/           # Configuration management
├── database/         # Database schema and connection
├── infrastructure/   # External service integrations
├── routes/           # Express route handlers
├── services/         # Business logic layer
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── app.ts           # Application setup
└── index.ts         # Entry point
```

## Database Schema

### Users Table
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `balance` (REAL, NOT NULL, DEFAULT 0)
- `user_id` (TEXT, NULLABLE) - Supabase Auth user ID (UUID)
- `created_at` (TEXT, NOT NULL)
- `updated_at` (TEXT, NOT NULL)

### Hedera Accounts Table
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `account_id` (TEXT, NOT NULL, UNIQUE) - Hedera account ID
- `private_key` (TEXT, NOT NULL) - Actual Hedera private key
- `public_key` (TEXT, NOT NULL) - Public key
- `alias` (TEXT, NULLABLE) - Human-readable alias
- `balance` (REAL, NOT NULL, DEFAULT 0) - Cached balance
- `is_active` (BOOLEAN, NOT NULL, DEFAULT true) - Account status
- `user_id` (TEXT, NOT NULL) - Foreign key to users.user_id
- `created_at` (TEXT, NOT NULL)
- `updated_at` (TEXT, NOT NULL)

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

### Adding New Features

1. **Types**: Add interfaces in `src/types/`
2. **Database**: Update schema in `src/database/schema.ts`
3. **Infrastructure**: Add external integrations in `src/infrastructure/`
4. **Services**: Implement business logic in `src/services/`
5. **Routes**: Add HTTP handlers in `src/routes/`

## Authentication & User Management

This project features integrated authentication with automatic user management:

### New User Signup Flow
1. **API Call**: POST `/api/hedera-accounts` with email and password
2. **Supabase Signup**: User account created in Supabase Auth
3. **Database User Creation**: User record created in local database
4. **Hedera Account Creation**: Account created on Hedera blockchain
5. **Response**: Complete account information returned

### Existing User Flow
1. **API Call**: POST `/api/hedera-accounts` with existing user_id
2. **User Validation**: Check if user exists in database
3. **User Creation**: Create user record if needed
4. **Hedera Account Creation**: Account created on Hedera blockchain
5. **Response**: Complete account information returned

### Security Features
- **Password Requirements**: Minimum 6 characters (configurable)
- **Email Validation**: Proper email format required
- **JWT Tokens**: Supabase handles secure token management
- **Rate Limiting**: Configured in Supabase Auth settings

## Hedera Integration

This project integrates with Hedera Hashgraph testnet:

- Account balance queries
- HBAR transfers
- Account creation
- Transaction status tracking
- **Multi-account management** - Store and manage multiple Hedera accounts
- **Payment processing** - Transfer HBAR between stored accounts
- **Integrated Authentication** - Seamless user and account creation
- **Account Aliases** - Set account aliases that are stored on the Hedera blockchain

### Payment API Usage

To process a payment between two stored accounts:

```bash
POST /api/hedera/payment
{
  "fromAccountId": "0.0.123456",
  "toAccountId": "0.0.789012",
  "amount": 10.5,
  "memo": "Payment for services"
}
```

The system will:
1. Validate both accounts exist in the database
2. Check account status (active/inactive)
3. Verify sufficient balance
4. Execute the transfer on Hedera network
5. Update cached balances in the database

Make sure to have valid Hedera testnet credentials in your `.env` file.

## API Documentation

### Interactive Documentation
Complete interactive API documentation is available via Swagger UI:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/api/health`

### Quick Examples

#### Create Account with New User Signup
```bash
curl -X POST http://localhost:3000/api/hedera-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "My First Account",
    "initial_balance": 100,
    "email": "alice@example.com",
    "password": "securePassword123"
  }'
```

#### Create Account with Existing User
```bash
curl -X POST http://localhost:3000/api/hedera-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "My Second Account",
    "initial_balance": 50,
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

#### Transfer HBAR
```bash
curl -X POST http://localhost:3000/api/hedera/payment \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "0.0.123456",
    "toAccountId": "0.0.789012",
    "amount": 25.5,
    "memo": "Payment for services"
  }'
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## External API Integration

The project includes a stub for external API notifications:

- User creation events
- Balance update events
- User deletion events

Replace the stub implementation in `src/infrastructure/external-api.ts` with your actual API calls.

## License

MIT
