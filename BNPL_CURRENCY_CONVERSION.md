# BNPL Currency Conversion Feature

This document describes the currency conversion functionality added to the Buy Now Pay Later (BNPL) system, allowing buyers and merchants to transact in different currencies.

## Overview

The BNPL system now supports automatic currency conversion when the buyer and merchant have different preferred currencies. This ensures that:

- **Buyers** see approximate amounts in their preferred currency
- **Merchants** receive payments in their preferred currency
- **Real-time exchange rates** are used for accurate conversions
- **Transparent pricing** with clear exchange rate information

## Features

### 1. Automatic Currency Detection
- The system automatically detects when buyer and merchant currencies differ
- Shows a currency conversion header in the BNPL modal
- Provides a "Show in my currency" button for manual conversion

### 2. Real-time Exchange Rates
- Uses the existing currency conversion infrastructure
- Generates live quotes with current exchange rates
- Quotes expire after 70 seconds to ensure accuracy

### 3. Dual Currency Display
- Shows original amounts in merchant's currency
- Shows converted amounts in buyer's currency with "≈" prefix
- Displays exchange rate information
- Includes disclaimer about approximate amounts

### 4. Comprehensive Conversion
- Converts all BNPL amounts:
  - Total amount
  - Interest amount
  - Total with interest
  - Individual installment amounts

## Backend Implementation

### New BNPL Service Methods

#### `generateBNPLQuote()`
```typescript
async generateBNPLQuote(
  buyerAccountId: string,
  merchantAccountId: string,
  amount: number,
  buyerCurrency: string,
  merchantCurrency: string
): Promise<CurrencyQuote>
```

Generates a currency quote specifically for BNPL transactions.

#### `convertTermsToBuyerCurrency()`
```typescript
async convertTermsToBuyerCurrency(
  terms: BNPLTerms,
  buyerCurrency: string
): Promise<{
  originalTerms: BNPLTerms;
  convertedTerms: {
    totalAmount: number;
    installmentAmount: number;
    totalInterest: number;
    totalAmountWithInterest: number;
    currency: string;
    exchangeRate: number;
  };
}>
```

Converts existing BNPL terms to the buyer's currency for display purposes.

### New API Endpoints

#### `POST /api/bnpl/quote`
Generate a currency quote for BNPL terms.

**Request Body:**
```json
{
  "buyerAccountId": "0.0.123456",
  "merchantAccountId": "0.0.789012",
  "amount": 100.00,
  "buyerCurrency": "USD",
  "merchantCurrency": "EUR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quoteId": "quote_1234567890_abc123",
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "fromAmount": 100.00,
    "toAmount": 85.00,
    "exchangeRate": 0.85,
    "expiresAt": 1234567890
  },
  "message": "BNPL currency quote generated successfully"
}
```

#### `POST /api/bnpl/terms/:termsId/convert`
Convert existing BNPL terms to buyer's currency.

**Request Body:**
```json
{
  "buyerCurrency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalTerms": { /* BNPLTerms object */ },
    "convertedTerms": {
      "totalAmount": 100.00,
      "installmentAmount": 33.33,
      "totalInterest": 5.00,
      "totalAmountWithInterest": 105.00,
      "currency": "USD",
      "exchangeRate": 1.1765
    }
  },
  "message": "BNPL terms converted to buyer currency successfully"
}
```

## Frontend Implementation

### Updated BNPL Hook

The `useBNPL` hook now includes currency conversion methods:

```typescript
const {
  terms,
  convertedTerms,        // New: converted amounts
  generateQuote,         // New: generate currency quote
  convertTermsToBuyerCurrency, // New: convert terms
  // ... existing methods
} = useBNPL();
```

### Updated BNPL Modal

The `BuyNowPayLaterModal` component now:

1. **Automatically detects** currency differences
2. **Shows conversion header** when currencies differ
3. **Displays both currencies** side by side
4. **Provides conversion button** for manual refresh
5. **Shows exchange rate info** with disclaimers

### UI Components

#### Currency Conversion Header
```
Showing amounts in EUR                    [Show in my currency]
```

#### Dual Currency Display
```
Total Amount                    100.00 EUR
                                ≈ 117.65 USD

Interest (5%)                   5.00 EUR
                                ≈ 5.88 USD

Total with Interest             105.00 EUR
                                ≈ 123.53 USD

3 Weekly Installments           35.00 EUR each
                                ≈ 41.18 USD each
```

#### Exchange Rate Information
```
Exchange rate: 1 EUR = 1.1765 USD
* Approximate amounts based on current exchange rate
```

## Usage Examples

### 1. Creating BNPL Terms with Different Currencies

```typescript
// Merchant prefers EUR, buyer prefers USD
const termsRequest = {
  paymentId: 'payment-123',
  buyerAccountId: '0.0.123456',
  merchantAccountId: '0.0.789012',
  totalAmount: 100.00,
  currency: 'EUR', // Merchant's currency
  installmentCount: 3,
  interestRate: 5.0,
  expiresInMinutes: 30
};

const terms = await createTerms(termsRequest);
// Terms are created in EUR (merchant's currency)
```

### 2. Converting Terms for Buyer Display

```typescript
// Convert terms to buyer's currency (USD)
const converted = await convertTermsToBuyerCurrency(terms.id, 'USD');
// Returns both original (EUR) and converted (USD) amounts
```

### 3. Generating Currency Quote

```typescript
const quote = await generateQuote({
  buyerAccountId: '0.0.123456',
  merchantAccountId: '0.0.789012',
  amount: 100.00,
  buyerCurrency: 'USD',
  merchantCurrency: 'EUR'
});
// Returns live exchange rate quote
```

## Error Handling

### Common Scenarios

1. **Currency conversion fails**: Falls back to original currency display
2. **Quote expires**: User can refresh to get new quote
3. **Network issues**: Shows error message with retry option
4. **Invalid currencies**: Validates currency codes before conversion

### Error Messages

- "Failed to convert currency. Please try again."
- "Currency conversion temporarily unavailable"
- "Invalid currency code provided"

## Testing

### Backend Tests

Run the currency conversion test:

```bash
cd backend
node test-bnpl-currency.js
```

This tests:
- ✅ Currency quote generation
- ✅ BNPL terms creation with different currencies
- ✅ Terms conversion to buyer currency
- ✅ Same currency handling (1:1 conversion)

### Frontend Tests

The UI automatically handles:
- ✅ Currency difference detection
- ✅ Conversion button display
- ✅ Dual currency display
- ✅ Exchange rate information
- ✅ Error states and loading states

## Configuration

### Environment Variables

No additional environment variables are required. The feature uses the existing currency conversion infrastructure.

### Currency Support

Supports all currencies available in the existing currency conversion system:
- USD, EUR, GBP, JPY, CAD, AUD, etc.
- Cryptocurrencies: HBAR, BTC, ETH
- Stablecoins: USDC, USDT, etc.

## Performance Considerations

### Caching
- Currency quotes are cached for 70 seconds
- Conversion results are cached in component state
- Automatic cleanup of expired quotes

### API Calls
- Minimal additional API calls
- Only converts when currencies differ
- Reuses existing currency conversion infrastructure

### UI Performance
- Lazy loading of conversion data
- Optimistic UI updates
- Smooth animations for currency switching

## Security Considerations

### Data Validation
- Validates currency codes before conversion
- Sanitizes all user inputs
- Prevents currency manipulation attacks

### Rate Limiting
- Uses existing rate limiting for currency conversion
- Prevents abuse of conversion endpoints
- Monitors for suspicious conversion patterns

## Future Enhancements

### Planned Features
1. **Historical exchange rates** for better accuracy
2. **Currency preferences** per user
3. **Bulk conversion** for multiple terms
4. **Exchange rate alerts** for significant changes
5. **Multi-currency wallets** support

### Potential Improvements
1. **Offline conversion** using cached rates
2. **Predictive conversion** based on trends
3. **Currency hedging** for merchants
4. **Cross-border fee** calculations

## Troubleshooting

### Common Issues

1. **Conversion not showing**: Check if currencies are different
2. **Stale exchange rates**: Refresh the conversion
3. **Conversion errors**: Check network connection
4. **UI not updating**: Clear component state and retry

### Debug Information

The modal includes debug information showing:
- Payment data presence
- Selected account information
- Terms status
- Currency conversion state

## Support

For issues related to currency conversion:

1. Check the browser console for error messages
2. Verify currency codes are valid
3. Ensure network connectivity
4. Try refreshing the conversion
5. Contact support with specific error details

## Changelog

### Version 1.0.0
- ✅ Initial currency conversion implementation
- ✅ BNPL modal updates with dual currency display
- ✅ Backend API endpoints for currency conversion
- ✅ Frontend hooks and services integration
- ✅ Comprehensive error handling
- ✅ Test suite for currency conversion
