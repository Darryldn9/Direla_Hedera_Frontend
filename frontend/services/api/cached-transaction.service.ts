import { BaseApiService } from './base';
import { API_ENDPOINTS } from './config';
import { 
  TransactionHistoryItem,
  ApiResponse 
} from '../../types/api';

export interface CachedTransactionService {
  getCachedTransactions(
    accountId: string, 
    periodType: 'daily' | 'weekly' | 'monthly' | 'all',
    startTime?: number,
    endTime?: number,
    forceRefresh?: boolean
  ): Promise<ApiResponse<TransactionHistoryItem[]>>;
  
  getRevenueForPeriod(
    accountId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    startTime: number,
    endTime: number
  ): Promise<ApiResponse<{ totalRevenue: number; transactionCount: number }>>;
  
  refreshCache(accountId: string): Promise<ApiResponse<{ message: string }>>;
  
  getCacheStatus(accountId: string): Promise<ApiResponse<{
    daily: { isValid: boolean; lastUpdated: string; transactionCount: number };
    weekly: { isValid: boolean; lastUpdated: string; transactionCount: number };
    monthly: { isValid: boolean; lastUpdated: string; transactionCount: number };
  }>>;
}

export class CachedTransactionServiceImpl extends BaseApiService implements CachedTransactionService {
  /**
   * Get cached transactions for a specific period
   */
  async getCachedTransactions(
    accountId: string, 
    periodType: 'daily' | 'weekly' | 'monthly' | 'all',
    startTime?: number,
    endTime?: number,
    forceRefresh: boolean = true
  ): Promise<ApiResponse<TransactionHistoryItem[]>> {
    const queryParams = new URLSearchParams();
    if (startTime) queryParams.append('startTime', startTime.toString());
    if (endTime) queryParams.append('endTime', endTime.toString());
    if (forceRefresh) queryParams.append('forceRefresh', 'true');
    
    const url = API_ENDPOINTS.CACHED_TRANSACTIONS(accountId, periodType) + 
      (queryParams.toString() ? `?${queryParams.toString()}` : '');
    
    console.log('🔗 Constructed URL for cached transactions:', {
      accountId,
      periodType,
      periodTypeType: typeof periodType,
      periodTypeLength: periodType?.length,
      url,
      queryParams: queryParams.toString()
    });
    
    return this.get<TransactionHistoryItem[]>(url);
  }

  /**
   * Get revenue for a specific period
   */
  async getRevenueForPeriod(
    accountId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    startTime: number,
    endTime: number
  ): Promise<ApiResponse<{ totalRevenue: number; transactionCount: number }>> {
    const queryParams = new URLSearchParams({
      startTime: startTime.toString(),
      endTime: endTime.toString()
    });
    
    const url = API_ENDPOINTS.CACHED_TRANSACTIONS_REVENUE(accountId, periodType) + 
      `?${queryParams.toString()}`;
    
    return this.get<{ totalRevenue: number; transactionCount: number }>(url);
  }

  /**
   * Refresh cache for an account
   */
  async refreshCache(accountId: string): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>(API_ENDPOINTS.CACHED_TRANSACTIONS_REFRESH(accountId));
  }

  /**
   * Get cache status for an account
   */
  async getCacheStatus(accountId: string): Promise<ApiResponse<{
    daily: { isValid: boolean; lastUpdated: string; transactionCount: number };
    weekly: { isValid: boolean; lastUpdated: string; transactionCount: number };
    monthly: { isValid: boolean; lastUpdated: string; transactionCount: number };
  }>> {
    return this.get<{
      daily: { isValid: boolean; lastUpdated: string; transactionCount: number };
      weekly: { isValid: boolean; lastUpdated: string; transactionCount: number };
      monthly: { isValid: boolean; lastUpdated: string; transactionCount: number };
    }>(API_ENDPOINTS.CACHED_TRANSACTIONS_STATUS(accountId));
  }
}
