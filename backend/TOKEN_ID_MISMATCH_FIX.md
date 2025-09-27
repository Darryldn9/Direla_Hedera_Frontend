# Token ID Mismatch Fix

## 🚨 Problem Description

The system was still experiencing `INVALID_SIGNATURE` errors even after configuring environment variables because there was a **token ID mismatch** between different layers of the application:

- **Service Layer** (`hedera.service.ts`): Using token IDs from environment variables with fallbacks `0.0.6916971` and `0.0.6916972`
- **Infrastructure Layer** (`hedera.ts`): Using hardcoded token IDs `0.0.6869755` and `0.0.6889204`

This mismatch meant that:
1. The service layer was trying to mint tokens using the correct supply keys
2. But the infrastructure layer was using different token IDs
3. The supply keys didn't match the tokens being referenced
4. Result: `INVALID_SIGNATURE` error

## 🔍 Root Cause Analysis

The issue occurred because the infrastructure layer (`hedera.ts`) had hardcoded token IDs that were different from the ones configured in the environment variables. When the system tried to mint ZAR tokens:

1. ✅ Service layer correctly used `ZAR_TOKEN_ID` from environment
2. ✅ Service layer correctly used `ZAR_SUPPLY_KEY` from environment  
3. ❌ **Infrastructure layer used hardcoded token ID `0.0.6889204`**
4. ❌ **The supply key didn't match the hardcoded token ID**
5. ❌ **Result: INVALID_SIGNATURE error**

## ✅ Solution Implemented

### 1. Updated Infrastructure Layer Token Resolution

**Fixed `getTokenIdForCurrency` method in `hedera.ts`:**
```typescript
private getTokenIdForCurrency(currency: string): string | null {
  const tokenMap: Record<string, string | null> = {
    'USD': process.env.USD_TOKEN_ID || '0.0.6869755',
    'ZAR': process.env.ZAR_TOKEN_ID || '0.0.6889204',
    'HBAR': null // HBAR doesn't have a token ID
  };
  
  return tokenMap[currency] || null;
}
```

### 2. Updated Account Balance Query

**Fixed hardcoded token IDs in `getAccountBalance` method:**
```typescript
// Define the token IDs for USD and ZAR from environment variables
const USD_TOKEN_ID = process.env.USD_TOKEN_ID || '0.0.6916971';
const ZAR_TOKEN_ID = process.env.ZAR_TOKEN_ID || '0.0.6916972';
```

### 3. Added Process Import

**Added missing import for environment variable access:**
```typescript
import process from 'process';
```

### 4. Updated HCS Topic ID

**Made HCS topic ID configurable:**
```typescript
async createTopic(): Promise<string> {
  try {
    // Use HCS topic ID from environment variable or fallback to hardcoded value
    return process.env.HCS_TOPIC_ID || "0.0.6880055";
```

## 🔧 Configuration Requirements

### Environment Variables Needed

Make sure your `.env` file contains:

```env
# Hedera Configuration
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420xxxxx
HEDERA_NETWORK=testnet

# Token IDs (must match the tokens you created)
USD_TOKEN_ID=0.0.xxxxx
USD_SUPPLY_KEY=302e020100300506032b657004220420xxxxx
ZAR_TOKEN_ID=0.0.xxxxx
ZAR_SUPPLY_KEY=302e020100300506032b657004220420xxxxx

# Optional: HCS Topic ID
HCS_TOPIC_ID=0.0.xxxxx
```

### Token ID Consistency

**Critical**: The token IDs in your environment variables must match the actual tokens created on the Hedera network. If you created new tokens using the stablecoin creation script, use those token IDs.

## 🚀 How to Fix Your System

### Step 1: Verify Your Token IDs

Check what token IDs you're actually using:

```bash
# Check your .env file
cat .env | grep TOKEN_ID

# Or check the logs for token ID usage
grep -r "Token ID" logs/
```

### Step 2: Ensure Consistency

Make sure both layers use the same token IDs:

1. **Service Layer**: Uses `config.hedera.usdTokenId` and `config.hedera.zarTokenId`
2. **Infrastructure Layer**: Uses `process.env.USD_TOKEN_ID` and `process.env.ZAR_TOKEN_ID`

Both should resolve to the same values.

### Step 3: Test the Fix

1. **Restart your backend service**:
   ```bash
   npm run dev
   ```

2. **Test cross-currency payment**:
   - Try a USD → ZAR payment
   - Check logs for successful minting
   - Verify no more `INVALID_SIGNATURE` errors

### Step 4: Verify Token Operations

Check that both layers are using the same token IDs:

```bash
# Look for these log messages:
✅ "Minting token with supply key" - should show correct token ID
✅ "Token mint successful" - should complete without errors
❌ "INVALID_SIGNATURE" - should not appear anymore
```

## 🔍 Debugging Steps

If you're still getting `INVALID_SIGNATURE` errors:

### 1. Check Token ID Consistency

```bash
# Add this debug logging to see what token IDs are being used
console.log('Service layer USD token ID:', config.hedera.usdTokenId);
console.log('Service layer ZAR token ID:', config.hedera.zarTokenId);
console.log('Infrastructure USD token ID:', process.env.USD_TOKEN_ID);
console.log('Infrastructure ZAR token ID:', process.env.ZAR_TOKEN_ID);
```

### 2. Verify Supply Key Match

Make sure the supply keys in your environment variables match the ones set on the actual tokens:

```bash
# Check your .env file
cat .env | grep SUPPLY_KEY

# Verify these match the supply keys from when you created the tokens
```

### 3. Check Token Status

Use Hedera Explorer to verify:
- Token exists and is active
- Supply key is set correctly
- Your account has permission to mint

## 🛡️ Prevention

To prevent this issue in the future:

1. **Always use environment variables** for token IDs
2. **Never hardcode token IDs** in multiple places
3. **Use a single source of truth** for configuration
4. **Test token operations** after any configuration changes
5. **Monitor logs** for token ID mismatches

## 📊 Expected Behavior After Fix

After applying this fix, you should see:

```
✅ Service layer uses: USD_TOKEN_ID from environment
✅ Infrastructure layer uses: USD_TOKEN_ID from environment  
✅ Both layers use the same token ID
✅ Supply key matches the token ID
✅ Token minting succeeds
✅ No more INVALID_SIGNATURE errors
```

## 🚨 Critical Notes

1. **Token ID Consistency**: Both layers must use the same token IDs
2. **Supply Key Match**: Supply keys must match the actual tokens on Hedera
3. **Environment Variables**: All token IDs should come from environment variables
4. **Testing**: Always test after configuration changes
5. **Monitoring**: Watch logs for any token ID mismatches

The system should now work correctly with consistent token ID usage across all layers.
