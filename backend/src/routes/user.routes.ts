import { Router, Request, Response } from 'express';
import { UserService } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class UserRoutes {
  private router: Router;
  private userService: UserService;

  constructor(userService: UserService) {
    this.router = Router();
    this.userService = userService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/', this.getAllUsers.bind(this));
    this.router.get('/:id', this.getUserById.bind(this));
    this.router.post('/', this.createUser.bind(this));
    this.router.put('/:id', this.updateUser.bind(this));
    this.router.delete('/:id', this.deleteUser.bind(this));
  }

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: Successfully retrieved all users
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
   *                     $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *                   example: "Found 5 users"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  private async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      logger.debug('GET /users - Fetching all users');
      
      const users = await this.userService.getAllUsers();
      
      res.json({
        success: true,
        data: users,
        message: `Found ${users.length} users`
      });
    } catch (error) {
      logger.error('GET /users failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *         example: 1
   *     responses:
   *       200:
   *         description: Successfully retrieved user
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid user ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
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
  private async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id!);
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
        return;
      }

      logger.debug('GET /users/:id - Fetching user', { userId });
      
      const user = await this.userService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('GET /users/:id failed', { userId: req.params.id, error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user'
      });
    }
  }

  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Create a new user with automatic Hedera account
   *     description: |
   *       Creates a new user account with Supabase authentication and automatically creates
   *       a default Hedera account for the user. The Hedera account will have an alias
   *       based on the user's email address.
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User's email address
   *                 example: "user@example.com"
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 description: User's password (minimum 6 characters)
   *                 example: "password123"
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *                   example: "User created successfully"
   *       400:
   *         description: Bad request - missing or invalid email/password
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
  private async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
        return;
      }

      // Basic password validation (minimum 6 characters)
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
        return;
      }
      
      logger.info('POST /users - Creating user', { email });
      
      const user = await this.userService.createUser({ email, password });
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      logger.error('POST /users failed', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     summary: Update user by ID
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUserRequest'
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *                   example: "User updated successfully"
   *       400:
   *         description: Invalid user ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
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
  private async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id!);
      const { balance } = req.body;
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
        return;
      }

      logger.info('PUT /users/:id - Updating user', { userId, balance });
      
      const user = await this.userService.updateUser(userId, { balance });
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      logger.error('PUT /users/:id failed', { userId: req.params.id, error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Failed to update user'
      });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: Delete user by ID
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *         example: 1
   *     responses:
   *       200:
   *         description: User deleted successfully
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
   *                   example: "User deleted successfully"
   *       400:
   *         description: Invalid user ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
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
  private async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id!);
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
        return;
      }

      logger.info('DELETE /users/:id - Deleting user', { userId });
      
      const deleted = await this.userService.deleteUser(userId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('DELETE /users/:id failed', { userId: req.params.id, error });
      res.status(500).json({
        success: false,
        error: 'Failed to delete user'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
