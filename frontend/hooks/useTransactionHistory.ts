import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HederaService } from '../services/api/hedera.service';
import { TransactionHistoryItem } from '../types/api';

interface UseTransactionHistoryReturn {
  transactions: TransactionHistoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchTransactionHistory: (accountId: string, limit?: number) => Promise<void>;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useTransactionHistory(accountId?: string, limit: number = 50): UseTransactionHistoryReturn {
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastFetchedAccountId = useRef<string | null>(null);
  
  // Memoize the service to prevent recreation on every render
  const hederaService = useMemo(() => new HederaService(), []);

  const fetchTransactionHistory = useCallback(async (targetAccountId: string, transactionLimit?: number) => {
    if (!targetAccountId) {
      setError('Account ID is required');
      return;
    }

    // Track the last fetched account to prevent duplicate fetches
    lastFetchedAccountId.current = targetAccountId;
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching transaction history for account:', targetAccountId);
      const response = await hederaService.getTransactionHistory(targetAccountId, transactionLimit || limit);
      
      if (response.success && response.data) {
        console.log('Transaction history fetched successfully:', response.data);
        setTransactions(response.data);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch transaction history:', response.error);
        setError(response.error || 'Failed to fetch transaction history');
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction history');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [hederaService, limit]);

  const refresh = useCallback(async () => {
    if (accountId) {
      await fetchTransactionHistory(accountId);
    }
  }, [accountId, fetchTransactionHistory]);

  // Auto-fetch when accountId changes
  useEffect(() => {
    if (accountId && accountId !== lastFetchedAccountId.current) {
      fetchTransactionHistory(accountId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]); // fetchTransactionHistory is stable due to useCallback with stable dependencies


  return {
    transactions,
    isLoading,
    error,
    fetchTransactionHistory,
    refresh,
    lastUpdated,
  };
}
