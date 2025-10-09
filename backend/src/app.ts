import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config, validateConfig } from './config/index.js';
import { swaggerSpec } from './config/swagger.js';
import { HederaInfrastructure } from './infrastructure/hedera.js';
import { ExternalApiInfrastructure } from './infrastructure/external-api.js';
import { UserServiceImpl } from './services/user.service.js';
import { HederaServiceImpl } from './services/hedera.service.js';
import { HederaAccountServiceImpl } from './services/hedera-account.service.js';
import { DIDService } from './services/did.service.js';
import { AuthService } from './services/auth.service.js';
import { Routes } from './routes/index.js';
import { DIDRoutes } from './routes/did.routes.js';
import { TransactionRoutes } from './routes/transaction.routes.js';
import kycRoutes from './routes/kyc.routes.js';
import { logger } from './utils/logger.js';

export class App {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration for mobile development
    this.app.use(cors({
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Swagger documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Hedera Express API Documentation'
    }));
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      logger.debug('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    try {
      // Initialize infrastructure
      const hederaInfra = new HederaInfrastructure(config.hedera);
      const externalApiInfra = new ExternalApiInfrastructure(
        config.externalApi.baseUrl,
        config.externalApi.apiKey
      );

      // Initialize services
      const authService = new AuthService();
      const userService = new UserServiceImpl(externalApiInfra, authService);
      const hederaAccountService = new HederaAccountServiceImpl(hederaInfra, externalApiInfra, userService, authService);
      
      // Set the HederaAccountService in userService to enable automatic Hedera account creation
      userService.setHederaAccountService(hederaAccountService);
      
      const hederaService = new HederaServiceImpl(hederaInfra, hederaAccountService, externalApiInfra);
      
      // Initialize DID service with existing Hedera infrastructure
      const didService = new DIDService(hederaInfra, config.did.hcsTopicId || undefined);

      // Initialize routes
      const routes = new Routes(userService, hederaService, hederaAccountService);
      logger.debug('Main routes initialized');
      
      const didRoutes = new DIDRoutes(didService, userService);
      logger.debug('DID routes initialized');
      
      const transactionRoutes = new TransactionRoutes(hederaService, didService);
      logger.debug('Transaction routes initialized');
      
      // Mount routes (order matters - mount specific routes before general ones)
      this.app.use('/api/did', didRoutes.getRouter());
      logger.debug('DID routes mounted at /api/did');
      
      this.app.use('/api/transactions', transactionRoutes.getRouter());
      logger.debug('Transaction routes mounted at /api/transactions');
      
      this.app.use('/api/kyc', kycRoutes);
      logger.debug('KYC routes mounted at /api/kyc');
      
      this.app.use('/api', routes.getRouter());
      logger.debug('Main routes mounted at /api');
      
      logger.info('Routes initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize routes', { error });
      throw error;
    }
  }

  public start(): void {
    try {
      // Validate configuration
      validateConfig();
      
      // Start server with error handling
      const server = this.app.listen(this.port, () => {
        logger.info('Server started successfully', {
          port: this.port,
          environment: config.nodeEnv,
          hederaNetwork: config.hedera.network
        });
      });

      // Handle server errors
      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${this.port} is already in use. Please stop any existing servers or use a different port.`, { 
            port: this.port,
            error: error.message 
          });
        } else {
          logger.error('Server error occurred', { error });
        }
        process.exit(1);
      });

      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', { error });
        process.exit(1);
      });

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection', { reason, promise });
        process.exit(1);
      });

    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}
