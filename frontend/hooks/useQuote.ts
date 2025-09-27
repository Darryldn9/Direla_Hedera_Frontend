import { useState, useCallback } from 'react';
import { useApi } from './useApi';
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
  const { hederaService } = useApi();

  const generateQuote = useCallback(async (request: GenerateQuoteRequest): Promise<CurrencyQuote | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await hederaService.generateQuote(request);
      
      if (response.success && response.data) {
        setQuote(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to generate quote');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate quote';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hederaService]);

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
