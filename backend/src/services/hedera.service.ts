import { HederaInfrastructure } from '../infrastructure/hedera.js';
import { 
  HederaService, 
  HederaTransactionResult,
  PaymentRequest,
  HederaAccountService,
  TransactionHistoryItem
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

      // Execute the transfer, signed by the sender's key to avoid INVALID_SIGNATURE
      const result = await (this.hederaInfra as any).transferHbarFromAccount(
        fromAccountId,
        (fromAccount as any).private_key,
        toAccountId,
        amount
      );

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

  async getTransactionHistory(accountId: string, limit: number = 50): Promise<TransactionHistoryItem[]> {
    try {
      logger.info('Getting transaction history', { accountId, limit });

      // Validate account exists in our database
      const account = await this.hederaAccountService.getAccountByAccountId(accountId);
      if (!account) {
        throw new Error(`Account ${accountId} not found in database`);
      }

      if (!account.is_active) {
        throw new Error(`Account ${accountId} is not active`);
      }

      // Get transaction history from infrastructure layer
      const transactions = await this.hederaInfra.getTransactionHistory(accountId, limit);

      // Enrich transactions with aliases
      const enrichedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          // Look up aliases for from and to accounts
          const fromAccount = await this.hederaAccountService.getAccountByAccountId(transaction.from);
          const toAccount = await this.hederaAccountService.getAccountByAccountId(transaction.to);

          return {
            ...transaction,
            fromAlias: fromAccount?.alias || transaction.from,
            toAlias: toAccount?.alias || transaction.to
          };
        })
      );

      logger.info('Transaction history retrieved successfully', { 
        accountId, 
        transactionCount: enrichedTransactions.length 
      });

      return enrichedTransactions;
    } catch (error) {
      logger.error('Failed to get transaction history', { 
        accountId, 
        limit, 
        error 
      });
      throw error;
    }
  }
}
