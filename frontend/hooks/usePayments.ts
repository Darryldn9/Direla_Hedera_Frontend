import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { api } from '../services/api';
import { 
  TransferRequest, 
  PaymentRequest,
  ProcessPaymentWithDIDRequest, 
} from '../types/api';
import { PaymentResult, PaymentValidation } from '../services/api/payment.service';


/**
 * Hook for payment operations
 */
export function usePayments() {
  const processPayment = useApi<PaymentResult>(api.payment.processPayment.bind(api.payment));
  const transferHbar = useApi<PaymentResult>(api.payment.transferHbar.bind(api.payment));
  // const calculateTransactionFee = useApi<number>(api.payment.calculateTransactionFee.bind(api.payment));
  // const getPaymentMethods = useApi<string[]>(api.payment.getPaymentMethods.bind(api.payment));
  // const processRefund = useApi<PaymentResult>(api.payment.processRefund.bind(api.payment));
  // const getPaymentStatus = useApi<{ status: string; confirmed: boolean }>(api.payment.getPaymentStatus.bind(api.payment));
  // const cancelPayment = useApi<boolean>(api.payment.cancelPayment.bind(api.payment));
  // const getPaymentHistory = useApi<any[]>(api.payment.getPaymentHistory.bind(api.payment));

  return {
    processPayment,
    transferHbar,
    // calculateTransactionFee,
    // getPaymentMethods,
    // processRefund,
    // getPaymentStatus,
    // cancelPayment,
    // getPaymentHistory,
  };
}

/**
 * Hook for payment management with local state
 */
export function usePaymentManager() {
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Set<string>>(new Set());
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  
  const payments = usePayments();

  const makePayment = useCallback(async (paymentData: ProcessPaymentWithDIDRequest) => {
    console.log("[DEBUG] MAKE PAYMENT REQUEST", paymentData);
    
    try {
      console.log("[DEBUG] Starting payment processing...");
      const startTime = Date.now();
      
      // Use the transaction service instead of payment service for ProcessPaymentWithDIDRequest
      const result = await api.transaction.processPaymentWithDID(paymentData);
      
      const processingTime = Date.now() - startTime;
      console.log("[DEBUG] MAKE PAYMENT RESULT", result, `Processing time: ${processingTime}ms`);
    
    // Handle the response structure from /transactions endpoint
    if (result?.success && result.data?.hedera_transaction?.transactionId) {
      const transactionId = result.data.hedera_transaction.transactionId;
      
      // Add to pending payments
      setPendingPayments(prev => new Set([...prev, transactionId]));
      
      // Add to recent transactions
      const transaction = {
        id: transactionId,
        type: 'payment',
        amount: paymentData.amount,
        to: paymentData.toAccountId,
        from: paymentData.fromAccountId,
        memo: paymentData.memo,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      setRecentTransactions(prev => [transaction, ...prev.slice(0, 9)]); // Keep last 10
      
      // Return a normalized result structure for compatibility
      return {
        success: true,
        transactionId: transactionId,
        data: result.data
      };
    }
    
    // Return the original result for error cases
    return result;
    } catch (error) {
      console.error("[DEBUG] MAKE PAYMENT ERROR", error);
      
      // Handle specific timeout errors
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Request timeout')) {
          return {
            success: false,
            error: 'Payment request timed out. The server may be busy. Please try again in a moment.'
          };
        }
        if (error.message.includes('Network error') || error.message.includes('fetch')) {
          return {
            success: false,
            error: 'Network error occurred. Please check your connection and try again.'
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, []);

  const makeTransfer = useCallback(async (transferData: TransferRequest) => {
    const result = await payments.transferHbar.execute(transferData);
    
    if (result?.success && result.transactionId) {
      // Add to pending payments
      setPendingPayments(prev => new Set([...prev, result.transactionId!]));
      
      // Add to recent transactions
      const transaction = {
        id: result.transactionId,
        type: 'transfer',
        amount: transferData.amount,
        to: transferData.toAccountId,
        from: transferData.fromAccountId,
        // memo: transferData.memo,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      setRecentTransactions(prev => [transaction, ...prev.slice(0, 9)]); // Keep last 10
    }
    
    return result;
  }, [payments.transferHbar]);

  // const checkPaymentStatus = useCallback(async (transactionId: string) => {
  //   const status = await payments.getPaymentStatus.execute(transactionId);
    
  //   if (status?.confirmed) {
  //     // Remove from pending payments
  //     setPendingPayments(prev => {
  //       const newSet = new Set(prev);
  //       newSet.delete(transactionId);
  //       return newSet;
  //     });
      
  //     // Update transaction status
  //     setRecentTransactions(prev => 
  //       prev.map(tx => 
  //         tx.id === transactionId 
  //           ? { ...tx, status: 'confirmed' }
  //           : tx
  //       )
  //     );
  //   }
    
  //   return status;
  // }, [payments.getPaymentStatus]);

  // const refreshPaymentHistory = useCallback(async (accountId: string) => {
  //   const history = await payments.getPaymentHistory.execute(accountId);
  //   if (history) {
  //     setPaymentHistory(history);
  //   }
  //   return history;
  // }, [payments.getPaymentHistory]);

  const clearPaymentHistory = useCallback(() => {
    setPaymentHistory([]);
    setRecentTransactions([]);
  }, []);

  const getPendingPaymentsCount = useCallback(() => {
    return pendingPayments.size;
  }, [pendingPayments]);

  const hasPendingPayments = useCallback(() => {
    return pendingPayments.size > 0;
  }, [pendingPayments]);

  return {
    paymentHistory,
    pendingPayments: Array.from(pendingPayments),
    recentTransactions,
    makePayment,
    makeTransfer,
    // checkPaymentStatus,
    // refreshPaymentHistory,
    clearPaymentHistory,
    getPendingPaymentsCount,
    hasPendingPayments,
    ...payments,
  };
}

/**
 * Hook for payment validation
 */
export function usePaymentValidation() {
  const [validationState, setValidationState] = useState<{
    isValidating: boolean;
    lastValidation: PaymentValidation | null;
  }>({
    isValidating: false,
    lastValidation: null,
  });

  const validatePayment = useCallback(async (paymentData: PaymentRequest) => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      // This would call the validation method from the payment service
      // For now, we'll create a simple validation
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!paymentData.fromAccountId) {
        errors.push('From account is required');
      }
      if (!paymentData.toAccountId) {
        errors.push('To account is required');
      }
      if (!paymentData.amount || paymentData.amount <= 0) {
        errors.push('Amount must be greater than 0');
      }
      if (paymentData.fromAccountId === paymentData.toAccountId) {
        errors.push('Cannot send to the same account');
      }

      const validation: PaymentValidation = {
        isValid: errors.length === 0,
        errors,
        warnings,
      };

      setValidationState({
        isValidating: false,
        lastValidation: validation,
      });

      return validation;
    } catch (error) {
      const validation: PaymentValidation = {
        isValid: false,
        errors: ['Validation failed'],
        warnings: [],
      };

      setValidationState({
        isValidating: false,
        lastValidation: validation,
      });

      return validation;
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValidating: false,
      lastValidation: null,
    });
  }, []);

  return {
    ...validationState,
    validatePayment,
    clearValidation,
  };
}
