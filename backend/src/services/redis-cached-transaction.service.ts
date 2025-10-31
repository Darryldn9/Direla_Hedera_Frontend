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
    // Disable cache reads globally: always miss
    logger.debug('Cache read bypassed for transactions (reads disabled)', { accountId, periodType });
    return null;
  }

  async getRevenueForPeriod(
    accountId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    startTime: number,
    endTime: number
  ): Promise<{ totalRevenue: number; transactionCount: number } | null> {
    // Disable cache reads globally: do not fetch revenue from cache
    logger.debug('Cache read bypassed for revenue (reads disabled)', { accountId, periodType, startTime, endTime });
    return null;
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
    // With reads disabled, always report invalid to force live fetches
    logger.debug('Cache validity bypassed (reads disabled)', { accountId, periodType });
    return false;
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
    // Disable cache reads globally: always miss
    logger.debug('Cache read bypassed for metadata (reads disabled)', { accountId, periodType });
    return null;
  }
}
