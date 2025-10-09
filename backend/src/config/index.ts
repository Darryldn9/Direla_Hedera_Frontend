import dotenv from 'dotenv';
import { HederaConfig } from '../types/index.js';

// Load environment variables
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  hedera: {
    accountId: process.env.HEDERA_ACCOUNT_ID || '',
    privateKey: process.env.HEDERA_PRIVATE_KEY || '',
    network: (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet') || 'testnet',
    usdTokenId: process.env.USD_TOKEN_ID || '',
    usdSupplyKey: process.env.USD_SUPPLY_KEY || '',
    zarTokenId: process.env.ZAR_TOKEN_ID || '',
    zarSupplyKey: process.env.ZAR_SUPPLY_KEY || '',
    evmRpcUrl: process.env.HEDERA_EVM_RPC_URL || 'https://testnet.hashio.io/api',
    bnplContractAddress: process.env.BNPL_ADDRESS || ''
  } as HederaConfig,
  
  mirrorNode: {
    testnet: 'https://testnet.mirrornode.hedera.com',
    mainnet: 'https://mainnet.mirrornode.hedera.com',
    previewnet: 'https://previewnet.mirrornode.hedera.com'
  },
  
  did: {
    hcsTopicId: process.env.HCS_TOPIC_ID || '' // Optional: if not provided, will create a new topic
  },
  
  database: {
    url: process.env.DATABASE_URL || './database.sqlite'
  },
  
  externalApi: {
    baseUrl: process.env.EXTERNAL_API_URL || 'https://api.example.com',
    apiKey: process.env.EXTERNAL_API_KEY || 'demo-key'
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttlSeconds: parseInt(process.env.REDIS_TTL_SECONDS || '30')
  }
  ,
  bnpl: {
    // EVM contract address for the BNPL contract (optional)
    address: process.env.BNPL_ADDRESS || '',
    // RPC URL for connecting to the EVM (e.g. Hedera EVM gateway)
    rpcUrl: process.env.BNPL_RPC_URL || process.env.EVM_RPC_URL || 'https://testnet.hashio.io/api',
    // Private key used by backend to sign BNPL transactions (optional)
    privateKey: process.env.BNPL_PRIVATE_KEY || process.env.PRIVATE_KEY || ''
  }
};

// Validate required environment variables
export const validateConfig = () => {
  const requiredVars = [
    'HEDERA_ACCOUNT_ID',
    'HEDERA_PRIVATE_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
