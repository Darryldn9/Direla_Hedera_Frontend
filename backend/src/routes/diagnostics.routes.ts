import { Router, Request, Response } from 'express';
import { HederaDiagnostics } from '../utils/hedera-diagnostics.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /diagnostics/hedera:
 *   get:
 *     summary: Run Hedera configuration diagnostics
 *     description: Comprehensive diagnostics for Hedera setup including signature validation
 *     tags: [Diagnostics]
 *     responses:
 *       200:
 *         description: Diagnostics completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/HederaDiagnosticsResult'
 *       500:
 *         description: Internal server error
 */
router.get('/hedera', async (req: Request, res: Response) => {
  try {
    logger.info('Running Hedera diagnostics');

    // Validate environment variables first
    const envValidation = HederaDiagnostics.validateEnvironmentVariables();
    if (!envValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Environment validation failed',
        issues: envValidation.issues
      });
    }

    // Run comprehensive diagnostics
    const diagnostics = await HederaDiagnostics.diagnoseHederaSetup(
      config.hedera.accountId,
      config.hedera.privateKey,
      config.hedera.network
    );

    logger.info('Hedera diagnostics completed', { 
      isValid: diagnostics.isValid,
      issueCount: diagnostics.issues.length,
      warningCount: diagnostics.warnings.length
    });

    return res.json({
      success: true,
      data: diagnostics
    });
  } catch (error) {
    logger.error('Hedera diagnostics failed', { error });
    return res.status(500).json({
      success: false,
      error: 'Diagnostics failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /diagnostics/env:
 *   get:
 *     summary: Check environment variables
 *     description: Validate that all required environment variables are set
 *     tags: [Diagnostics]
 *     responses:
 *       200:
 *         description: Environment validation completed
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
 *                     isValid:
 *                       type: boolean
 *                     issues:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/env', async (req: Request, res: Response) => {
  try {
    const validation = HederaDiagnostics.validateEnvironmentVariables();
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error('Environment validation failed', { error });
    res.status(500).json({
      success: false,
      error: 'Environment validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /diagnostics/test-signature:
 *   post:
 *     summary: Test transaction signature
 *     description: Test if the current configuration can sign transactions properly
 *     tags: [Diagnostics]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromAccountId:
 *                 type: string
 *                 description: Account ID to test with
 *               toAccountId:
 *                 type: string
 *                 description: Destination account ID
 *               amount:
 *                 type: number
 *                 description: Amount to transfer (in HBAR)
 *     responses:
 *       200:
 *         description: Signature test completed
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
 *                     canSign:
 *                       type: boolean
 *                     error:
 *                       type: string
 *                     transactionId:
 *                       type: string
 */
router.post('/test-signature', async (req: Request, res: Response) => {
  try {
    const { fromAccountId, toAccountId, amount } = req.body;
    
    // Use provided values or defaults
    const testFromAccount = fromAccountId || config.hedera.accountId;
    const testToAccount = toAccountId || config.hedera.accountId; // Use same account for test
    const testAmount = amount || 0.001; // Small test amount

    logger.info('Testing transaction signature', { 
      fromAccountId: testFromAccount,
      toAccountId: testToAccount,
      amount: testAmount
    });

    // Import HederaInfrastructure dynamically to avoid circular imports
    const { HederaInfrastructure } = await import('../infrastructure/hedera.js');
    
    const hederaInfra = new HederaInfrastructure(config.hedera);
    
    // Test the enhanced transfer method
    const result = await hederaInfra.transferHbarWithValidation(
      testFromAccount,
      testToAccount,
      testAmount
    );

    res.json({
      success: true,
      data: {
        canSign: result.status === 'SUCCESS',
        error: result.status === 'FAILED' ? result.message : null,
        transactionId: result.transactionId
      }
    });
  } catch (error) {
    logger.error('Signature test failed', { error });
    res.json({
      success: false,
      data: {
        canSign: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: null
      }
    });
  }
});

export default router;
