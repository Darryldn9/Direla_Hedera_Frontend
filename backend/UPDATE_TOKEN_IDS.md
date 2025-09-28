# Updating Token IDs After Creating New Stablecoins

After running the stablecoin creation script, you'll need to update your backend code with the new token IDs.

## 🔄 Step 1: Update Environment Variables

Add the new token IDs and supply keys to your `.env` file:

```env
# Existing Hedera configuration
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420xxxxx
HEDERA_NETWORK=testnet

# New stablecoin token IDs (replace with actual values from script output)
USD_TOKEN_ID=0.0.xxxxx
USD_SUPPLY_KEY=302e020100300506032b657004220420xxxxx
ZAR_TOKEN_ID=0.0.xxxxx
ZAR_SUPPLY_KEY=302e020100300506032b657004220420xxxxx
```

## 🔧 Step 2: Update Backend Code

### Update `backend/src/infrastructure/hedera.ts`

Replace the hardcoded token IDs in the `getAccountBalance` method:

```typescript
// Replace these lines (around line 68-69):
const USD_TOKEN_ID = '0.0.6869755';
const ZAR_TOKEN_ID = '0.0.6889204';

// With:
const USD_TOKEN_ID = process.env.USD_TOKEN_ID || '0.0.6869755';
const ZAR_TOKEN_ID = process.env.ZAR_TOKEN_ID || '0.0.6889204';
```

### Update `backend/src/infrastructure/hedera.ts`

Replace the hardcoded token IDs in the `getTokenIdForCurrency` method:

```typescript
// Replace this method (around line 772):
private getTokenIdForCurrency(currency: string): string | null {
  const tokenMap: Record<string, string | null> = {
    'USD': '0.0.6869755',
    'ZAR': '0.0.6889204',
    'HBAR': null // HBAR doesn't have a token ID
  };
  
  return tokenMap[currency] || null;
}

// With:
private getTokenIdForCurrency(currency: string): string | null {
  const tokenMap: Record<string, string | null> = {
    'USD': process.env.USD_TOKEN_ID || '0.0.6869755',
    'ZAR': process.env.ZAR_TOKEN_ID || '0.0.6889204',
    'HBAR': null // HBAR doesn't have a token ID
  };
  
  return tokenMap[currency] || null;
}
```

### Update `backend/src/services/hedera.service.ts`

Replace the hardcoded token IDs in the `getTokenIdForCurrency` method:

```typescript
// Replace this method (around line 600):
private getTokenIdForCurrency(currency: string): string | null {
  const tokenMap: Record<string, string | null> = {
    'USD': '0.0.6869755',
    'ZAR': '0.0.6889204',
    'HBAR': null // HBAR doesn't have a token ID
  };
  
  return tokenMap[currency] || null;
}

// With:
private getTokenIdForCurrency(currency: string): string | null {
  const tokenMap: Record<string, string | null> = {
    'USD': process.env.USD_TOKEN_ID || '0.0.6869755',
    'ZAR': process.env.ZAR_TOKEN_ID || '0.0.6889204',
    'HBAR': null // HBAR doesn't have a token ID
  };
  
  return tokenMap[currency] || null;
}
```

## 🔑 Step 3: Add Supply Key Support (Optional)

If you want to use the supply keys for minting/burning operations, you can add them to your configuration:

### Update `backend/src/config/index.ts`

Add supply key configuration:

```typescript
export const config = {
  // ... existing config
  hedera: {
    accountId: process.env.HEDERA_ACCOUNT_ID!,
    privateKey: process.env.HEDERA_PRIVATE_KEY!,
    network: process.env.HEDERA_NETWORK as 'testnet' | 'mainnet',
    // Add supply keys
    usdSupplyKey: process.env.USD_SUPPLY_KEY,
    zarSupplyKey: process.env.ZAR_SUPPLY_KEY,
  },
  // ... rest of config
};
```

### Update Token Operations

If you want to use the supply keys for minting/burning, update the token operations to use the configured keys instead of the operator key.

## 🧪 Step 4: Test the Changes

1. **Restart your backend service**:
   ```bash
   npm run dev
   ```

2. **Test token operations**:
   - Check account balances include the new tokens
   - Test minting operations
   - Test burning operations
   - Test cross-currency payments

3. **Verify in Hedera Explorer**:
   - Visit [Hedera Explorer](https://hashscan.io/testnet)
   - Search for your token IDs
   - Verify the tokens have supply keys

## 🔍 Step 5: Verify Token Configuration

You can verify your tokens are configured correctly by checking:

1. **Token Info**: The tokens should show as "Fungible Common" with "Infinite" supply
2. **Supply Key**: The tokens should have supply keys set
3. **Admin Key**: The tokens should have admin keys set
4. **Treasury**: The tokens should have your account as treasury

## 🚨 Important Notes

- **Backup Keys**: Make sure to backup your supply keys securely
- **Test First**: Always test on testnet before using on mainnet
- **Environment Variables**: Ensure all environment variables are properly set
- **Token Association**: Users may need to associate with the new tokens before receiving them

## 🐛 Troubleshooting

### Token Not Found
- Check that the token ID is correct in your environment variables
- Verify the token exists on Hedera Explorer

### Supply Key Issues
- Ensure the supply key is correctly set on the token
- Check that you're using the right key for mint/burn operations

### Balance Issues
- Verify token association for accounts
- Check that the treasury account has sufficient balance

## 📞 Need Help?

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your environment variables are set correctly
3. Test with a simple token transfer first
4. Check the Hedera Explorer for token status
