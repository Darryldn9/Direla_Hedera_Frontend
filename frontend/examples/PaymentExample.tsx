import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useHederaOperations } from '../hooks/useHedera';
import { usePaymentManager, usePaymentValidation } from '../hooks/usePayments';
import { useTransactions } from '../hooks/useTransactions';
import { useDID } from '../hooks/useDID';
import { PaymentRequest, ProcessPaymentWithDIDRequest } from '../types/api';

/**
 * Example component showing how to use the API services
 * This demonstrates the complete payment flow
 */
export default function PaymentExample() {
  // State for form inputs
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  // API hooks
  const auth = useAuth();
  const hedera = useHederaOperations();
  const paymentManager = usePaymentManager();
  const validation = usePaymentValidation();
  const transactions = useTransactions();
  const did = useDID();

  // Load user accounts on component mount
  useEffect(() => {
    // Example: Load accounts for a specific user
    // In a real app, you'd get the current user ID from your auth context
    const userId = 'example-user-id';
    hedera.getUserAccounts.execute(userId);
  }, []);

  // Handle payment submission
  const handlePayment = async () => {
    if (!hedera.selectedAccount) {
      Alert.alert('Error', 'Please select an account first');
      return;
    }

    const paymentData: PaymentRequest = {
      fromAccountId: hedera.selectedAccount.account_id,
      toAccountId: recipientAccount,
      amount: parseFloat(amount),
      memo: memo || undefined,
    };

    // Validate payment before processing
    const validationResult = await validation.validatePayment(paymentData);
    if (!validationResult.isValid) {
      Alert.alert('Validation Error', validationResult.errors.join('\n'));
      return;
    }

    // Process the payment
    const result = await paymentManager.makePayment(paymentData);
    
    if (result?.success) {
      Alert.alert('Success', `Payment sent! Transaction ID: ${result.transactionId}`);
      // Clear form
      setRecipientAccount('');
      setAmount('');
      setMemo('');
    } else {
      Alert.alert('Error', result?.error || 'Payment failed');
    }
  };

  // Handle transfer
  const handleTransfer = async () => {
    if (!hedera.selectedAccount) {
      Alert.alert('Error', 'Please select an account first');
      return;
    }

    const transferData = {
      fromAccountId: hedera.selectedAccount.account_id,
      toAccountId: recipientAccount,
      amount: parseFloat(amount),
      memo: memo || undefined,
    };

    const result = await paymentManager.makeTransfer(transferData);
    
    if (result?.success) {
      Alert.alert('Success', `Transfer completed! Transaction ID: ${result.transactionId}`);
      // Clear form
      setRecipientAccount('');
      setAmount('');
      setMemo('');
    } else {
      Alert.alert('Error', result?.error || 'Transfer failed');
    }
  };

  // Handle payment with DID logging (for merchants)
  const handlePaymentWithDID = async (merchantUserId?: string) => {
    if (!hedera.selectedAccount) {
      Alert.alert('Error', 'Please select an account first');
      return;
    }

    const paymentData: ProcessPaymentWithDIDRequest = {
      fromAccountId: hedera.selectedAccount.account_id,
      toAccountId: recipientAccount,
      amount: parseFloat(amount),
      memo: memo || undefined,
      merchant_user_id: merchantUserId,
    };

    const result = await transactions.processPaymentWithDID.execute(paymentData);
    
    if (result?.success) {
      const message = result.did_logging 
        ? `Payment successful! Hedera TX: ${result.hedera_transaction.transactionId}, DID TX: ${result.did_logging.hcs_transaction_id}`
        : `Payment successful! Transaction ID: ${result.hedera_transaction.transactionId}`;
      
      Alert.alert('Success', message);
      // Clear form
      setRecipientAccount('');
      setAmount('');
      setMemo('');
    } else {
      Alert.alert('Error', 'Payment with DID failed');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Payment Example</Text>

      {/* Account Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Account</Text>
        {hedera.getUserAccounts.loading ? (
          <Text>Loading accounts...</Text>
        ) : (
          <View>
            {hedera.getUserAccounts.data?.map((account) => (
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
      </View>

      {/* Payment Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Recipient Account ID"
          value={recipientAccount}
          onChangeText={setRecipientAccount}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Amount (HBAR)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Memo (optional)"
          value={memo}
          onChangeText={setMemo}
        />

        {/* Validation Warnings */}
        {validation.lastValidation?.warnings.map((warning, index) => (
          <Text key={index} style={styles.warningText}>
            ⚠️ {warning}
          </Text>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.paymentButton]}
          onPress={handlePayment}
          disabled={paymentManager.processPayment.loading}
        >
          <Text style={styles.buttonText}>
            {paymentManager.processPayment.loading ? 'Processing...' : 'Send Payment'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.transferButton]}
          onPress={handleTransfer}
          disabled={paymentManager.transferHbar.loading}
        >
          <Text style={styles.buttonText}>
            {paymentManager.transferHbar.loading ? 'Processing...' : 'Transfer HBAR'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.didButton]}
          onPress={() => handlePaymentWithDID('merchant-user-id')}
          disabled={transactions.processPaymentWithDID.loading}
        >
          <Text style={styles.buttonText}>
            {transactions.processPaymentWithDID.loading ? 'Processing...' : 'Payment with DID'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {paymentManager.recentTransactions.map((transaction) => (
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

      {/* Error Display */}
      {paymentManager.processPayment.error && (
        <Text style={styles.errorText}>
          Error: {paymentManager.processPayment.error}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
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
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  paymentButton: {
    backgroundColor: '#007AFF',
  },
  transferButton: {
    backgroundColor: '#34C759',
  },
  didButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
  warningText: {
    color: '#FF9500',
    fontSize: 14,
    marginBottom: 5,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});
