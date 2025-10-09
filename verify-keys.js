#!/usr/bin/env node

/**
 * Verify that all required keys are properly configured
 */

require('dotenv').config();

function verifyKeys() {
  console.log('🔍 Verifying BNPL Burn/Mint Key Configuration\n');

  const requiredKeys = {
    'HEDERA_ACCOUNT_ID': process.env.HEDERA_ACCOUNT_ID,
    'HEDERA_PRIVATE_KEY': process.env.HEDERA_PRIVATE_KEY,
    'USD_TOKEN_ID': process.env.USD_TOKEN_ID,
    'USD_SUPPLY_KEY': process.env.USD_SUPPLY_KEY,
    'ZAR_TOKEN_ID': process.env.ZAR_TOKEN_ID,
    'ZAR_SUPPLY_KEY': process.env.ZAR_SUPPLY_KEY,
    'BNPL_ADDRESS': process.env.BNPL_ADDRESS
  };

  let allGood = true;

  Object.entries(requiredKeys).forEach(([key, value]) => {
    if (value) {
      console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${key}: MISSING`);
      allGood = false;
    }
  });

  console.log('\n' + '='.repeat(50));
  
  if (allGood) {
    console.log('🎉 All keys are configured! You\'re ready for burn/mint operations.');
  } else {
    console.log('⚠️  Some keys are missing. Please add them to your .env file.');
  }

  console.log('\n📋 Key Usage Summary:');
  console.log('   HEDERA_PRIVATE_KEY → Contract calls (treasury operations)');
  console.log('   USD_SUPPLY_KEY     → USD token mint/burn operations');
  console.log('   ZAR_SUPPLY_KEY     → ZAR token mint/burn operations');
  console.log('   Consumer keys      → Stored in database, used for token transfers');
}

verifyKeys();
