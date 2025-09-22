import { TransactionCacheManagerService, TransactionCacheManagerServiceImpl } from './transaction-cache-manager.service.js';
import { HederaAccountService } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface CacheSchedulerService {
  start(): void;
  stop(): void;
  scheduleAccountUpdate(accountId: string): void;
  isRunning(): boolean;
}

export class CacheSchedulerServiceImpl implements CacheSchedulerService {
  private cacheManager: TransactionCacheManagerService;
  private hederaAccountService: HederaAccountService;
  private intervalId: NodeJS.Timeout | null = null;
  private isSchedulerRunning = false;
  private updateInterval = 5 * 60 * 1000; // 5 minutes

  constructor(hederaAccountService: HederaAccountService, hederaService: any) {
    this.hederaAccountService = hederaAccountService;
    this.cacheManager = new TransactionCacheManagerServiceImpl(hederaService);
  }

  start(): void {
    if (this.isSchedulerRunning) {
      logger.warn('Cache scheduler is already running');
      return;
    }

    logger.info('Starting cache scheduler', { interval: this.updateInterval });
    
    this.isSchedulerRunning = true;
    this.intervalId = setInterval(async () => {
      await this.updateAllCaches();
    }, this.updateInterval);

    // Run initial update
    this.updateAllCaches();
  }

  stop(): void {
    if (!this.isSchedulerRunning) {
      logger.warn('Cache scheduler is not running');
      return;
    }

    logger.info('Stopping cache scheduler');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isSchedulerRunning = false;
  }

  async scheduleAccountUpdate(accountId: string): Promise<void> {
    try {
      logger.info('Scheduling cache update for account', { accountId });
      await this.cacheManager.updateCacheForAccount(accountId);
    } catch (error) {
      logger.error('Failed to update cache for account', { accountId, error });
    }
  }

  isRunning(): boolean {
    return this.isSchedulerRunning;
  }

  private async updateAllCaches(): Promise<void> {
    try {
      logger.info('Starting scheduled cache update');
      
      // Get all active accounts
      const accounts = await this.hederaAccountService.getAllAccounts();
      const activeAccounts = accounts.filter(account => account.is_active);
      logger.info('Updating cache for active accounts', { count: activeAccounts.length });

      // Update cache for each account in parallel (with concurrency limit)
      const concurrencyLimit = 3;
      const chunks = this.chunkArray(activeAccounts, concurrencyLimit);
      
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (account) => {
            try {
              await this.cacheManager.updateCacheForAccount(account.account_id);
              logger.debug('Cache updated for account', { accountId: account.account_id });
            } catch (error) {
              logger.error('Failed to update cache for account', { 
                accountId: account.account_id, 
                error 
              });
            }
          })
        );
        
        // Small delay between chunks to avoid overwhelming the system
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info('Scheduled cache update completed', { 
        accountsProcessed: activeAccounts.length 
      });
    } catch (error) {
      logger.error('Error during scheduled cache update', { error });
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
