import { useState, useCallback } from 'react';
import { 
  BNPLTerms, 
  CreateBNPLTermsRequest, 
  CurrencyQuote
} from '../types/api';
import { api } from '../services/api';

export interface BNPLConvertedTerms {
  totalAmount: number;
  installmentAmount: number;
  totalInterest: number;
  totalAmountWithInterest: number;
  currency: string;
  exchangeRate: number;
}

export interface UseBNPLReturn {
  // State
  terms: BNPLTerms | null;
  convertedTerms: BNPLConvertedTerms | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createTerms: (request: CreateBNPLTermsRequest) => Promise<BNPLTerms | null>;
  getTerms: (paymentId: string, accountId: string) => Promise<BNPLTerms | null>;
  acceptTerms: (termsId: string, accountId: string) => Promise<{ success: boolean; smartContractAgreementId?: string }>;
  rejectTerms: (termsId: string, accountId: string, reason?: string) => Promise<boolean>;
  getPendingTermsForMerchant: (merchantAccountId: string) => Promise<BNPLTerms[]>;
  getTermsForMerchant: (merchantAccountId: string) => Promise<BNPLTerms[]>;
  getTermsForBuyer: (buyerAccountId: string) => Promise<BNPLTerms[]>;
  
  // Currency conversion
  generateQuote: (request: {
    buyerAccountId: string;
    merchantAccountId: string;
    amount: number;
    buyerCurrency: string;
    merchantCurrency: string;
  }) => Promise<CurrencyQuote | null>;
  convertTermsToBuyerCurrency: (termsId: string, buyerCurrency: string) => Promise<BNPLConvertedTerms | null>;
  
  // Utilities
  clearError: () => void;
  reset: () => void;
}

export function useBNPL(): UseBNPLReturn {
  const [terms, setTerms] = useState<BNPLTerms | null>(null);
  const [convertedTerms, setConvertedTerms] = useState<BNPLConvertedTerms | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setTerms(null);
    setConvertedTerms(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const createTerms = useCallback(async (request: CreateBNPLTermsRequest): Promise<BNPLTerms | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.bnpl.createTerms(request);
      console.log('[useBNPL] Create terms response:', response);

      if (response?.success && response.terms) {
        setTerms(response.terms);
        return response.terms;
      }

      throw new Error(response?.message || 'Failed to create BNPL terms');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error creating BNPL terms:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTerms = useCallback(async (paymentId: string, accountId: string): Promise<BNPLTerms | null> => {
    console.log('[useBNPL] Getting terms for payment:', paymentId, 'account:', accountId);
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.bnpl.getTerms(paymentId, accountId);
      console.log('[useBNPL] Get terms response:', response);

      if (response?.success && response.terms) {
        setTerms(response.terms);
        return response.terms;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting BNPL terms:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptTerms = useCallback(async (termsId: string, accountId: string): Promise<{ success: boolean; smartContractAgreementId?: string }> => {
    setIsLoading(true);
    setError(null);

    console.log('[useBNPL] Accepting terms:', termsId, 'account:', accountId);

    try {
      const response = await api.bnpl.acceptTerms(termsId, accountId);
      console.log('[useBNPL] Accept terms response:', response);

      if (response?.success) {
        console.log('[useBNPL] Terms accepted successfully');
        // Update local terms state if we have it
        if (terms && terms.id === termsId) {
          setTerms(prev => prev ? { ...prev, status: 'ACCEPTED', acceptedAt: Date.now() } : null);
        }
        return {
          success: true,
          smartContractAgreementId: response.smartContractAgreementId
        };
      }

      console.log('[useBNPL] Accept terms failed - response not successful:', response);
      throw new Error(response?.message || 'Failed to accept BNPL terms');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[useBNPL] Error accepting BNPL terms:', err);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [terms]);

  const rejectTerms = useCallback(async (termsId: string, accountId: string, reason?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.bnpl.rejectTerms(termsId, accountId, reason);

      if (response?.success) {
        // Update local terms state if we have it
        if (terms && terms.id === termsId) {
          setTerms(prev => prev ? { ...prev, status: 'REJECTED', rejectedAt: Date.now() } : null);
        }
        return true;
      }

      throw new Error(response?.message || 'Failed to reject BNPL terms');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error rejecting BNPL terms:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [terms]);

  const getPendingTermsForMerchant = useCallback(async (merchantAccountId: string): Promise<BNPLTerms[]> => {
    setIsLoading(true);
    setError(null);

    console.log('[useBNPL] Getting pending terms for merchant:', merchantAccountId);

    try {
      const terms = await api.bnpl.getPendingTermsForMerchant(merchantAccountId);
      return terms;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting pending BNPL terms:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTermsForMerchant = useCallback(async (merchantAccountId: string): Promise<BNPLTerms[]> => {
    setIsLoading(true);
    setError(null);

    console.log('[useBNPL] Getting terms for merchant:', merchantAccountId);

    try {
      const terms = await api.bnpl.getTermsForMerchant(merchantAccountId);
      return terms;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting BNPL terms for merchant:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTermsForBuyer = useCallback(async (buyerAccountId: string): Promise<BNPLTerms[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const terms = await api.bnpl.getTermsForBuyer(buyerAccountId);
      return terms;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting BNPL terms for buyer:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Currency conversion methods
  const generateQuote = useCallback(async (request: {
    buyerAccountId: string;
    merchantAccountId: string;
    amount: number;
    buyerCurrency: string;
    merchantCurrency: string;
  }): Promise<CurrencyQuote | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const quote = await api.bnpl.generateQuote(request);
      return quote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error generating BNPL currency quote:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const convertTermsToBuyerCurrency = useCallback(async (termsId: string, buyerCurrency: string): Promise<BNPLConvertedTerms | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.bnpl.convertTermsToBuyerCurrency(termsId, { buyerCurrency });
      if (result) {
        setConvertedTerms(result.convertedTerms);
        return result.convertedTerms;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error converting BNPL terms to buyer currency:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    terms,
    convertedTerms,
    isLoading,
    error,
    createTerms,
    getTerms,
    acceptTerms,
    rejectTerms,
    getPendingTermsForMerchant,
    getTermsForMerchant,
    getTermsForBuyer,
    generateQuote,
    convertTermsToBuyerCurrency,
    clearError,
    reset,
  };
}
