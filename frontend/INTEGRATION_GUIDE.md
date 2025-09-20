# Integration Guide for Pay.tsx

This guide shows how to integrate the new API services into your existing `pay.tsx` file.

## Quick Integration Steps

### 1. Import the Required Hooks

Add these imports to your `pay.tsx` file:

```typescript
import { useHederaOperations } from '../hooks/useHedera';
import { usePaymentManager, usePaymentValidation } from '../hooks/usePayments';
import { useTransactions } from '../hooks/useTransactions';
import { useDID } from '../hooks/useDID';
import { useAuth } from '../hooks/useAuth';
```

### 2. Initialize the Hooks

Add these hooks to your component:

```typescript
export default function PayScreen() {
  // ... existing state ...
  
  // Add these new hooks
  const auth = useAuth();
  const hedera = useHederaOperations();
  const paymentManager = usePaymentManager();
  const validation = usePaymentValidation();
  const transactions = useTransactions();
  const did = useDID();
  
  // ... rest of your component
}
```

### 3. Load User Accounts

Add this useEffect to load accounts when the component mounts:

```typescript
useEffect(() => {
  // Load user accounts - replace with actual user ID
  const userId = 'your-user-id'; // Get this from your auth context
  hedera.getUserAccounts.execute(userId);
}, []);
```

### 4. Update Payment Methods

Replace your existing payment method handlers with API calls:

```typescript
const handleQRPayment = async (qrData: string) => {
  // Parse QR data to get recipient and amount
  const { recipientAccount, amount, memo } = parseQRData(qrData);
  
  if (!hedera.selectedAccount) {
    Alert.alert('Error', 'Please select an account first');
    return;
  }

  const paymentData = {
    fromAccountId: hedera.selectedAccount.account_id,
    toAccountId: recipientAccount,
    amount: parseFloat(amount),
    memo: memo || undefined,
  };

  // Validate payment
  const validationResult = await validation.validatePayment(paymentData);
  if (!validationResult.isValid) {
    Alert.alert('Validation Error', validationResult.errors.join('\n'));
    return;
  }

  // Process payment
  const result = await paymentManager.makePayment(paymentData);
  
  if (result?.success) {
    Alert.alert('Success', `Payment sent! Transaction ID: ${result.transactionId}`);
  } else {
    Alert.alert('Error', result?.error || 'Payment failed');
  }
};

const handleWhatsAppPayment = async (phoneNumber: string, amount: number) => {
  // Similar implementation for WhatsApp payments
  // You'll need to implement the recipient account lookup logic
};

const handleTapPayment = async (amount: number) => {
  // Similar implementation for tap payments
};
```

### 5. Add Account Selection UI

Add this to your payment methods section:

```typescript
// Add this after your existing payment method buttons
{hedera.getUserAccounts.data && hedera.getUserAccounts.data.length > 0 && (
  <View style={styles.accountSelection}>
    <Text style={styles.sectionTitle}>Select Account</Text>
    {hedera.getUserAccounts.data.map((account) => (
      <TouchableOpacity
        key={account.id}
        style={[
          styles.accountItem,
          hedera.selectedAccount?.id === account.id && styles.selectedAccount
        ]}
        onPress={() => hedera.selectAccount(account)}
      >
        <Text style={styles.accountText}>
          {account.alias || account.account_id}
        </Text>
        <Text style={styles.balanceText}>
          Balance: {hedera.getAccountBalance(account.account_id)} HBAR
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}
```

### 6. Add Loading States

Update your buttons to show loading states:

```typescript
<TouchableOpacity
  style={[styles.paymentButton, paymentManager.processPayment.loading && styles.loadingButton]}
  onPress={handleQRPayment}
  disabled={paymentManager.processPayment.loading}
>
  <Text style={styles.buttonText}>
    {paymentManager.processPayment.loading ? 'Processing...' : 'Scan QR Code'}
  </Text>
</TouchableOpacity>
```

### 7. Add Error Handling

Display errors from the API:

```typescript
{paymentManager.processPayment.error && (
  <Text style={styles.errorText}>
    Error: {paymentManager.processPayment.error}
  </Text>
)}
```

### 8. Add Recent Transactions

Add this to show recent transactions:

```typescript
{paymentManager.recentTransactions.length > 0 && (
  <View style={styles.recentTransactions}>
    <Text style={styles.sectionTitle}>Recent Transactions</Text>
    {paymentManager.recentTransactions.slice(0, 5).map((transaction) => (
      <View key={transaction.id} style={styles.transactionItem}>
        <Text style={styles.transactionText}>
          {transaction.type === 'payment' ? '💳' : '🔄'} {transaction.amount} HBAR
        </Text>
        <Text style={styles.transactionSubtext}>
          To: {transaction.to} • {transaction.status}
        </Text>
      </View>
    ))}
  </View>
)}
```

## Complete Example Integration

Here's how your updated `pay.tsx` might look:

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
// ... other imports ...

// Add these new imports
import { useHederaOperations } from '../hooks/useHedera';
import { usePaymentManager, usePaymentValidation } from '../hooks/usePayments';
import { useAuth } from '../hooks/useAuth';

export default function PayScreen() {
  // ... existing state ...
  
  // Add API hooks
  const auth = useAuth();
  const hedera = useHederaOperations();
  const paymentManager = usePaymentManager();
  const validation = usePaymentValidation();

  // Load user accounts
  useEffect(() => {
    const userId = 'your-user-id'; // Replace with actual user ID
    hedera.getUserAccounts.execute(userId);
  }, []);

  // ... existing methods ...

  // Add new payment methods
  const handleQRPayment = async (qrData: string) => {
    // Implementation as shown above
  };

  // ... rest of your component with the new UI elements ...
}
```

## Styling Updates

Add these styles to your existing StyleSheet:

```typescript
const styles = StyleSheet.create({
  // ... existing styles ...
  
  accountSelection: {
    marginVertical: 20,
  },
  accountItem: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedAccount: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  accountText: {
    fontSize: 16,
    fontWeight: '500',
  },
  balanceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  loadingButton: {
    opacity: 0.6,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  recentTransactions: {
    marginTop: 20,
  },
  transactionItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  transactionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});
```

## Testing the Integration

1. Make sure your backend is running on `http://localhost:3000`
2. Test user creation: `auth.createUser.execute({ email: 'test@example.com', password: 'password123' })`
3. Test account creation: `hedera.createAccount.execute({ user_id: 'user-id', alias: 'Test Account' })`
4. Test payment: `paymentManager.makePayment.execute({ fromAccountId: '0.0.123', toAccountId: '0.0.456', amount: 10 })`

## Next Steps

1. Replace placeholder user IDs with actual authentication
2. Implement QR code parsing logic
3. Add proper error handling for different scenarios
4. Implement the other payment methods (WhatsApp, Tap, etc.)
5. Add transaction history and account management features

This integration provides a solid foundation for your payment app with proper error handling, loading states, and type safety.
