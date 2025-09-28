// Simple test to check if the script can run
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Testing script execution...');
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', process.cwd());

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('Environment variables:');
  console.log('HEDERA_ACCOUNT_ID:', envContent.includes('HEDERA_ACCOUNT_ID') ? '✅ Found' : '❌ Missing');
  console.log('HEDERA_PRIVATE_KEY:', envContent.includes('HEDERA_PRIVATE_KEY') ? '✅ Found' : '❌ Missing');
  console.log('HEDERA_NETWORK:', envContent.includes('HEDERA_NETWORK') ? '✅ Found' : '❌ Missing');
} else {
  console.log('❌ .env file not found');
}

console.log('\n🔧 Testing TypeScript execution...');
try {
  const { execSync } = await import('child_process');
  const result = execSync('npx tsx --version', { encoding: 'utf8' });
  console.log('tsx version:', result.trim());
} catch (error) {
  console.log('❌ tsx not available:', error.message);
}
