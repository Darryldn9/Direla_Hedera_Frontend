import { ApiConfig } from '../../types/api';

// Default API configuration
export const defaultApiConfig: ApiConfig = {
  baseUrl: 'http://localhost:3000/api',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
};

const MY_IP = "196.24.183.249"; // Replace with your actual IP address

// Environment-based configuration
export const getApiConfig = (): ApiConfig => {
  // In production, you might want to use different URLs
  const isDevelopment = __DEV__;

  return {
    ...defaultApiConfig,
    baseUrl: isDevelopment 
      ? `http://${MY_IP}:3000/api` 
      : 'https://your-production-api.com/api',
  };
};

// API endpoints
export const API_ENDPOINTS = {
  // Health
  HEALTH: '/health',
  
  // Authentication
  AUTH_SIGNUP: '/auth/signup',
  AUTH_SIGNIN: '/auth/signin',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id: string | number) => `/users/${id}`,
  
  // Hedera Accounts
  HEDERA_ACCOUNTS: '/hedera-accounts',
  HEDERA_ACCOUNT_BY_ID: (id: string | number) => `/hedera-accounts/${id}`,
  HEDERA_ACCOUNT_BALANCE: (accountId: string) => `/hedera-accounts/balance/${accountId}`,
  HEDERA_ACCOUNT_INFO: (accountId: string) => `/hedera-accounts/info/${accountId}`,
  HEDERA_ACCOUNTS_ACTIVE: '/hedera-accounts/active',
  HEDERA_ACCOUNTS_BY_USER: (userId: string) => `/hedera-accounts/user/${userId}`,
  
  // Hedera Operations
  HEDERA_TRANSFER: '/hedera/transfer',
  HEDERA_PAYMENT: '/hedera/payment',
  HEDERA_TRANSACTION_HISTORY: (accountId: string) => `/hedera/transaction-history/${accountId}`,
  
  // Cached Transactions
  CACHED_TRANSACTIONS: (accountId: string, periodType: string) => `/cached-transactions/${accountId}/${periodType}`,
  CACHED_TRANSACTIONS_REVENUE: (accountId: string, periodType: string) => `/cached-transactions/${accountId}/revenue/${periodType}`,
  CACHED_TRANSACTIONS_REFRESH: (accountId: string) => `/cached-transactions/${accountId}/refresh`,
  CACHED_TRANSACTIONS_STATUS: (accountId: string) => `/cached-transactions/${accountId}/status`,
  
  // Metrics
  METRICS_DAILY_REVENUE: (accountId: string) => `/metrics/daily-revenue/${accountId}`,
  METRICS_SUMMARY: (accountId: string, period: 'day' | 'week' | 'month') => `/metrics/summary/${accountId}?period=${period}`,
  METRICS_TIMESERIES: (accountId: string, range: '7d' | '30d') => `/metrics/timeseries/${accountId}?range=${range}`,
  
  // Transactions (with DID logging)
  TRANSACTIONS: '/transactions',
  
  // DID (Decentralized Identity)
  DID_USERS: '/did/users',
  DID_USER_BY_ID: (userId: string) => `/did/users/${userId}`,
  DID_TRANSACTIONS: '/did/transactions',
} as const;
