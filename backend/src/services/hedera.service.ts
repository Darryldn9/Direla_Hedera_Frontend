import { HederaInfrastructure } from '../infrastructure/hedera.js';
import { ExternalApiInfrastructure } from '../infrastructure/external-api.js';
import { 
  HederaService, 
  HederaTransactionResult,
  PaymentRequest,
  HederaAccountService,
  TransactionHistoryItem,
  CurrencyConversionRequest,
  CurrencyQuote
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { cacheGet, cacheSet, cacheKeys, cacheDel } from '../utils/redis.js';
import { config } from '../config/index.js';
import { toBaseUnits, fromBaseUnits } from '../utils/token-amount.js';

export class HederaServiceImpl implements HederaService {
  private hederaInfra: HederaInfrastructure;
  private hederaAccountService: HederaAccountService;
  private externalApi: ExternalApiInfrastructure;

  constructor(hederaInfra: HederaInfrastructure, hederaAccountService: HederaAccountService, externalApi?: ExternalApiInfrastructure) {
    this.hederaInfra = hederaInfra;
    this.hederaAccountService = hederaAccountService;
    this.externalApi = externalApi || new ExternalApiInfrastructure('', '');
  }

  async getAccountBalance(accountId: string): Promise<{ code: string; amount: number }[]> {
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

      // Invalidate caches on success
      if (result.status === 'SUCCESS') {
        await Promise.all([
          cacheDel(cacheKeys.balance(fromAccountId)),
          cacheDel(cacheKeys.balance(toAccountId)),
          cacheDel(cacheKeys.txHistory(fromAccountId)),
          cacheDel(cacheKeys.txHistory(toAccountId))
        ]);
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
      const { fromAccountId, toAccountId, amount, memo, fromCurrency, toCurrency, quote } = paymentRequest;
      
      logger.info('Processing payment', { 
        fromAccountId, 
        toAccountId, 
        amount, 
        memo,
        fromCurrency,
        toCurrency,
        hasQuote: !!quote
      });

      // Validate accounts exist in our database
      logger.info('Retrieving accounts from database', {
        fromAccountId,
        toAccountId
      });
      
      const fromAccount = await this.hederaAccountService.getAccountByAccountId(fromAccountId);
      const toAccount = await this.hederaAccountService.getAccountByAccountId(toAccountId);

      logger.info('Account retrieval results', {
        fromAccountId,
        fromAccountFound: !!fromAccount,
        fromAccountActive: fromAccount?.is_active,
        toAccountId,
        toAccountFound: !!toAccount,
        toAccountActive: toAccount?.is_active
      });

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

      // Validate quote if provided
      if (quote) {
        logger.info('Validating quote', {
          quoteId: quote.quoteId,
          fromCurrency: quote.fromCurrency,
          toCurrency: quote.toCurrency,
          fromAmount: quote.fromAmount,
          toAmount: quote.toAmount,
          exchangeRate: quote.exchangeRate,
          expiresAt: new Date(quote.expiresAt).toISOString()
        });
        
        // Validate quote expiry
        const now = Date.now();
        if (now > quote.expiresAt) {
          throw new Error(`Quote expired. Quote expired at ${new Date(quote.expiresAt).toISOString()}, current time: ${new Date(now).toISOString()}`);
        }

        // Validate quote matches payment request
        if (quote.fromCurrency !== fromCurrency || quote.toCurrency !== toCurrency) {
          throw new Error(`Quote currency mismatch. Expected ${fromCurrency}->${toCurrency}, got ${quote.fromCurrency}->${quote.toCurrency}`);
        }

        if (Math.abs(quote.toAmount - amount) > 0.01) { // Allow small floating point differences
          throw new Error(`Quote amount mismatch. Expected ${amount}, got ${quote.toAmount}`);
        }

        logger.info('Quote validation passed', {
          quoteId: quote.quoteId,
          fromCurrency: quote.fromCurrency,
          toCurrency: quote.toCurrency,
          fromAmount: quote.toAmount,
          toAmount: quote.toAmount,
          exchangeRate: quote.exchangeRate,
          expiresAt: new Date(quote.expiresAt).toISOString()
        });
      }

      // Determine currencies - use quote if available, otherwise account preferences
      const senderCurrency = fromCurrency || fromAccount.preferred_currency || 'HBAR';
      const receiverCurrency = toCurrency || toAccount.preferred_currency || 'HBAR';

      logger.info('Currency conversion details', {
        senderCurrency,
        receiverCurrency,
        originalAmount: amount,
        usingQuote: !!quote
      });

      // Use quote for conversion if available, otherwise convert on-the-fly
      let hbarAmount = amount;
      let conversionDetails = null;
      let burnAmount = amount; // Amount to burn from sender
      let mintAmount = amount; // Amount to mint to receiver

      if (quote) {
        // Use quote for conversion
        hbarAmount = quote.toAmount;
        burnAmount = quote.fromAmount; // Amount to burn in sender's currency
        mintAmount = quote.toAmount;   // Amount to mint in receiver's currency
        conversionDetails = {
          fromCurrency: quote.fromCurrency,
          toCurrency: quote.toCurrency,
          fromAmount: quote.fromAmount,
          toAmount: quote.toAmount,
          exchangeRate: quote.exchangeRate,
          timestamp: Date.now()
        };

        logger.info('Using quote for currency conversion', {
          fromCurrency: quote.fromCurrency,
          toCurrency: quote.toCurrency,
          fromAmount: quote.fromAmount,
          toAmount: quote.toAmount,
          burnAmount,
          mintAmount,
          exchangeRate: quote.exchangeRate
        });
      } else if (senderCurrency !== receiverCurrency) {
        // Fallback to real-time conversion if no quote
        try {
          const conversionRequest: CurrencyConversionRequest = {
            fromCurrency: senderCurrency,
            toCurrency: receiverCurrency,
            amount: amount
          };

          const conversion = await this.externalApi.convertCurrency(conversionRequest);
          hbarAmount = conversion.toAmount;
          burnAmount = conversion.fromAmount; // Amount to burn in sender's currency
          mintAmount = conversion.toAmount;   // Amount to mint in receiver's currency
          conversionDetails = conversion;

          logger.info('Real-time currency conversion applied', {
            fromCurrency: conversion.fromCurrency,
            toCurrency: conversion.toCurrency,
            fromAmount: conversion.fromAmount,
            toAmount: conversion.toAmount,
            burnAmount,
            mintAmount,
            exchangeRate: conversion.exchangeRate
          });
        } catch (conversionError) {
          logger.error('Currency conversion failed', { 
            senderCurrency, 
            receiverCurrency, 
            amount, 
            error: conversionError 
          });
          throw new Error(`Currency conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
        }
      }

      // Check if this is a quote-based payment and validate expiry (legacy support)
      if (paymentRequest.quoteId) {
        const quoteExpiry = this.validateQuoteExpiry(paymentRequest.quoteId);
        if (!quoteExpiry.isValid) {
          throw new Error(`Quote expired: ${quoteExpiry.message}`);
        }
        logger.info('Quote validation passed', { 
          quoteId: paymentRequest.quoteId,
          expiresAt: quoteExpiry.expiresAt 
        });
      }

      // Get current balances from Hedera network
      logger.info('Retrieving account balances', {
        fromAccountId,
        toAccountId
      });
      
      const fromBalanceData = await this.hederaAccountService.getAccountBalance(fromAccountId);
      const toBalanceData = await this.hederaAccountService.getAccountBalance(toAccountId);
      
      logger.info('Account balances retrieved', {
        fromAccountId,
        fromBalanceData,
        toAccountId,
        toBalanceData
      });

      // Determine if we need to handle token operations
      const fromTokenId = this.getTokenIdForCurrency(senderCurrency);
      const toTokenId = this.getTokenIdForCurrency(receiverCurrency);
      
      let result: HederaTransactionResult;
      let tokenOperations: { burn?: HederaTransactionResult; mint?: HederaTransactionResult } = {};

      if (fromTokenId && toTokenId && fromTokenId !== toTokenId) {
        // Cross-currency payment with different tokens - burn from sender, mint to receiver
        logger.info('Processing cross-currency payment with token burn/mint', {
          fromCurrency: senderCurrency,
          toCurrency: receiverCurrency,
          fromTokenId,
          toTokenId,
          amount,
          hbarAmount
        });

        // Check sender has sufficient tokens
        const fromTokenBalance = fromBalanceData.find(b => b.code === senderCurrency)?.amount || 0;
        logger.info('Token balance check', {
          senderCurrency,
          fromTokenBalance,
          requiredAmount: burnAmount,
          hasSufficientBalance: fromTokenBalance >= burnAmount
        });
        
        if (fromTokenBalance < burnAmount) {
          throw new Error(`Insufficient ${senderCurrency} balance. Available: ${fromTokenBalance}, Required: ${burnAmount}`);
        }

        // Burn tokens from sender
        logger.info('Attempting to burn tokens', {
          fromTokenId,
          burnAmount,
          fromAccountId,
          senderCurrency
        });
        
        try {
          const burnResult = await this.burnToken(fromTokenId, burnAmount, fromAccountId, senderCurrency, (fromAccount as any).private_key);
          if (burnResult.status !== 'SUCCESS') {
            logger.error('Token burn failed', {
              fromTokenId,
              burnAmount,
              fromAccountId,
              burnResult
            });
            throw new Error(`Token burn failed: ${burnResult.message}`);
          }
          tokenOperations.burn = burnResult;
        } catch (burnError) {
          logger.error('Token burn operation failed', {
            fromTokenId,
            amount,
            fromAccountId,
            error: burnError instanceof Error ? burnError.message : String(burnError)
          });
          throw new Error(`Token burn operation failed: ${burnError instanceof Error ? burnError.message : 'Unknown error'}`);
        }

        // Ensure receiver account is associated with the token before minting
        logger.info('Ensuring token association for receiver', {
          toTokenId,
          toAccountId
        });
        
        try {
          const associateResult = await this.associateToken(toAccountId, toTokenId, (toAccount as any).private_key);
          if (associateResult.status !== 'SUCCESS' && !associateResult.message?.toLowerCase().includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
            logger.warn('Token association failed, but continuing with mint attempt', {
              toTokenId,
              toAccountId,
              associateError: associateResult.message
            });
          } else {
            logger.info('Token association successful', {
              toTokenId,
              toAccountId
            });
          }
        } catch (associateError) {
          logger.warn('Token association error, but continuing with mint attempt', {
            toTokenId,
            toAccountId,
            error: associateError instanceof Error ? associateError.message : String(associateError)
          });
        }

        // Mint tokens to receiver
        logger.info('Attempting to mint tokens', {
          toTokenId,
          mintAmount,
          toAccountId,
          receiverCurrency
        });
        
        try {
          const mintResult = await this.mintToken(toTokenId, mintAmount, receiverCurrency, toAccountId);
          if (mintResult.status !== 'SUCCESS') {
            // If mint fails, attempt to refund the burned tokens
            logger.error('Token mint failed after successful burn - attempting refund', {
              burnTransactionId: tokenOperations.burn?.transactionId,
              mintError: mintResult.message,
              mintResult
            });
            
            try {
              await this.attemptRefundBurnedTokens(fromTokenId, burnAmount, fromAccountId, senderCurrency);
              logger.info('Successfully refunded burned tokens', {
                fromTokenId,
                burnAmount,
                fromAccountId
              });
            } catch (refundError) {
              logger.error('Failed to refund burned tokens - tokens may be lost', {
                fromTokenId,
                burnAmount,
                fromAccountId,
                refundError: refundError instanceof Error ? refundError.message : String(refundError)
              });
            }
            
            throw new Error(`Token mint failed: ${mintResult.message}`);
          }
          tokenOperations.mint = mintResult;
        } catch (mintError) {
          logger.error('Token mint operation failed', {
            toTokenId,
            hbarAmount,
            toAccountId,
            error: mintError instanceof Error ? mintError.message : String(mintError)
          });
          
          // Attempt refund if this was a cross-currency payment
          if (fromTokenId && toTokenId && fromTokenId !== toTokenId) {
            try {
              await this.attemptRefundBurnedTokens(fromTokenId, burnAmount, fromAccountId, senderCurrency);
              logger.info('Successfully refunded burned tokens after mint failure', {
                fromTokenId,
                burnAmount,
                fromAccountId
              });
            } catch (refundError) {
              logger.error('Failed to refund burned tokens after mint failure - tokens may be lost', {
                fromTokenId,
                burnAmount,
                fromAccountId,
                refundError: refundError instanceof Error ? refundError.message : String(refundError)
              });
            }
          }
          
          throw new Error(`Token mint operation failed: ${mintError instanceof Error ? mintError.message : 'Unknown error'}`);
        }

        result = {
          transactionId: `${tokenOperations.burn?.transactionId},${tokenOperations.mint?.transactionId}`,
          status: 'SUCCESS',
          message: 'Cross-currency payment processed with token burn/mint'
        };

      } else if (fromTokenId && toTokenId && fromTokenId === toTokenId) {
        // Same currency token transfer
        logger.info('Processing same-currency token transfer', {
          currency: senderCurrency,
          tokenId: fromTokenId,
          amount
        });

        // Check sender has sufficient tokens
        const fromTokenBalanceBaseUnits = fromBalanceData.find(b => b.code === senderCurrency)?.amount || 0;
        const fromTokenBalance = fromBaseUnits(fromTokenBalanceBaseUnits, senderCurrency);
        if (fromTokenBalance < amount) {
          throw new Error(`Insufficient ${senderCurrency} balance. Available: ${fromTokenBalance}, Required: ${amount}`);
        }

        // Transfer tokens directly
        result = await this.transferToken(fromTokenId, fromAccountId, toAccountId, amount, (fromAccount as any).private_key, senderCurrency);

      } else {
        // HBAR transfer (fallback)
        logger.info('Processing HBAR transfer', {
          fromAccountId,
          toAccountId,
          hbarAmount
        });

        // Extract HBAR balances
        const fromBalance = fromBalanceData.find(b => b.code === 'HBAR')?.amount || 0;
        const toBalance = toBalanceData.find(b => b.code === 'HBAR')?.amount || 0;

        // Check sufficient balance
        if (fromBalance < hbarAmount) {
          throw new Error(`Insufficient HBAR balance. Available: ${fromBalance} HBAR, Required: ${hbarAmount} HBAR`);
        }

        // Execute the HBAR transfer
        result = await (this.hederaInfra as any).transferHbarFromAccount(
          fromAccountId,
          (fromAccount as any).private_key,
          toAccountId,
          hbarAmount
        );

        if (result.status === 'SUCCESS') {
          // Update HBAR balances in our database
          const newFromBalance = fromBalance - hbarAmount;
          const newToBalance = toBalance + hbarAmount;
          
          await this.hederaAccountService.updateAccountBalance(fromAccountId, newFromBalance);
          await this.hederaAccountService.updateAccountBalance(toAccountId, newToBalance);
        }
      }

      if (result.status === 'SUCCESS') {
        // Invalidate caches for balances and transactions
        await Promise.all([
          cacheDel(cacheKeys.balance(fromAccountId)),
          cacheDel(cacheKeys.balance(toAccountId)),
          cacheDel(cacheKeys.txHistory(fromAccountId)),
          cacheDel(cacheKeys.txHistory(toAccountId))
        ]);

        logger.info('Payment processed successfully', { 
          fromAccountId, 
          toAccountId, 
          amount,
          senderCurrency,
          receiverCurrency,
          transactionId: result.transactionId,
          tokenOperations: Object.keys(tokenOperations).length > 0 ? tokenOperations : undefined
        });
      } else {
        logger.error('Payment failed', { 
          fromAccountId, 
          toAccountId, 
          amount,
          senderCurrency,
          receiverCurrency,
          transactionId: result.transactionId,
          message: result.message
        });
      }

      return result;
    } catch (error) {
      logger.error('Payment processing error', { 
        paymentRequest, 
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        transactionId: '',
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getTransactionHistory(accountId: string, limit: number = 50, forceRefresh: boolean = false): Promise<TransactionHistoryItem[]> {
    try {
      logger.info('Getting transaction history', { accountId, limit, forceRefresh });

      // Validate account exists in our database
      const account = await this.hederaAccountService.getAccountByAccountId(accountId);
      if (!account) {
        throw new Error(`Account ${accountId} not found in database`);
      }

      if (!account.is_active) {
        throw new Error(`Account ${accountId} is not active`);
      }

      // Try cache first (unless force refresh is requested)
      const key = cacheKeys.txHistory(accountId);
      let transactions: TransactionHistoryItem[] | null = null;
      
      if (!forceRefresh) {
        const cached = await cacheGet<TransactionHistoryItem[]>(key);
        if (cached && Array.isArray(cached)) {
          logger.debug('Transaction history served from cache', { accountId, count: cached.length });
          transactions = cached;
        }
      }

      // If no cached data or force refresh, fetch from Mirror Node
      if (!transactions || transactions.length === 0) {
        logger.info('Fetching fresh transaction data from Mirror Node API', { accountId, forceRefresh });
        transactions = await this.hederaInfra.getTransactionHistory(accountId, limit);
        // Store in cache
        await cacheSet<TransactionHistoryItem[]>(key, transactions);
      }

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
        transactionCount: enrichedTransactions.length,
        fromCache: !forceRefresh && transactions !== null
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

  /**
   * Purge all cached transaction data for an account
   */
  async purgeTransactionCache(accountId: string): Promise<void> {
    try {
      logger.info('Purging transaction cache for account', { accountId });

      // Clear Redis cache
      const key = cacheKeys.txHistory(accountId);
      await cacheDel(key);

      // Clear any other related caches
      const balanceKey = cacheKeys.balance(accountId);
      await cacheDel(balanceKey);

      logger.info('Transaction cache purged successfully', { accountId });
    } catch (error) {
      logger.error('Failed to purge transaction cache', { accountId, error });
      throw error;
    }
  }

  /**
   * Force refresh transaction data from Mirror Node API
   */
  async refreshTransactionData(accountId: string, limit: number = 50): Promise<TransactionHistoryItem[]> {
    try {
      logger.info('Force refreshing transaction data from Mirror Node', { accountId, limit });
      
      // First purge existing cache
      await this.purgeTransactionCache(accountId);
      
      // Then fetch fresh data
      return await this.getTransactionHistory(accountId, limit, true);
    } catch (error) {
      logger.error('Failed to refresh transaction data', { accountId, error });
      throw error;
    }
  }

  /**
   * Purge cache for all active accounts in the database
   */
  async purgeAllTransactionCaches(): Promise<{ purgedCount: number; accounts: string[] }> {
    try {
      logger.info('Purging transaction cache for all accounts');

      // Get all active accounts from the database
      const accounts = await this.hederaAccountService.getActiveAccounts();
      
      if (!accounts || accounts.length === 0) {
        logger.info('No active accounts found to purge cache for');
        return { purgedCount: 0, accounts: [] };
      }

      const accountIds = accounts.map(account => account.account_id);
      logger.info('Found active accounts to purge cache for', { count: accountIds.length, accountIds });

      // Purge cache for each account
      const purgePromises = accountIds.map(async (accountId) => {
        try {
          await this.purgeTransactionCache(accountId);
          logger.debug('Successfully purged cache for account', { accountId });
          return { accountId, success: true };
        } catch (error) {
          logger.error('Failed to purge cache for account', { accountId, error });
          return { accountId, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const results = await Promise.all(purgePromises);
      const successfulPurges = results.filter(result => result.success);
      const failedPurges = results.filter(result => !result.success);

      logger.info('Cache purge completed for all accounts', { 
        totalAccounts: accountIds.length,
        successfulPurges: successfulPurges.length,
        failedPurges: failedPurges.length,
        failedAccounts: failedPurges.map(r => ({ accountId: r.accountId, error: r.error }))
      });

      return {
        purgedCount: successfulPurges.length,
        accounts: successfulPurges.map(r => r.accountId)
      };
    } catch (error) {
      logger.error('Failed to purge cache for all accounts', { error });
      throw error;
    }
  }

  // New method for generating currency quotes
  async generatePaymentQuote(
    fromAccountId: string, 
    toAccountId: string, 
    amount: number, 
    fromCurrency?: string, 
    toCurrency?: string
  ): Promise<CurrencyQuote> {
    try {
      logger.info('Generating payment quote', { 
        fromAccountId, 
        toAccountId, 
        amount, 
        fromCurrency, 
        toCurrency 
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

      // Determine currencies - use account preferences if not specified
      const senderCurrency = fromCurrency || fromAccount.preferred_currency || 'HBAR';
      const receiverCurrency = toCurrency || toAccount.preferred_currency || 'HBAR';

      // Generate currency quote
      const conversionRequest: CurrencyConversionRequest = {
        fromCurrency: senderCurrency,
        toCurrency: receiverCurrency,
        amount: amount
      };

      const quote = await this.externalApi.generateCurrencyQuote(conversionRequest);

      logger.info('Payment quote generated successfully', { 
        quoteId: quote.quoteId,
        fromCurrency: quote.fromCurrency,
        toCurrency: quote.toCurrency,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        expiresAt: new Date(quote.expiresAt).toISOString()
      });

      return quote;
    } catch (error) {
      logger.error('Failed to generate payment quote', { 
        fromAccountId, 
        toAccountId, 
        amount, 
        fromCurrency, 
        toCurrency, 
        error 
      });
      throw error;
    }
  }

  // Quote validation method
  private validateQuoteExpiry(quoteId: string | undefined): { isValid: boolean; message: string; expiresAt?: number } {
    if (!quoteId) {
      return { isValid: false, message: 'No quote ID provided' };
    }
    try {
      // Extract timestamp from quote ID (format: quote_1234567890_abc123)
      const parts = quoteId.split('_');
      if (parts.length < 2) {
        return { isValid: false, message: 'Invalid quote ID format' };
      }

      const timestampStr = parts[1];
      if (!timestampStr) {
        return { isValid: false, message: 'Invalid timestamp in quote ID' };
      }
      
      const timestamp = parseInt(timestampStr);
      if (isNaN(timestamp)) {
        return { isValid: false, message: 'Invalid timestamp in quote ID' };
      }

      const quoteCreatedAt = timestamp;
      const now = Date.now();
      const expiresAt = quoteCreatedAt + (70 * 1000); // 70 seconds from creation

      if (now > expiresAt) {
        return { 
          isValid: false, 
          message: `Quote expired ${Math.floor((now - expiresAt) / 1000)} seconds ago`,
          expiresAt 
        };
      }

      const remainingSeconds = Math.floor((expiresAt - now) / 1000);
      return { 
        isValid: true, 
        message: `Quote valid for ${remainingSeconds} more seconds`,
        expiresAt 
      };
    } catch (error) {
      logger.error('Quote validation error', { quoteId, error });
      return { isValid: false, message: 'Quote validation failed' };
    }
  }

  async associateToken(accountId: string, tokenId: string, privateKey: string): Promise<HederaTransactionResult> {
    return await this.hederaInfra.associateToken(accountId, tokenId, privateKey);
  }

  async mintToken(tokenId: string, amount: number, currency: string, toAccountId?: string): Promise<HederaTransactionResult> {
    const supplyKey = this.getSupplyKeyForCurrency(currency);
    if (!supplyKey) {
      logger.error('Supply key not configured for currency', {
        currency,
        tokenId,
        toAccountId,
        usdSupplyKeyConfigured: !!config.hedera.usdSupplyKey,
        zarSupplyKeyConfigured: !!config.hedera.zarSupplyKey
      });
      throw new Error(`No supply key configured for currency: ${currency}. Please set ${currency}_SUPPLY_KEY environment variable.`);
    }
    
    // Convert display amount to base units for minting
    const baseUnits = toBaseUnits(amount, currency);
    
    logger.debug('Minting token with supply key', {
      tokenId,
      displayAmount: amount,
      baseUnits,
      currency,
      toAccountId,
      supplyKeyLength: supplyKey?.length || 0,
      supplyKeyPrefix: supplyKey?.substring(0, 10) || 'undefined'
    });
    
    return await this.hederaInfra.mintToken(tokenId, baseUnits, supplyKey, toAccountId);
  }

  async burnToken(tokenId: string, amount: number, fromAccountId: string, currency: string, fromAccountPrivateKey?: string): Promise<HederaTransactionResult> {
    const supplyKey = this.getSupplyKeyForCurrency(currency);
    if (!supplyKey) {
      throw new Error(`No supply key configured for currency: ${currency}`);
    }
    
    // Convert display amount to base units for burning
    const baseUnits = toBaseUnits(amount, currency);
    
    logger.debug('Burning token', {
      tokenId,
      displayAmount: amount,
      baseUnits,
      currency,
      fromAccountId
    });
    
    return await this.hederaInfra.burnToken(tokenId, baseUnits, fromAccountId, supplyKey, fromAccountPrivateKey);
  }

  async transferToken(tokenId: string, fromAccountId: string, toAccountId: string, amount: number, fromPrivateKey: string, currency?: string): Promise<HederaTransactionResult> {
    // Convert display amount to base units for transfer if currency is provided
    const transferAmount = currency ? toBaseUnits(amount, currency) : amount;
    
    logger.debug('Transferring token', {
      tokenId,
      displayAmount: amount,
      transferAmount,
      currency,
      fromAccountId,
      toAccountId
    });
    
    return await this.hederaInfra.transferToken(tokenId, fromAccountId, toAccountId, transferAmount, fromPrivateKey);
  }

  /**
   * Get token ID for a given currency code
   */
  private getTokenIdForCurrency(currency: string): string | null {
    const tokenMap: Record<string, string | null> = {
      'USD': config.hedera.usdTokenId || '0.0.6916971',
      'ZAR': config.hedera.zarTokenId || '0.0.6916972',
      'HBAR': null // HBAR doesn't have a token ID
    };
    
    return tokenMap[currency] || null;
  }

  /**
   * Get supply key for a given currency code
   */
  private getSupplyKeyForCurrency(currency: string): string | null {
    const supplyKeyMap: Record<string, string | null> = {
      'USD': config.hedera.usdSupplyKey || null,
      'ZAR': config.hedera.zarSupplyKey || null,
      'HBAR': null // HBAR doesn't have a supply key
    };
    
    const supplyKey = supplyKeyMap[currency] || null;
    
    logger.debug('Supply key lookup', {
      currency,
      hasUsdSupplyKey: !!config.hedera.usdSupplyKey,
      hasZarSupplyKey: !!config.hedera.zarSupplyKey,
      foundSupplyKey: !!supplyKey,
      supplyKeyLength: supplyKey?.length || 0,
      usdSupplyKeyPrefix: config.hedera.usdSupplyKey?.substring(0, 10) || 'undefined',
      zarSupplyKeyPrefix: config.hedera.zarSupplyKey?.substring(0, 10) || 'undefined'
    });
    
    return supplyKey;
  }

  /**
   * Attempt to refund burned tokens by minting them back to the original account
   * This is used as a recovery mechanism when minting to the destination fails
   */
  private async attemptRefundBurnedTokens(
    tokenId: string, 
    amount: number, 
    accountId: string, 
    currency: string
  ): Promise<HederaTransactionResult> {
    logger.info('Attempting to refund burned tokens', {
      tokenId,
      amount,
      accountId,
      currency
    });

    try {
      // Mint the tokens back to the original account
      const refundResult = await this.mintToken(tokenId, amount, currency, accountId);
      
      if (refundResult.status === 'SUCCESS') {
        logger.info('Successfully refunded burned tokens', {
          tokenId,
          amount,
          accountId,
          refundTransactionId: refundResult.transactionId
        });
      } else {
        logger.error('Failed to refund burned tokens', {
          tokenId,
          amount,
          accountId,
          refundError: refundResult.message
        });
      }
      
      return refundResult;
    } catch (error) {
      logger.error('Exception during token refund attempt', {
        tokenId,
        amount,
        accountId,
        currency,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
