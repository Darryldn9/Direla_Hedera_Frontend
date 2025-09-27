import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { api } from '../services/api';
import { CurrencyQuote, GenerateQuoteRequest } from '../types/api';

export interface UseQuoteReturn {
  quote: CurrencyQuote | null;
  isLoading: boolean;
  error: string | null;
  generateQuote: (request: GenerateQuoteRequest) => Promise<CurrencyQuote | null>;
  clearQuote: () => void;
  isQuoteExpired: (quote: CurrencyQuote) => boolean;
}

export const useQuote = (): UseQuoteReturn => {
  const [quote, setQuote] = useState<CurrencyQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generateQuoteApi = useApi<CurrencyQuote>(api.hedera.generateQuote.bind(api.hedera));

  const generateQuote = useCallback(async (request: GenerateQuoteRequest): Promise<CurrencyQuote | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateQuoteApi.execute(request);
      
      if (result) {
        setQuote(result);
        return result;
      } else {
        setError(generateQuoteApi.error || 'Failed to generate quote');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate quote';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [generateQuoteApi]);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setError(null);
  }, []);

  const isQuoteExpired = useCallback((quote: CurrencyQuote): boolean => {
    return Date.now() > quote.expiresAt;
  }, []);

  return {
    quote,
    isLoading,
    error,
    generateQuote,
    clearQuote,
    isQuoteExpired,
  };
};
