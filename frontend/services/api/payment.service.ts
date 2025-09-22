import { BaseApiService } from './base';
import { API_ENDPOINTS } from './config';
import { 
  TransferRequest,
  PaymentRequest,
  TransactionResponse,
  AccountBalance,
  ApiResponse 
} from '../../types/api';

export interface PaymentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  validation?: PaymentValidation;
}

export class PaymentService extends BaseApiService {
  private normalizeAmountHBAR(amount: number): number {
    const normalized = Math.round(amount * 1e8) / 1e8;
    if (!Number.isFinite(normalized) || normalized <= 0) {
      throw new Error('Invalid payment amount');
    }
    return normalized;
  }

  /**
   * Process a payment between accounts
   */
  async processPayment(paymentData: PaymentRequest): Promise<ApiResponse<PaymentResult>> {
    try {
      // Normalize amount to 8 decimal places (HBAR precision)
      const safePaymentData = {
        ...paymentData,
        amount: this.normalizeAmountHBAR(paymentData.amount),
      };

      // Validate payment before processing
      const validation = await this.validatePayment(safePaymentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Payment validation failed',
          data: {
            success: false,
            error: 'Payment validation failed',
            validation
          }
        };
      }

      const response = await this.post<TransactionResponse>(API_ENDPOINTS.HEDERA_PAYMENT, safePaymentData);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            success: true,
            transactionId: response.data.transactionId
          }
        };
      }

      return {
        success: false,
        error: response.error || 'Payment processing failed',
        data: {
          success: false,
          error: response.error || 'Payment processing failed'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  /**
   * Transfer HBAR between accounts
   */
  async transferHbar(transferData: TransferRequest): Promise<ApiResponse<PaymentResult>> {
    try {
      // Validate transfer before processing
      const validation = await this.validateTransfer(transferData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Transfer validation failed',
          data: {
            success: false,
            error: 'Transfer validation failed',
            validation
          }
        };
      }

      const response = await this.post<TransactionResponse>(API_ENDPOINTS.HEDERA_TRANSFER, transferData);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            success: true,
            transactionId: response.data.transactionId
          }
        };
      }

      return {
        success: false,
        error: response.error || 'Transfer failed',
        data: {
          success: false,
          error: response.error || 'Transfer failed'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  /**
   * Validate payment data
   */
  async validatePayment(paymentData: PaymentRequest): Promise<PaymentValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!paymentData.fromAccountId) {
      errors.push('From account ID is required');
    }
    if (!paymentData.toAccountId) {
      errors.push('To account ID is required');
    }
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    // Check if accounts exist
    if (paymentData.fromAccountId && paymentData.toAccountId) {
      const [fromExists, toExists] = await Promise.all([
        this.accountExists(paymentData.fromAccountId),
        this.accountExists(paymentData.toAccountId)
      ]);

      if (!fromExists) {
        errors.push('From account does not exist');
      }
      if (!toExists) {
        errors.push('To account does not exist');
      }
    }

    // Check balance if from account exists
    if (paymentData.fromAccountId && paymentData.amount > 0) {
      try {
        const balanceResponse = await this.getAccountBalance(paymentData.fromAccountId);
        if (balanceResponse.success && balanceResponse.data) {
          if (balanceResponse.data.balance < paymentData.amount) {
            errors.push('Insufficient balance');
          } else if (balanceResponse.data.balance < paymentData.amount * 1.1) {
            warnings.push('Low balance warning - consider adding more funds');
          }
        }
      } catch (error) {
        warnings.push('Could not verify account balance');
      }
    }

    // Check for same account transfer
    if (paymentData.fromAccountId === paymentData.toAccountId) {
      errors.push('Cannot transfer to the same account');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate transfer data
   */
  async validateTransfer(transferData: TransferRequest): Promise<PaymentValidation> {
    // Transfer validation is similar to payment validation
    return this.validatePayment(transferData);
  }

  /**
   * Check if account exists
   */
  private async accountExists(accountId: string): Promise<boolean> {
    try {
      const response = await this.get<AccountBalance>(API_ENDPOINTS.HEDERA_ACCOUNT_BALANCE(accountId));
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Get account balance
   */
  private async getAccountBalance(accountId: string): Promise<ApiResponse<AccountBalance>> {
    return this.get<AccountBalance>(API_ENDPOINTS.HEDERA_ACCOUNT_BALANCE(accountId));
  }

  /**
   * Calculate transaction fee (placeholder)
   */
  async calculateTransactionFee(amount: number): Promise<number> {
    // TODO: Implement actual fee calculation based on Hedera network
    // For now, return a simple percentage
    return amount * 0.001; // 0.1% fee
  }

  /**
   * Get payment methods for an account
   */
  async getPaymentMethods(accountId: string): Promise<string[]> {
    // TODO: Implement payment methods retrieval
    // This could include different payment options, cards, etc.
    return ['HBAR', 'USD']; // Placeholder
  }

  /**
   * Process refund
   */
  async processRefund(originalTransactionId: string, amount: number): Promise<PaymentResult> {
    // TODO: Implement refund processing
    return {
      success: false,
      error: 'Refund processing not yet implemented'
    };
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<{ status: string; confirmed: boolean }> {
    // TODO: Implement payment status checking
    return {
      status: 'unknown',
      confirmed: false
    };
  }

  /**
   * Cancel pending payment
   */
  async cancelPayment(transactionId: string): Promise<boolean> {
    // TODO: Implement payment cancellation
    return false;
  }

  /**
   * Get payment history for an account
   */
  async getPaymentHistory(accountId: string, limit: number = 50): Promise<any[]> {
    // TODO: Implement payment history retrieval
    return [];
  }
}
