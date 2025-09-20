import { Router, Request, Response } from 'express';
import { DIDService } from '../services/did.service.js';
import { UserService } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface CreateMerchantDIDRequest {
  user_id: string;
}

export interface LogTransactionRequest {
  merchant_user_id: string;
  hedera_account: string;
  txn_id: string;
  amount: string; // Amount in ZAR or other currency
}

export class DIDRoutes {
  private router: Router;
  private didService: DIDService;
  private userService: UserService;

  constructor(didService: DIDService, userService: UserService) {
    this.router = Router();
    this.didService = didService;
    this.userService = userService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /did/users:
     *   post:
     *     summary: Create a merchant DID
     *     tags: [DID]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - user_id
     *             properties:
     *               user_id:
     *                 type: string
     *                 format: uuid
     *                 description: The UUID of the user/merchant
     *     responses:
     *       201:
     *         description: DID created successfully
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
     *                     did:
     *                       type: string
     *                       example: "did:hedera:testnet:550e8400-e29b-41d4-a716-446655440000"
     *                     hcs_transaction_id:
     *                       type: string
     *                     hcs_explorer_link:
     *                       type: string
     *       400:
     *         description: Bad request
     *       404:
     *         description: User not found
     *       409:
     *         description: DID already exists for user
     */
    this.router.post('/users', this.createMerchantDID.bind(this));

    /**
     * @swagger
     * /did/transactions:
     *   post:
     *     summary: Log a transaction under merchant's DID
     *     tags: [DID]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - merchant_user_id
     *               - hedera_account
     *               - txn_id
     *               - amount
     *             properties:
     *               merchant_user_id:
     *                 type: string
     *                 format: uuid
     *                 description: The UUID of the merchant
     *               hedera_account:
     *                 type: string
     *                 description: Hedera account ID (e.g., 0.0.12345)
     *               txn_id:
     *                 type: string
     *                 description: Transaction ID from Hedera
     *               amount:
     *                 type: string
     *                 description: Transaction amount in ZAR
     *     responses:
     *       200:
     *         description: Transaction logged successfully
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
     *                     hcs_transaction_id:
     *                       type: string
     *                     hcs_explorer_link:
     *                       type: string
     *       400:
     *         description: Bad request
     *       404:
     *         description: Merchant not found or no DID
     */
    this.router.post('/transactions', this.logTransaction.bind(this));

    /**
     * @swagger
     * /did/users/{userId}:
     *   get:
     *     summary: Get DID for a user
     *     tags: [DID]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: The UUID of the user
     *     responses:
     *       200:
     *         description: DID retrieved successfully
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
     *                     did:
     *                       type: string
     *                       nullable: true
     *       404:
     *         description: User not found
     */
    this.router.get('/users/:userId', this.getDID.bind(this));
  }

  private async createMerchantDID(req: Request, res: Response): Promise<void> {
    try {
      const { user_id }: CreateMerchantDIDRequest = req.body;

      // Validate input
      if (!user_id) {
        res.status(400).json({
          success: false,
          error: 'user_id is required'
        });
        return;
      }

      // Check if user exists
      const user = await this.userService.getUserByUserId(user_id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Check if user already has a DID
      const existingDID = await this.didService.getDIDByUserId(user_id);
      if (existingDID) {
        res.status(409).json({
          success: false,
          error: 'User already has a DID',
          data: {
            did: existingDID
          }
        });
        return;
      }

      // Create DID
      const result = await this.didService.createMerchantDID(user_id);

      logger.info('DID created via API', { 
        user_id, 
        did: result.did,
        hcsTransactionId: result.hcsResult.transactionId 
      });

      res.status(201).json({
        success: true,
        data: {
          did: result.did,
          hcs_transaction_id: result.hcsResult.transactionId,
          hcs_explorer_link: result.hcsResult.explorerLink
        }
      });
    } catch (error) {
      logger.error('Failed to create merchant DID via API', { 
        body: req.body, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error while creating DID'
      });
    }
  }

  private async logTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { 
        merchant_user_id, 
        hedera_account, 
        txn_id, 
        amount 
      }: LogTransactionRequest = req.body;

      // Validate input
      if (!merchant_user_id || !hedera_account || !txn_id || !amount) {
        res.status(400).json({
          success: false,
          error: 'merchant_user_id, hedera_account, txn_id, and amount are required'
        });
        return;
      }

      // Check if merchant exists and has DID
      const hasDID = await this.didService.hasDID(merchant_user_id);
      if (!hasDID) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found or does not have a DID'
        });
        return;
      }

      // Log transaction
      const result = await this.didService.logTransaction(
        merchant_user_id,
        hedera_account,
        txn_id,
        amount
      );

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to log transaction to HCS'
        });
        return;
      }

      logger.info('Transaction logged via API', { 
        merchant_user_id, 
        hedera_account, 
        txn_id, 
        amount,
        hcsTransactionId: result.transactionId 
      });

      res.status(200).json({
        success: true,
        data: {
          hcs_transaction_id: result.transactionId,
          hcs_explorer_link: result.explorerLink
        }
      });
    } catch (error) {
      logger.error('Failed to log transaction via API', { 
        body: req.body, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error while logging transaction'
      });
    }
  }

  private async getDID(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required'
        });
        return;
      }

      const did = await this.didService.getDIDByUserId(userId);

      res.status(200).json({
        success: true,
        data: {
          did: did
        }
      });
    } catch (error) {
      logger.error('Failed to get DID via API', { 
        userId: req.params.userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting DID'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
