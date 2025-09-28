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
  import { config, validateConfig } from '../config/index.js';
  import { logger } from '../utils/logger.js';
  
  /**
   * One-time script to create the Demo USD Stablecoin token
   * Run this script once to create your token and get the Token ID
   */
  export class TokenCreator {
    private client: Client;
    private operatorId: AccountId;
    private operatorKey: PrivateKey;
  
    constructor() {
      try {
        // Validate configuration
        validateConfig();
  
        // Initialize client
        this.client = Client.forName(config.hedera.network);
        this.operatorId = AccountId.fromString(config.hedera.accountId);
        this.operatorKey = PrivateKey.fromString(config.hedera.privateKey);
        
        // Set operator
        this.client.setOperator(this.operatorId, this.operatorKey);
  
        logger.info('Token creator initialized', {
          network: config.hedera.network,
          operatorAccount: config.hedera.accountId
        });
      } catch (error) {
        logger.error('Failed to initialize token creator', { error });
        throw error;
      }
    }
  
    async createStablecoin(): Promise<{ tokenId: string; supplyKey: string }> {
      try {
        logger.info('Creating Demo USD Stablecoin token...');

        // Generate a supply key for minting/burning
        const supplyKey = PrivateKey.generateED25519();
  
        const tokenCreateTx = new TokenCreateTransaction()
          .setTokenName("Demo USD Stablecoin")
          .setTokenSymbol("DUSD")
          .setTokenType(TokenType.FungibleCommon)
          .setDecimals(2)                    // 100 = $1.00
          .setInitialSupply(10_000_000)      // $100,000.00 worth
          .setSupplyType(TokenSupplyType.Infinite) // Allow infinite supply
          .setTreasuryAccountId(this.operatorId)
          .setAdminKey(this.operatorKey)
          .setSupplyKey(supplyKey)           // Supply key for minting/burning
          .setMaxTransactionFee(Hbar.fromTinybars(500_000_000)); // 5 HBAR Fee Max
  
        // Execute transaction
        const txResponse = await tokenCreateTx.execute(this.client);
        const receipt = await txResponse.getReceipt(this.client);
  
        if (!receipt.tokenId) {
          throw new Error('Token creation failed - no token ID returned');
        }
  
        const tokenId = receipt.tokenId.toString();
  
        logger.success('Token created successfully!', {
          tokenId,
          transactionId: txResponse.transactionId.toString(),
          name: "Demo USD Stablecoin",
          symbol: "DUSD",
          decimals: 2,
          initialSupply: "10,000,000 (represents $100,000.00)",
          treasuryAccount: this.operatorId.toString(),
          supplyKey: supplyKey.toString()
        });
  
        logger.info('Next steps:', {
          step1: `Add this to your .env file: STABLECOIN_TOKEN_ID=${tokenId}`,
          step2: `Add supply key to your .env file: STABLECOIN_SUPPLY_KEY=${supplyKey.toString()}`,
          step3: 'Restart your application to load the new token ID',
          step4: 'Test token association and transfers'
        });
  
        return { tokenId, supplyKey: supplyKey.toString() };
      } catch (error) {
        logger.error('Token creation failed', { error });
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
  }
  
  // Script execution function
  async function main() {
    try {
      const tokenCreator = new TokenCreator();
      
      // Check account balance first
      await tokenCreator.getAccountBalance();
      
      // Create the token
      const result = await tokenCreator.createStablecoin();
      
      logger.success('Script completed successfully', { 
        tokenId: result.tokenId,
        supplyKey: result.supplyKey
      });
      
      process.exit(0);
    } catch (error) {
      logger.error('Script failed', { error });
      process.exit(1);
    }
  }
  
  // Run the script if called directly
  if (import.meta.url === `file://${process.argv[1]}`) {
    main();
  }