// scripts/check-credentials.js
// Check and convert Hedera credentials format

require('dotenv').config();
const { PrivateKey, AccountId } = require("@hashgraph/sdk");

function checkCredentials() {
  console.log("🔍 Checking Hedera Credentials");
  console.log("=============================");
  
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  
  console.log(`Account ID: ${accountId}`);
  console.log(`Private Key Length: ${privateKey ? privateKey.length : 0} characters`);
  console.log(`Private Key (first 20 chars): ${privateKey ? privateKey.substring(0, 20) + '...' : 'Not set'}`);
  
  if (!accountId || !privateKey) {
    console.log("❌ Missing credentials in .env file");
    return;
  }
  
  try {
    // Try to parse the private key
    const parsedKey = PrivateKey.fromString(privateKey);
    const publicKey = parsedKey.publicKey;
    const derivedAccountId = publicKey.toAccountId(0, 0);
    
    console.log("✅ Private key is valid");
    console.log(`Derived Account ID: ${derivedAccountId.toString()}`);
    console.log(`Matches provided Account ID: ${derivedAccountId.toString() === accountId}`);
    
    // Convert to hex format for Hardhat
    const hexPrivateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
    console.log(`\nFor Hardhat, use this private key format:`);
    console.log(`HEDERA_PRIVATE_KEY=${hexPrivateKey}`);
    
  } catch (error) {
    console.log("❌ Error parsing private key:", error.message);
    
    // Try to convert from different formats
    console.log("\n🔄 Trying to convert from different formats...");
    
    // If it's a hex string without 0x prefix
    if (privateKey.length === 64 && /^[0-9a-fA-F]+$/.test(privateKey)) {
      const withPrefix = '0x' + privateKey;
      console.log(`Try this format: HEDERA_PRIVATE_KEY=${withPrefix}`);
    }
    // If it's already in DER format, try to convert
    else if (privateKey.startsWith('302e')) {
      try {
        const parsedKey = PrivateKey.fromString(privateKey);
        const hexKey = parsedKey.toStringRaw();
        console.log(`Try this hex format: HEDERA_PRIVATE_KEY=0x${hexKey}`);
      } catch (e) {
        console.log("Could not convert DER format to hex");
      }
    }
  }
}

if (require.main === module) {
  checkCredentials();
}

module.exports = { checkCredentials };
