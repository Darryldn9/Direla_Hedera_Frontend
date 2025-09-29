// scripts/setup-hedera-credentials.js
// Helper script to generate or validate Hedera credentials

const { Client, PrivateKey, AccountId } = require("@hashgraph/sdk");
const fs = require('fs');
const path = require('path');

async function setupHederaCredentials() {
  console.log("🔧 Hedera Credentials Setup");
  console.log("==========================");
  
  // Check if credentials already exist
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const hasAccountId = envContent.includes('HEDERA_ACCOUNT_ID=0.0.') && !envContent.includes('HEDERA_ACCOUNT_ID=0.0.XXX');
  const hasPrivateKey = envContent.includes('HEDERA_PRIVATE_KEY=302') && !envContent.includes('HEDERA_PRIVATE_KEY=302XXX');
  
  if (hasAccountId && hasPrivateKey) {
    console.log("✅ Hedera credentials already configured in .env file");
    
    // Validate the credentials
    try {
      const accountId = process.env.HEDERA_ACCOUNT_ID;
      const privateKey = process.env.HEDERA_PRIVATE_KEY;
      
      const client = Client.forTestnet();
      client.setOperator(AccountId.fromString(accountId), PrivateKey.fromString(privateKey));
      
      console.log("✅ Credentials are valid and working");
      console.log(`Account ID: ${accountId}`);
      console.log(`Private Key: ${privateKey.substring(0, 10)}...`);
      
      return { accountId, privateKey };
    } catch (error) {
      console.log("❌ Credentials are invalid or not working");
      console.log("Error:", error.message);
    }
  }
  
  console.log("\n📝 To deploy your BNPL contract, you need to:");
  console.log("1. Create a Hedera testnet account at: https://portal.hedera.com/");
  console.log("2. Get your Account ID and Private Key from the portal");
  console.log("3. Update the .env file with your credentials");
  console.log("\nExample .env configuration:");
  console.log("HEDERA_ACCOUNT_ID=0.0.123456");
  console.log("HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...");
  console.log("\nAlternatively, you can generate a new account using the Hedera SDK:");
  
  // Generate a new account for testing
  try {
    const newPrivateKey = PrivateKey.generateED25519();
    const newPublicKey = newPrivateKey.publicKey;
    const newAccountId = newPublicKey.toAccountId(0, 0);
    
    console.log("\n🆕 Generated new test account:");
    console.log(`Account ID: ${newAccountId.toString()}`);
    console.log(`Private Key: ${newPrivateKey.toString()}`);
    console.log("\n⚠️  Note: This is a new account with no HBAR. You'll need to fund it from the Hedera portal.");
    
    return {
      accountId: newAccountId.toString(),
      privateKey: newPrivateKey.toString()
    };
  } catch (error) {
    console.log("❌ Error generating new account:", error.message);
  }
}

if (require.main === module) {
  setupHederaCredentials().catch(console.error);
}

module.exports = { setupHederaCredentials };
