import { HederaInfrastructure } from '../infrastructure/hedera.js';
import { 
  HederaService, 
  HederaTransactionResult,
  PaymentRequest,
  HederaAccountService
} from '../types/index.js';
import { logger } from '../utils/logger.js';

export class HederaServiceImpl implements HederaService {
  private hederaInfra: HederaInfrastructure;
  private hederaAccountService: HederaAccountService;

  constructor(hederaInfra: HederaInfrastructure, hederaAccountService: HederaAccountService) {
    this.hederaInfra = hederaInfra;
    this.hederaAccountService = hederaAccountService;
  }

  async getAccountBalance(accountId: string): Promise<number> {
    return this.hederaInfra.getAccountBalance(accountId);
  }

  async createAccount(initialBalance: number, alias?: string): Promise<{ accountId: string; privateKey: string; publicKey: string }> {
    return this.hederaInfra.createAccount(initialBalance, alias);
  }

  async getAccountInfo(accountId: string): Promise<any> {
    return this.hederaInfra.getAccountInfo(accountId);
  }

  async transferHbar(
    fromAccountId: string, 
    toAccountId: string, 
    amount: number
  ): Promise<HederaTransactionResult> {
    try {
      logger.info('Initiating Hbar transfer', { 
        fromAccountId, 
        toAccountId, 
        amount 
      });

      // Validate amount
      if (amount <= 0) {
        throw new Error('Transfer amount must be positive');
      }

      // Check if accounts are different
      if (fromAccountId === toAccountId) {
        throw new Error('Cannot transfer to the same account');
      }

      const result = await this.hederaInfra.transferHbar(
        fromAccountId, 
        toAccountId, 
        amount
      );

      if (result.status === 'SUCCESS') {
        logger.info('Hbar transfer completed successfully', { 
          fromAccountId, 
          toAccountId, 
          amount,
          transactionId: result.transactionId
        });
      } else {
        logger.error('Hbar transfer failed', { 
          fromAccountId, 
          toAccountId, 
          amount,
          transactionId: result.transactionId,
          message: result.message
        });
      }

      return result;
    } catch (error) {
      logger.error('Hbar transfer service error', { 
        fromAccountId, 
        toAccountId, 
        amount, 
        error 
      });
      
      return {
        transactionId: '',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }



  async processPayment(paymentRequest: PaymentRequest): Promise<HederaTransactionResult> {
    try {
      const { fromAccountId, toAccountId, amount, memo } = paymentRequest;
      
      logger.info('Processing payment', { 
        fromAccountId, 
        toAccountId, 
        amount, 
        memo 
      });

      // Validate accounts exist in our database
      const fromAccount = await this.hederaAccountService.getAccountByAccountId(fromAccountId);
      const toAccount = await this.hederaAccountService.getAccountByAccountId(toAccountId);

      if (!fromAccount) {
        throw new Error(`From account ${fromAccountId} not found in database`);
      }

      if (!toAccount) {
        throw new Error(`To account ${toAccountId} not found in database`);
      }

      if (!fromAccount.is_active) {
        throw new Error(`From account ${fromAccountId} is not active`);
      }

      if (!toAccount.is_active) {
        throw new Error(`To account ${toAccountId} is not active`);
      }

      // Validate amount
      if (amount <= 0) {
        throw new Error('Payment amount must be positive');
      }

      // Check if accounts are different
      if (fromAccountId === toAccountId) {
        throw new Error('Cannot transfer to the same account');
      }

      // Get current balances from Hedera network
      const fromBalance = await this.hederaAccountService.getAccountBalance(fromAccountId);
      const toBalance = await this.hederaAccountService.getAccountBalance(toAccountId);

      // Check sufficient balance
      if (fromBalance < amount) {
        throw new Error(`Insufficient balance. Available: ${fromBalance} HBAR, Required: ${amount} HBAR`);
      }

      // Execute the transfer
      const result = await this.hederaInfra.transferHbar(fromAccountId, toAccountId, amount);

      if (result.status === 'SUCCESS') {
        // Update balances in our database
        const newFromBalance = fromBalance - amount;
        const newToBalance = toBalance + amount;
        
        await this.hederaAccountService.updateAccountBalance(fromAccountId, newFromBalance);
        await this.hederaAccountService.updateAccountBalance(toAccountId, newToBalance);

        logger.info('Payment processed successfully', { 
          fromAccountId, 
          toAccountId, 
          amount,
          transactionId: result.transactionId,
          newFromBalance,
          newToBalance
        });
      } else {
        logger.error('Payment failed', { 
          fromAccountId, 
          toAccountId, 
          amount,
          transactionId: result.transactionId,
          message: result.message
        });
      }

      return result;
    } catch (error) {
      logger.error('Payment processing error', { 
        paymentRequest, 
        error 
      });
      
      return {
        transactionId: '',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
