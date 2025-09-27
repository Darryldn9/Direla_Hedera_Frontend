// Debug: Check if script is running
console.log('🚀 Script started - checking imports...');

import {
  TokenCreateTransaction,
  AccountId,
  PrivateKey,
  Client,
  Hbar,
  AccountBalanceQuery,
  TokenSupplyType,
  TokenType
} from '@hashgraph/sdk';

console.log('✅ Hedera SDK imported successfully');

import { config, validateConfig } from '../config/index.js';
import { logger } from '../utils/logger.js';

console.log('✅ Local modules imported successfully');

/**
 * Script to create Demo USD and ZAR Stablecoins with proper supply keys
 * This script creates tokens that can be minted and burned
 */
export class DemoStablecoinCreator {
  private client: Client;
  private operatorId: AccountId;
  private operatorKey: PrivateKey;

  constructor() {
    try {
      console.log('🔧 Constructor: Validating configuration...');
      // Validate configuration
      validateConfig();
      console.log('✅ Config validation passed');

      console.log('🔧 Constructor: Initializing Hedera client...');
      // Initialize client
      this.client = Client.forName(config.hedera.network);
      this.operatorId = AccountId.fromString(config.hedera.accountId);
      this.operatorKey = PrivateKey.fromString(config.hedera.privateKey);
      
      console.log('🔧 Constructor: Setting operator...');
      // Set operator
      this.client.setOperator(this.operatorId, this.operatorKey);

      console.log('✅ Demo Stablecoin Creator initialized successfully');
      logger.info('Demo Stablecoin Creator initialized', {
        network: config.hedera.network,
        operatorAccount: config.hedera.accountId
      });
    } catch (error) {
      console.log('❌ Constructor failed:', error);
      logger.error('Failed to initialize stablecoin creator', { error });
      throw error;
    }
  }

  async createUSDStablecoin(): Promise<{ tokenId: string; supplyKey: string }> {
    try {
      console.log('\n💵 Creating Demo USD Stablecoin...');
      logger.info('Creating Demo USD Stablecoin...');

      // Generate a new supply key for this token
      const supplyKey = PrivateKey.generateED25519();
      const supplyPublicKey = supplyKey.publicKey;

      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName("Demo USD Stablecoin")
        .setTokenSymbol("DUSD")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)                    // 100 = $1.00
        .setInitialSupply(0)               // Start with 0 supply
        .setSupplyType(TokenSupplyType.Infinite) // Allow infinite supply
        .setTreasuryAccountId(this.operatorId)
        .setAdminKey(this.operatorKey)     // Admin key for token management
        .setSupplyKey(supplyKey)           // Supply key for minting/burning
        .setMaxTransactionFee(Hbar.fromTinybars(500_000_000)); // 5 HBAR Fee Max

      // Execute transaction
      const txResponse = await tokenCreateTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      if (!receipt.tokenId) {
        throw new Error('USD Token creation failed - no token ID returned');
      }

      const tokenId = receipt.tokenId.toString();

      console.log(`✅ USD Stablecoin created: ${tokenId}`);
      logger.success('USD Stablecoin created successfully!', {
        tokenId,
        transactionId: txResponse.transactionId.toString(),
        name: "Demo USD Stablecoin",
        symbol: "DUSD",
        decimals: 2,
        supplyType: "Infinite",
        treasuryAccount: this.operatorId.toString(),
        supplyKey: supplyKey.toString()
      });

      return { tokenId, supplyKey: supplyKey.toString() };
    } catch (error) {
      logger.error('USD Token creation failed', { error });
      throw error;
    }
  }

  async createZARStablecoin(): Promise<{ tokenId: string; supplyKey: string }> {
    try {
      console.log('\n🇿🇦 Creating Demo ZAR Stablecoin...');
      logger.info('Creating Demo ZAR Stablecoin...');

      // Generate a new supply key for this token
      const supplyKey = PrivateKey.generateED25519();
      const supplyPublicKey = supplyKey.publicKey;

      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName("Demo ZAR Stablecoin")
        .setTokenSymbol("DZAR")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)                    // 100 = R1.00
        .setInitialSupply(0)               // Start with 0 supply
        .setSupplyType(TokenSupplyType.Infinite) // Allow infinite supply
        .setTreasuryAccountId(this.operatorId)
        .setAdminKey(this.operatorKey)     // Admin key for token management
        .setSupplyKey(supplyKey)           // Supply key for minting/burning
        .setMaxTransactionFee(Hbar.fromTinybars(500_000_000)); // 5 HBAR Fee Max

      // Execute transaction
      const txResponse = await tokenCreateTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      if (!receipt.tokenId) {
        throw new Error('ZAR Token creation failed - no token ID returned');
      }

      const tokenId = receipt.tokenId.toString();

      console.log(`✅ ZAR Stablecoin created: ${tokenId}`);
      logger.success('ZAR Stablecoin created successfully!', {
        tokenId,
        transactionId: txResponse.transactionId.toString(),
        name: "Demo ZAR Stablecoin",
        symbol: "DZAR",
        decimals: 2,
        supplyType: "Infinite",
        treasuryAccount: this.operatorId.toString(),
        supplyKey: supplyKey.toString()
      });

      return { tokenId, supplyKey: supplyKey.toString() };
    } catch (error) {
      logger.error('ZAR Token creation failed', { error });
      throw error;
    }
  }

  async getAccountBalance(): Promise<void> {
    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(this.operatorId)
        .execute(this.client);
      logger.info('Current account balance', {
        account: this.operatorId.toString(),
        hbarBalance: balance.hbars.toString()
      });
    } catch (error) {
      logger.error('Failed to get account balance', { error });
    }
  }

  async mintInitialSupply(tokenId: string, supplyKey: string, amount: number, symbol: string): Promise<void> {
    try {
      console.log(`\n🪙 Minting ${amount.toLocaleString()} ${symbol} tokens...`);
      logger.info(`Minting initial supply of ${amount} ${symbol}...`);

      const { TokenMintTransaction } = await import('@hashgraph/sdk');
      
      // Parse the supply key
      const supplyKeyObj = PrivateKey.fromString(supplyKey);
      
      const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(amount)
        .setMaxTransactionFee(Hbar.fromTinybars(100_000_000)); // 1 HBAR Fee Max

      // Freeze and sign with the supply key
      const frozenTx = await mintTx.freezeWith(this.client);
      const signedTx = await frozenTx.sign(supplyKeyObj);
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      if (receipt.status.toString() === 'SUCCESS') {
        const displayAmount = (amount / 100).toLocaleString(); // Convert to display amount (divide by 100 for 2 decimals)
        console.log(`✅ Successfully minted ${displayAmount} ${symbol} (${amount.toLocaleString()} units)`);
        logger.success(`Successfully minted ${amount} ${symbol}`, {
          tokenId,
          amount,
          transactionId: txResponse.transactionId.toString()
        });
      } else {
        console.log(`❌ Failed to mint ${symbol}: ${receipt.status.toString()}`);
        logger.error(`Failed to mint ${symbol}`, {
          tokenId,
          amount,
          status: receipt.status.toString()
        });
        throw new Error(`Failed to mint ${symbol}: ${receipt.status.toString()}`);
      }
    } catch (error) {
      console.log(`❌ Error minting ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error(`Failed to mint initial supply for ${symbol}`, { error });
      throw error;
    }
  }
}

// Script execution function
async function main() {
  try {
    console.log('🚀 Starting stablecoin creation script...');
    console.log('🔧 Initializing creator...');
    
    const creator = new DemoStablecoinCreator();
    console.log('✅ Creator initialized successfully');
    
    // Check account balance first
    await creator.getAccountBalance();
    
    // Create USD stablecoin
    const usdResult = await creator.createUSDStablecoin();
    
    // Create ZAR stablecoin
    const zarResult = await creator.createZARStablecoin();
    
    // Mint initial supply for both tokens (150k tokens each)
    await creator.mintInitialSupply(usdResult.tokenId, usdResult.supplyKey, 15000000, 'DUSD'); // $150,000
    await creator.mintInitialSupply(zarResult.tokenId, zarResult.supplyKey, 15000000, 'DZAR'); // R150,000
    
    // Display results with enhanced formatting
    console.log('\n' + '='.repeat(100));
    console.log('🎉 DEMO STABLECOINS CREATED SUCCESSFULLY!');
    console.log('='.repeat(100));
    
    console.log('\n📋 TOKEN INFORMATION:');
    console.log('─'.repeat(60));
    console.log(`USD Token ID:     ${usdResult.tokenId}`);
    console.log(`USD Symbol:       DUSD`);
    console.log(`USD Supply Key:   ${usdResult.supplyKey}`);
    console.log(`USD Initial Supply: 15,000,000 (represents $150,000.00)`);
    
    console.log(`\nZAR Token ID:     ${zarResult.tokenId}`);
    console.log(`ZAR Symbol:       DZAR`);
    console.log(`ZAR Supply Key:   ${zarResult.supplyKey}`);
    console.log(`ZAR Initial Supply: 15,000,000 (represents R150,000.00)`);
    
    console.log('\n🔑 COPY THESE TO YOUR .ENV FILE:');
    console.log('─'.repeat(60));
    console.log(`USD_TOKEN_ID=${usdResult.tokenId}`);
    console.log(`USD_SUPPLY_KEY=${usdResult.supplyKey}`);
    console.log(`ZAR_TOKEN_ID=${zarResult.tokenId}`);
    console.log(`ZAR_SUPPLY_KEY=${zarResult.supplyKey}`);
    
    console.log('\n📝 QUICK COPY BLOCK:');
    console.log('─'.repeat(60));
    console.log('# Add these lines to your .env file:');
    console.log(`USD_TOKEN_ID=${usdResult.tokenId}`);
    console.log(`USD_SUPPLY_KEY=${usdResult.supplyKey}`);
    console.log(`ZAR_TOKEN_ID=${zarResult.tokenId}`);
    console.log(`ZAR_SUPPLY_KEY=${zarResult.supplyKey}`);
    
    console.log('\n📝 NEXT STEPS:');
    console.log('─'.repeat(40));
    console.log('1. Add these environment variables to your .env file');
    console.log('2. Update your backend code to use these new token IDs');
    console.log('3. Update the getTokenIdForCurrency method with new token IDs');
    console.log('4. Restart your application');
    console.log('5. Test minting and burning operations');
    
    console.log('\n⚠️  SECURITY NOTES:');
    console.log('─'.repeat(60));
    console.log('• Keep the supply keys secure - they can mint/burn tokens');
    console.log('• Consider using a hardware wallet for production');
    console.log('• These are demo tokens for testing only');
    
    console.log('\n' + '='.repeat(100));
    console.log('📋 SUMMARY - COPY THIS SECTION:');
    console.log('='.repeat(100));
    console.log(`USD Token ID: ${usdResult.tokenId}`);
    console.log(`USD Supply Key: ${usdResult.supplyKey}`);
    console.log(`ZAR Token ID: ${zarResult.tokenId}`);
    console.log(`ZAR Supply Key: ${zarResult.supplyKey}`);
    console.log('='.repeat(100));
    
    logger.success('Script completed successfully', { 
      usdTokenId: usdResult.tokenId,
      zarTokenId: zarResult.tokenId
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('Script failed', { error });
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Running main function...');
main();
