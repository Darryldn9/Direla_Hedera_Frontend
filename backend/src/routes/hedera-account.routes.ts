import { Router, Request, Response } from 'express';
import { HederaAccountService } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { isValidHederaAccountId } from '../utils/hedera-validation.js';

export class HederaAccountRoutes {
  private router: Router;
  private hederaAccountService: HederaAccountService;

  constructor(hederaAccountService: HederaAccountService) {
    this.router = Router();
    this.hederaAccountService = hederaAccountService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/', this.getAllAccounts.bind(this));
    this.router.get('/active', this.getActiveAccounts.bind(this));
    this.router.get('/user/:userId', this.getAccountsByUserId.bind(this));
    this.router.get('/:id', this.getAccountById.bind(this));
    this.router.get('/balance/:accountId', this.getAccountBalance.bind(this));
    this.router.get('/info/:accountId', this.getAccountInfo.bind(this));
    this.router.post('/', this.createAccount.bind(this));
    this.router.put('/:id', this.updateAccount.bind(this));
    this.router.delete('/:id', this.deleteAccount.bind(this));
  }

  /**
   * @swagger
   * /hedera-accounts:
   *   get:
   *     summary: Get all Hedera accounts
   *     tags: [Hedera Accounts]
   *     responses:
   *       200:
   *         description: Successfully retrieved all Hedera accounts
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
   *                     $ref: '#/components/schemas/HederaAccount'
   *                 message:
   *                   type: string
   *                   example: "Found 5 Hedera accounts"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  private async getAllAccounts(req: Request, res: Response): Promise<void> {
    try {
      logger.debug('GET /hedera-accounts - Fetching all accounts');
      
      const accounts = await this.hederaAccountService.getAllAccounts();
      
      res.json({
        success: true,
        data: accounts,
        message: `Found ${accounts.length} Hedera accounts`
      });
    } catch (error) {
      logger.error('GET /hedera-accounts failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Hedera accounts'
      });
    }
  }

  /**
   * @swagger
   * /hedera-accounts/active:
   *   get:
   *     summary: Get active Hedera accounts
   *     tags: [Hedera Accounts]
   *     responses:
   *       200:
   *         description: Successfully retrieved active Hedera accounts
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
   *                     $ref: '#/components/schemas/HederaAccount'
   *                 message:
   *                   type: string
   *                   example: "Found 3 active Hedera accounts"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  private async getActiveAccounts(req: Request, res: Response): Promise<void> {
    try {
      logger.debug('GET /hedera-accounts/active - Fetching active accounts');
      
      const accounts = await this.hederaAccountService.getActiveAccounts();
      
      res.json({
        success: true,
        data: accounts,
        message: `Found ${accounts.length} active Hedera accounts`
      });
    } catch (error) {
      logger.error('GET /hedera-accounts/active failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active Hedera accounts'
      });
    }
  }

  /**
   * @swagger
   * /hedera-accounts/user/{userId}:
   *   get:
   *     summary: Get all Hedera accounts for a specific user
   *     tags: [Hedera Accounts]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID (UUID)
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: Successfully retrieved user's Hedera accounts
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
   *                     $ref: '#/components/schemas/HederaAccount'
   *                 message:
   *                   type: string
   *                   example: "Found 2 Hedera accounts for user"
   *       400:
   *         description: Invalid user ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               invalidUserId:
   *                 summary: Invalid UUID format
   *                 value:
   *                   success: false
   *                   error: "Invalid user ID format"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  private async getAccountsByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }
      
      // Basic UUID validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID format'
        });
        return;
      }

      logger.debug('GET /hedera-accounts/user/:userId - Fetching accounts for user', { userId });
      
      const accounts = await this.hederaAccountService.getAccountsByUserId(userId);
      
      res.json({
        success: true,
        data: accounts,
        message: `Found ${accounts.length} Hedera accounts for user`
      });
    } catch (error) {
      logger.error('GET /hedera-accounts/user/:userId failed', { userId: req.params.userId, error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user accounts'
      });
    }
  }

  /**
   * @swagger
   * /hedera-accounts/{id}:
   *   get:
   *     summary: Get Hedera account by ID
   *     tags: [Hedera Accounts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Account ID
   *         example: 1
   *     responses:
   *       200:
   *         description: Successfully retrieved Hedera account
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/HederaAccount'
   *       400:
   *         description: Invalid account ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Hedera account not found
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
  private async getAccountById(req: Request, res: Response): Promise<void> {
    try {
      const accountId = parseInt(req.params.id!);
      
      if (isNaN(accountId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid account ID'
        });
        return;
      }

      logger.debug('GET /hedera-accounts/:id - Fetching account', { accountId });
      
      const account = await this.hederaAccountService.getAccountById(accountId);
      
      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Hedera account not found'
        });
        return;
      }

      res.json({
        success: true,
        data: account
      });
    } catch (error) {
      logger.error('GET /hedera-accounts/:id failed', { accountId: req.params.id, error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Hedera account'
      });
    }
  }

  /**
   * @swagger
   * /hedera-accounts:
   *   post:
   *     summary: Create a new Hedera account for an existing user
   *     description: |
   *       Creates a new Hedera account on the blockchain and stores the details in the database.
   *       The user must already exist in the system before creating a Hedera account.
   *       
   *       The system will:
   *       1. Verify that the user exists in the database
   *       2. Create Hedera account on the blockchain with the provided alias (if any)
   *       3. Store account details in the hedera_accounts table
   *       4. Return complete account information
   *     tags: [Hedera Accounts]
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
   *                 description: UUID of the existing user
   *                 example: "123e4567-e89b-12d3-a456-426614174000"
   *               alias:
   *                 type: string
   *                 description: Optional alias for the Hedera account
   *                 example: "My Hedera Account"
   *               initial_balance:
   *                 type: number
   *                 minimum: 0
   *                 description: Initial balance for the Hedera account (defaults to 0)
   *                 example: 100
   *           examples:
   *             basicAccount:
   *               summary: Create account with minimal required fields
   *               value:
   *                 user_id: "123e4567-e89b-12d3-a456-426614174000"
   *             accountWithAlias:
   *               summary: Create account with alias and initial balance
   *               value:
   *                 user_id: "123e4567-e89b-12d3-a456-426614174000"
   *                 alias: "My Hedera Account"
   *                 initial_balance: 100
   *     responses:
   *       201:
   *         description: Hedera account created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/HederaAccount'
   *                 message:
   *                   type: string
   *                   example: "Hedera account created successfully"
   *       400:
   *         description: Bad request - missing required fields or validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               missingUserId:
   *                 summary: Missing user_id
   *                 value:
   *                   success: false
   *                   error: "user_id is required"
   *               invalidBalance:
   *                 summary: Invalid initial balance
   *                 value:
   *                   success: false
   *                   error: "initial_balance must be a non-negative number"
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               userNotFound:
   *                 summary: User does not exist
   *                 value:
   *                   success: false
   *                   error: "User with ID 123e4567-e89b-12d3-a456-426614174000 not found. User must exist before creating Hedera account."
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  private async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const { alias, initial_balance, user_id } = req.body;
      
      // Validate required fields
      if (!user_id) {
        res.status(400).json({
          success: false,
          error: 'user_id is required'
        });
        return;
      }

      // Validate initial_balance if provided
      if (initial_balance !== undefined && (typeof initial_balance !== 'number' || initial_balance < 0)) {
        res.status(400).json({
          success: false,
          error: 'initial_balance must be a non-negative number'
        });
        return;
      }
      
      logger.info('POST /hedera-accounts - Creating account', { 
        alias, 
        initial_balance, 
        user_id
      });
      
      const account = await this.hederaAccountService.createAccount({ 
        alias, 
        initial_balance,
        user_id
      });
      
      res.status(201).json({
        success: true,
        data: account,
        message: 'Hedera account created successfully'
      });
    } catch (error) {
      logger.error('POST /hedera-accounts failed', { error, body: req.body });
      
      // Handle specific error cases
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Hedera account'
      });
    }
  }

  /**
   * @swagger
   * /hedera-accounts/{id}:
   *   put:
   *     summary: Update Hedera account by ID
   *     tags: [Hedera Accounts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Account ID
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateHederaAccountRequest'
   *     responses:
   *       200:
   *         description: Hedera account updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/HederaAccount'
   *                 message:
   *                   type: string
   *                   example: "Hedera account updated successfully"
   *       400:
   *         description: Invalid account ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Hedera account not found
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
  private async updateAccount(req: Request, res: Response): Promise<void> {
    try {
      const accountId = parseInt(req.params.id!);
      const { alias, isActive } = req.body;
      
      if (isNaN(accountId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid account ID'
        });
        return;
      }

      logger.info('PUT /hedera-accounts/:id - Updating account', { accountId, alias, isActive });
      
      const account = await this.hederaAccountService.updateAccount(accountId, { alias, is_active: isActive });
      
      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Hedera account not found'
        });
        return;
      }

      res.json({
        success: true,
        data: account,
        message: 'Hedera account updated successfully'
      });
    } catch (error) {
      logger.error('PUT /hedera-accounts/:id failed', { accountId: req.params.id, error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Failed to update Hedera account'
      });
    }
  }

  /**
   * @swagger
   * /hedera-accounts/{id}:
   *   delete:
   *     summary: Delete Hedera account by ID
   *     tags: [Hedera Accounts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Account ID
   *         example: 1
   *     responses:
   *       200:
   *         description: Hedera account deleted successfully
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
   *                   example: "Hedera account deleted successfully"
   *       400:
   *         description: Invalid account ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Hedera account not found
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
  private async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const accountId = parseInt(req.params.id!);
      
      if (isNaN(accountId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid account ID'
        });
        return;
      }

      logger.info('DELETE /hedera-accounts/:id - Deleting account', { accountId });
      
      const deleted = await this.hederaAccountService.deleteAccount(accountId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Hedera account not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Hedera account deleted successfully'
      });
    } catch (error) {
      logger.error('DELETE /hedera-accounts/:id failed', { accountId: req.params.id, error });
      res.status(500).json({
        success: false,
        error: 'Failed to delete Hedera account'
      });
    }
  }

  /**
   * @swagger
   * /hedera-accounts/balance/{accountId}:
   *   get:
   *     summary: Get Hedera account balance
   *     tags: [Hedera Accounts]
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *         description: Hedera account ID
   *         example: "0.0.123456"
   *     responses:
   *       200:
   *         description: Successfully retrieved account balance
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
   *                     accountId:
   *                       type: string
   *                       example: "0.0.123456"
   *                     balance:
   *                       type: number
   *                       example: 100.5
   *                 message:
   *                   type: string
   *                   example: "Account balance: 100.5 HBAR"
   *       400:
   *         description: Account ID is required
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
  private async getAccountBalance(req: Request, res: Response): Promise<void> {
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
      
      logger.debug('GET /hedera-accounts/balance/:accountId - Getting balance', { accountId });
      
      const balances = await this.hederaAccountService.getAccountBalance(accountId);
      
      res.json({
        success: true,
        data: { accountId, balances },
        message: `Account balances retrieved successfully`
      });
    } catch (error) {
      logger.error('GET /hedera-accounts/balance/:accountId failed', { accountId: req.params.accountId, error });
      res.status(500).json({
        success: false,
        error: 'Failed to get account balance'
      });
    }
  }

  /**
   * @swagger
   * /hedera-accounts/info/{accountId}:
   *   get:
   *     summary: Get Hedera account information
   *     tags: [Hedera Accounts]
   *     parameters:
   *       - in: path
   *         name: accountId
   *         required: true
   *         schema:
   *           type: string
   *         description: Hedera account ID
   *         example: "0.0.123456"
   *     responses:
   *       200:
   *         description: Successfully retrieved account info
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
   *                     accountId:
   *                       type: string
   *                       example: "0.0.123456"
   *                     accountInfo:
   *                       type: object
   *                 message:
   *                   type: string
   *                   example: "Account info retrieved successfully"
   *       400:
   *         description: Account ID is required
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
  private async getAccountInfo(req: Request, res: Response): Promise<void> {
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
      
      logger.debug('GET /hedera-accounts/info/:accountId - Getting account info', { accountId });
      
      const accountInfo = await this.hederaAccountService.getAccountInfo(accountId);
      
      res.json({
        success: true,
        data: { accountId, accountInfo },
        message: 'Account info retrieved successfully'
      });
    } catch (error) {
      logger.error('GET /hedera-accounts/info/:accountId failed', { accountId: req.params.accountId, error });
      res.status(500).json({
        success: false,
        error: 'Failed to get account info'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
