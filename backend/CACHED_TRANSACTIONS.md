# Cached Transaction System

This document describes the cached transaction system that provides fast access to transaction history with different time periods.

## Overview

The cached transaction system stores transaction history in the database with different time periods (daily, weekly, monthly, all) to provide fast access to transaction data without repeatedly querying the Hedera network.

## Architecture

### Backend Components

1. **CachedTransactionService** (`src/services/cached-transaction.service.ts`)
   - Manages cached transaction data in the database
   - Handles CRUD operations for cached transactions
   - Manages cache metadata and statistics

2. **TransactionCacheManagerService** (`src/services/transaction-cache-manager.service.ts`)
   - High-level service for managing transaction cache
   - Handles cache updates and data transformation
   - Provides revenue calculations for different periods

3. **CacheSchedulerService** (`src/services/cache-scheduler.service.ts`)
   - Background service that periodically updates caches
   - Runs every 5 minutes to keep data fresh
   - Updates all active accounts automatically

4. **CachedTransactionRoutes** (`src/routes/cached-transaction.routes.ts`)
   - REST API endpoints for accessing cached data
   - Supports different time periods and filtering
   - Provides revenue calculations and cache management

### Database Schema

#### `cached_transactions` Table
- Stores individual transactions with period classification
- Indexed for fast queries by account and time period
- Includes transaction metadata (amount, gas fees, aliases)

#### `transaction_cache_metadata` Table
- Tracks cache validity and statistics
- Stores last update times and transaction counts
- Manages cache lifecycle per account and period

## API Endpoints

### Get Cached Transactions
```
GET /api/cached-transactions/{accountId}/{periodType}
```

**Parameters:**
- `accountId`: Hedera account ID
- `periodType`: `daily`, `weekly`, `monthly`, or `all`
- `startTime` (optional): Unix timestamp filter
- `endTime` (optional): Unix timestamp filter
- `forceRefresh` (optional): Force refresh from Hedera

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "transactionId": "0.0.123456@1234567890.123456789",
      "amount": 100.50,
      "currency": "HBAR",
      "gasFee": 0.001,
      "time": 1234567890000,
      "to": "0.0.789",
      "from": "0.0.456",
      "fromAlias": "Merchant Account",
      "toAlias": "Customer Account",
      "type": "RECEIVE"
    }
  ]
}
```

### Get Revenue for Period
```
GET /api/cached-transactions/{accountId}/revenue/{periodType}
```

**Parameters:**
- `accountId`: Hedera account ID
- `periodType`: `daily`, `weekly`, or `monthly`
- `startTime`: Unix timestamp (required)
- `endTime`: Unix timestamp (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 1250.75,
    "transactionCount": 15
  }
}
```

### Refresh Cache
```
POST /api/cached-transactions/{accountId}/refresh
```

**Response:**
```json
{
  "success": true,
  "message": "Cache refreshed successfully"
}
```

### Get Cache Status
```
GET /api/cached-transactions/{accountId}/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "daily": {
      "isValid": true,
      "lastUpdated": "2024-12-01T10:30:00Z",
      "transactionCount": 5
    },
    "weekly": {
      "isValid": true,
      "lastUpdated": "2024-12-01T10:30:00Z",
      "transactionCount": 25
    },
    "monthly": {
      "isValid": false,
      "lastUpdated": "2024-11-30T15:45:00Z",
      "transactionCount": 100
    }
  }
}
```

## Frontend Integration

### useCachedTransactions Hook

The frontend uses the `useCachedTransactions` hook to access cached data:

```typescript
const {
  transactions,
  isLoading,
  error,
  revenue,
  isLoadingRevenue,
  revenueError,
  fetchTransactions,
  fetchRevenue,
  refreshCache,
  fetchCacheStatus
} = useCachedTransactions(accountId);
```

### Features

- **Automatic Loading**: Fetches weekly transactions by default
- **Revenue Calculation**: Provides cached revenue data for different periods
- **Cache Management**: Allows manual cache refresh
- **Error Handling**: Comprehensive error states and retry functionality
- **Loading States**: Proper loading indicators for all operations

## Cache Strategy

### Time Periods

1. **Daily**: Last 24 hours of transactions
2. **Weekly**: Last 7 days of transactions
3. **Monthly**: Last 30 days of transactions
4. **All**: All available transactions

### Cache Validity

- Caches are considered valid for 5 minutes
- Automatic refresh when cache is stale
- Manual refresh available via API
- Background scheduler updates every 5 minutes

### Performance Benefits

- **Fast Queries**: Database queries instead of Hedera network calls
- **Reduced Load**: Less stress on Hedera infrastructure
- **Better UX**: Instant loading of transaction history
- **Scalable**: Handles multiple accounts efficiently

## Setup and Migration

### Database Migration

Run the migration script to create the required tables:

```sql
-- Run the migration file
\i supabase/migrations/20241201_create_cached_transaction_tables.sql
```

### Environment Variables

No additional environment variables are required. The system uses existing database and Hedera configurations.

### Starting the Cache Scheduler

The cache scheduler starts automatically when the backend service starts. It will:

1. Update caches for all active accounts
2. Continue updating every 5 minutes
3. Handle errors gracefully without stopping the service

## Monitoring and Maintenance

### Cache Health

- Monitor cache validity through the status endpoint
- Check transaction counts and update frequencies
- Verify revenue calculations match expected values

### Performance Monitoring

- Database query performance on cached tables
- Cache hit rates and refresh frequencies
- Memory usage of the scheduler service

### Troubleshooting

1. **Stale Data**: Use `forceRefresh=true` parameter
2. **Missing Transactions**: Check Hedera service connectivity
3. **Performance Issues**: Review database indexes and query patterns
4. **Cache Errors**: Check service logs and database connectivity

## Future Enhancements

- **Real-time Updates**: WebSocket notifications for new transactions
- **Advanced Filtering**: More granular time range queries
- **Analytics**: Transaction pattern analysis and insights
- **Compression**: Store transaction data more efficiently
- **Partitioning**: Split large transaction tables by time periods
