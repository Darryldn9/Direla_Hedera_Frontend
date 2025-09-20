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
}

// Hedera related types
export interface HederaConfig {
  accountId: string;
  privateKey: string;
  network: 'testnet' | 'mainnet';
}

export interface HederaTransactionResult {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED';
  message?: string;
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
  getAccountBalance(accountId: string): Promise<number>;
  getAccountInfo(accountId: string): Promise<any>;
}

export interface HederaService {
  getAccountBalance(accountId: string): Promise<number>;
  transferHbar(fromAccountId: string, toAccountId: string, amount: number): Promise<HederaTransactionResult>;
  createAccount(initialBalance: number, alias?: string): Promise<{ accountId: string; privateKey: string; publicKey: string }>;
  getAccountInfo(accountId: string): Promise<any>;
  processPayment(paymentRequest: PaymentRequest): Promise<HederaTransactionResult>;
}

export interface ExternalApiService {
  notifyService(request: ExternalNotificationRequest): Promise<ExternalNotificationResponse>;
}