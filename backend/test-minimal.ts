// Minimal test to check if the script can run
console.log('🚀 Starting minimal test...');

// Test environment loading
import { config, validateConfig } from './src/config/index.js';

try {
  console.log('🔧 Validating config...');
  validateConfig();
  console.log('✅ Config validation passed');
  console.log('Account ID:', config.hedera.accountId);
  console.log('Network:', config.hedera.network);
} catch (error) {
  console.log('❌ Config validation failed:', error);
  process.exit(1);
}

console.log('🎉 Minimal test completed successfully!');
