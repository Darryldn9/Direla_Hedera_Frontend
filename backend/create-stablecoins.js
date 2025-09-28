#!/usr/bin/env node

// Simple Node.js script to create demo stablecoins
// Run with: node create-stablecoins.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Creating Demo Stablecoins on Hedera Testnet...');
console.log('================================================');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('❌ Error: .env file not found!');
    console.log('Please create a .env file with your Hedera credentials:');
    console.log('HEDERA_ACCOUNT_ID=0.0.xxxxx');
    console.log('HEDERA_PRIVATE_KEY=302e020100300506032b657004220420xxxxx');
    console.log('HEDERA_NETWORK=testnet');
    process.exit(1);
}

// Read .env file to check for required variables
const envContent = fs.readFileSync(envPath, 'utf8');
if (!envContent.includes('HEDERA_ACCOUNT_ID') || !envContent.includes('HEDERA_PRIVATE_KEY')) {
    console.log('❌ Error: Missing required environment variables!');
    console.log('Please ensure your .env file contains:');
    console.log('HEDERA_ACCOUNT_ID=0.0.xxxxx');
    console.log('HEDERA_PRIVATE_KEY=302e020100300506032b657004220420xxxxx');
    console.log('HEDERA_NETWORK=testnet');
    process.exit(1);
}

console.log('✅ Environment variables found');
console.log('');

try {
    // Run the TypeScript script
    console.log('🔧 Running stablecoin creation script...');
    execSync('npx tsx src/scripts/create-demo-stablecoins.ts', { 
        stdio: 'inherit',
        cwd: __dirname
    });
    
    console.log('');
    console.log('🎉 Script completed! Check the output above for your new token IDs and keys.');
} catch (error) {
    console.log('❌ Script failed:', error.message);
    process.exit(1);
}
