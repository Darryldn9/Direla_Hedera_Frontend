import { getSupabaseClient } from '../database/connection.js';
import { TABLES } from '../database/schema.js';
import { HederaInfrastructure } from '../infrastructure/hedera.js';
import { logger } from '../utils/logger.js';

export interface DIDCreationEvent {
  event: 'did_creation';
  user_id: string;
  did: string;
  timestamp: string;
  platform_issuer: string;
}

export interface TransactionEvent {
  event: 'transaction';
  merchant_did: string;
  hedera_account: string;
  txn_id: string;
  amount: string;
  timestamp: string;
  platform_issuer: string;
}

export interface HCSMessageResult {
  success: boolean;
  transactionId?: string;
  explorerLink?: string;
  error?: string;
}

export class DIDService {
  private hederaInfra: HederaInfrastructure;
  private topicId: string;
  private readonly PLATFORM_ISSUER = 'did:hedera:testnet:platform-0.0.9999';
  private readonly HEDERA_EXPLORER_BASE = 'https://hashscan.io/testnet/transaction';
  private isInitialized = false;

  constructor(hederaInfra: HederaInfrastructure, topicId?: string) {
    this.hederaInfra = hederaInfra;
    this.topicId = topicId || '';
    
    if (!topicId) {
      // Auto-initialize topic if not provided
      this.initializeTopic().catch(error => {
        logger.error('Failed to auto-initialize HCS topic', { error });
      });
    } else {
      this.isInitialized = true;
    }
  }

  /**
   * Initialize HCS topic for DID messages
   */
  async initializeTopic(): Promise<string> {
    try {
      const topicIdString = await this.hederaInfra.createTopic();
      this.topicId = topicIdString;
      this.isInitialized = true;
      
      logger.info('DID service HCS Topic initialized', { 
        topicId: topicIdString
      });
      
      return topicIdString;
    } catch (error) {
      logger.error('Failed to initialize HCS topic in DID service', { error });
      throw error;
    }
  }

  /**
   * Ensure topic is initialized before performing operations
   */
  private async ensureTopicInitialized(): Promise<void> {
    if (!this.isInitialized || !this.topicId) {
      await this.initializeTopic();
    }
  }

  /**
   * Generate DID for a user
   */
  generateDID(userId: string): string {
    return `did:hedera:testnet:${userId}`;
  }

  /**
   * Create DID for a new merchant and update the database
   */
  async createMerchantDID(userId: string): Promise<{ did: string; hcsResult: HCSMessageResult }> {
    const supabase = getSupabaseClient();
    
    try {
      logger.info('Creating DID for merchant', { userId });
      
      // Generate DID
      const did = this.generateDID(userId);
      
      // Update user record with DID
      const { data: updatedUser, error: updateError } = await supabase
        .from(TABLES.USERS)
        .update({
          did: did,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to update user with DID', { userId, did, error: updateError });
        throw new Error(`Failed to update user with DID: ${updateError.message}`);
      }

      if (!updatedUser) {
        throw new Error('User not found');
      }

      // Create DID creation event
      const didEvent: DIDCreationEvent = {
        event: 'did_creation',
        user_id: userId,
        did: did,
        timestamp: new Date().toISOString(),
        platform_issuer: this.PLATFORM_ISSUER
      };

      // Publish to HCS
      const hcsResult = await this.publishToHCS(didEvent);
      
      logger.info('DID created successfully', { 
        userId, 
        did, 
        hcsTransactionId: hcsResult.transactionId 
      });

      return { did, hcsResult };
    } catch (error) {
      logger.error('Failed to create merchant DID', { userId, error });
      throw error;
    }
  }

  /**
   * Log transaction under merchant's DID
   */
  async logTransaction(
    merchantUserId: string,
    hederaAccountId: string,
    transactionId: string,
    amount: string
  ): Promise<HCSMessageResult> {
    const supabase = getSupabaseClient();
    
    try {
      logger.info('Logging transaction', { 
        merchantUserId, 
        hederaAccountId, 
        transactionId, 
        amount 
      });

      // Get merchant's DID
      const { data: user, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('did')
        .eq('user_id', merchantUserId)
        .single();

      if (userError || !user) {
        throw new Error('Merchant not found or DID not available');
      }

      const userData = user as any; // Type assertion since DID column was added via UI
      if (!userData.did) {
        throw new Error('Merchant does not have a DID');
      }

      // Create transaction event
      const transactionEvent: TransactionEvent = {
        event: 'transaction',
        merchant_did: userData.did,
        hedera_account: hederaAccountId,
        txn_id: transactionId,
        amount: amount,
        timestamp: new Date().toISOString(),
        platform_issuer: this.PLATFORM_ISSUER
      };

      // Publish to HCS
      const hcsResult = await this.publishToHCS(transactionEvent);
      
      logger.info('Transaction logged successfully', { 
        merchantUserId,
        merchantDID: userData.did,
        transactionId,
        hcsTransactionId: hcsResult.transactionId 
      });

      return hcsResult;
    } catch (error) {
      logger.error('Failed to log transaction', { 
        merchantUserId, 
        hederaAccountId, 
        transactionId, 
        amount, 
        error 
      });
      throw error;
    }
  }

  /**
   * Publish message to HCS topic
   */
  private async publishToHCS(message: DIDCreationEvent | TransactionEvent): Promise<HCSMessageResult> {
    try {
      // Ensure topic is initialized
      await this.ensureTopicInitialized();
      
      const messageString = JSON.stringify(message);
      
      logger.debug('Publishing to HCS', { 
        topicId: this.topicId,
        messageType: message.event,
        messageSize: messageString.length
      });

      const result = await this.hederaInfra.submitTopicMessage(this.topicId, messageString);
      
      if (result.status === 'SUCCESS') {
        const explorerLink = `${this.HEDERA_EXPLORER_BASE}/${result.transactionId}`;
        
        logger.info('HCS message published successfully', { 
          topicId: this.topicId,
          transactionId: result.transactionId,
          explorerLink: explorerLink,
          messageType: message.event
        });

        return {
          success: true,
          transactionId: result.transactionId,
          explorerLink: explorerLink
        };
      } else {
        logger.error('HCS message publishing failed', { 
          topicId: this.topicId,
          status: result.status,
          messageType: message.event,
          error: result.message
        });

        return {
          success: false,
          error: result.message || `HCS message failed with status: ${result.status}`
        };
      }
    } catch (error) {
      logger.error('HCS message publishing error', { 
        topicId: this.topicId,
        messageType: message.event,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get DID by user ID
   */
  async getDIDByUserId(userId: string): Promise<string | null> {
    const supabase = getSupabaseClient();
    
    try {
      const { data: user, error } = await supabase
        .from(TABLES.USERS)
        .select('did')
        .eq('user_id', userId)
        .single();

      if (error || !user) {
        logger.debug('User not found or no DID', { userId });
        return null;
      }

      const userData = user as any; // Type assertion since DID column was added via UI
      return userData.did || null;
    } catch (error) {
      logger.error('Failed to get DID by user ID', { userId, error });
      throw error;
    }
  }

  /**
   * Check if user has DID
   */
  async hasDID(userId: string): Promise<boolean> {
    const did = await this.getDIDByUserId(userId);
    return did !== null;
  }

  /**
   * Get topic ID being used
   */
  getTopicId(): string {
    return this.topicId;
  }
}
