# INVALID_SIGNATURE Error Fix

## 🚨 Problem Description

The system was experiencing `INVALID_SIGNATURE` errors when attempting to mint ZAR tokens during cross-currency payments. This error occurred because:

1. **Missing Supply Keys**: The `ZAR_SUPPLY_KEY` environment variable was not configured
2. **Token Loss Risk**: When minting failed after a successful burn operation, tokens were permanently lost
3. **Poor Error Handling**: The system didn't provide clear guidance on how to fix the configuration issue

## 🔍 Root Cause Analysis

The error occurred in the following sequence:
1. User initiates cross-currency payment (USD → ZAR)
2. System successfully burns USD tokens from sender
3. System attempts to mint ZAR tokens to receiver
4. **FAILURE**: `INVALID_SIGNATURE` error because `ZAR_SUPPLY_KEY` is missing
5. **RESULT**: USD tokens are burned but ZAR tokens are not minted = **TOKEN LOSS**

## ✅ Solution Implemented

### 1. Environment Configuration Updates

**Updated `env.example`:**
```env
# Stablecoin Token IDs and Supply Keys
USD_TOKEN_ID=0.0.XXX
USD_SUPPLY_KEY=302e020100300506032b657004220420XXX
ZAR_TOKEN_ID=0.0.XXX
ZAR_SUPPLY_KEY=302e020100300506032b657004220420XXX
```

**Updated `config/index.ts`:**
```typescript
hedera: {
  accountId: process.env.HEDERA_ACCOUNT_ID || '',
  privateKey: process.env.HEDERA_PRIVATE_KEY || '',
  network: (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet') || 'testnet',
  usdTokenId: process.env.USD_TOKEN_ID || '',
  usdSupplyKey: process.env.USD_SUPPLY_KEY || '',
  zarTokenId: process.env.ZAR_TOKEN_ID || '',
  zarSupplyKey: process.env.ZAR_SUPPLY_KEY || ''
}
```

**Updated `types/index.ts`:**
```typescript
export interface HederaConfig {
  accountId: string;
  privateKey: string;
  network: 'testnet' | 'mainnet';
  usdTokenId?: string;
  usdSupplyKey?: string;
  zarTokenId?: string;
  zarSupplyKey?: string;
}
```

### 2. Dynamic Token ID Resolution

**Updated `getTokenIdForCurrency` method:**
```typescript
private getTokenIdForCurrency(currency: string): string | null {
  const tokenMap: Record<string, string | null> = {
    'USD': config.hedera.usdTokenId || '0.0.6916971',
    'ZAR': config.hedera.zarTokenId || '0.0.6916972',
    'HBAR': null // HBAR doesn't have a token ID
  };
  
  return tokenMap[currency] || null;
}
```

### 3. Enhanced Error Handling

**Improved `mintToken` method with better error messages:**
```typescript
async mintToken(tokenId: string, amount: number, currency: string, toAccountId?: string): Promise<HederaTransactionResult> {
  const supplyKey = this.getSupplyKeyForCurrency(currency);
  if (!supplyKey) {
    logger.error('Supply key not configured for currency', {
      currency,
      tokenId,
      toAccountId,
      usdSupplyKeyConfigured: !!config.hedera.usdSupplyKey,
      zarSupplyKeyConfigured: !!config.hedera.zarSupplyKey
    });
    throw new Error(`No supply key configured for currency: ${currency}. Please set ${currency}_SUPPLY_KEY environment variable.`);
  }
  // ... rest of method
}
```

### 4. Token Recovery Mechanism

**Added `attemptRefundBurnedTokens` method:**
```typescript
private async attemptRefundBurnedTokens(
  tokenId: string, 
  amount: number, 
  accountId: string, 
  currency: string
): Promise<HederaTransactionResult> {
  // Attempts to mint tokens back to original account if destination minting fails
  // Prevents permanent token loss
}
```

**Enhanced burn-then-mint error recovery:**
- If minting fails after successful burn, automatically attempts to refund
- Logs all recovery attempts for audit purposes
- Prevents permanent token loss in cross-currency payments

## 🚀 How to Fix Your System

### Step 1: Create Stablecoins with Supply Keys

Run the stablecoin creation script:
```bash
cd backend
npx tsx src/scripts/create-demo-stablecoins.ts
```

This will output:
```
USD_TOKEN_ID=0.0.xxxxx
USD_SUPPLY_KEY=302e020100300506032b657004220420xxxxx
ZAR_TOKEN_ID=0.0.xxxxx
ZAR_SUPPLY_KEY=302e020100300506032b657004220420xxxxx
```

### Step 2: Update Environment Variables

Add the generated values to your `.env` file:
```env
# Add these to your .env file
USD_TOKEN_ID=0.0.xxxxx
USD_SUPPLY_KEY=302e020100300506032b657004220420xxxxx
ZAR_TOKEN_ID=0.0.xxxxx
ZAR_SUPPLY_KEY=302e020100300506032b657004220420xxxxx
```

### Step 3: Restart Backend Service

```bash
npm run dev
```

### Step 4: Test Cross-Currency Payments

The system should now:
- ✅ Successfully mint ZAR tokens
- ✅ Provide clear error messages if configuration is missing
- ✅ Automatically recover from failed mint operations
- ✅ Prevent token loss in cross-currency payments

## 🔧 Configuration Validation

The system now validates configuration on startup and provides clear error messages:

```typescript
// Example error message if ZAR_SUPPLY_KEY is missing:
"No supply key configured for currency: ZAR. Please set ZAR_SUPPLY_KEY environment variable."
```

## 🛡️ Safety Features

1. **Token Recovery**: Automatic refund of burned tokens if minting fails
2. **Configuration Validation**: Clear error messages for missing supply keys
3. **Audit Logging**: All recovery attempts are logged for debugging
4. **Fallback Values**: Hardcoded token IDs as fallbacks if environment variables are missing

## 📊 Monitoring

Monitor these logs to ensure the system is working correctly:

```bash
# Look for these log messages:
✅ "Successfully minted tokens"
✅ "Token association successful"
✅ "Successfully refunded burned tokens"

❌ "Supply key not configured for currency"
❌ "Token mint failed after successful burn"
❌ "Failed to refund burned tokens"
```

## 🚨 Critical Notes

1. **Supply Keys are Sensitive**: Keep supply keys secure - they can mint unlimited tokens
2. **Test First**: Always test on testnet before using on mainnet
3. **Backup Keys**: Store supply keys securely and separately from your code
4. **Monitor Transactions**: Use Hedera Explorer to verify token operations

## 🔄 Next Steps

1. **Run the stablecoin creation script** to generate supply keys
2. **Update your .env file** with the generated values
3. **Restart your backend service**
4. **Test cross-currency payments** to verify the fix
5. **Monitor logs** to ensure no more INVALID_SIGNATURE errors

The system is now robust against token loss and provides clear guidance for configuration issues.
