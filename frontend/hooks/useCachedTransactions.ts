import { useState, useEffect, useCallback, useMemo } from 'react';
import { CachedTransactionServiceImpl } from '../services/api/cached-transaction.service';
import { TransactionHistoryItem } from '../types/api';

interface UseCachedTransactionsReturn {
  // Transaction data
  transactions: TransactionHistoryItem[];
  isLoading: boolean;
  error: string | null;
  
  // Revenue data
  revenue: { totalRevenue: number; transactionCount: number } | null;
  isLoadingRevenue: boolean;
  revenueError: string | null;
  
  // Cache status
  cacheStatus: {
    daily: { isValid: boolean; lastUpdated: string; transactionCount: number };
    weekly: { isValid: boolean; lastUpdated: string; transactionCount: number };
    monthly: { isValid: boolean; lastUpdated: string; transactionCount: number };
  } | null;
  isLoadingStatus: boolean;
  statusError: string | null;
  
  // Actions
  fetchTransactions: (periodType: 'daily' | 'weekly' | 'monthly' | 'all', forceRefresh?: boolean) => Promise<void>;
  fetchRevenue: (periodType: 'daily' | 'weekly' | 'monthly', startTime: number, endTime: number) => Promise<void>;
  refreshCache: () => Promise<void>;
  fetchCacheStatus: () => Promise<void>;
}

export function useCachedTransactions(accountId?: string): UseCachedTransactionsReturn {
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [revenue, setRevenue] = useState<{ totalRevenue: number; transactionCount: number } | null>(null);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  
  const [cacheStatus, setCacheStatus] = useState<{
    daily: { isValid: boolean; lastUpdated: string; transactionCount: number };
    weekly: { isValid: boolean; lastUpdated: string; transactionCount: number };
    monthly: { isValid: boolean; lastUpdated: string; transactionCount: number };
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  
  // Memoize the service to prevent recreation on every render
  const cachedTransactionService = useMemo(() => new CachedTransactionServiceImpl(), []);

  const fetchTransactions = useCallback(async (
    periodType: 'daily' | 'weekly' | 'monthly' | 'all',
    forceRefresh: boolean = true
  ) => {
    if (!accountId) {
      setError('Account ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching cached transactions', { 
        accountId, 
        periodType, 
        periodTypeType: typeof periodType,
        periodTypeLength: periodType?.length,
        forceRefresh 
      });
      
      const response = await cachedTransactionService.getCachedTransactions(
        accountId, 
        periodType, 
        undefined, 
        undefined, 
        forceRefresh
      );
      
      if (response.success && response.data) {
        console.log('Cached transactions fetched successfully', { count: response.data.length });
        setTransactions(response.data);
      } else {
        console.error('Failed to fetch cached transactions', response.error);
        setError(response.error || 'Failed to fetch cached transactions');
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching cached transactions', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cached transactions');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, cachedTransactionService]);

  const fetchRevenue = useCallback(async (
    periodType: 'daily' | 'weekly' | 'monthly',
    startTime: number,
    endTime: number
  ) => {
    if (!accountId) {
      setRevenueError('Account ID is required');
      return;
    }

    setIsLoadingRevenue(true);
    setRevenueError(null);

    try {
      console.log('Fetching revenue for period', { accountId, periodType, startTime, endTime });
      
      const response = await cachedTransactionService.getRevenueForPeriod(
        accountId,
        periodType,
        startTime,
        endTime
      );
      
      if (response.success && response.data) {
        console.log('Revenue fetched successfully', response.data);
        setRevenue(response.data);
      } else {
        console.error('Failed to fetch revenue', response.error);
        setRevenueError(response.error || 'Failed to fetch revenue');
        setRevenue(null);
      }
    } catch (err) {
      console.error('Error fetching revenue', err);
      setRevenueError(err instanceof Error ? err.message : 'Failed to fetch revenue');
      setRevenue(null);
    } finally {
      setIsLoadingRevenue(false);
    }
  }, [accountId, cachedTransactionService]);

  const refreshCache = useCallback(async () => {
    if (!accountId) {
      setError('Account ID is required');
      return;
    }

    try {
      console.log('Refreshing cache for account', accountId);
      
      const response = await cachedTransactionService.refreshCache(accountId);
      
      if (response.success) {
        console.log('Cache refreshed successfully');
        // Optionally refetch data after refresh
        await fetchTransactions('weekly', true);
      } else {
        console.error('Failed to refresh cache', response.error);
        setError(response.error || 'Failed to refresh cache');
      }
    } catch (err) {
      console.error('Error refreshing cache', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh cache');
    }
  }, [accountId, cachedTransactionService, fetchTransactions]);

  const fetchCacheStatus = useCallback(async () => {
    if (!accountId) {
      setStatusError('Account ID is required');
      return;
    }

    setIsLoadingStatus(true);
    setStatusError(null);

    try {
      console.log('Fetching cache status for account', accountId);
      
      const response = await cachedTransactionService.getCacheStatus(accountId);
      
      if (response.success && response.data) {
        console.log('Cache status fetched successfully', response.data);
        setCacheStatus(response.data);
      } else {
        console.error('Failed to fetch cache status', response.error);
        setStatusError(response.error || 'Failed to fetch cache status');
        setCacheStatus(null);
      }
    } catch (err) {
      console.error('Error fetching cache status', err);
      setStatusError(err instanceof Error ? err.message : 'Failed to fetch cache status');
      setCacheStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [accountId, cachedTransactionService]);

  // Auto-fetch weekly transactions when accountId changes
  useEffect(() => {
    if (accountId) {
      fetchTransactions('weekly');
      fetchCacheStatus();
    }
  }, [accountId, fetchTransactions, fetchCacheStatus]);

  return {
    transactions,
    isLoading,
    error,
    revenue,
    isLoadingRevenue,
    revenueError,
    cacheStatus,
    isLoadingStatus,
    statusError,
    fetchTransactions,
    fetchRevenue,
    refreshCache,
    fetchCacheStatus,
  };
}
