# Hedera INVALID_SIGNATURE Error Troubleshooting Guide

## Overview

The `INVALID_SIGNATURE` error in Hedera transactions typically occurs when there's a mismatch between the private key and account ID, or when the transaction cannot be properly signed. This guide will help you diagnose and fix these issues.

## Quick Diagnosis

### 1. Run Automated Diagnostics

Use the new diagnostics endpoints to automatically check your configuration:

```bash
# Check environment variables
curl http://localhost:3000/api/diagnostics/env

# Run comprehensive Hedera diagnostics
curl http://localhost:3000/api/diagnostics/hedera

# Test transaction signing
curl -X POST http://localhost:3000/api/diagnostics/test-signature \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId": "0.0.123456", "toAccountId": "0.0.789012", "amount": 0.001}'
```

### 2. Check Your Environment Variables

Ensure your `.env` file contains the correct values:

```bash
# Check if variables are set
echo $HEDERA_ACCOUNT_ID
echo $HEDERA_PRIVATE_KEY
echo $HEDERA_NETWORK
```

## Common Causes and Solutions

### 1. **Private Key Format Issues**

**Problem**: Private key is malformed or in wrong format.

**Symptoms**:
- Error during client initialization
- "Invalid private key" messages in logs

**Solutions**:
- Ensure private key starts with `302` (ED25519) or `303` (ECDSA)
- Remove any whitespace or special characters
- Verify the key is complete (usually 88-90 characters for ED25519)

**Example**:
```bash
# Correct format
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...

# Wrong format (missing prefix)
HEDERA_PRIVATE_KEY=e020100300506032b657004220420...
```

### 2. **Account ID Mismatch**

**Problem**: Private key doesn't correspond to the account ID.

**Symptoms**:
- "Key-account verification failed" in logs
- INVALID_SIGNATURE error during transactions

**Solutions**:
- Verify the account ID exists on the network
- Ensure the private key matches the account's public key
- Check if you're using the correct network (testnet vs mainnet)

**Verification**:
```bash
# Check account info
curl http://localhost:3000/api/hedera/account/0.0.123456/info
```

### 3. **Network Mismatch**

**Problem**: Using testnet keys on mainnet or vice versa.

**Symptoms**:
- Account not found errors
- INVALID_SIGNATURE errors

**Solutions**:
- Ensure `HEDERA_NETWORK` matches your account's network
- Use testnet for development: `HEDERA_NETWORK=testnet`
- Use mainnet for production: `HEDERA_NETWORK=mainnet`

### 4. **Key Type Issues**

**Problem**: Using wrong key type or corrupted key.

**Symptoms**:
- Parsing errors during key validation
- Signature verification failures

**Solutions**:
- Regenerate keys if corrupted
- Ensure consistent key type usage
- Check for encoding issues

### 5. **Environment Variable Issues**

**Problem**: Special characters or encoding issues in environment variables.

**Symptoms**:
- Unexpected parsing errors
- Inconsistent behavior

**Solutions**:
- Use single quotes around values with special characters
- Check for hidden characters or encoding issues
- Verify file encoding (should be UTF-8)

**Example**:
```bash
# Correct
HEDERA_PRIVATE_KEY='302e020100300506032b657004220420...'

# Problematic (if key contains special characters)
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
```

## Step-by-Step Troubleshooting

### Step 1: Verify Environment Setup

1. Check if all required environment variables are set:
   ```bash
   curl http://localhost:3000/api/diagnostics/env
   ```

2. If variables are missing, update your `.env` file:
   ```bash
   HEDERA_ACCOUNT_ID=0.0.123456
   HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
   HEDERA_NETWORK=testnet
   ```

### Step 2: Run Comprehensive Diagnostics

1. Execute the full diagnostic suite:
   ```bash
   curl http://localhost:3000/api/diagnostics/hedera
   ```

2. Review the output for:
   - Issues (must be fixed)
   - Warnings (should be addressed)
   - Recommendations (follow for best practices)

### Step 3: Test Transaction Signing

1. Test with a small amount:
   ```bash
   curl -X POST http://localhost:3000/api/diagnostics/test-signature \
     -H "Content-Type: application/json" \
     -d '{"amount": 0.001}'
   ```

2. If successful, try with your actual transaction parameters.

### Step 4: Check Logs

1. Review application logs for detailed error information:
   ```bash
   # If using PM2
   pm2 logs your-app-name

   # If running directly
   tail -f logs/app.log
   ```

2. Look for specific error patterns:
   - "Private key validation failed"
   - "Key-account verification failed"
   - "INVALID_SIGNATURE"

## Advanced Troubleshooting

### Manual Key Verification

If automated diagnostics don't reveal the issue, you can manually verify:

1. **Check Account Exists**:
   ```bash
   curl http://localhost:3000/api/hedera/account/0.0.123456/balance
   ```

2. **Verify Key Format**:
   - Should start with `302` (ED25519) or `303` (ECDSA)
   - Should be 88-90 characters long for ED25519
   - Should be valid hex string

3. **Test Network Connectivity**:
   ```bash
   curl http://localhost:3000/api/hedera/account/0.0.3/balance
   ```

### Regenerating Keys

If your keys are corrupted or don't match:

1. **Generate New Test Keys** (for testnet):
   ```javascript
   const { PrivateKey } = require('@hashgraph/sdk');
   const newKey = PrivateKey.generateED25519();
   console.log('Private Key:', newKey.toString());
   console.log('Public Key:', newKey.publicKey.toString());
   ```

2. **Create New Account**:
   ```bash
   curl -X POST http://localhost:3000/api/hedera/account/create \
     -H "Content-Type: application/json" \
     -d '{"initialBalance": 1.0}'
   ```

## Prevention

### Best Practices

1. **Environment Management**:
   - Use `.env` files for local development
   - Use secure environment variable management for production
   - Never commit private keys to version control

2. **Key Management**:
   - Store keys securely
   - Use different keys for different environments
   - Regularly rotate keys in production

3. **Validation**:
   - Always validate configuration on startup
   - Use the diagnostic endpoints regularly
   - Monitor logs for signature-related errors

### Configuration Validation

The enhanced HederaInfrastructure now includes:
- Automatic private key validation
- Key-account matching verification
- Transaction validation before execution
- Retry logic for signature issues
- Comprehensive error logging

## Getting Help

If you're still experiencing issues after following this guide:

1. **Check the logs** for specific error messages
2. **Run the diagnostics** and share the output
3. **Verify your environment** variables are correct
4. **Test with a fresh account** to isolate the issue

## API Reference

### Diagnostics Endpoints

- `GET /api/diagnostics/env` - Check environment variables
- `GET /api/diagnostics/hedera` - Run comprehensive Hedera diagnostics
- `POST /api/diagnostics/test-signature` - Test transaction signing

### Enhanced Hedera Methods

- `transferHbarWithValidation()` - Enhanced transfer with validation
- `validateAndParsePrivateKey()` - Private key validation
- `verifyKeyAccountMatch()` - Key-account verification
- `executeTransactionWithRetry()` - Retry logic for signature issues

## Example Fixes

### Fix 1: Correct Private Key Format

**Before**:
```bash
HEDERA_PRIVATE_KEY=e020100300506032b657004220420...
```

**After**:
```bash
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
```

### Fix 2: Network Mismatch

**Before**:
```bash
HEDERA_NETWORK=mainnet  # But using testnet account
```

**After**:
```bash
HEDERA_NETWORK=testnet  # Match your account's network
```

### Fix 3: Account ID Format

**Before**:
```bash
HEDERA_ACCOUNT_ID=123456  # Missing 0.0. prefix
```

**After**:
```bash
HEDERA_ACCOUNT_ID=0.0.123456  # Correct format
```

This guide should help you resolve most INVALID_SIGNATURE issues. If you continue to experience problems, please check the logs and run the diagnostic endpoints for more specific error information.
