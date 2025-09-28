import { HederaService, TransactionHistoryItem } from '../types/index.js';
import { RedisCachedTransactionService, RedisCachedTransactionServiceImpl } from './redis-cached-transaction.service.js';
import { logger } from '../utils/logger.js';

export interface TransactionCacheManagerService {
  updateCacheForAccount(accountId: string): Promise<void>;
  updateCacheForPeriod(accountId: string, periodType: 'daily' | 'weekly' | 'monthly' | 'all'): Promise<void>;
  getCachedTransactionsForPeriod(
    accountId: string, 
    periodType: 'daily' | 'weekly' | 'monthly' | 'all',
    startTime?: number,
    endTime?: number
  ): Promise<TransactionHistoryItem[]>;
  getRevenueForPeriod(
    accountId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    startTime: number,
    endTime: number
  ): Promise<{ totalRevenue: number; transactionCount: number }>;
  isCacheValid(accountId: string, periodType: string, maxAgeMinutes: number): Promise<boolean>;
}

export class TransactionCacheManagerServiceImpl implements TransactionCacheManagerService {
  private hederaService: HederaService;
  private cachedTransactionService: RedisCachedTransactionService;

  constructor(hederaService: HederaService) {
    this.hederaService = hederaService;
    this.cachedTransactionService = new RedisCachedTransactionServiceImpl();
  }

  async updateCacheForAccount(accountId: string): Promise<void> {
    try {
      logger.info('Updating cache for account', { accountId });

      // Get fresh transaction history from Hedera
      const transactions = await this.hederaService.getTransactionHistory(accountId, 1000);
      
      if (!transactions || transactions.length === 0) {
        logger.info('No transactions found for account', { accountId });
        return;
      }

      // Clear existing cache
      await this.cachedTransactionService.clearCacheForAccount(accountId);

      // Process transactions for different periods
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

      const dailyTransactions = transactions.filter(tx => tx.time >= oneDayAgo);
      const weeklyTransactions = transactions.filter(tx => tx.time >= oneWeekAgo);
      const monthlyTransactions = transactions.filter(tx => tx.time >= oneMonthAgo);

      // Cache transactions for each period in Redis
      await Promise.all([
        this.cachedTransactionService.cacheTransactions(accountId, 'daily', dailyTransactions),
        this.cachedTransactionService.cacheTransactions(accountId, 'weekly', weeklyTransactions),
        this.cachedTransactionService.cacheTransactions(accountId, 'monthly', monthlyTransactions),
        this.cachedTransactionService.cacheTransactions(accountId, 'all', transactions)
      ]);

      // Cache metadata for each period
      await Promise.all([
        this.cachedTransactionService.setCacheMetadata(accountId, 'daily', {
          lastUpdated: now,
          transactionCount: dailyTransactions.length,
          totalRevenue: dailyTransactions.filter(tx => tx.type === 'RECEIVE').reduce((sum, tx) => sum + tx.amount, 0)
        }),
        this.cachedTransactionService.setCacheMetadata(accountId, 'weekly', {
          lastUpdated: now,
          transactionCount: weeklyTransactions.length,
          totalRevenue: weeklyTransactions.filter(tx => tx.type === 'RECEIVE').reduce((sum, tx) => sum + tx.amount, 0)
        }),
        this.cachedTransactionService.setCacheMetadata(accountId, 'monthly', {
          lastUpdated: now,
          transactionCount: monthlyTransactions.length,
          totalRevenue: monthlyTransactions.filter(tx => tx.type === 'RECEIVE').reduce((sum, tx) => sum + tx.amount, 0)
        }),
        this.cachedTransactionService.setCacheMetadata(accountId, 'all', {
          lastUpdated: now,
          transactionCount: transactions.length,
          totalRevenue: transactions.filter(tx => tx.type === 'RECEIVE').reduce((sum, tx) => sum + tx.amount, 0)
        })
      ]);

      logger.info('Cache updated successfully for account', { accountId });
    } catch (error) {
      logger.error('Failed to update cache for account', { accountId, error });
      throw error;
    }
  }

  async updateCacheForPeriod(accountId: string, periodType: 'daily' | 'weekly' | 'monthly' | 'all'): Promise<void> {
    try {
      logger.info('Updating cache for period', { accountId, periodType });

      // Get fresh transaction history from Hedera
      const transactions = await this.hederaService.getTransactionHistory(accountId, 1000);
      
      if (!transactions || transactions.length === 0) {
        logger.info('No transactions found for account', { accountId });
        return;
      }

      // Clear existing cache for this period
      await this.cachedTransactionService.clearCacheForPeriod(accountId, periodType);

      // Filter transactions based on period
      const now = Date.now();
      let filteredTransactions: TransactionHistoryItem[];

      switch (periodType) {
        case 'daily':
          const oneDayAgo = now - (24 * 60 * 60 * 1000);
          filteredTransactions = transactions.filter(tx => tx.time >= oneDayAgo);
          break;
        case 'weekly':
          const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
          filteredTransactions = transactions.filter(tx => tx.time >= oneWeekAgo);
          break;
        case 'monthly':
          const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
          filteredTransactions = transactions.filter(tx => tx.time >= oneMonthAgo);
          break;
        case 'all':
          filteredTransactions = transactions;
          break;
        default:
          throw new Error(`Invalid period type: ${periodType}`);
      }

      // Cache transactions in Redis
      await this.cachedTransactionService.cacheTransactions(accountId, periodType, filteredTransactions);

      // Cache metadata
      await this.cachedTransactionService.setCacheMetadata(accountId, periodType, {
        lastUpdated: now,
        transactionCount: filteredTransactions.length,
        totalRevenue: filteredTransactions.filter(tx => tx.type === 'RECEIVE').reduce((sum, tx) => sum + tx.amount, 0)
      });

      logger.info('Cache updated successfully for period', { accountId, periodType });
    } catch (error) {
      logger.error('Failed to update cache for period', { accountId, periodType, error });
      throw error;
    }
  }

  // This method is no longer needed with Redis approach

  async getCachedTransactionsForPeriod(
    accountId: string, 
    periodType: 'daily' | 'weekly' | 'monthly' | 'all',
    startTime?: number,
    endTime?: number
  ): Promise<TransactionHistoryItem[]> {
    try {
      logger.info('Getting cached transactions for period', { accountId, periodType, startTime, endTime });

      const transactions = await this.cachedTransactionService.getCachedTransactions(accountId, periodType);
      
      if (!transactions) {
        logger.info('No cached transactions found', { accountId, periodType });
        return [];
      }

      // Apply time filtering if specified
      let filteredTransactions = transactions;
      if (startTime || endTime) {
        filteredTransactions = transactions.filter(tx => {
          if (startTime && tx.time < startTime) return false;
          if (endTime && tx.time > endTime) return false;
          return true;
        });
      }

      logger.info('Cached transactions retrieved successfully', { count: filteredTransactions.length });
      return filteredTransactions;
    } catch (error) {
      logger.error('Failed to get cached transactions for period', { accountId, periodType, error });
      throw error;
    }
  }

  async getRevenueForPeriod(
    accountId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    startTime: number,
    endTime: number
  ): Promise<{ totalRevenue: number; transactionCount: number }> {
    try {
      logger.info('Getting revenue for period', { accountId, periodType, startTime, endTime });

      const result = await this.cachedTransactionService.getRevenueForPeriod(
        accountId,
        periodType,
        startTime,
        endTime
      );

      return result || { totalRevenue: 0, transactionCount: 0 };
    } catch (error) {
      logger.error('Failed to get revenue for period', { accountId, periodType, error });
      throw error;
    }
  }

  async isCacheValid(accountId: string, periodType: string, maxAgeMinutes: number): Promise<boolean> {
    try {
      return await this.cachedTransactionService.isCacheValid(accountId, periodType);
    } catch (error) {
      logger.error('Failed to check cache validity', { accountId, periodType, error });
      return false;
    }
  }
}
