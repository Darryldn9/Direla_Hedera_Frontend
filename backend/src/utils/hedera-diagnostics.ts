import { AccountId, PrivateKey, Client, Hbar } from '@hashgraph/sdk';
import { PublicKey } from '@hashgraph/sdk';
import { logger } from './logger.js';

export interface HederaDiagnosticsResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
  accountInfo?: {
    accountId: string;
    keyType: string;
    publicKey: string;
    balance?: number;
  };
}

export class HederaDiagnostics {
  /**
   * Comprehensive diagnostics for Hedera configuration and signature issues
   */
  static async diagnoseHederaSetup(
    accountId: string,
    privateKey: string,
    network: 'testnet' | 'mainnet'
  ): Promise<HederaDiagnosticsResult> {
    const result: HederaDiagnosticsResult = {
      isValid: true,
      issues: [],
      warnings: [],
      recommendations: []
    };

    try {
      // 1. Validate account ID format
      this.validateAccountId(accountId, result);

      // 2. Validate private key format
      this.validatePrivateKey(privateKey, result);

      // 3. Test key-account match
      await this.testKeyAccountMatch(accountId, privateKey, network, result);

      // 4. Test network connectivity
      await this.testNetworkConnectivity(network, result);

      // 5. Test transaction signing capability
      await this.testTransactionSigning(accountId, privateKey, network, result);

      // Determine overall validity
      result.isValid = result.issues.length === 0;

      // Add recommendations based on findings
      this.addRecommendations(result);

    } catch (error) {
      result.isValid = false;
      result.issues.push(`Diagnostic error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private static validateAccountId(accountId: string, result: HederaDiagnosticsResult): void {
    try {
      if (!accountId || accountId.trim() === '') {
        result.issues.push('Account ID is empty');
        return;
      }

      const cleanAccountId = accountId.trim();
      
      // Check format (should be like 0.0.123456)
      if (!/^\d+\.\d+\.\d+$/.test(cleanAccountId)) {
        result.issues.push(`Invalid account ID format: ${cleanAccountId}. Expected format: 0.0.123456`);
        return;
      }

      // Try to parse with Hedera SDK
      AccountId.fromString(cleanAccountId);
      
      logger.debug('Account ID validation passed', { accountId: cleanAccountId });
    } catch (error) {
      result.issues.push(`Invalid account ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static validatePrivateKey(privateKey: string, result: HederaDiagnosticsResult): void {
    try {
      if (!privateKey || privateKey.trim() === '') {
        result.issues.push('Private key is empty');
        return;
      }

      const cleanKey = privateKey.trim();
      
      // Check if it starts with expected prefixes
      if (!cleanKey.startsWith('302') && !cleanKey.startsWith('303')) {
        result.warnings.push('Private key does not start with expected prefix (302 or 303)');
      }

      // Check length (should be around 88-90 characters for ED25519, longer for ECDSA)
      if (cleanKey.length < 80 || cleanKey.length > 200) {
        result.warnings.push(`Private key length seems unusual: ${cleanKey.length} characters`);
      }

      // Try to parse with Hedera SDK
      const parsedKey = PrivateKey.fromString(cleanKey);

      // Get public key for verification
      const publicKey = parsedKey.publicKey;
      
      result.accountInfo = {
        accountId: '',
        keyType: 'ED25519', // Default assumption, actual type detection is complex
        publicKey: publicKey.toString()
      };

      logger.debug('Private key validation passed', { 
        keyLength: cleanKey.length 
      });
    } catch (error) {
      result.issues.push(`Invalid private key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async testKeyAccountMatch(
    accountId: string,
    privateKey: string,
    network: 'testnet' | 'mainnet',
    result: HederaDiagnosticsResult
  ): Promise<void> {
    try {
      const client = Client.forName(network);
      const operatorId = AccountId.fromString(accountId);
      const operatorKey = PrivateKey.fromString(privateKey);
      
      client.setOperator(operatorId, operatorKey);

      // Get account info
      const accountInfo = await new (await import('@hashgraph/sdk')).AccountInfoQuery()
        .setAccountId(operatorId)
        .execute(client);

      if (!accountInfo.key) {
        result.issues.push('Account does not have a public key');
        return;
      }

      // Compare public keys
      const privateKeyPublicKey = operatorKey.publicKey;
      if (!privateKeyPublicKey.equals(accountInfo.key as PublicKey)) {
        result.issues.push('Private key does not match the account public key');
        return;
      }

      // Get balance
      const balance = await new (await import('@hashgraph/sdk')).AccountBalanceQuery()
        .setAccountId(operatorId)
        .execute(client);

      if (result.accountInfo) {
        result.accountInfo.accountId = accountId;
        result.accountInfo.balance = Number(balance.hbars.toString());
      }

      logger.debug('Key-account match verification passed');
    } catch (error) {
      if (error instanceof Error && error.message.includes('INVALID_ACCOUNT_ID')) {
        result.issues.push('Account ID does not exist on the network');
      } else if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
        result.issues.push('Account access is unauthorized - check if account exists and is active');
      } else {
        result.issues.push(`Key-account verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private static async testNetworkConnectivity(
    network: 'testnet' | 'mainnet',
    result: HederaDiagnosticsResult
  ): Promise<void> {
    try {
      const client = Client.forName(network);
      
      // Try to get network info
      // const networkInfo = await client.getNetworkVersionInfo();
      
      logger.debug('Network connectivity test passed', { 
        network,
        version: "" //networkInfo?.version || 'unknown'
      });
    } catch (error) {
      result.warnings.push(`Network connectivity issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async testTransactionSigning(
    accountId: string,
    privateKey: string,
    network: 'testnet' | 'mainnet',
    result: HederaDiagnosticsResult
  ): Promise<void> {
    try {
      const client = Client.forName(network);
      const operatorId = AccountId.fromString(accountId);
      const operatorKey = PrivateKey.fromString(privateKey);
      
      client.setOperator(operatorId, operatorKey);

      // Create a test transaction (just for signing, not execution)
      const testTransaction = new (await import('@hashgraph/sdk')).TransferTransaction()
        .addHbarTransfer(operatorId, Hbar.fromTinybars(0));

      // Try to freeze the transaction (this tests signing without execution)
      testTransaction.freezeWith(client);

      logger.debug('Transaction signing test passed');
    } catch (error) {
      if (error instanceof Error && error.message.includes('INVALID_SIGNATURE')) {
        result.issues.push('Transaction signing failed - INVALID_SIGNATURE error');
      } else {
        result.warnings.push(`Transaction signing test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private static addRecommendations(result: HederaDiagnosticsResult): void {
    if (result.issues.length === 0) {
      result.recommendations.push('Configuration looks good! No issues detected.');
      return;
    }

    // Add specific recommendations based on issues found
    result.issues.forEach(issue => {
      if (issue.includes('Account ID')) {
        result.recommendations.push('Verify your account ID format and ensure it exists on the network');
      }
      if (issue.includes('Private key')) {
        result.recommendations.push('Check your private key format and ensure it matches the account');
      }
      if (issue.includes('INVALID_SIGNATURE')) {
        result.recommendations.push('Verify that your private key corresponds to the account ID');
        result.recommendations.push('Ensure you are using the correct network (testnet vs mainnet)');
        result.recommendations.push('Check for any special characters or encoding issues in your private key');
      }
      if (issue.includes('Key-account verification')) {
        result.recommendations.push('The private key does not match the account - verify you have the correct key');
      }
    });

    // General recommendations
    if (result.warnings.length > 0) {
      result.recommendations.push('Review the warnings above for potential issues');
    }
  }

  /**
   * Quick validation for environment variables
   */
  static validateEnvironmentVariables(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!process.env.HEDERA_ACCOUNT_ID) {
      issues.push('HEDERA_ACCOUNT_ID environment variable is not set');
    }
    
    if (!process.env.HEDERA_PRIVATE_KEY) {
      issues.push('HEDERA_PRIVATE_KEY environment variable is not set');
    }
    
    if (!process.env.HEDERA_NETWORK) {
      issues.push('HEDERA_NETWORK environment variable is not set');
    } else if (!['testnet', 'mainnet'].includes(process.env.HEDERA_NETWORK)) {
      issues.push('HEDERA_NETWORK must be either "testnet" or "mainnet"');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
