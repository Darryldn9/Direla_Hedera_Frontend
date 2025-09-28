import { BaseApiService } from './base';
import { API_ENDPOINTS } from './config';
import { 
  BNPLTerms, 
  CreateBNPLTermsRequest, 
  CreateBNPLTermsResponse,
  GetBNPLTermsResponse,
  AcceptBNPLTermsResponse,
  RejectBNPLTermsResponse,
  CurrencyQuote,
  ApiResponse
} from '../../types/api';

export interface BNPLQuoteRequest {
  buyerAccountId: string;
  merchantAccountId: string;
  amount: number;
  buyerCurrency: string;
  merchantCurrency: string;
}

export interface BNPLConvertRequest {
  buyerCurrency: string;
}

export interface BNPLConvertResponse {
  originalTerms: BNPLTerms;
  convertedTerms: {
    totalAmount: number;
    installmentAmount: number;
    totalInterest: number;
    totalAmountWithInterest: number;
    currency: string;
    exchangeRate: number;
  };
}

export class BNPLService extends BaseApiService {
  // Create BNPL terms
  async createTerms(request: CreateBNPLTermsRequest): Promise<CreateBNPLTermsResponse | null> {
    try {
      const response = await this.post<BNPLTerms>(
        API_ENDPOINTS.BNPL_TERMS,
        request
      );
      
      if (response?.success && response.data) {
        return {
          terms: response.data,
          success: true,
          message: response.message
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error creating BNPL terms:', error);
      throw error;
    }
  }

  // Get BNPL terms by payment ID and account ID
  async getTerms(paymentId: string, accountId: string): Promise<GetBNPLTermsResponse | null> {
    try {
      const response = await this.get<BNPLTerms>(
        API_ENDPOINTS.BNPL_TERMS_BY_PAYMENT(paymentId, accountId)
      );
      
      if (response?.success) {
        return {
          terms: response.data || null,
          success: true,
          message: response.message
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting BNPL terms:', error);
      throw error;
    }
  }

  // Accept BNPL terms
  async acceptTerms(termsId: string, accountId: string): Promise<AcceptBNPLTermsResponse | null> {
    try {
      console.log('[BNPLService] Accepting terms:', termsId, 'account:', accountId);
      const response = await this.post<{ success: boolean; transactionId?: string }>(
        API_ENDPOINTS.BNPL_TERMS_ACCEPT(termsId),
        { accountId }
      );
      
      console.log('[BNPLService] Raw response:', response);
      
      if (response?.success && response.data) {
        const result = {
          success: response.data.success,
          message: response.message,
          transactionId: response.data.transactionId
        };
        console.log('[BNPLService] Returning success result:', result);
        return result;
      }
      
      console.log('[BNPLService] Response not successful, returning null');
      return null;
    } catch (error) {
      console.error('[BNPLService] Error accepting BNPL terms:', error);
      throw error;
    }
  }

  // Reject BNPL terms
  async rejectTerms(termsId: string, accountId: string, reason?: string): Promise<RejectBNPLTermsResponse | null> {
    try {
      const response = await this.post<{ success: boolean }>(
        API_ENDPOINTS.BNPL_TERMS_REJECT(termsId),
        { accountId, reason }
      );
      
      if (response?.success && response.data) {
        return {
          success: response.data.success,
          message: response.message
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error rejecting BNPL terms:', error);
      throw error;
    }
  }

  // Get pending BNPL terms for merchant
  async getPendingTermsForMerchant(merchantAccountId: string): Promise<BNPLTerms[]> {
    try {
      const response = await this.get<BNPLTerms[]>(
        API_ENDPOINTS.BNPL_MERCHANT_PENDING(merchantAccountId)
      );
      
      if (response?.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting pending BNPL terms for merchant:', error);
      throw error;
    }
  }

  // Get BNPL terms for buyer
  async getTermsForBuyer(buyerAccountId: string): Promise<BNPLTerms[]> {
    try {
      const response = await this.get<BNPLTerms[]>(
        API_ENDPOINTS.BNPL_BUYER_TERMS(buyerAccountId)
      );
      
      if (response?.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting BNPL terms for buyer:', error);
      throw error;
    }
  }

  // Generate BNPL currency quote
  async generateQuote(request: BNPLQuoteRequest): Promise<CurrencyQuote | null> {
    try {
      const response = await this.post<CurrencyQuote>(
        API_ENDPOINTS.BNPL_QUOTE,
        request
      );
      
      if (response?.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error generating BNPL currency quote:', error);
      throw error;
    }
  }

  // Convert BNPL terms to buyer's currency
  async convertTermsToBuyerCurrency(termsId: string, request: BNPLConvertRequest): Promise<BNPLConvertResponse | null> {
    try {
      const response = await this.post<BNPLConvertResponse>(
        API_ENDPOINTS.BNPL_TERMS_CONVERT(termsId),
        request
      );
      
      if (response?.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error converting BNPL terms to buyer currency:', error);
      throw error;
    }
  }
}