import { Router } from 'express';
import { UserRoutes } from './user.routes.js';
import { HederaRoutes } from './hedera.routes.js';
import { HederaAccountRoutes } from './hedera-account.routes.js';
import { AuthRoutes } from './auth.routes.js';
import { CachedTransactionRoutes } from './cached-transaction.routes.js';
import diagnosticsRoutes from './diagnostics.routes.js';
import { UserService, HederaService, HederaAccountService } from '../types/index.js';
import { AuthService } from '../services/auth.service.js';
import { MetricsRoutes } from './metrics.routes.js';
import whatsappRoutes from './whatsapp.routes.js'; // Import the WhatsApp routes
import bnplRoutes from './bnpl.routes.js'; // Import the BNPL routes

export class Routes {
  private router: Router;
  private userRoutes: UserRoutes;
  private hederaRoutes: HederaRoutes;
  private hederaAccountRoutes: HederaAccountRoutes;
  private authRoutes: AuthRoutes;
  private cachedTransactionRoutes: CachedTransactionRoutes;
  private metricsRoutes: MetricsRoutes;

  constructor(userService: UserService, hederaService: HederaService, hederaAccountService: HederaAccountService) {
    this.router = Router();
    this.userRoutes = new UserRoutes(userService);
    this.hederaRoutes = new HederaRoutes(hederaService);
    this.hederaAccountRoutes = new HederaAccountRoutes(hederaAccountService);
    this.authRoutes = new AuthRoutes(new AuthService());
    this.cachedTransactionRoutes = new CachedTransactionRoutes(hederaService);
    this.metricsRoutes = new MetricsRoutes(hederaService, hederaAccountService);
    this.setupRoutes();
    
  }

  private setupRoutes(): void {
    // Health check endpoint
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Server is running
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
     *                   example: "Server is running"
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                   example: "2024-01-01T00:00:00.000Z"
     */
    this.router.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
      });
    });

    // API routes
    this.router.use('/auth', this.authRoutes.getRouter());
    this.router.use('/users', this.userRoutes.getRouter());
    this.router.use('/hedera', this.hederaRoutes.getRouter());
    this.router.use('/hedera-accounts', this.hederaAccountRoutes.getRouter());
    this.router.use('/cached-transactions', this.cachedTransactionRoutes.getRouter());
    this.router.use('/metrics', this.metricsRoutes.getRouter());
    this.router.use('/diagnostics', diagnosticsRoutes);
    this.router.use('/whatsapp', whatsappRoutes); // Use the WhatsApp routes
    this.router.use('/bnpl', bnplRoutes); // Use the BNPL routes

    // 404 handler
    this.router.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}
