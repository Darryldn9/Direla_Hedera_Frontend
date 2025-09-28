// Export all services
export { BaseApiService, ApiError } from './base';
export { AuthService } from './auth.service';
export { HederaService } from './hedera.service';
export { PaymentService } from './payment.service';
export { TransactionService } from './transaction.service';
export { DIDService } from './did.service';
export { getApiConfig, API_ENDPOINTS } from './config';
export { MetricsService } from './metrics.service';

// Export types
export * from '../../types/api';

// Create a main API service that combines all services
import { AuthService } from './auth.service';
import { HederaService } from './hedera.service';
import { PaymentService } from './payment.service';
import { TransactionService } from './transaction.service';
import { DIDService } from './did.service';
import { ApiConfig } from '../../types/api';
import { MetricsService } from './metrics.service';

export class ApiService {
  public auth: AuthService;
  public hedera: HederaService;
  public payment: PaymentService;
  public transaction: TransactionService;
  public did: DIDService;
  public metrics: MetricsService;

  constructor(config?: Partial<ApiConfig>) {
    this.auth = new AuthService(config);
    this.hedera = new HederaService(config);
    this.payment = new PaymentService(config);
    this.transaction = new TransactionService(config);
    this.did = new DIDService(config);
    this.metrics = new MetricsService(config);
  }

  /**
   * Check if the API is healthy
   */
  async healthCheck(): Promise<boolean> {
    return this.auth.healthCheck();
  }
}

// Create a default instance
export const api = new ApiService();
