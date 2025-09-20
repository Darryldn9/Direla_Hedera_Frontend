// Database table names
export const TABLES = {
  USERS: 'users',
  HEDERA_ACCOUNTS: 'hedera_accounts'
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
}

export interface NewHederaAccount {
  account_id: string;
  private_key: string;
  public_key: string;
  alias?: string | null;
  balance?: number;
  is_active?: boolean;
  user_id: string;
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