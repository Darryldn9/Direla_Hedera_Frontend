// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User Types
export interface User {
  id: number;
  balance: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
}

export interface CreateUserResponse {
  id: number;
  balance: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Hedera Account Types
export interface HederaAccount {
  id: number;
  account_id: string;
  private_key?: string;
  public_key?: string;
  alias?: string;
  balance: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  preferred_currency: string;
}

export interface CreateHederaAccountRequest {
  user_id?: string;
  alias?: string;
  initial_balance?: number;
  email?: string;
  password?: string;
}

export interface CreateHederaAccountResponse {
  id: number;
  account_id: string;
  private_key: string;
  public_key: string;
  alias?: string;
  balance: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AccountBalance {
  accountId: string;
  balance: number;
}

export interface AccountInfo {
  accountId: string;
  accountInfo: {
    accountId: string;
    key: string;
    balance: number;
  };
}

// Payment Types
export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

export interface PaymentRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo?: string;
  fromCurrency?: string;
  toCurrency?: string;
  quoteId?: string;
}

export interface TransactionResponse {
  status: string;
  transactionId: string;
  message?: string;
}

// Transaction History Types
export interface TransactionHistoryItem {
  amount: number;
  currency: string;
  gasFee: number;
  time: number;
  to: string;
  from: string;
  fromAlias: string;
  toAlias: string;
  transactionId: string;
  type: 'SEND' | 'RECEIVE';
}

// Transaction with DID Types
export interface ProcessPaymentWithDIDRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo?: string;
  merchant_user_id?: string;
  fromCurrency?: string;
  toCurrency?: string;
  quoteId?: string;
}

export interface ProcessPaymentWithDIDResponse {
  hedera_transaction: TransactionResponse;
  did_logging: {
    hcs_transaction_id: string;
    hcs_explorer_link: string;
  } | null;
}

// DID Types
export interface CreateMerchantDIDRequest {
  user_id: string;
}

export interface CreateMerchantDIDResponse {
  did: string;
  hcs_transaction_id: string;
  hcs_explorer_link: string;
}

export interface LogTransactionRequest {
  merchant_user_id: string;
  hedera_account: string;
  txn_id: string;
  amount: string;
}

export interface LogTransactionResponse {
  hcs_transaction_id: string;
  hcs_explorer_link: string;
}

export interface GetDIDResponse {
  did: string | null;
}

// Health Check Types
export interface HealthCheckResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

// Error Types
export interface IApiError {
  success: false;
  error: string;
  statusCode?: number;
}

// Request Options
export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

// Currency Quote Types
export interface CurrencyQuote {
  quoteId: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  expiresAt: number; // Unix timestamp
}

export interface GenerateQuoteRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  fromCurrency?: string;
  toCurrency?: string;
}

// Service Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}
