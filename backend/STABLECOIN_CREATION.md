# Demo Stablecoin Creation Scripts

This directory contains scripts to create demo USD and ZAR stablecoins on Hedera testnet with proper supply keys for minting and burning operations.

## 🚀 Quick Start

### Option 1: Using the Shell Script (Recommended)
```bash
cd backend
./create-stablecoins.sh
```

### Option 2: Using the Node.js Script
```bash
cd backend
node create-stablecoins.js
```

### Option 3: Direct TypeScript Execution
```bash
cd backend
npx tsx src/scripts/create-demo-stablecoins.ts
```

## 📋 Prerequisites

1. **Environment Variables**: Ensure your `.env` file contains:
   ```env
   HEDERA_ACCOUNT_ID=0.0.xxxxx
   HEDERA_PRIVATE_KEY=302e020100300506032b657004220420xxxxx
   HEDERA_NETWORK=testnet
   ```

2. **Account Balance**: Your Hedera account should have sufficient HBAR for transaction fees (at least 10 HBAR recommended).

3. **Dependencies**: Make sure all npm dependencies are installed:
   ```bash
   npm install
   ```

## 🎯 What the Scripts Do

### Main Script: `create-demo-stablecoins.ts`
- Creates **Demo USD Stablecoin (DUSD)** with infinite supply capability
- Creates **Demo ZAR Stablecoin (DZAR)** with infinite supply capability
- Generates unique supply keys for each token
- Mints initial supply for both tokens
- Displays all relevant information for your application

### Legacy Script: `create-token.ts`
- Creates a single USD stablecoin (updated with supply key support)
- Useful for creating additional tokens or testing

## 📊 Token Specifications

### USD Stablecoin (DUSD)
- **Name**: Demo USD Stablecoin
- **Symbol**: DUSD
- **Decimals**: 2 (100 = $1.00)
- **Supply Type**: Infinite (can be minted/burned)
- **Initial Supply**: 1,000,000 (represents $10,000.00)

### ZAR Stablecoin (DZAR)
- **Name**: Demo ZAR Stablecoin
- **Symbol**: DZAR
- **Decimals**: 2 (100 = R1.00)
- **Supply Type**: Infinite (can be minted/burned)
- **Initial Supply**: 18,500,000 (represents R185,000.00)

## 🔑 Important Keys Generated

After running the script, you'll get:

```
USD_TOKEN_ID=0.0.xxxxx
USD_SUPPLY_KEY=302e020100300506032b657004220420xxxxx
ZAR_TOKEN_ID=0.0.xxxxx
ZAR_SUPPLY_KEY=302e020100300506032b657004220420xxxxx
```

## 🔧 Integration Steps

1. **Add to Environment**: Add the generated keys to your `.env` file
2. **Update Backend Code**: Update the `getTokenIdForCurrency` method in:
   - `backend/src/infrastructure/hedera.ts`
   - `backend/src/services/hedera.service.ts`
3. **Restart Application**: Restart your backend service
4. **Test Operations**: Test minting and burning operations

## 🛡️ Security Notes

- **Supply Keys**: Keep supply keys secure - they can mint/burn unlimited tokens
- **Demo Tokens**: These are for testing only, not for production use
- **Key Storage**: Consider using a hardware wallet for production environments
- **Access Control**: Limit access to supply keys in production

## 🐛 Troubleshooting

### Common Issues

1. **TOKEN_HAS_NO_SUPPLY_KEY Error**
   - **Cause**: Existing tokens don't have supply keys
   - **Solution**: Use these scripts to create new tokens with supply keys

2. **Insufficient Balance**
   - **Cause**: Not enough HBAR for transaction fees
   - **Solution**: Add more HBAR to your testnet account

3. **Environment Variables Missing**
   - **Cause**: `.env` file not configured properly
   - **Solution**: Ensure all required variables are set

4. **Token Creation Fails**
   - **Cause**: Network issues or invalid credentials
   - **Solution**: Check your Hedera credentials and network connection

### Getting Testnet HBAR

If you need testnet HBAR:
1. Visit [Hedera Portal](https://portal.hedera.com/)
2. Create a testnet account
3. Use the testnet faucet to get free HBAR

## 📝 Example Usage

After running the script, you can use the tokens in your application:

```typescript
// Example: Mint 100 USD tokens
await hederaService.mintToken(usdTokenId, 10000, toAccountId); // 10000 = $100.00

// Example: Burn 50 ZAR tokens
await hederaService.burnToken(zarTokenId, 5000, fromAccountId, privateKey); // 5000 = R50.00
```

## 🔄 Next Steps

1. **Test Token Operations**: Verify minting and burning work correctly
2. **Update Frontend**: Ensure frontend can handle the new token IDs
3. **Test Payment Flow**: Test cross-currency payments with the new tokens
4. **Monitor Transactions**: Use Hedera Explorer to monitor token operations

## 📞 Support

If you encounter issues:
1. Check the console output for detailed error messages
2. Verify your Hedera credentials are correct
3. Ensure your account has sufficient HBAR balance
4. Check the Hedera testnet status
