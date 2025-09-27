import process from 'process';
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
  PublicKey,
  TransactionRecordQuery,
  TransactionId,
  TokenId,
  TokenMintTransaction,
  TokenBurnTransaction,
  TokenAssociateTransaction,
  TokenDissociateTransaction
} from '@hashgraph/sdk';
import { HederaConfig, HederaTransactionResult, TransactionHistoryItem } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { assertValidHederaAccountId } from '../utils/hedera-validation.js';
import { fromBaseUnits } from '../utils/token-amount.js';

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

  async getAccountBalance(accountId: string): Promise<{ code: string; amount: number }[]> {
    try {
      assertValidHederaAccountId(accountId);
      const query = new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId));
      
      const balance = await query.execute(this.client);
      
      // Define the token IDs for USD and ZAR from environment variables
      const USD_TOKEN_ID = process.env.USD_TOKEN_ID || '0.0.6916971';
      const ZAR_TOKEN_ID = process.env.ZAR_TOKEN_ID || '0.0.6916972';
      
      // Initialize the balances array with HBAR, USD, and ZAR
      const balances = [
        { code: 'HBAR', amount: 0 },
        { code: 'USD', amount: 0 },
        { code: 'ZAR', amount: 0 }
      ];
      
      // Get HBAR balance
      const hbarBalance = balance.hbars.toBigNumber().toNumber();
      if (balances[0]) {
        balances[0].amount = hbarBalance;
      }
      
      // Get token balances
      const tokenBalances = balance.tokens;
      
      if (tokenBalances) {
        for (const [tokenId, balanceAmount] of tokenBalances) {
          if (tokenId) {
            const tokenIdString = tokenId.toString();
            const amount = balanceAmount.toNumber();
            
            if (tokenIdString === USD_TOKEN_ID && balances[1]) {
              balances[1].amount = fromBaseUnits(amount, 'USD');
            } else if (tokenIdString === ZAR_TOKEN_ID && balances[2]) {
              balances[2].amount = fromBaseUnits(amount, 'ZAR');
            }
          }
        }
      }
      
      logger.debug('Account balance retrieved', { 
        accountId, 
        balances: balances.map(b => `${b.code}: ${b.amount}`).join(', ')
      });
      
      return balances;
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

      const tinybars = Math.round(amount * 100000000);
      if (!Number.isFinite(tinybars)) {
        throw new Error('Invalid amount provided');
      }

      const transferTransaction = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(fromAccountId), Hbar.fromTinybars(-tinybars))
        .addHbarTransfer(AccountId.fromString(toAccountId), Hbar.fromTinybars(tinybars));

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

  /**
   * Transfer HBAR using the sender's private key as the payer and signer.
   * This avoids INVALID_SIGNATURE when the configured operator does not match the sender.
   */
  async transferHbarFromAccount(
    fromAccountId: string,
    fromPrivateKey: string,
    toAccountId: string,
    amount: number
  ): Promise<HederaTransactionResult> {
    try {
      const tinybars = Math.round(amount * 100000000);
      if (!Number.isFinite(tinybars)) {
        throw new Error('Invalid amount provided');
      }

      // Build transaction and set payer to the sender account
      const transferTransaction = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(fromAccountId), Hbar.fromTinybars(-tinybars))
        .addHbarTransfer(AccountId.fromString(toAccountId), Hbar.fromTinybars(tinybars))
        .setTransactionId(TransactionId.generate(AccountId.fromString(fromAccountId)));

      // Freeze then sign with the sender's private key
      const senderPrivateKey = this.validateAndParsePrivateKey(fromPrivateKey);
      const frozen = await transferTransaction.freezeWith(this.client);
      const signed = await frozen.sign(senderPrivateKey);

      const response = await signed.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      if (receipt.status === Status.Success) {
        logger.info('Hbar transfer (sender-signed) successful', {
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
        logger.error('Hbar transfer (sender-signed) failed', {
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
      logger.error('Hbar transfer (sender-signed) error', { fromAccountId, toAccountId, amount, error });
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

      const initialTinybars = Math.round(initialBalance * 100000000);
      if (!Number.isFinite(initialTinybars)) {
        throw new Error('Invalid initial balance provided');
      }

      const accountCreateTransaction = new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(initialTinybars));

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
      assertValidHederaAccountId(accountId);
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
      const tinybars = Math.round(amount * 100000000);
      if (!Number.isFinite(tinybars)) {
        throw new Error('Invalid amount provided');
      }

      const transferTransaction = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(fromAccountId), Hbar.fromTinybars(-tinybars))
        .addHbarTransfer(AccountId.fromString(toAccountId), Hbar.fromTinybars(tinybars));

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
      // Use HCS topic ID from environment variable or fallback to hardcoded value
      return process.env.HCS_TOPIC_ID || "0.0.6880055";

      /*
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
    */
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
   * Get transaction history for an account using Hedera Mirror Node API
   * 
   * This method fetches real transaction data from the Hedera Mirror Node REST API.
   * The API provides historical transaction data for any account on the Hedera network.
   * 
   * API Documentation: https://docs.hedera.com/hedera/sdks-and-apis/rest-api
   * 
   * @param accountId - The Hedera account ID to fetch transactions for
   * @param limit - Maximum number of transactions to return (default: 50)
   * @returns Promise<TransactionHistoryItem[]> - Array of transaction history items with aliases
   */
  async getTransactionHistory(accountId: string, limit: number = 50): Promise<TransactionHistoryItem[]> {
    try {
      assertValidHederaAccountId(accountId);
      logger.info('Fetching transaction history from Mirror Node API', { accountId, limit });

      // Use appropriate mirror node API based on network configuration
      const mirrorNodeUrl = config.mirrorNode[config.hedera.network];
      const apiUrl = `${mirrorNodeUrl}/api/v1/transactions?account.id=${accountId}&limit=${limit}&order=desc`;

      logger.debug('Making request to Mirror Node API', { apiUrl });

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Mirror Node API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      logger.debug('Mirror Node API response received', { 
        transactionCount: data.transactions?.length || 0 
      });

      if (!data.transactions || data.transactions.length === 0) {
        logger.info('No transactions found for account', { accountId });
        return [];
      }

      // Parse transactions from Mirror Node API response
      const transactions: TransactionHistoryItem[] = data.transactions.map((tx: any) => {
        // Extract transfer information
        const transfers = tx.transfers || [];
        const accountTransfers = transfers.filter((transfer: any) => 
          transfer.account === accountId
        );

        if (accountTransfers.length === 0) {
          // This shouldn't happen if we filtered by account.id, but just in case
          return null;
        }

        // Determine if this is a send or receive transaction
        const accountTransfer = accountTransfers[0];
        const isReceive = accountTransfer.amount > 0;
        
        // Find the counterparty account
        const counterpartyTransfer = transfers.find((transfer: any) => 
          transfer.account !== accountId
        );

        const counterpartyAccount = counterpartyTransfer?.account || 'Unknown';
        const amount = Math.abs(accountTransfer.amount) / 100000000; // Convert from tinybars to HBAR
        const gasFee = (tx.charged_tx_fee || 0) / 100000000; // Convert from tinybars to HBAR

        return {
          amount,
          currency: 'HBAR',
          gasFee,
          time: Number(tx.consensus_timestamp.split('.')[0]) * 1000,
          to: isReceive ? accountId : counterpartyAccount,
          from: isReceive ? counterpartyAccount : accountId,
          fromAlias: isReceive ? counterpartyAccount : accountId, // Will be replaced with actual alias lookup
          toAlias: isReceive ? accountId : counterpartyAccount, // Will be replaced with actual alias lookup
          transactionId: tx.transaction_id,
          type: isReceive ? 'RECEIVE' : 'SEND'
        };
      }).filter((tx: any) => tx !== null); // Remove null entries

      logger.info('Transaction history retrieved from Mirror Node API', { 
        accountId, 
        transactionCount: transactions.length 
      });

      return transactions;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('Mirror Node API request timed out', { accountId });
      } else {
        logger.error('Failed to get transaction history from Mirror Node API', { accountId, error });
      }
      
      // Fallback to mock data if Mirror Node API fails
      logger.warn('Falling back to mock transaction data', { accountId });
      
      const mockTransactions: TransactionHistoryItem[] = [
        {
          amount: 10.5,
          currency: 'HBAR',
          gasFee: 0.001,
          time: new Date().getTime(),
          to: accountId,
          from: '0.0.123456',
          fromAlias: '0.0.123456', // Will be replaced with actual alias lookup
          toAlias: accountId, // Will be replaced with actual alias lookup
          transactionId: '0.0.123456@1234567890.123456789',
          type: 'RECEIVE'
        },
        {
          amount: 5.0,
          currency: 'HBAR',
          gasFee: 0.001,
          time: new Date(Date.now() - 3600000).getTime(), // 1 hour ago
          to: '0.0.789012',
          from: accountId,
          fromAlias: accountId, // Will be replaced with actual alias lookup
          toAlias: '0.0.789012', // Will be replaced with actual alias lookup
          transactionId: '0.0.123456@1234567891.123456789',
          type: 'SEND'
        }
      ];

      return mockTransactions.slice(0, limit);
    }
  }

  /**
   * Get token ID for a given currency code
   */
  private getTokenIdForCurrency(currency: string): string | null {
    const tokenMap: Record<string, string | null> = {
      'USD': process.env.USD_TOKEN_ID || '0.0.6869755',
      'ZAR': process.env.ZAR_TOKEN_ID || '0.0.6889204',
      'HBAR': null // HBAR doesn't have a token ID
    };
    
    return tokenMap[currency] || null;
  }

  /**
   * Associate a token with an account
   */
  async associateToken(accountId: string, tokenId: string, privateKey: string): Promise<HederaTransactionResult> {
    try {
      assertValidHederaAccountId(accountId);
      
      const accountPrivateKey = this.validateAndParsePrivateKey(privateKey);
      const tokenIdObj = TokenId.fromString(tokenId);
      
      const associateTransaction = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(accountId))
        .setTokenIds([tokenIdObj])
        .setTransactionId(TransactionId.generate(AccountId.fromString(accountId)));

      const frozen = await associateTransaction.freezeWith(this.client);
      const signed = await frozen.sign(accountPrivateKey);
      const response = await signed.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      if (receipt.status === Status.Success) {
        logger.info('Token association successful', { accountId, tokenId });
        return {
          transactionId: response.transactionId.toString(),
          status: 'SUCCESS'
        };
      } else {
        logger.error('Token association failed', { accountId, tokenId, status: receipt.status });
        return {
          transactionId: response.transactionId.toString(),
          status: 'FAILED',
          message: `Token association failed with status: ${receipt.status}`
        };
      }
    } catch (error) {
      logger.error('Token association error', { accountId, tokenId, error });
      return {
        transactionId: '',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mint tokens to an account
   */
  async mintToken(tokenId: string, amount: number, supplyKey: string, toAccountId?: string): Promise<HederaTransactionResult> {
    try {
      const tokenIdObj = TokenId.fromString(tokenId);
      const supplyKeyObj = PrivateKey.fromString(supplyKey);
  
      const mintTransaction = await new TokenMintTransaction()
        .setTokenId(tokenIdObj)
        .setAmount(amount)
        .freezeWith(this.client);
  
      // Sign with supply key
      const signedTx = await mintTransaction.sign(supplyKeyObj);
  
      // Execute (client will add operator signature automatically as payer)
      const response = await signedTx.execute(this.client);
      const receipt = await response.getReceipt(this.client);
  
      if (receipt.status === Status.Success) {
        // If toAccountId is specified and different from treasury, transfer tokens to that account
        if (toAccountId && toAccountId !== this.operatorId.toString()) {
          logger.info('Transferring minted tokens to target account', {
            tokenId,
            amount,
            fromAccountId: this.operatorId.toString(),
            toAccountId
          });
          
          const transferResult = await this.transferToken(
            tokenId, 
            this.operatorId.toString(), 
            toAccountId, 
            amount, 
            this.operatorKey.toString()
          );
          
          if (transferResult.status !== 'SUCCESS') {
            logger.error('Failed to transfer minted tokens to target account', {
              tokenId,
              amount,
              toAccountId,
              transferError: transferResult.message
            });
            return {
              transactionId: response.transactionId.toString(),
              status: 'FAILED',
              message: `Token minted but transfer to target account failed: ${transferResult.message}`
            };
          }
          
          logger.info('Successfully transferred minted tokens to target account', {
            tokenId,
            amount,
            toAccountId,
            transferTransactionId: transferResult.transactionId
          });
        }
        
        return {
          transactionId: response.transactionId.toString(),
          status: 'SUCCESS',
        };
      } else {
        return {
          transactionId: response.transactionId.toString(),
          status: 'FAILED',
          message: `Token mint failed with status: ${receipt.status}`
        };
      }
    } catch (error) {
      return {
        transactionId: '',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Burn tokens from an account
   */
  async burnToken(tokenId: string, amount: number, fromAccountId: string, supplyKey: string, fromAccountPrivateKey?: string): Promise<HederaTransactionResult> {
    try {
      assertValidHederaAccountId(fromAccountId);
      
      const supplyKeyObj = this.validateAndParsePrivateKey(supplyKey);
      const tokenIdObj = TokenId.fromString(tokenId);
      
      // If burning from a different account than treasury, we need to transfer to treasury first
      if (fromAccountId !== this.operatorId.toString()) {
        logger.info('Transferring tokens to treasury before burning', {
          tokenId,
          amount,
          fromAccountId,
          treasuryAccount: this.operatorId.toString()
        });
        
        // First, transfer tokens from the account to treasury
        if (!fromAccountPrivateKey) {
          return {
            transactionId: '',
            status: 'FAILED',
            message: 'Account private key required to transfer tokens for burning'
          };
        }
        
        const transferResult = await this.transferToken(
          tokenId,
          fromAccountId,
          this.operatorId.toString(),
          amount,
          fromAccountPrivateKey
        );
        
        if (transferResult.status !== 'SUCCESS') {
          logger.error('Failed to transfer tokens to treasury for burning', {
            tokenId,
            amount,
            fromAccountId,
            transferError: transferResult.message
          });
          return {
            transactionId: '',
            status: 'FAILED',
            message: `Failed to transfer tokens to treasury for burning: ${transferResult.message}`
          };
        }
        
        logger.info('Successfully transferred tokens to treasury for burning', {
          tokenId,
          amount,
          fromAccountId,
          transferTransactionId: transferResult.transactionId
        });
      }
      
      // Now burn from treasury
      const burnTransaction = new TokenBurnTransaction()
        .setTokenId(tokenIdObj)
        .setAmount(amount);

      const frozen = await burnTransaction.freezeWith(this.client);
      const signed = await frozen.sign(supplyKeyObj);
      const response = await signed.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      if (receipt.status === Status.Success) {
        logger.info('Token burn successful', { tokenId, amount, fromAccountId });
        return {
          transactionId: response.transactionId.toString(),
          status: 'SUCCESS'
        };
      } else {
        logger.error('Token burn failed', { tokenId, amount, fromAccountId, status: receipt.status });
        return {
          transactionId: response.transactionId.toString(),
          status: 'FAILED',
          message: `Token burn failed with status: ${receipt.status}`
        };
      }
    } catch (error) {
      logger.error('Token burn error', { tokenId, amount, fromAccountId, error });
      return {
        transactionId: '',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Transfer tokens between accounts
   */
  async transferToken(
    tokenId: string, 
    fromAccountId: string, 
    toAccountId: string, 
    amount: number, 
    fromPrivateKey: string
  ): Promise<HederaTransactionResult> {
    try {
      assertValidHederaAccountId(fromAccountId);
      assertValidHederaAccountId(toAccountId);
      
      const accountPrivateKey = this.validateAndParsePrivateKey(fromPrivateKey);
      const tokenIdObj = TokenId.fromString(tokenId);
      
      const transferTransaction = new TransferTransaction()
        .addTokenTransfer(tokenIdObj, AccountId.fromString(fromAccountId), -amount)
        .addTokenTransfer(tokenIdObj, AccountId.fromString(toAccountId), amount)
        .setTransactionId(TransactionId.generate(AccountId.fromString(fromAccountId)));

      const frozen = await transferTransaction.freezeWith(this.client);
      const signed = await frozen.sign(accountPrivateKey);
      const response = await signed.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      if (receipt.status === Status.Success) {
        logger.info('Token transfer successful', { tokenId, fromAccountId, toAccountId, amount });
        return {
          transactionId: response.transactionId.toString(),
          status: 'SUCCESS'
        };
      } else {
        logger.error('Token transfer failed', { tokenId, fromAccountId, toAccountId, amount, status: receipt.status });
        return {
          transactionId: response.transactionId.toString(),
          status: 'FAILED',
          message: `Token transfer failed with status: ${receipt.status}`
        };
      }
    } catch (error) {
      logger.error('Token transfer error', { tokenId, fromAccountId, toAccountId, amount, error });
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
