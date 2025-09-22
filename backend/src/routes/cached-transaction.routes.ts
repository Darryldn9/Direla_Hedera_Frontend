import { Router, Request, Response } from 'express';
import { TransactionCacheManagerService } from '../services/transaction-cache-manager.service.js';
import { HederaService } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { TransactionCacheManagerServiceImpl } from '../services/transaction-cache-manager.service.js';

export class CachedTransactionRoutes {
  private router: Router;
  private cacheManager: TransactionCacheManagerService;

  constructor(hederaService: HederaService) {
    this.router = Router();
    this.cacheManager = new TransactionCacheManagerServiceImpl(hederaService);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Get cached transactions for a specific period
    /**
     * @swagger
     * /cached-transactions/{accountId}/{periodType}:
     *   get:
     *     summary: Get cached transactions for a specific period
     *     tags: [Cached Transactions]
     *     parameters:
     *       - in: path
     *         name: accountId
     *         required: true
     *         schema:
     *           type: string
     *         description: Hedera account ID
     *       - in: path
     *         name: periodType
     *         required: true
     *         schema:
     *           type: string
     *           enum: [daily, weekly, monthly, all]
     *         description: Time period for transactions
     *       - in: query
     *         name: startTime
     *         schema:
     *           type: number
     *         description: Start timestamp (optional)
     *       - in: query
     *         name: endTime
     *         schema:
     *           type: number
     *         description: End timestamp (optional)
     *       - in: query
     *         name: forceRefresh
     *         schema:
     *           type: boolean
     *           default: false
     *         description: Force refresh cache from Hedera
     *     responses:
     *       200:
     *         description: Cached transactions retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/TransactionHistoryItem'
     *       400:
     *         description: Bad request
     *       500:
     *         description: Internal server error
     */
    this.router.get('/:accountId/:periodType', this.getCachedTransactions.bind(this));

    // Get revenue for a specific period
    /**
     * @swagger
     * /cached-transactions/{accountId}/revenue/{periodType}:
     *   get:
     *     summary: Get revenue for a specific period
     *     tags: [Cached Transactions]
     *     parameters:
     *       - in: path
     *         name: accountId
     *         required: true
     *         schema:
     *           type: string
     *         description: Hedera account ID
     *       - in: path
     *         name: periodType
     *         required: true
     *         schema:
     *           type: string
     *           enum: [daily, weekly, monthly]
     *         description: Time period for revenue calculation
     *       - in: query
     *         name: startTime
     *         required: true
     *         schema:
     *           type: number
     *         description: Start timestamp
     *       - in: query
     *         name: endTime
     *         required: true
     *         schema:
     *           type: number
     *         description: End timestamp
     *     responses:
     *       200:
     *         description: Revenue calculated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     totalRevenue:
     *                       type: number
     *                       example: 1250.50
     *                     transactionCount:
     *                       type: number
     *                       example: 15
     *       400:
     *         description: Bad request
     *       500:
     *         description: Internal server error
     */
    this.router.get('/:accountId/revenue/:periodType', this.getRevenueForPeriod.bind(this));

    // Refresh cache for an account
    /**
     * @swagger
     * /cached-transactions/{accountId}/refresh:
     *   post:
     *     summary: Refresh cache for an account
     *     tags: [Cached Transactions]
     *     parameters:
     *       - in: path
     *         name: accountId
     *         required: true
     *         schema:
     *           type: string
     *         description: Hedera account ID
     *     responses:
     *       200:
     *         description: Cache refreshed successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: "Cache refreshed successfully"
     *       400:
     *         description: Bad request
     *       500:
     *         description: Internal server error
     */
    this.router.post('/:accountId/refresh', this.refreshCache.bind(this));

    // Get cache status for an account
    /**
     * @swagger
     * /cached-transactions/{accountId}/status:
     *   get:
     *     summary: Get cache status for an account
     *     tags: [Cached Transactions]
     *     parameters:
     *       - in: path
     *         name: accountId
     *         required: true
     *         schema:
     *           type: string
     *         description: Hedera account ID
     *     responses:
     *       200:
     *         description: Cache status retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     daily:
     *                       type: object
     *                       properties:
     *                         isValid:
     *                           type: boolean
     *                         lastUpdated:
     *                           type: string
     *                         transactionCount:
     *                           type: number
     *                     weekly:
     *                       type: object
     *                       properties:
     *                         isValid:
     *                           type: boolean
     *                         lastUpdated:
     *                           type: string
     *                         transactionCount:
     *                           type: number
     *                     monthly:
     *                       type: object
     *                       properties:
     *                         isValid:
     *                           type: boolean
     *                         lastUpdated:
     *                           type: string
     *                         transactionCount:
     *                           type: number
     *       400:
     *         description: Bad request
     *       500:
     *         description: Internal server error
     */
    this.router.get('/:accountId/status', this.getCacheStatus.bind(this));
  }

  private async getCachedTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { accountId, periodType } = req.params;
      if(!accountId || !periodType) {
        res.status(400).json({
          success: false,
          error: 'accountId and periodType are required'
        });
        return;
      }

      const { startTime, endTime, forceRefresh } = req.query;

      // Debug logging
      logger.info('getCachedTransactions called', { 
        accountId, 
        periodType, 
        periodTypeType: typeof periodType,
        periodTypeLength: periodType?.length,
        periodTypeCharCodes: periodType ? Array.from(periodType).map(c => c.charCodeAt(0)) : null,
        startTime, 
        endTime, 
        forceRefresh,
        reqParams: req.params,
        reqQuery: req.query
      });

      // Validate period type
      const validPeriods = ['daily', 'weekly', 'monthly', 'all'];
      if (!validPeriods.includes(periodType)) {
        logger.error('Invalid period type received', { 
          periodType, 
          validPeriods,
          periodTypeTrimmed: periodType?.trim(),
          periodTypeLowerCase: periodType?.toLowerCase()
        });
        res.status(400).json({
          success: false,
          error: `Invalid period type. Must be one of: ${validPeriods.join(', ')}`
        });
        return;
      }

      // Check if we should force refresh
      if (forceRefresh === 'true') {
        logger.info('Force refreshing cache for account', { accountId, periodType });
        await this.cacheManager.updateCacheForPeriod(accountId, periodType as any);
      } else {
        // Check if cache is valid (less than 5 minutes old)
        const isCacheValid = await this.cacheManager.isCacheValid(accountId, periodType, 5);
        if (!isCacheValid) {
          logger.info('Cache is stale, refreshing', { accountId, periodType });
          await this.cacheManager.updateCacheForPeriod(accountId, periodType as any);
        }
      }

      // Get cached transactions
      const transactions = await this.cacheManager.getCachedTransactionsForPeriod(
        accountId,
        periodType as any,
        startTime ? parseInt(startTime as string) : undefined,
        endTime ? parseInt(endTime as string) : undefined
      );

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      logger.error('Failed to get cached transactions', { error, accountId: req.params.accountId });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cached transactions'
      });
    }
  }

  private async getRevenueForPeriod(req: Request, res: Response): Promise<void> {
    try {
      const { accountId, periodType } = req.params;
      if(!accountId || !periodType) {
        res.status(400).json({
          success: false,
          error: 'accountId and periodType are required'
        });
        return;
      }
      const { startTime, endTime } = req.query;

      // Validate period type
      const validPeriods = ['daily', 'weekly', 'monthly'];
      if (!validPeriods.includes(periodType)) {
        res.status(400).json({
          success: false,
          error: `Invalid period type. Must be one of: ${validPeriods.join(', ')}`
        });
        return;
      }

      // Validate required parameters
      if (!startTime || !endTime) {
        res.status(400).json({
          success: false,
          error: 'startTime and endTime are required'
        });
        return;
      }

      const start = parseInt(startTime as string);
      const end = parseInt(endTime as string);

      if (isNaN(start) || isNaN(end)) {
        res.status(400).json({
          success: false,
          error: 'startTime and endTime must be valid numbers'
        });
        return;
      }

      // Get revenue for period
      const revenue = await this.cacheManager.getRevenueForPeriod(
        accountId,
        periodType as any,
        start,
        end
      );

      res.json({
        success: true,
        data: revenue
      });
    } catch (error) {
      logger.error('Failed to get revenue for period', { error, accountId: req.params.accountId });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get revenue for period'
      });
    }
  }

  private async refreshCache(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      if(!accountId) {
        res.status(400).json({
          success: false,
          error: 'accountId is required'
        });
        return;
      }
      logger.info('Refreshing cache for account', { accountId });
      await this.cacheManager.updateCacheForAccount(accountId);

      res.json({
        success: true,
        message: 'Cache refreshed successfully'
      });
    } catch (error) {
      logger.error('Failed to refresh cache', { error, accountId: req.params.accountId });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh cache'
      });
    }
  }

  private async getCacheStatus(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      if(!accountId) {
        res.status(400).json({
          success: false,
          error: 'accountId is required'
        });
        return;
      }
      // Check cache validity for each period type
      const periods = ['daily', 'weekly', 'monthly'];
      const status: any = {};

      for (const period of periods) {
        const isValid = await this.cacheManager.isCacheValid(accountId, period, 5);
        // You could also get more detailed info from the metadata service
        status[period] = {
          isValid,
          lastUpdated: new Date().toISOString(), // This would come from metadata in a real implementation
          transactionCount: 0 // This would come from metadata in a real implementation
        };
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Failed to get cache status', { error, accountId: req.params.accountId });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get cache status'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
