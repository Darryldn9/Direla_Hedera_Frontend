import { BaseApiService } from './base';
import { API_ENDPOINTS } from './config';
import { 
  ProcessPaymentWithDIDRequest,
  ProcessPaymentWithDIDResponse,
  ApiResponse 
} from '../../types/api';

export class TransactionService extends BaseApiService {
  /**
   * Process a payment with optional DID logging
   */
  async processPaymentWithDID(paymentData: ProcessPaymentWithDIDRequest): Promise<ApiResponse<ProcessPaymentWithDIDResponse>> {
    return this.post<ProcessPaymentWithDIDResponse>(API_ENDPOINTS.TRANSACTIONS, paymentData);
  }
}
