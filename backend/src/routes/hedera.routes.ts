import { Router, Request, Response } from 'express';
import { HederaService } from '../types/index.js';
import { logger } from '../utils/logger.js';

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
    this.router.get('/transaction-history/:accountId', this.getTransactionHistory.bind(this));
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
          data: result,
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
      const { fromAccountId, toAccountId, amount, memo } = req.body;
      
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

      logger.info('POST /hedera/payment - Processing payment', { 
        fromAccountId, 
        toAccountId, 
        amount, 
        memo 
      });
      
      const result = await this.hederaService.processPayment({
        fromAccountId,
        toAccountId,
        amount,
        memo
      });
      
      if (result.status === 'SUCCESS') {
        res.json({
          success: true,
          data: result,
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
      
      // Validate account ID format
      if (!accountId || !accountId.match(/^\d+\.\d+\.\d+$/)) {
        res.status(400).json({
          success: false,
          error: 'Invalid account ID format. Expected format: 0.0.123456'
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

  public getRouter(): Router {
    return this.router;
  }
}
