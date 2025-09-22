import { getRedisClient } from '../utils/redis.js';
import { TransactionHistoryItem } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface RedisCachedTransactionService {
  // Transaction cache operations
  cacheTransactions(
    accountId: string, 
    periodType: 'daily' | 'weekly' | 'monthly' | 'all',
    transactions: TransactionHistoryItem[],
    ttlSeconds?: number
  ): Promise<void>;
  
  getCachedTransactions(
    accountId: string, 
    periodType: 'daily' | 'weekly' | 'monthly' | 'all'
  ): Promise<TransactionHistoryItem[] | null>;
  
  getRevenueForPeriod(
    accountId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    startTime: number,
    endTime: number
  ): Promise<{ totalRevenue: number; transactionCount: number } | null>;
  
  // Cache management
  clearCacheForAccount(accountId: string): Promise<void>;
  clearCacheForPeriod(accountId: string, periodType: string): Promise<void>;
  isCacheValid(accountId: string, periodType: string): Promise<boolean>;
  
  // Cache metadata
  setCacheMetadata(
    accountId: string, 
    periodType: string, 
    metadata: { lastUpdated: number; transactionCount: number; totalRevenue: number }
  ): Promise<void>;
  
  getCacheMetadata(accountId: string, periodType: string): Promise<{
    lastUpdated: number;
    transactionCount: number;
    totalRevenue: number;
  } | null>;
}

export class RedisCachedTransactionServiceImpl implements RedisCachedTransactionService {
  private redis = getRedisClient();
  private readonly DEFAULT_TTL = 300; // 5 minutes

  private getTransactionKey(accountId: string, periodType: string): string {
    return `txn:${accountId}:${periodType}`;
  }

  private getMetadataKey(accountId: string, periodType: string): string {
    return `txn_meta:${accountId}:${periodType}`;
  }

  private getRevenueKey(accountId: string, periodType: string, startTime: number, endTime: number): string {
    return `revenue:${accountId}:${periodType}:${startTime}:${endTime}`;
  }

  async cacheTransactions(
    accountId: string, 
    periodType: 'daily' | 'weekly' | 'monthly' | 'all',
    transactions: TransactionHistoryItem[],
    ttlSeconds: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      const key = this.getTransactionKey(accountId, periodType);
      const data = JSON.stringify(transactions);
      
      await this.redis.set(key, data, { EX: ttlSeconds });
      
      logger.info('Transactions cached in Redis', { 
        accountId, 
        periodType, 
        count: transactions.length,
        ttl: ttlSeconds 
      });
    } catch (error) {
      logger.error('Failed to cache transactions in Redis', { accountId, periodType, error });
      throw error;
    }
  }

  async getCachedTransactions(
    accountId: string, 
    periodType: 'daily' | 'weekly' | 'monthly' | 'all'
  ): Promise<TransactionHistoryItem[] | null> {
    try {
      const key = this.getTransactionKey(accountId, periodType);
      const data = await this.redis.get(key);
      
      if (!data) {
        return null;
      }

      const transactions = JSON.parse(data) as TransactionHistoryItem[];
      
      logger.debug('Transactions retrieved from Redis cache', { 
        accountId, 
        periodType, 
        count: transactions.length 
      });
      
      return transactions;
    } catch (error) {
      logger.error('Failed to get cached transactions from Redis', { accountId, periodType, error });
      return null;
    }
  }

  async getRevenueForPeriod(
    accountId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    startTime: number,
    endTime: number
  ): Promise<{ totalRevenue: number; transactionCount: number } | null> {
    try {
      // Try to get cached revenue first
      const revenueKey = this.getRevenueKey(accountId, periodType, startTime, endTime);
      const cachedRevenue = await this.redis.get(revenueKey);
      
      if (cachedRevenue) {
        return JSON.parse(cachedRevenue);
      }

      // If not cached, calculate from transactions
      const transactions = await this.getCachedTransactions(accountId, periodType);
      if (!transactions) {
        return null;
      }

      const filteredTransactions = transactions.filter(tx => 
        tx.time >= startTime && 
        tx.time <= endTime && 
        tx.type === 'RECEIVE'
      );

      const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const transactionCount = filteredTransactions.length;

      const revenue = { totalRevenue, transactionCount };

      // Cache the calculated revenue for 1 minute
      await this.redis.set(revenueKey, JSON.stringify(revenue), { EX: 60 });

      return revenue;
    } catch (error) {
      logger.error('Failed to get revenue for period', { accountId, periodType, error });
      return null;
    }
  }

  async clearCacheForAccount(accountId: string): Promise<void> {
    try {
      const pattern = `txn:${accountId}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(keys as any);
      }

      // Also clear metadata
      const metaPattern = `txn_meta:${accountId}:*`;
      const metaKeys = await this.redis.keys(metaPattern);
      
      if (metaKeys.length > 0) {
        await this.redis.del(metaKeys as any);
      }

      // Clear revenue caches
      const revenuePattern = `revenue:${accountId}:*`;
      const revenueKeys = await this.redis.keys(revenuePattern);
      
      if (revenueKeys.length > 0) {
        await this.redis.del(revenueKeys as any);
      }

      logger.info('Cache cleared for account', { accountId, keysCleared: keys.length + metaKeys.length + revenueKeys.length });
    } catch (error) {
      logger.error('Failed to clear cache for account', { accountId, error });
      throw error;
    }
  }

  async clearCacheForPeriod(accountId: string, periodType: string): Promise<void> {
    try {
      const txnKey = this.getTransactionKey(accountId, periodType);
      const metaKey = this.getMetadataKey(accountId, periodType);
      await this.redis.del(txnKey);
      await this.redis.del(metaKey);

      // Clear all revenue caches for this period
      const revenuePattern = `revenue:${accountId}:${periodType}:*`;
      const revenueKeys = await this.redis.keys(revenuePattern);
      
      if (revenueKeys.length > 0) {
        await this.redis.del(revenueKeys as any);
      }

      logger.info('Cache cleared for period', { accountId, periodType });
    } catch (error) {
      logger.error('Failed to clear cache for period', { accountId, periodType, error });
      throw error;
    }
  }

  async isCacheValid(accountId: string, periodType: string): Promise<boolean> {
    try {
      const key = this.getTransactionKey(accountId, periodType);
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Failed to check cache validity', { accountId, periodType, error });
      return false;
    }
  }

  async setCacheMetadata(
    accountId: string, 
    periodType: string, 
    metadata: { lastUpdated: number; transactionCount: number; totalRevenue: number }
  ): Promise<void> {
    try {
      const key = this.getMetadataKey(accountId, periodType);
      const data = JSON.stringify(metadata);
      
      // Cache metadata for same TTL as transactions
      await this.redis.set(key, data, { EX: this.DEFAULT_TTL });
      
      logger.debug('Cache metadata set', { accountId, periodType, metadata });
    } catch (error) {
      logger.error('Failed to set cache metadata', { accountId, periodType, error });
      throw error;
    }
  }

  async getCacheMetadata(accountId: string, periodType: string): Promise<{
    lastUpdated: number;
    transactionCount: number;
    totalRevenue: number;
  } | null> {
    try {
      const key = this.getMetadataKey(accountId, periodType);
      const data = await this.redis.get(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to get cache metadata', { accountId, periodType, error });
      return null;
    }
  }
}
