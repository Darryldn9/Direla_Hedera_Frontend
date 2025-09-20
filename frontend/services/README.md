# API Services Documentation

This directory contains a comprehensive API service layer for your React Native payments app that connects to your Hedera backend.

## Structure

```
services/
├── api/
│   ├── index.ts          # Main API service and exports
│   ├── base.ts           # Base API service class
│   ├── config.ts         # API configuration
│   ├── auth.service.ts   # User authentication service
│   ├── hedera.service.ts # Hedera blockchain operations
│   └── payment.service.ts # Payment processing service
└── README.md            # This documentation

hooks/
├── useApi.ts            # Generic API hook
├── useAuth.ts           # Authentication hooks
├── useHedera.ts         # Hedera operations hooks
└── usePayments.ts       # Payment management hooks

types/
└── api.ts               # TypeScript type definitions

examples/
└── PaymentExample.tsx   # Complete usage example
```

## Quick Start

### 1. Basic Usage

```typescript
import { api } from '../services/api';

// Create a user
const userResponse = await api.auth.createUser({
  email: 'user@example.com',
  password: 'password123'
});

// Get account balance
const balanceResponse = await api.hedera.getAccountBalance('0.0.123456');

// Process a payment
const paymentResponse = await api.payment.processPayment({
  fromAccountId: '0.0.123456',
  toAccountId: '0.0.789012',
  amount: 50.0,
  memo: 'Payment for services'
});
```

### 2. Using React Hooks

```typescript
import { useAuth, useHederaOperations, usePaymentManager } from '../hooks';

function PaymentScreen() {
  const auth = useAuth();
  const hedera = useHederaOperations();
  const paymentManager = usePaymentManager();

  // Create user
  const handleCreateUser = async () => {
    const user = await auth.createUser.execute({
      email: 'user@example.com',
      password: 'password123'
    });
    
    if (user) {
      console.log('User created:', user);
    }
  };

  // Make payment
  const handlePayment = async () => {
    const result = await paymentManager.makePayment({
      fromAccountId: '0.0.123456',
      toAccountId: '0.0.789012',
      amount: 25.0,
      memo: 'Payment'
    });
    
    if (result?.success) {
      console.log('Payment successful:', result.transactionId);
    }
  };

  return (
    // Your UI components
  );
}
```

## Services Overview

### AuthService

Handles user management and authentication:

- `createUser(userData)` - Create a new user
- `getUserById(userId)` - Get user by ID
- `getAllUsers()` - Get all users
- `updateUserBalance(userId, balance)` - Update user balance
- `deleteUser(userId)` - Delete user
- `userExists(userId)` - Check if user exists

### HederaService

Manages Hedera blockchain operations:

- `createAccount(accountData)` - Create Hedera account
- `getAllAccounts()` - Get all accounts
- `getAccountBalance(accountId)` - Get account balance
- `getAccountInfo(accountId)` - Get detailed account info
- `transferHbar(transferData)` - Transfer HBAR
- `processPayment(paymentData)` - Process payment
- `getUserAccounts(userId)` - Get user's accounts
- `getPrimaryAccount(userId)` - Get user's primary account

### PaymentService

Handles payment processing:

- `processPayment(paymentData)` - Process payment
- `transferHbar(transferData)` - Transfer HBAR
- `validatePayment(paymentData)` - Validate payment
- `calculateTransactionFee(amount)` - Calculate fees
- `getPaymentHistory(accountId)` - Get payment history

### TransactionService

Handles transactions with DID logging:

- `processPaymentWithDID(paymentData)` - Process payment with optional DID logging

### DIDService

Manages Decentralized Identity operations:

- `createMerchantDID(didData)` - Create merchant DID
- `getDIDByUserId(userId)` - Get DID for user
- `logTransaction(transactionData)` - Log transaction to DID
- `hasDID(userId)` - Check if user has DID

## React Hooks

### useAuth()

Provides authentication operations with loading states:

```typescript
const auth = useAuth();

// Access loading states
auth.createUser.loading
auth.createUser.error
auth.createUser.data

// Execute operations
await auth.createUser.execute(userData);
```

### useHederaOperations()

Manages Hedera accounts and balances:

```typescript
const hedera = useHederaOperations();

// Local state
hedera.selectedAccount
hedera.accountBalances

// Operations
hedera.selectAccount(account);
hedera.refreshAccountBalance(accountId);
hedera.getUserAccounts.execute(userId);
```

### usePaymentManager()

Handles payment operations with local state:

```typescript
const paymentManager = usePaymentManager();

// Local state
paymentManager.recentTransactions
paymentManager.pendingPayments
paymentManager.paymentHistory

// Operations
paymentManager.makePayment(paymentData);
paymentManager.makeTransfer(transferData);
paymentManager.checkPaymentStatus(transactionId);
```

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  const result = await api.payment.processPayment(paymentData);
  if (result.success) {
    // Handle success
  } else {
    // Handle API error
    console.error(result.error);
  }
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API error with status code
    console.error(`API Error ${error.statusCode}: ${error.message}`);
  } else {
    // Handle network or other errors
    console.error('Network error:', error.message);
  }
}
```

## Configuration

### Environment-based Configuration

The API automatically uses different URLs for development and production:

```typescript
// Development: http://localhost:3000/api
// Production: https://your-production-api.com/api
```

### Custom Configuration

```typescript
import { ApiService } from '../services/api';

const customApi = new ApiService({
  baseUrl: 'https://custom-api.com/api',
  timeout: 15000,
  retryAttempts: 5
});
```

## TypeScript Support

All services are fully typed with TypeScript:

```typescript
import { 
  User, 
  HederaAccount, 
  PaymentRequest, 
  ApiResponse 
} from '../types/api';

// Type-safe API calls
const user: User = await api.auth.getUserById.execute('123');
const accounts: HederaAccount[] = await api.hedera.getAllAccounts.execute();
```

## Best Practices

### 1. Use Hooks for UI Components

```typescript
// ✅ Good - Use hooks for UI components
function PaymentScreen() {
  const paymentManager = usePaymentManager();
  // ...
}

// ❌ Avoid - Direct API calls in components
function PaymentScreen() {
  const [loading, setLoading] = useState(false);
  // Manual state management...
}
```

### 2. Handle Loading States

```typescript
function PaymentButton() {
  const paymentManager = usePaymentManager();
  
  return (
    <TouchableOpacity 
      disabled={paymentManager.processPayment.loading}
      onPress={handlePayment}
    >
      <Text>
        {paymentManager.processPayment.loading ? 'Processing...' : 'Send Payment'}
      </Text>
    </TouchableOpacity>
  );
}
```

### 3. Validate Before Processing

```typescript
const handlePayment = async () => {
  // Validate first
  const validation = await validation.validatePayment(paymentData);
  if (!validation.isValid) {
    Alert.alert('Error', validation.errors.join('\n'));
    return;
  }
  
  // Then process
  const result = await paymentManager.makePayment(paymentData);
};
```

### 4. Use Error Boundaries

```typescript
// Wrap your app with error boundary
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Testing

### Mock Services for Testing

```typescript
// __mocks__/services/api.ts
export const api = {
  auth: {
    createUser: jest.fn(),
    getUserById: jest.fn(),
  },
  hedera: {
    getAccountBalance: jest.fn(),
  },
  payment: {
    processPayment: jest.fn(),
  },
};
```

## Troubleshooting

### Common Issues

1. **Network Errors**: Check your backend URL configuration
2. **Authentication Errors**: Ensure user is properly authenticated
3. **Validation Errors**: Check payment data before processing
4. **Timeout Errors**: Increase timeout in configuration

### Debug Mode

Enable debug logging:

```typescript
// In your app initialization
if (__DEV__) {
  console.log('API Base URL:', getApiConfig().baseUrl);
}
```

## Contributing

When adding new API endpoints:

1. Add types to `types/api.ts`
2. Add endpoint to `config.ts`
3. Implement in appropriate service
4. Add corresponding hook if needed
5. Update this documentation

## Support

For questions or issues:
- Check the example in `examples/PaymentExample.tsx`
- Review the TypeScript types in `types/api.ts`
- Check the backend API documentation
