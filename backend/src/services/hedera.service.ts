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
      const { fromAccountId, toAccountId, amount, memo, fromCurrency, toCurrency } = paymentRequest;
      
      logger.info('Processing payment', { 
        fromAccountId, 
        toAccountId, 
        amount, 
        memo,
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

      // Determine currencies - use account preferences if not specified
      const senderCurrency = fromCurrency || fromAccount.preferred_currency || 'HBAR';
      const receiverCurrency = toCurrency || toAccount.preferred_currency || 'HBAR';

      logger.info('Currency conversion details', {
        senderCurrency,
        receiverCurrency,
        originalAmount: amount
      });

      // Convert amount if currencies are different
      let hbarAmount = amount;
      let conversionDetails = null;

      if (senderCurrency !== receiverCurrency) {
        try {
          const conversionRequest: CurrencyConversionRequest = {
            fromCurrency: senderCurrency,
            toCurrency: receiverCurrency,
            amount: amount
          };

          const conversion = await this.externalApi.convertCurrency(conversionRequest);
          hbarAmount = conversion.toAmount;
          conversionDetails = conversion;

          logger.info('Currency conversion applied', {
            fromCurrency: conversion.fromCurrency,
            toCurrency: conversion.toCurrency,
            fromAmount: conversion.fromAmount,
            toAmount: conversion.toAmount,
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

      // Check if this is a quote-based payment and validate expiry
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
      const fromBalanceData = await this.hederaAccountService.getAccountBalance(fromAccountId);
      const toBalanceData = await this.hederaAccountService.getAccountBalance(toAccountId);

      // Extract HBAR balances
      const fromBalance = fromBalanceData.find(b => b.code === 'HBAR')?.amount || 0;
      const toBalance = toBalanceData.find(b => b.code === 'HBAR')?.amount || 0;

      // Check sufficient balance (always in HBAR for Hedera network)
      if (fromBalance < hbarAmount) {
        throw new Error(`Insufficient balance. Available: ${fromBalance} HBAR, Required: ${hbarAmount} HBAR`);
      }

      // Execute the transfer, signed by the sender's key to avoid INVALID_SIGNATURE
      const result = await (this.hederaInfra as any).transferHbarFromAccount(
        fromAccountId,
        (fromAccount as any).private_key,
        toAccountId,
        hbarAmount
      );

      if (result.status === 'SUCCESS') {
        // Update balances in our database (always in HBAR)
        const newFromBalance = fromBalance - hbarAmount;
        const newToBalance = toBalance + hbarAmount;
        
        await this.hederaAccountService.updateAccountBalance(fromAccountId, newFromBalance);
        await this.hederaAccountService.updateAccountBalance(toAccountId, newToBalance);

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

      // Try cache first
      const key = cacheKeys.txHistory(accountId);
      const cached = await cacheGet<TransactionHistoryItem[]>(key);
      let transactions: TransactionHistoryItem[] | null = null;
      if (cached && Array.isArray(cached)) {
        logger.debug('Transaction history served from cache', { accountId, count: cached.length });
        transactions = cached;
      } else {
        // Get transaction history from infrastructure layer (Mirror Node)
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
}
