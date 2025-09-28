import { ApiConfig } from '../../types/api';

// Default API configuration
export const defaultApiConfig: ApiConfig = {
  baseUrl: 'http://localhost:3000/api',
  timeout: 60000, // 60 seconds - increased for payment processing
  retryAttempts: 3,
};

const MY_IP = "192.168.0.100"; // Replace with your actual IP address

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
  HEDERA_QUOTE: '/hedera/quote',
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
  
  // BNPL (Buy Now Pay Later)
  BNPL_TERMS: '/bnpl/terms',
  BNPL_TERMS_BY_PAYMENT: (paymentId: string, accountId: string) => `/bnpl/terms/${paymentId}/${accountId}`,
  BNPL_TERMS_ACCEPT: (termsId: string) => `/bnpl/terms/${termsId}/accept`,
  BNPL_TERMS_REJECT: (termsId: string) => `/bnpl/terms/${termsId}/reject`,
  BNPL_MERCHANT_PENDING: (accountId: string) => `/bnpl/merchant/${accountId}/pending`,
  BNPL_BUYER_TERMS: (accountId: string) => `/bnpl/buyer/${accountId}`,
  BNPL_QUOTE: '/bnpl/quote',
  BNPL_TERMS_CONVERT: (termsId: string) => `/bnpl/terms/${termsId}/convert`,
} as const;
