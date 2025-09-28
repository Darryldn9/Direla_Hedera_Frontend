// User related types
export interface User {
  id: number;
  balance: number;
  created_at: string;
  updated_at: string;
  user_id: string | null; // UUID from auth.uid()
  did?: string | null; // Merchant DID
}

export interface CreateUserRequest {
  balance?: number;
  user_id?: string | null;
  did?: string | null;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  balance?: number;
  did?: string | null;
}

// Hedera Account related types
export interface HederaAccount {
  id: number;
  account_id: string;
  private_key: string;
  public_key: string;
  alias?: string | null;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string; // UUID foreign key to users.user_id
  preferred_currency: string; // User's preferred currency (e.g., 'USD', 'EUR', 'HBAR')
}

export interface CreateHederaAccountRequest {
  alias: string;
  initial_balance?: number;
  user_id: string; // Required - user must already exist
}

export interface UpdateHederaAccountRequest {
  alias?: string;
  is_active?: boolean;
}

export interface PaymentRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo?: string;
  fromCurrency?: string; // Optional: defaults to sender's preferred currency
  toCurrency?: string; // Optional: defaults to receiver's preferred currency
  quoteId?: string; // Optional: for quote-based payments
  quote?: CurrencyQuote; // Required: payment quote for currency validation and token calculations
}

// Hedera related types
export interface HederaConfig {
  accountId: string;
  privateKey: string;
  network: 'testnet' | 'mainnet';
  usdTokenId?: string;
  usdSupplyKey?: string;
  zarTokenId?: string;
  zarSupplyKey?: string;
}

export interface HederaTransactionResult {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED';
  message?: string;
}

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
  type: 'SEND' | 'RECEIVE' | 'BURN' | 'TRANSFER' | 'MINT';
  memo?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// External API types
export interface ExternalNotificationRequest {
  userId: number;
  event: string;
  data: Record<string, any>;
}

export interface ExternalNotificationResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
}

// Supabase Auth types
export interface SupabaseAuthResponse {
  user: {
    id: string;
    email?: string;
    created_at: string;
  } | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  } | null;
  error: {
    message: string;
    status?: number;
  } | null;
}

// Database types
export interface DatabaseConfig {
  url: string;
}

// Service layer types
export interface UserService {
  createUser(data: CreateUserRequest): Promise<User>;
  getUserById(id: number): Promise<User | null>;
  getUserByUserId(userId: string): Promise<User | null>;
  updateUser(id: number, data: UpdateUserRequest): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
}

export interface HederaAccountService {
  createAccount(data: CreateHederaAccountRequest): Promise<HederaAccount>;
  getAccountById(id: number): Promise<HederaAccount | null>;
  getAccountByAccountId(accountId: string): Promise<HederaAccount | null>;
  getAccountsByUserId(userId: string): Promise<HederaAccount[]>;
  updateAccount(id: number, data: UpdateHederaAccountRequest): Promise<HederaAccount | null>;
  deleteAccount(id: number): Promise<boolean>;
  getAllAccounts(): Promise<HederaAccount[]>;
  getActiveAccounts(): Promise<HederaAccount[]>;
  updateAccountBalance(accountId: string, balance: number): Promise<void>;
  getAccountBalance(accountId: string): Promise<{ code: string; amount: number }[]>;
  getAccountInfo(accountId: string): Promise<any>;
}

export interface HederaService {
  getAccountBalance(accountId: string): Promise<{ code: string; amount: number }[]>;
  transferHbar(fromAccountId: string, toAccountId: string, amount: number): Promise<HederaTransactionResult>;
  createAccount(initialBalance: number, alias?: string): Promise<{ accountId: string; privateKey: string; publicKey: string }>;
  getAccountInfo(accountId: string): Promise<any>;
  processPayment(paymentRequest: PaymentRequest): Promise<HederaTransactionResult>;
  getTransactionHistory(accountId: string, limit?: number, forceRefresh?: boolean): Promise<TransactionHistoryItem[]>;
  generatePaymentQuote(fromAccountId: string, toAccountId: string, amount: number, fromCurrency?: string, toCurrency?: string): Promise<CurrencyQuote>;
  associateToken(accountId: string, tokenId: string, privateKey: string): Promise<HederaTransactionResult>;
  mintToken(tokenId: string, amount: number, toAccountId?: string): Promise<HederaTransactionResult>;
  burnToken(tokenId: string, amount: number, fromAccountId: string, privateKey: string): Promise<HederaTransactionResult>;
  transferToken(tokenId: string, fromAccountId: string, toAccountId: string, amount: number, fromPrivateKey: string): Promise<HederaTransactionResult>;
  purgeTransactionCache(accountId: string): Promise<void>;
  refreshTransactionData(accountId: string, limit?: number): Promise<TransactionHistoryItem[]>;
  purgeAllTransactionCaches(): Promise<{ purgedCount: number; accounts: string[] }>;
  publishTransactionToHCS(
    transactionId: string,
    fromAccountId: string,
    toAccountId: string,
    amountSent: { amount: number; currency: string },
    amountReceived: { amount: number; currency: string },
    memo?: string
  ): Promise<HCSMessageResult>;
}

export interface ExternalApiService {
  notifyService(request: ExternalNotificationRequest): Promise<ExternalNotificationResponse>;
}

// Currency conversion types
export interface CurrencyConversionRequest {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

export interface CurrencyConversionResponse {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  timestamp: number;
}

export interface CurrencyQuote {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  expiresAt: number; // Unix timestamp
  quoteId: string;
}

// HCS Transaction Event types
export interface HCSTransactionEvent {
  event: 'transaction_completion';
  transaction_id: string;
  from_account: {
    account_id: string;
    alias?: string;
  };
  to_account: {
    account_id: string;
    alias?: string;
  };
  amount_sent: {
    amount: number;
    currency: string;
  };
  amount_received: {
    amount: number;
    currency: string;
  };
  timestamp: string;
  platform_issuer: string;
  memo?: string;
}

export interface HCSMessageResult {
  success: boolean;
  transactionId?: string;
  explorerLink?: string;
  error?: string;
}