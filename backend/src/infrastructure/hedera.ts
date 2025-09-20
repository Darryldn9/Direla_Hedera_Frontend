import {
  Client,
  AccountId,
  PrivateKey,
  AccountBalanceQuery,
  TransferTransaction,
  Hbar,
  AccountCreateTransaction,
  AccountInfoQuery,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  Status,
  PublicKey
} from '@hashgraph/sdk';
import { HederaConfig, HederaTransactionResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class HederaInfrastructure {
  private client: Client;
  private operatorId: AccountId;
  private operatorKey: PrivateKey;

  constructor(config: HederaConfig) {
    try {
      // Validate and parse account ID
    this.operatorId = AccountId.fromString(config.accountId);
      
      // Validate and parse private key
      this.operatorKey = this.validateAndParsePrivateKey(config.privateKey);
    
      // Initialize client
    this.client = Client.forName(config.network);
      
      // Set operator with validation
    this.client.setOperator(this.operatorId, this.operatorKey);
    
      // Note: Key-account verification is now done lazily when needed
      // This prevents blocking the constructor with async operations
      
      logger.info('Hedera client initialized successfully', { 
        accountId: config.accountId, 
        network: config.network
      });
    } catch (error) {
      logger.error('Failed to initialize Hedera client', { 
      accountId: config.accountId, 
        network: config.network,
        error: error instanceof Error ? error.message : 'Unknown error'
    });
      throw new Error(`Hedera client initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAccountBalance(accountId: string): Promise<number> {
    try {
      const query = new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId));
      
      const balance = await query.execute(this.client);
      const hbarBalance = Number(balance.hbars.toString());
      
      logger.debug('Account balance retrieved', { accountId, balance: hbarBalance });
      return hbarBalance;
    } catch (error) {
      logger.error('Failed to get account balance', { accountId, error });
      throw error;
    }
  }

  async transferHbar(
    fromAccountId: string, 
    toAccountId: string, 
    amount: number
  ): Promise<HederaTransactionResult> {
    try {
      // Verify key-account match before proceeding
      const keyMatch = await this.verifyKeyAccountMatch();
      if (!keyMatch) {
        throw new Error('Private key does not match the account. Please verify your credentials.');
      }

      const transferTransaction = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(fromAccountId), Hbar.fromTinybars(-amount * 100000000))
        .addHbarTransfer(AccountId.fromString(toAccountId), Hbar.fromTinybars(amount * 100000000));

      const response = await transferTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.status === Status.Success) {
        logger.info('Hbar transfer successful', { 
          fromAccountId, 
          toAccountId, 
          amount,
          transactionId: response.transactionId.toString()
        });
        
        return {
          transactionId: response.transactionId.toString(),
          status: 'SUCCESS'
        };
      } else {
        logger.error('Hbar transfer failed', { 
          fromAccountId, 
          toAccountId, 
          amount,
          status: receipt.status
        });
        
        return {
          transactionId: response.transactionId.toString(),
          status: 'FAILED',
          message: `Transfer failed with status: ${receipt.status}`
        };
      }
    } catch (error) {
      logger.error('Hbar transfer error', { fromAccountId, toAccountId, amount, error });
      return {
        transactionId: '',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createAccount(initialBalance: number, alias?: string): Promise<{ accountId: string; privateKey: string; publicKey: string }> {
    try {
      const newAccountPrivateKey = PrivateKey.generateED25519();
      const newAccountPublicKey = newAccountPrivateKey.publicKey;

      const accountCreateTransaction = new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(initialBalance * 100000000));

      // Add alias if provided
      if (alias) {
        accountCreateTransaction.setAccountMemo(alias);
      }

      const newAccount = await accountCreateTransaction.execute(this.client);

      const receipt = await newAccount.getReceipt(this.client);
      const newAccountId = receipt.accountId?.toString();

      if (!newAccountId) {
        throw new Error('Failed to create account - no account ID returned');
      }

      // Convert private key to string format
      const privateKeyString = newAccountPrivateKey.toString();
      const publicKeyString = newAccountPublicKey.toString();

      logger.info('New account created', { 
        accountId: newAccountId, 
        initialBalance,
        alias: alias || 'No alias provided',
        hasPrivateKey: !!privateKeyString,
        hasPublicKey: !!publicKeyString
      });

      return {
        accountId: newAccountId,
        privateKey: privateKeyString,
        publicKey: publicKeyString
      };
    } catch (error) {
      logger.error('Failed to create account', { initialBalance, error });
      throw error;
    }
  }

  async getAccountInfo(accountId: string) {
    try {
      const query = new AccountInfoQuery()
        .setAccountId(AccountId.fromString(accountId));
      
      const accountInfo = await query.execute(this.client);
      
      logger.debug('Account info retrieved', { accountId });
      return accountInfo;
    } catch (error) {
      logger.error('Failed to get account info', { accountId, error });
      throw error;
    }
  }

  /**
   * Validates and parses the private key with comprehensive error checking
   */
  private validateAndParsePrivateKey(privateKeyString: string): PrivateKey {
    try {
      // Check if private key string is empty or null
      if (!privateKeyString || privateKeyString.trim() === '') {
        throw new Error('Private key cannot be empty');
      }

      // Remove any whitespace
      const cleanKey = privateKeyString.trim();

      // Check if it starts with expected prefixes
      if (!cleanKey.startsWith('302') && !cleanKey.startsWith('303')) {
        logger.warn('Private key does not start with expected prefix (302 or 303)', {
          keyPrefix: cleanKey.substring(0, 10) + '...'
        });
      }

      // Try to parse the private key
      const privateKey = PrivateKey.fromString(cleanKey);

      logger.debug('Private key validated successfully', { 
        keyLength: cleanKey.length 
      });

      return privateKey;
    } catch (error) {
      logger.error('Private key validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        keyPrefix: privateKeyString.substring(0, 10) + '...'
      });
      throw new Error(`Invalid private key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifies that the private key corresponds to the account ID
   * This method is now public and can be called when needed
   */
  async verifyKeyAccountMatch(): Promise<boolean> {
    try {
      // Get the public key from the private key
      const publicKey = this.operatorKey.publicKey;
      
      // Get account info to verify the key matches
      const accountInfo = await this.getAccountInfo(this.operatorId.toString());
      
      // Check if the public key matches
      const accountPublicKey = accountInfo.key;
      if (!accountPublicKey) {
        logger.error('Account does not have a public key');
        return false;
      }

      // Compare public keys - convert Key to PublicKey if needed
      const accountPublicKeyObj = accountPublicKey as PublicKey;
      const keysMatch = publicKey.equals(accountPublicKeyObj);
      
      if (keysMatch) {
        logger.debug('Key-account match verified successfully');
        return true;
      } else {
        logger.error('Private key does not match the account public key');
        return false;
      }
    } catch (error) {
      logger.error('Key-account verification failed', { 
        accountId: this.operatorId.toString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Validates transaction before execution to catch signature issues early
   */
  private async validateTransaction(transaction: any): Promise<void> {
    try {
      // Check if the transaction is properly constructed
      if (!transaction) {
        throw new Error('Transaction is null or undefined');
      }

      // Verify the client is properly initialized
      if (!this.client) {
        throw new Error('Hedera client is not initialized');
      }

      // Verify operator is set
      if (!this.operatorId || !this.operatorKey) {
        throw new Error('Operator credentials are not set');
      }

      logger.debug('Transaction validation passed');
    } catch (error) {
      logger.error('Transaction validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Enhanced transfer method with better error handling and validation
   */
  async transferHbarWithValidation(
    fromAccountId: string, 
    toAccountId: string, 
    amount: number
  ): Promise<HederaTransactionResult> {
    try {
      logger.info('Starting validated Hbar transfer', { 
        fromAccountId, 
        toAccountId, 
        amount 
      });

      // Validate inputs
      if (!fromAccountId || !toAccountId) {
        throw new Error('Account IDs cannot be empty');
      }

      if (amount <= 0) {
        throw new Error('Transfer amount must be positive');
      }

      if (fromAccountId === toAccountId) {
        throw new Error('Cannot transfer to the same account');
      }

      // Verify key-account match before proceeding
      const keyMatch = await this.verifyKeyAccountMatch();
      if (!keyMatch) {
        throw new Error('Private key does not match the account. Please verify your credentials.');
      }

      // Create and validate transaction
      const transferTransaction = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(fromAccountId), Hbar.fromTinybars(-amount * 100000000))
        .addHbarTransfer(AccountId.fromString(toAccountId), Hbar.fromTinybars(amount * 100000000));

      await this.validateTransaction(transferTransaction);

      // Execute transaction with retry logic
      const response = await this.executeTransactionWithRetry(transferTransaction);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.status === Status.Success) {
        logger.info('Hbar transfer successful', { 
          fromAccountId, 
          toAccountId, 
          amount,
          transactionId: response.transactionId.toString()
        });
        
        return {
          transactionId: response.transactionId.toString(),
          status: 'SUCCESS'
        };
      } else {
        logger.error('Hbar transfer failed', { 
          fromAccountId, 
          toAccountId, 
          amount,
          status: receipt.status
        });
        
        return {
          transactionId: response.transactionId.toString(),
          status: 'FAILED',
          message: `Transfer failed with status: ${receipt.status}`
        };
      }
    } catch (error) {
      logger.error('Hbar transfer error', { 
        fromAccountId, 
        toAccountId, 
        amount, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        transactionId: '',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute transaction with retry logic for signature issues
   */
  private async executeTransactionWithRetry(transaction: any, maxRetries: number = 3): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Executing transaction, attempt ${attempt}/${maxRetries}`);
        return await transaction.execute(this.client);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if it's a signature-related error
        if (lastError.message.includes('INVALID_SIGNATURE') || 
            lastError.message.includes('INVALID_ACCOUNT_ID') ||
            lastError.message.includes('UNAUTHORIZED')) {
          
          logger.warn(`Signature error on attempt ${attempt}`, { 
            error: lastError.message,
            attempt 
          });
          
          if (attempt === maxRetries) {
            throw new Error(`Transaction failed after ${maxRetries} attempts due to signature issues: ${lastError.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        } else {
          // Non-signature error, don't retry
          throw lastError;
        }
      }
    }
    
    throw lastError || new Error('Transaction execution failed');
  }

  /**
   * Create a new HCS topic
   */
  async createTopic(): Promise<string> {
    try {
      logger.info('Creating HCS topic');

      const transaction = new TopicCreateTransaction();
      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      if (receipt.status === Status.Success && receipt.topicId) {
        const topicIdString = receipt.topicId.toString();
        
        logger.info('HCS Topic created successfully', { 
          topicId: topicIdString,
          transactionId: response.transactionId.toString()
        });
        
        return topicIdString;
      } else {
        throw new Error('Failed to create HCS topic');
      }
    } catch (error) {
      logger.error('Failed to create HCS topic', { error });
      throw error;
    }
  }

  /**
   * Submit a message to an HCS topic
   */
  async submitTopicMessage(topicId: string, message: string): Promise<HederaTransactionResult> {
    try {
      logger.debug('Submitting message to HCS topic', { 
        topicId, 
        messageSize: message.length 
      });

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(topicId))
        .setMessage(message);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      if (receipt.status === Status.Success) {
        logger.info('HCS message submitted successfully', { 
          topicId,
          transactionId: response.transactionId.toString()
        });

        return {
          transactionId: response.transactionId.toString(),
          status: 'SUCCESS'
        };
      } else {
        logger.error('HCS message submission failed', { 
          topicId,
          status: receipt.status
        });

        return {
          transactionId: response.transactionId.toString(),
          status: 'FAILED',
          message: `HCS message failed with status: ${receipt.status}`
        };
      }
    } catch (error) {
      logger.error('HCS message submission error', { topicId, error });
      return {
        transactionId: '',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the Hedera client (for advanced use cases)
   */
  getClient(): Client {
    return this.client;
  }
}
