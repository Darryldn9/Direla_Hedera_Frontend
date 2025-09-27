#!/bin/bash

# Script to create demo USD and ZAR stablecoins on Hedera testnet
# This script will create tokens with proper supply keys for minting/burning

echo "🚀 Creating Demo Stablecoins on Hedera Testnet..."
echo "================================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please make sure you have a .env file with your Hedera credentials:"
    echo "HEDERA_ACCOUNT_ID=0.0.xxxxx"
    echo "HEDERA_PRIVATE_KEY=302e020100300506032b657004220420xxxxx"
    echo "HEDERA_NETWORK=testnet"
    exit 1
fi

# Check if required environment variables are set
if ! grep -q "HEDERA_ACCOUNT_ID" .env || ! grep -q "HEDERA_PRIVATE_KEY" .env; then
    echo "❌ Error: Missing required environment variables!"
    echo "Please ensure your .env file contains:"
    echo "HEDERA_ACCOUNT_ID=0.0.xxxxx"
    echo "HEDERA_PRIVATE_KEY=302e020100300506032b657004220420xxxxx"
    echo "HEDERA_NETWORK=testnet"
    exit 1
fi

echo "✅ Environment variables found"
echo ""

# Run the TypeScript script
echo "🔧 Running stablecoin creation script..."
npx tsx src/scripts/create-demo-stablecoins.ts

echo ""
echo "🎉 Script completed! Check the output above for your new token IDs and keys."
