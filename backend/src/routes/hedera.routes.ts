import { Router, Request, Response } from 'express';
import { HederaService } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { isValidHederaAccountId } from '../utils/hedera-validation.js';

export class HederaRoutes {
  private router: Router;
  private hederaService: HederaService;

  constructor(hederaService: HederaService) {
    this.router = Router();
    this.hederaService = hederaService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/transfer', this.transferHbar.bind(this));
    this.router.post('/payment', this.processPayment.bind(this));
    this.router.post('/quote', this.generateQuote.bind(this));
    this.router.get('/transaction-history/:accountId', this.getTransactionHistory.bind(this));
    this.router.post('/purge-cache/:accountId', this.purgeTransactionCache.bind(this));
    this.router.post('/refresh-data/:accountId', this.refreshTransactionData.bind(this));
    this.router.post('/purge-all-caches', this.purgeAllTransactionCaches.bind(this));
  }


  /**
   * @swagger
   * /hedera/transfer:
   *   post:
   *     summary: Transfer HBAR between accounts
   *     tags: [Hedera]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransferRequest'
   *     responses:
   *       200:
   *         description: Transfer completed successfully
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
   *                     status:
   *                       type: string
   *                       example: "SUCCESS"
   *                     transactionId:
   *                       type: string
   *                       example: "0.0.123456@1234567890.123456789"
   *                 message:
   *                   type: string
   *                   example: "Transfer completed successfully"
   *       400:
   *         description: Bad request - missing required fields or invalid amount
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  private async transferHbar(req: Request, res: Response): Promise<void> {
    try {
      const { fromAccountId, toAccountId, amount } = req.body;
      
      // Validate required fields
      if (!fromAccountId || !toAccountId || amount === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: fromAccountId, toAccountId, amount'
        });
        return;
      }

      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Amount must be a positive number'
        });
        return;
      }

      logger.info('POST /hedera/transfer - Transferring Hbar', { 
        fromAccountId, 
        toAccountId, 
        amount 
      });
      
      const result = await this.hederaService.transferHbar(fromAccountId, toAccountId, amount);
      
      if (result.status === 'SUCCESS') {
        res.json({
          success: true,
          data: {
            transactionId: result.transactionId,
            status: result.status,
            message: result.message
          },
          message: 'Transfer completed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          data: result,
          error: result.message || 'Transfer failed'
        });
      }
    } catch (error) {
      logger.error('POST /hedera/transfer failed', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Failed to transfer Hbar'
      });
    }
  }



  /**
   * @swagger
   * /hedera/payment:
   *   post:
   *     summary: Process a payment between accounts
   *     tags: [Hedera]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PaymentRequest'
   *     responses:
   *       200:
   *         description: Payment processed successfully
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
   *                     status:
   *                       type: string
   *                       example: "SUCCESS"
   *                     transactionId:
   *                       type: string
   *                       example: "0.0.123456@1234567890.123456789"
   *                 message:
   *                   type: string
   *                   example: "Payment processed successfully"
   *       400:
   *         description: Bad request - missing required fields or invalid amount
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  private async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const { fromAccountId, toAccountId, amount, memo, fromCurrency, toCurrency, quote } = req.body;
      
      // Validate required fields
      if (!fromAccountId || !toAccountId || amount === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: fromAccountId, toAccountId, amount'
        });
        return;
      }

      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Amount must be a positive number'
        });
        return;
      }

      // Validate quote if provided
      if (quote) {
        if (!quote.fromCurrency || !quote.toCurrency || !quote.fromAmount || !quote.toAmount || !quote.exchangeRate || !quote.expiresAt || !quote.quoteId) {
          res.status(400).json({
            success: false,
            error: 'Invalid quote format. Required fields: fromCurrency, toCurrency, fromAmount, toAmount, exchangeRate, expiresAt, quoteId'
          });
          return;
        }

        // Validate quote expiry
        const now = Date.now();
        if (now > quote.expiresAt) {
          res.status(400).json({
            success: false,
            error: `Quote expired. Quote expired at ${new Date(quote.expiresAt).toISOString()}, current time: ${new Date(now).toISOString()}`
          });
          return;
        }
      }

      logger.info('POST /hedera/payment - Processing payment', { 
        fromAccountId, 
        toAccountId, 
        amount, 
        memo,
        fromCurrency,
        toCurrency,
        hasQuote: !!quote
      });
      
      const result = await this.hederaService.processPayment({
        fromAccountId,
        toAccountId,
        amount,
        memo,
        fromCurrency,
        toCurrency,
        quote
      });
      
      if (result.status === 'SUCCESS') {
        res.json({
          success: true,
          data: {
            transactionId: result.transactionId,
            status: result.status,
            message: result.message
          },
          message: 'Payment processed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          data: result,
          error: result.message || 'Payment failed'
        });
      }
    } catch (error) {
      logger.error('POST /hedera/payment failed', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Failed to process payment'
      });
    }
  }

  /**
   * @swagger
   * /hedera/transaction-history/{accountId}:
   *   get:
   *     summary: Get transaction history for a Hedera account
   *     tags: [Hedera]
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *         description: The Hedera account ID
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Maximum number of transactions to return
   *     responses:
   *       200:
   *         description: Transaction history retrieved successfully
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
   *                     type: object
   *                     properties:
   *                       amount:
   *                         type: number
   *                         example: 10.5
   *                       currency:
   *                         type: string
   *                         example: "HBAR"
   *                       gasFee:
   *                         type: number
   *                         example: 0.001
   *                       time:
   *                         type: string
   *                         format: date-time
   *                         example: "2024-01-15T10:30:00.000Z"
   *                       to:
   *                         type: string
   *                         example: "0.0.123456"
   *                       from:
   *                         type: string
   *                         example: "0.0.789012"
   *                       transactionId:
   *                         type: string
   *                         example: "0.0.123456@1234567890.123456789"
   *                       type:
   *                         type: string
   *                         enum: [SEND, RECEIVE]
   *                         example: "RECEIVE"
   *                 message:
   *                   type: string
   *                   example: "Transaction history retrieved successfully"
   *       400:
   *         description: Bad request - invalid account ID or account not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  private async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      // Validate account ID format using shared validator (supports EVM 0x... too)
      if (!accountId || !isValidHederaAccountId(accountId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid Hedera account ID format'
        });
        return;
      }

      // Validate limit
      if (limit < 1 || limit > 1000) {
        res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 1000'
        });
        return;
      }

      logger.info('GET /hedera/transaction-history - Getting transaction history', { 
        accountId, 
        limit 
      });
      
      const transactions = await this.hederaService.getTransactionHistory(accountId, limit);
      
      res.json({
        success: true,
        data: transactions,
        message: 'Transaction history retrieved successfully'
      });
    } catch (error) {
      logger.error('GET /hedera/transaction-history failed', { 
        error, 
        accountId: req.params.accountId,
        limit: req.query.limit 
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to get transaction history';
      
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * @swagger
   * /hedera/quote:
   *   post:
   *     summary: Generate a currency quote for payment
   *     tags: [Hedera]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fromAccountId:
   *                 type: string
   *                 example: "0.0.123456"
   *               toAccountId:
   *                 type: string
   *                 example: "0.0.789012"
   *               amount:
   *                 type: number
   *                 example: 100.0
   *               fromCurrency:
   *                 type: string
   *                 example: "USD"
   *               toCurrency:
   *                 type: string
   *                 example: "EUR"
   *     responses:
   *       200:
   *         description: Quote generated successfully
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
   *                     quoteId:
   *                       type: string
   *                       example: "quote_1234567890_abc123"
   *                     fromCurrency:
   *                       type: string
   *                       example: "USD"
   *                     toCurrency:
   *                       type: string
   *                       example: "EUR"
   *                     fromAmount:
   *                       type: number
   *                       example: 100.0
   *                     toAmount:
   *                       type: number
   *                       example: 85.0
   *                     exchangeRate:
   *                       type: number
   *                       example: 0.85
   *                     expiresAt:
   *                       type: number
   *                       example: 1234567890
   *                 message:
   *                   type: string
   *                   example: "Quote generated successfully"
   *       400:
   *         description: Bad request - missing required fields or invalid amount
   *       500:
   *         description: Internal server error
   */
  private async generateQuote(req: Request, res: Response): Promise<void> {
    try {
      const { fromAccountId, toAccountId, amount, fromCurrency, toCurrency } = req.body;
      
      // Validate required fields
      if (!fromAccountId || !toAccountId || amount === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: fromAccountId, toAccountId, amount'
        });
        return;
      }

      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Amount must be a positive number'
        });
        return;
      }

      logger.info('POST /hedera/quote - Generating quote', { 
        fromAccountId, 
        toAccountId, 
        amount,
        fromCurrency,
        toCurrency
      });
      
      const quote = await this.hederaService.generatePaymentQuote(
        fromAccountId,
        toAccountId,
        amount,
        fromCurrency,
        toCurrency
      );
      
      res.json({
        success: true,
        data: quote,
        message: 'Quote generated successfully'
      });
    } catch (error) {
      logger.error('POST /hedera/quote failed', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Failed to generate quote'
      });
    }
  }

  /**
   * @swagger
   * /hedera/purge-cache/{accountId}:
   *   post:
   *     summary: Purge cached transaction data for an account
   *     tags: [Hedera]
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *         description: Hedera account ID
   *     responses:
   *       200:
   *         description: Cache purged successfully
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
   *                   example: "Cache purged successfully"
   *       400:
   *         description: Invalid account ID
   *       500:
   *         description: Internal server error
   */
  private async purgeTransactionCache(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        res.status(400).json({
          success: false,
          error: 'Account ID is required'
        });
        return;
      }

      if (!isValidHederaAccountId(accountId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid Hedera account ID format'
        });
        return;
      }

      await this.hederaService.purgeTransactionCache(accountId);

      res.json({
        success: true,
        message: 'Cache purged successfully',
        data: { accountId }
      });
    } catch (error) {
      logger.error('POST /hedera/purge-cache failed', { error, params: req.params });
      res.status(500).json({
        success: false,
        error: 'Failed to purge cache'
      });
    }
  }

  /**
   * @swagger
   * /hedera/refresh-data/{accountId}:
   *   post:
   *     summary: Force refresh transaction data from Mirror Node API
   *     tags: [Hedera]
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *         description: Hedera account ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Maximum number of transactions to fetch
   *     responses:
   *       200:
   *         description: Transaction data refreshed successfully
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
   *                 message:
   *                   type: string
   *                   example: "Transaction data refreshed successfully"
   *       400:
   *         description: Invalid account ID
   *       500:
   *         description: Internal server error
   */
  private async refreshTransactionData(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!accountId) {
        res.status(400).json({
          success: false,
          error: 'Account ID is required'
        });
        return;
      }

      if (!isValidHederaAccountId(accountId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid Hedera account ID format'
        });
        return;
      }

      const transactions = await this.hederaService.refreshTransactionData(accountId, limit);

      res.json({
        success: true,
        data: transactions,
        message: 'Transaction data refreshed successfully'
      });
    } catch (error) {
      logger.error('POST /hedera/refresh-data failed', { error, params: req.params, query: req.query });
      res.status(500).json({
        success: false,
        error: 'Failed to refresh transaction data'
      });
    }
  }

  /**
   * @swagger
   * /hedera/purge-all-caches:
   *   post:
   *     summary: Purge cached transaction data for all active accounts
   *     tags: [Hedera]
   *     responses:
   *       200:
   *         description: Cache purged successfully for all accounts
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
   *                     purgedCount:
   *                       type: integer
   *                       example: 5
   *                       description: Number of accounts successfully purged
   *                     accounts:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["0.0.123456", "0.0.789012", "0.0.345678"]
   *                       description: List of account IDs that were purged
   *                 message:
   *                   type: string
   *                   example: "Successfully purged cache for 5 accounts"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  private async purgeAllTransactionCaches(req: Request, res: Response): Promise<void> {
    try {
      logger.info('POST /hedera/purge-all-caches - Purging cache for all accounts');
      
      const result = await this.hederaService.purgeAllTransactionCaches();

      res.json({
        success: true,
        data: result,
        message: `Successfully purged cache for ${result.purgedCount} accounts`
      });
    } catch (error) {
      logger.error('POST /hedera/purge-all-caches failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to purge cache for all accounts'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
