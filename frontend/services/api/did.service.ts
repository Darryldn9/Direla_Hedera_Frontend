import { BaseApiService } from './base';
import { API_ENDPOINTS } from './config';
import { 
  CreateMerchantDIDRequest,
  CreateMerchantDIDResponse,
  LogTransactionRequest,
  LogTransactionResponse,
  GetDIDResponse,
  ApiResponse 
} from '../../types/api';

export class DIDService extends BaseApiService {
  /**
   * Create a merchant DID
   */
  async createMerchantDID(didData: CreateMerchantDIDRequest): Promise<ApiResponse<CreateMerchantDIDResponse>> {
    return this.post<CreateMerchantDIDResponse>(API_ENDPOINTS.DID_USERS, didData);
  }

  /**
   * Get DID for a user
   */
  async getDIDByUserId(userId: string): Promise<ApiResponse<GetDIDResponse>> {
    return this.get<GetDIDResponse>(API_ENDPOINTS.DID_USER_BY_ID(userId));
  }

  /**
   * Log a transaction under merchant's DID
   */
  async logTransaction(transactionData: LogTransactionRequest): Promise<ApiResponse<LogTransactionResponse>> {
    return this.post<LogTransactionResponse>(API_ENDPOINTS.DID_TRANSACTIONS, transactionData);
  }

  /**
   * Check if user has a DID
   */
  async hasDID(userId: string): Promise<boolean> {
    try {
      const response = await this.getDIDByUserId(userId);
      return response.success && response.data?.did !== null;
    } catch {
      return false;
    }
  }
}
