import { 
  ExternalNotificationRequest, 
  ExternalNotificationResponse,
  CurrencyConversionRequest,
  CurrencyConversionResponse,
  CurrencyQuote
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export class ExternalApiInfrastructure {
  private baseUrl: string;
  private apiKey: string;
  private currencyClient?: any;
  private currencyApiKey: string = '';
  private currencyClientInit?: Promise<void>;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    logger.info('External API client initialized', { baseUrl });

    const freeCurrencyKey = config.externalApi.freeCurrencyApiKey || process.env.FREE_CURRENCY_API_KEY || '';
    this.currencyApiKey = freeCurrencyKey;
    if (!freeCurrencyKey) {
      logger.warn('FREE_CURRENCY_API_KEY not set; currency conversion will fallback or fail');
    }
  }

  private async ensureCurrencyClient(): Promise<void> {
    if (this.currencyClient) return;
    if (!this.currencyApiKey) {
      throw new Error('Currency API client not initialized. Set FREE_CURRENCY_API_KEY.');
    }
    if (!this.currencyClientInit) {
      this.currencyClientInit = (async () => {
        const mod = await import('@everapi/freecurrencyapi-js');
        const Freecurrencyapi = (mod as any).default || (mod as any);
        this.currencyClient = new Freecurrencyapi(this.currencyApiKey);
        logger.info('Freecurrencyapi client initialized');
      })();
    }
    await this.currencyClientInit;
  }

  async notifyExternalService(request: ExternalNotificationRequest): Promise<ExternalNotificationResponse> {
    try {
      logger.debug('Sending external notification', { 
        userId: request.userId, 
        event: request.event 
      });

      // Simulate external API call
      // In a real implementation, you would make an actual HTTP request here
      const response = await this.simulateExternalCall(request);

      logger.info('External notification sent successfully', { 
        userId: request.userId,
        notificationId: response.notificationId 
      });

      return response;
    } catch (error) {
      logger.error('Failed to send external notification', { 
        userId: request.userId, 
        error 
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async simulateExternalCall(request: ExternalNotificationRequest): Promise<ExternalNotificationResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate different responses based on event type
    switch (request.event) {
      case 'user_created':
        return {
          success: true,
          notificationId: `notif_${Date.now()}_${request.userId}`
        };
      
      case 'balance_updated':
        return {
          success: true,
          notificationId: `notif_${Date.now()}_${request.userId}`
        };
      
      case 'user_deleted':
        return {
          success: true,
          notificationId: `notif_${Date.now()}_${request.userId}`
        };
      
      default:
        return {
          success: false,
          error: `Unknown event type: ${request.event}`
        };
    }
  }

  // Currency conversion methods
  async convertCurrency(request: CurrencyConversionRequest): Promise<CurrencyConversionResponse> {
    try {
      logger.debug('Converting currency', { 
        fromCurrency: request.fromCurrency, 
        toCurrency: request.toCurrency,
        amount: request.amount
      });

      const fromCurrency = request.fromCurrency.toUpperCase();
      const toCurrency = request.toCurrency.toUpperCase();

      if (fromCurrency === toCurrency) {
        return {
          fromCurrency,
          toCurrency,
          fromAmount: request.amount,
          toAmount: request.amount,
          exchangeRate: 1.0,
          timestamp: Date.now()
        };
      }

      await this.ensureCurrencyClient();

      const latest = await this.currencyClient.latest({
        base_currency: fromCurrency,
        currencies: toCurrency
      });

      const rate = latest?.data?.[toCurrency];
      if (typeof rate !== 'number') {
        throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
      }

      const toAmount = request.amount * rate;

      const response: CurrencyConversionResponse = {
        fromCurrency,
        toCurrency,
        fromAmount: request.amount,
        toAmount,
        exchangeRate: rate,
        timestamp: Date.now()
      };

      logger.info('Currency conversion completed', { 
        fromCurrency,
        toCurrency,
        exchangeRate: response.exchangeRate
      });

      return response;
    } catch (error) {
      logger.error('Failed to convert currency', { 
        fromCurrency: request.fromCurrency,
        toCurrency: request.toCurrency,
        error 
      });

      throw error;
    }
  }

  async generateCurrencyQuote(request: CurrencyConversionRequest): Promise<CurrencyQuote> {
    try {
      const conversion = await this.convertCurrency(request);
      const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = Date.now() + (70 * 1000); // 70 seconds from now

      const quote: CurrencyQuote = {
        fromCurrency: conversion.fromCurrency,
        toCurrency: conversion.toCurrency,
        fromAmount: conversion.fromAmount,
        toAmount: conversion.toAmount,
        exchangeRate: conversion.exchangeRate,
        expiresAt,
        quoteId
      };

      logger.info('Currency quote generated', { 
        quoteId,
        fromCurrency: quote.fromCurrency,
        toCurrency: quote.toCurrency,
        expiresAt: new Date(expiresAt).toISOString()
      });

      return quote;
    } catch (error) {
      logger.error('Failed to generate currency quote', { 
        fromCurrency: request.fromCurrency,
        toCurrency: request.toCurrency,
        error 
      });

      throw error;
    }
  }

  private async simulateCurrencyConversion(request: CurrencyConversionRequest): Promise<CurrencyConversionResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate exchange rates (in production, fetch from real API)
    const exchangeRates: Record<string, Record<string, number>> = {
      'USD': { 'HBAR': 0.05, 'EUR': 0.85, 'GBP': 0.73, 'ZAR': 15.0 },
      'EUR': { 'HBAR': 0.059, 'USD': 1.18, 'GBP': 0.86, 'ZAR': 18.0 },
      'GBP': { 'HBAR': 0.068, 'USD': 1.37, 'EUR': 1.16, 'ZAR': 20.0 },
      'HBAR': { 'USD': 20.0, 'EUR': 16.9, 'GBP': 14.7, 'ZAR': 300.0 },
      'ZAR': { 'USD': 0.05, 'EUR': 0.85, 'GBP': 0.73, 'HBAR': 0.0033 }
    };

    const fromCurrency = request.fromCurrency.toUpperCase();
    const toCurrency = request.toCurrency.toUpperCase();

    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        fromAmount: request.amount,
        toAmount: request.amount,
        exchangeRate: 1.0,
        timestamp: Date.now()
      };
    }

    const rate = exchangeRates[fromCurrency]?.[toCurrency];
    if (!rate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }

    const toAmount = request.amount * (1 / rate);

    return {
      fromCurrency,
      toCurrency,
      fromAmount: toAmount,
      toAmount: request.amount, // Round to 8 decimal places
      exchangeRate: rate,
      timestamp: Date.now()
    };
  }

  // Real implementation would look like this:
  /*
  private async makeHttpRequest(request: ExternalNotificationRequest): Promise<ExternalNotificationResponse> {
    const response = await fetch(`${this.baseUrl}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
  */
}
