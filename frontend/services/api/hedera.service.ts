import { BaseApiService } from './base';
import { API_ENDPOINTS } from './config';
import { 
  HederaAccount, 
  CreateHederaAccountRequest, 
  CreateHederaAccountResponse,
  AccountBalance,
  AccountInfo,
  TransferRequest,
  PaymentRequest,
  TransactionResponse,
  TransactionHistoryItem,
  ApiResponse 
} from '../../types/api';

export class HederaService extends BaseApiService {
  /**
   * Create a new Hedera account for an existing user
   */
  async createAccount(accountData: CreateHederaAccountRequest): Promise<ApiResponse<CreateHederaAccountResponse>> {
    return this.post<CreateHederaAccountResponse>(API_ENDPOINTS.HEDERA_ACCOUNTS, accountData);
  }

  /**
   * Get all Hedera accounts
   */
  async getAllAccounts(): Promise<ApiResponse<HederaAccount[]>> {
    return this.get<HederaAccount[]>(API_ENDPOINTS.HEDERA_ACCOUNTS);
  }

  /**
   * Get all active Hedera accounts
   */
  async getActiveAccounts(): Promise<ApiResponse<HederaAccount[]>> {
    return this.get<HederaAccount[]>(API_ENDPOINTS.HEDERA_ACCOUNTS_ACTIVE);
  }

  /**
   * Get Hedera account by ID
   */
  async getAccountById(accountId: string | number): Promise<ApiResponse<HederaAccount>> {
    return this.get<HederaAccount>(API_ENDPOINTS.HEDERA_ACCOUNT_BY_ID(accountId));
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string): Promise<ApiResponse<AccountBalance>> {
    return this.get<AccountBalance>(API_ENDPOINTS.HEDERA_ACCOUNT_BALANCE(accountId));
  }

  /**
   * Get detailed account information
   */
  async getAccountInfo(accountId: string): Promise<ApiResponse<AccountInfo>> {
    return this.get<AccountInfo>(API_ENDPOINTS.HEDERA_ACCOUNT_INFO(accountId));
  }

  /**
   * Update Hedera account
   */
  async updateAccount(accountId: string | number, updates: Partial<HederaAccount>): Promise<ApiResponse<HederaAccount>> {
    return this.put<HederaAccount>(API_ENDPOINTS.HEDERA_ACCOUNT_BY_ID(accountId), updates);
  }

  /**
   * Delete Hedera account
   */
  async deleteAccount(accountId: string | number): Promise<ApiResponse<void>> {
    return this.delete<void>(API_ENDPOINTS.HEDERA_ACCOUNT_BY_ID(accountId));
  }

  /**
   * Transfer HBAR between accounts
   */
  async transferHbar(transferData: TransferRequest): Promise<ApiResponse<TransactionResponse>> {
    return this.post<TransactionResponse>(API_ENDPOINTS.HEDERA_TRANSFER, transferData);
  }

  /**
   * Process a payment between accounts
   */
  async processPayment(paymentData: PaymentRequest): Promise<ApiResponse<TransactionResponse>> {
    return this.post<TransactionResponse>(API_ENDPOINTS.HEDERA_PAYMENT, paymentData);
  }


  /**
   * Check if account exists on Hedera network
   */
  async accountExists(accountId: string): Promise<boolean> {
    try {
      await this.getAccountBalance(accountId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get accounts for a specific user
   */
  async getUserAccounts(userId: string): Promise<ApiResponse<HederaAccount[]>> {
    return this.get<HederaAccount[]>(API_ENDPOINTS.HEDERA_ACCOUNTS_BY_USER(userId));
  }

  /**
   * Get primary account for a user (first active account)
   */
  async getPrimaryAccount(userId: string): Promise<ApiResponse<HederaAccount | null>> {
    const response = await this.getUserAccounts(userId);
    if (response.success && response.data && response.data.length > 0) {
      const primaryAccount = response.data.find(account => account.is_active) || response.data[0];
      return {
        success: true,
        data: primaryAccount,
        message: 'Primary account found'
      };
    }
    return {
      success: true,
      data: null,
      message: 'No accounts found for user'
    };
  }

  /**
   * Validate account before transaction
   */
  async validateAccountForTransaction(accountId: string, amount: number): Promise<boolean> {
    try {
      const balanceResponse = await this.getAccountBalance(accountId);
      if (balanceResponse.success && balanceResponse.data) {
        return balanceResponse.data.balance >= amount;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get transaction history for a Hedera account
   */
  async getTransactionHistory(accountId: string, limit?: number): Promise<ApiResponse<TransactionHistoryItem[]>> {
    const queryParams = limit ? `?limit=${limit}` : '';
    return this.get<TransactionHistoryItem[]>(API_ENDPOINTS.HEDERA_TRANSACTION_HISTORY(accountId) + queryParams);
  }
}
