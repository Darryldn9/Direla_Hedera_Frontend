#!/usr/bin/env node

/**
 * Test script for HCS transaction publishing functionality
 * This script tests the publishTransactionToHCS method
 */

import { HederaInfrastructure } from './dist/infrastructure/hedera.js';
import { HederaAccountServiceImpl } from './dist/services/hedera-account.service.js';
import { HederaServiceImpl } from './dist/services/hedera.service.js';
import { config } from './dist/config/index.js';

async function testHCSPublishing() {
  console.log('🧪 Testing HCS Transaction Publishing...\n');

  try {
    // Initialize services
    const hederaInfra = new HederaInfrastructure(config.hedera);
    const hederaAccountService = new HederaAccountServiceImpl();
    const hederaService = new HederaServiceImpl(hederaInfra, hederaAccountService);

    // Test data
    const testTransactionId = '0.0.123456@1234567890.123456789';
    const fromAccountId = '0.0.123456';
    const toAccountId = '0.0.789012';
    const amountSent = { amount: 100.0, currency: 'USD' };
    const amountReceived = { amount: 85.0, currency: 'EUR' };
    const memo = 'Test transaction for HCS publishing';

    console.log('📋 Test Parameters:');
    console.log(`   Transaction ID: ${testTransactionId}`);
    console.log(`   From Account: ${fromAccountId}`);
    console.log(`   To Account: ${toAccountId}`);
    console.log(`   Amount Sent: ${amountSent.amount} ${amountSent.currency}`);
    console.log(`   Amount Received: ${amountReceived.amount} ${amountReceived.currency}`);
    console.log(`   Memo: ${memo}`);
    console.log(`   HCS Topic ID: ${process.env.HCS_TOPIC_ID || '0.0.6880055'}\n`);

    // Test HCS publishing
    console.log('📤 Publishing transaction completion to HCS...');
    const result = await hederaService.publishTransactionToHCS(
      testTransactionId,
      fromAccountId,
      toAccountId,
      amountSent,
      amountReceived,
      memo
    );

    console.log('\n📊 HCS Publishing Result:');
    console.log(`   Success: ${result.success}`);
    
    if (result.success) {
      console.log(`   HCS Transaction ID: ${result.transactionId}`);
      console.log(`   Explorer Link: ${result.explorerLink}`);
      console.log('\n✅ HCS publishing test completed successfully!');
    } else {
      console.log(`   Error: ${result.error}`);
      console.log('\n❌ HCS publishing test failed!');
    }

  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testHCSPublishing()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
