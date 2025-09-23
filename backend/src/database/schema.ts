// Database table names
export const TABLES = {
  USERS: 'users',
  HEDERA_ACCOUNTS: 'hedera_accounts',
  CACHED_TRANSACTIONS: 'cached_transactions',
  TRANSACTION_CACHE_METADATA: 'transaction_cache_metadata'
} as const;

// User table structure
export interface User {
  id: number;
  balance: number;
  created_at: string;
  updated_at: string;
  user_id: string | null; // UUID from auth.uid()
  did?: string | null; // Merchant DID
}

export interface NewUser {
  balance?: number;
  user_id?: string | null;
  did?: string | null;
}

// Hedera Account table structure
export interface HederaAccount {
  id: number;
  account_id: string;
  private_key: string;
  public_key: string;
  alias: string | null;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string; // UUID foreign key to users.user_id
  whatsapp_phone: string | null; // WhatsApp phone number
}

export interface NewHederaAccount {
  account_id: string;
  private_key: string;
  public_key: string;
  alias?: string | null;
  balance?: number;
  is_active?: boolean;
  user_id: string;
  whatsapp_phone?: string | null; // WhatsApp phone number
}

// Cached Transaction table structure
export interface CachedTransaction {
  id: number;
  account_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  gas_fee: number;
  transaction_time: number;
  to_account: string;
  from_account: string;
  from_alias: string | null;
  to_alias: string | null;
  transaction_type: 'SEND' | 'RECEIVE';
  period_type: 'daily' | 'weekly' | 'monthly' | 'all';
  period_start: number;
  period_end: number;
  created_at: string;
  updated_at: string;
}

export interface NewCachedTransaction {
  account_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  gas_fee: number;
  transaction_time: number;
  to_account: string;
  from_account: string;
  from_alias?: string | null;
  to_alias?: string | null;
  transaction_type: 'SEND' | 'RECEIVE';
  period_type: 'daily' | 'weekly' | 'monthly' | 'all';
  period_start: number;
  period_end: number;
}

// Transaction Cache Metadata table structure
export interface TransactionCacheMetadata {
  id: number;
  account_id: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'all';
  period_start: number;
  period_end: number;
  last_updated: string;
  transaction_count: number;
  total_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewTransactionCacheMetadata {
  account_id: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'all';
  period_start: number;
  period_end: number;
  last_updated: string;
  transaction_count: number;
  total_amount: number;
  is_active?: boolean;
}

// Database query types
export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface QueryResult<T> {
  data: T | null;
  error: DatabaseError | null;
}