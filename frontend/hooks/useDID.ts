import { useApi } from './useApi';
import { api } from '../services/api';
import { CreateMerchantDIDRequest, LogTransactionRequest } from '../types/api';

/**
 * Hook for DID (Decentralized Identity) operations
 */
export function useDID() {
  const createMerchantDID = useApi(api.did.createMerchantDID.bind(api.did));
  const getDIDByUserId = useApi(api.did.getDIDByUserId.bind(api.did));
  const logTransaction = useApi(api.did.logTransaction.bind(api.did));
  const hasDID = useApi(api.did.hasDID.bind(api.did));

  return {
    createMerchantDID,
    getDIDByUserId,
    logTransaction,
    hasDID,
  };
}
