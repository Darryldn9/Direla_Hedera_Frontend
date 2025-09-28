# Cache Purge Endpoints

This document describes the backend endpoints available for purging cached transaction data when you suspect stale data.

## Available Endpoints

### 1. Purge Cache for All Accounts
**Endpoint:** `POST /api/hedera/purge-all-caches`

**Description:** Clears all cached transaction data for all active accounts in the database.

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/hedera/purge-all-caches
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "purgedCount": 5,
    "accounts": ["0.0.123456", "0.0.789012", "0.0.345678", "0.0.456789", "0.0.567890"]
  },
  "message": "Successfully purged cache for 5 accounts"
}
```

### 2. Purge Cache for Specific Account
**Endpoint:** `POST /api/hedera/purge-cache/{accountId}`

**Description:** Clears all cached transaction data for a specific Hedera account.

**Parameters:**
- `accountId` (path): The Hedera account ID (e.g., "0.0.123456")

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/hedera/purge-cache/0.0.123456
```

**Example Response:**
```json
{
  "success": true,
  "message": "Cache purged successfully",
  "data": {
    "accountId": "0.0.123456"
  }
}
```

### 3. Force Refresh from Mirror Node
**Endpoint:** `POST /api/hedera/refresh-data/{accountId}`

**Description:** Forces a fresh fetch from the Hedera Mirror Node API and updates the cache.

**Parameters:**
- `accountId` (path): The Hedera account ID (e.g., "0.0.123456")
- `limit` (query, optional): Maximum number of transactions to fetch (default: 50)

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/hedera/refresh-data/0.0.123456?limit=100"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "transactionId": "0.0.123456@1234567890.123456789",
      "type": "RECEIVE",
      "amount": 10.5,
      "currency": "HBAR",
      "gasFee": 0.001,
      "time": 1234567890123,
      "to": "0.0.123456",
      "from": "0.0.789012",
      "fromAlias": "0.0.789012",
      "toAlias": "0.0.123456",
      "memo": "Payment to account"
    }
  ],
  "message": "Transaction data refreshed successfully"
}
```

## Usage Scenarios

### When to Use Purge All Caches
- When you suspect stale data across multiple accounts
- After system maintenance or updates
- When you want to ensure all users see fresh data
- For bulk cache management operations

### When to Use Purge Cache (Specific Account)
- When you suspect the cache contains stale data for a specific account
- Before performing important operations that require fresh data
- When debugging transaction-related issues for a particular user

### When to Use Force Refresh
- When you want to get the latest data from the Mirror Node API
- When you need to verify that new transactions have been processed
- When the regular refresh isn't showing expected results

## Frontend Behavior

The frontend will continue to work normally with the regular refresh functionality. Users will see:
- Regular "Refresh" button that uses cached data when available
- Last updated timestamp in the transaction history modal
- No cache purging controls visible to end users

## Error Handling

Both endpoints return appropriate error responses:
- `400 Bad Request`: Invalid account ID format
- `500 Internal Server Error`: Server-side errors during cache operations

## Notes

- These endpoints are designed for administrative use
- The frontend UI remains simple and user-friendly
- Cache purging is immediate and affects all cached data for the specified account
- Force refresh bypasses all caches and fetches directly from the Hedera Mirror Node API
