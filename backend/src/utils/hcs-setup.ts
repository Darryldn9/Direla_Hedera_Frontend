import { Client, TopicCreateTransaction, Status } from '@hashgraph/sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Utility to initialize HCS topic for DID messages
 */
export class HCSInitializer {
  private client: Client;

  constructor() {
    this.client = Client.forName(config.hedera.network);
    this.client.setOperator(config.hedera.accountId, config.hedera.privateKey);
  }

  /**
   * Create a new HCS topic for DID messages
   */
  async createTopic(): Promise<string> {
    try {
      logger.info('Creating HCS topic for DID messages...');
      
      const transaction = new TopicCreateTransaction();
      
      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.status === Status.Success && receipt.topicId) {
        const topicId = receipt.topicId.toString();
        
        logger.info('HCS Topic created successfully', {
          topicId: topicId,
          transactionId: response.transactionId.toString(),
          network: config.hedera.network
        });
        
        console.log('\n🎉 HCS Topic created successfully!');
        console.log(`Topic ID: ${topicId}`);
        console.log(`Transaction ID: ${response.transactionId.toString()}`);
        console.log(`Network: ${config.hedera.network}`);
        console.log(`\nAdd this to your .env file:`);
        console.log(`HCS_TOPIC_ID=${topicId}`);
        console.log(`\nExplorer Link: https://hashscan.io/${config.hedera.network}/transaction/${response.transactionId.toString()}`);
        
        return topicId;
      } else {
        throw new Error('Failed to create HCS topic');
      }
    } catch (error) {
      logger.error('Failed to create HCS topic', { error });
      throw error;
    }
  }

  /**
   * Close the client connection
   */
  close(): void {
    this.client.close();
  }
}

// CLI script to create topic
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file://').href) {
  const initializer = new HCSInitializer();
  
  initializer.createTopic()
    .then((topicId) => {
      console.log(`\n✅ Setup complete! Topic ID: ${topicId}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed to create topic:', error.message);
      process.exit(1);
    })
    .finally(() => {
      initializer.close();
    });
}
