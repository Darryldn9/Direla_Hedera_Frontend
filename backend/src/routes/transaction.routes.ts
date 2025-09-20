import { Router, Request, Response } from 'express';
import { HederaService } from '../types/index.js';
import { DIDService } from '../services/did.service.js';
import { logger } from '../utils/logger.js';

export interface ProcessPaymentWithDIDRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo?: string;
  merchant_user_id?: string; // Optional: if provided, will log to DID
}

export class TransactionRoutes {
  private router: Router;
  private hederaService: HederaService;
  private didService: DIDService;

  constructor(hederaService: HederaService, didService: DIDService) {
    this.router = Router();
    this.hederaService = hederaService;
    this.didService = didService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /transactions:
     *   post:
     *     summary: Process a payment with optional DID logging
     *     tags: [Transactions]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - fromAccountId
     *               - toAccountId
     *               - amount
     *             properties:
     *               fromAccountId:
     *                 type: string
     *                 description: Source Hedera account ID
     *                 example: "0.0.12345"
     *               toAccountId:
     *                 type: string
     *                 description: Destination Hedera account ID
     *                 example: "0.0.67890"
     *               amount:
     *                 type: number
     *                 description: Amount to transfer in HBAR
     *                 example: 10.5
     *               memo:
     *                 type: string
     *                 description: Optional transaction memo
     *                 example: "Payment for services"
     *               merchant_user_id:
     *                 type: string
     *                 format: uuid
     *                 description: Optional merchant UUID for DID logging
     *                 example: "550e8400-e29b-41d4-a716-446655440000"
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
     *                 data:
     *                   type: object
     *                   properties:
     *                     hedera_transaction:
     *                       type: object
     *                       properties:
     *                         transactionId:
     *                           type: string
     *                         status:
     *                           type: string
     *                     did_logging:
     *                       type: object
     *                       nullable: true
     *                       properties:
     *                         hcs_transaction_id:
     *                           type: string
     *                         hcs_explorer_link:
     *                           type: string
     *       400:
     *         description: Bad request
     *       500:
     *         description: Internal server error
     */
    this.router.post('/', this.processPaymentWithDID.bind(this));
  }

  private async processPaymentWithDID(req: Request, res: Response): Promise<void> {
    try {
      const { 
        fromAccountId, 
        toAccountId, 
        amount, 
        memo, 
        merchant_user_id 
      }: ProcessPaymentWithDIDRequest = req.body;

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

      logger.info('Processing payment with potential DID logging', { 
        fromAccountId, 
        toAccountId, 
        amount, 
        memo,
        merchant_user_id 
      });

      // Process the Hedera payment first
      const paymentRequest = {
        fromAccountId,
        toAccountId,
        amount,
        ...(memo && { memo })
      };
      
      const hederaResult = await this.hederaService.processPayment(paymentRequest);

      // Prepare response data
      const responseData: any = {
        hedera_transaction: hederaResult,
        did_logging: null
      };

      // If payment was successful and merchant_user_id is provided, log to DID
      if (hederaResult.status === 'SUCCESS' && merchant_user_id && hederaResult.transactionId) {
        try {
          // Check if merchant has DID
          const hasDID = await this.didService.hasDID(merchant_user_id);
          
          if (hasDID) {
            // Log transaction to DID
            const didResult = await this.didService.logTransaction(
              merchant_user_id,
              toAccountId, // Using destination account as the merchant's account
              hederaResult.transactionId,
              `${amount} HBAR` // Format amount with currency
            );

            if (didResult.success) {
              responseData.did_logging = {
                hcs_transaction_id: didResult.transactionId,
                hcs_explorer_link: didResult.explorerLink
              };
              
              logger.info('Transaction logged to DID successfully', {
                merchant_user_id,
                hederaTransactionId: hederaResult.transactionId,
                hcsTransactionId: didResult.transactionId
              });
            } else {
              logger.warn('Failed to log transaction to DID', {
                merchant_user_id,
                hederaTransactionId: hederaResult.transactionId,
                error: didResult.error
              });
            }
          } else {
            logger.warn('Merchant does not have DID, skipping DID logging', {
              merchant_user_id
            });
          }
        } catch (didError) {
          logger.error('Error during DID logging', {
            merchant_user_id,
            hederaTransactionId: hederaResult.transactionId,
            error: didError instanceof Error ? didError.message : 'Unknown error'
          });
          // Don't fail the whole transaction if DID logging fails
        }
      }

      // Return response based on Hedera transaction status
      if (hederaResult.status === 'SUCCESS') {
        res.json({
          success: true,
          data: responseData,
          message: 'Payment processed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          data: responseData,
          error: hederaResult.message || 'Payment failed'
        });
      }
    } catch (error) {
      logger.error('Failed to process payment', { 
        body: req.body, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error while processing payment'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}