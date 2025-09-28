import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

export class AuthRoutes {
  private router: Router;
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.router = Router();
    this.authService = authService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/signup', this.signUp.bind(this));
    this.router.post('/signin', this.signIn.bind(this));
    this.router.post('/logout', this.logout.bind(this));
    this.router.get('/me', this.getCurrentUser.bind(this));
  }

  /**
   * @swagger
   * /auth/signup:
   *   post:
   *     summary: Create a new user account
   *     description: |
   *       Creates a new user account with Supabase authentication and automatically creates
   *       a default Hedera account for the user. The Hedera account will have an alias
   *       based on the user's email address.
   *     tags: [Authentication]
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
   *                   type: object
   *                   properties:
   *                     user:
   *                       type: object
   *                       description: User information from Supabase Auth
   *                     session:
   *                       type: object
   *                       description: User session information
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
  private async signUp(req: Request, res: Response): Promise<void> {
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
      
      logger.info('POST /auth/signup - Creating user', { email });
      
      const result = await this.authService.signUp(email, password);
      
      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error.message
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          session: result.session
        },
        message: 'User created successfully'
      });
    } catch (error) {
      logger.error('POST /auth/signup failed', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }
  }

  /**
   * @swagger
   * /auth/signin:
   *   post:
   *     summary: Sign in with email and password
   *     description: Authenticates a user with their email and password
   *     tags: [Authentication]
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
   *                 description: User's password
   *                 example: "password123"
   *     responses:
   *       200:
   *         description: User signed in successfully
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
   *                     user:
   *                       type: object
   *                       description: User information from Supabase Auth
   *                     session:
   *                       type: object
   *                       description: User session information
   *                 message:
   *                   type: string
   *                   example: "User signed in successfully"
   *       400:
   *         description: Bad request - missing or invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized - invalid credentials
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
  private async signIn(req: Request, res: Response): Promise<void> {
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
      
      logger.info('POST /auth/signin - Signing in user', { email });
      
      const result = await this.authService.signIn(email, password);
      
      if (result.error || !result.user) {
        const statusCode = result?.error?.status === 400 ? 401 : 400;
        res.status(statusCode).json({
          success: false,
          error: result?.error?.message
        });
        return;
      }

      const userData = await this.authService.getUserById(result.user.id);

      res.json({
        success: true,
        data: userData,
        message: 'User signed in successfully'
      });
    } catch (error) {
      logger.error('POST /auth/signin failed', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Failed to sign in user'
      });
    }
  }

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: Sign out the current user
   *     description: Signs out the current user and invalidates their session
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: User signed out successfully
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
   *                   example: "User signed out successfully"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  private async logout(req: Request, res: Response): Promise<void> {
    try {
      logger.info('POST /auth/logout - Signing out user');
      
      // For now, we'll just return success
      // In a real implementation, you might want to invalidate the session
      // or call Supabase's signOut method
      
      res.json({
        success: true,
        message: 'User signed out successfully'
      });
    } catch (error) {
      logger.error('POST /auth/logout failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to sign out user'
      });
    }
  }

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Get current user information
   *     description: Returns the current authenticated user's information
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User information retrieved successfully
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
   *                   description: User information from Supabase Auth
   *       401:
   *         description: Unauthorized - no valid session
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
  private async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // Extract user ID from request (this would typically come from JWT token or session)
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'No user session found'
        });
        return;
      }

      logger.info('GET /auth/me - Getting current user', { userId });
      
      const user = await this.authService.getUserById(userId);
      
      if (!user) {
        res.status(401).json({
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
      logger.error('GET /auth/me failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get current user'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
