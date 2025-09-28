import { useApi } from './useApi';
import { api } from '../services/api';
import { ProcessPaymentWithDIDRequest } from '../types/api';

/**
 * Hook for transaction operations with DID logging
 */
export function useTransactions() {
  const processPaymentWithDID = useApi(api.transaction.processPaymentWithDID.bind(api.transaction));

  return {
    processPaymentWithDID,
  };
}
