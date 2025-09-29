import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { config } from '../config';
import { AccountId } from '@hashgraph/sdk';

// BNPL Contract ABI - extracted from the updated Solidity contract
export const BNPL_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "consumer",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "merchant",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "principalAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "interestRate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "numInstallments",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "tokenId",
        "type": "string"
      }
    ],
    "name": "createBNPLAgreement",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agreementId",
        "type": "uint256"
      }
    ],
    "name": "payInstallment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agreementId",
        "type": "uint256"
      }
    ],
    "name": "getAgreement",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "consumer",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "merchant",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "principalAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "interestRate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalOwed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "numInstallments",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "installmentsPaid",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isCompleted",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "tokenId",
            "type": "string"
          }
        ],
        "internalType": "struct BNPL.Agreement",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agreementId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "consumer",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "merchant",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "tokenId",
        "type": "string"
      }
    ],
    "name": "processTokenPayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newTreasury",
        "type": "address"
      }
    ],
    "name": "updateTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agreementId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "consumer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "merchant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "numInstallments",
        "type": "uint256"
      }
    ],
    "name": "AgreementCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agreementId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "consumer",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "merchant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "installmentNumber",
        "type": "uint256"
      }
    ],
    "name": "InstallmentPaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agreementId",
        "type": "uint256"
      }
    ],
    "name": "AgreementCompleted",
    "type": "event"
  }
];

export interface BNPLAgreement {
  consumer: string;
  merchant: string;
  principalAmount: string;
  interestRate: string; // in basis points
  totalOwed: string;
  numInstallments: string;
  installmentsPaid: string;
  isCompleted: boolean;
  tokenId: string;
}

export interface BNPLContractResult {
  success: boolean;
  transactionId?: string;
  agreementId?: string;
  error?: string;
}

export class BNPLContractInfrastructure {
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract;
  private contractAddress: string;

  constructor() {
    // Initialize provider for Hedera EVM
    this.provider = new ethers.providers.JsonRpcProvider(config.hedera.evmRpcUrl);
    this.contractAddress = config.hedera.bnplContractAddress || '';
    
    // Validate contract address
    if (!this.contractAddress) {
      logger.error('BNPL Contract address not configured', {
        contractAddress: this.contractAddress,
        envVar: 'BNPL_ADDRESS'
      });
      throw new Error('BNPL_ADDRESS environment variable is required but not set');
    }

    // Validate contract address format (should be a valid Ethereum address)
    if (!/^0x[a-fA-F0-9]{40}$/.test(this.contractAddress)) {
      logger.error('Invalid BNPL Contract address format', {
        contractAddress: this.contractAddress,
        expectedFormat: '0x followed by 40 hexadecimal characters'
      });
      throw new Error(`Invalid BNPL contract address format: ${this.contractAddress}. Expected format: 0x followed by 40 hexadecimal characters`);
    }
    
    // Initialize contract instance
    this.contract = new ethers.Contract(
      this.contractAddress,
      BNPL_CONTRACT_ABI,
      this.provider
    );

    logger.info('BNPL Contract infrastructure initialized', {
      contractAddress: this.contractAddress,
      rpcUrl: config.hedera.evmRpcUrl
    });
  }

  /**
   * Resolve agreementId from a BNPL agreement creation transaction hash
   */
  async getAgreementIdFromTxHash(txHash: string): Promise<string | null> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        logger.warn('No receipt found for transaction hash', { txHash });
        return null;
      }

      // Use a precise Interface for AgreementCreated to parse logs reliably
      const iface = new ethers.utils.Interface([
        'event AgreementCreated(uint256 indexed agreementId, address indexed consumer, address indexed merchant, uint256 principalAmount, uint256 interestRate, uint256 totalOwed, uint256 numInstallments, string tokenId)'
      ]);

      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === 'AgreementCreated') {
            const id = parsed.args?.agreementId?.toString();
            if (id != null) {
              return id;
            }
          }
        } catch (_) {
          // not this event, continue
        }
      }

      logger.warn('AgreementCreated event not found in receipt logs', { txHash });
      return null;
    } catch (error) {
      logger.error('Failed to resolve agreementId from tx hash', {
        txHash,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Create a BNPL agreement on the smart contract
   */
  async createBNPLAgreement(
    consumerAddress: string,
    merchantAddress: string,
    principalAmount: string, // in wei
    interestRate: number, // in basis points (e.g., 500 = 5%)
    numInstallments: number,
    tokenId: string,
    signerPrivateKey: string
  ): Promise<BNPLContractResult> {
    try {
      logger.info('Creating BNPL agreement on smart contract', {
        consumerAddress,
        merchantAddress,
        principalAmount,
        interestRate,
        numInstallments,
        tokenId
      });

      // Validate that the provided key is an ECDSA hex key
      if (!BNPLContractInfrastructure.isValidEcdsaPrivateKey(signerPrivateKey)) {
        logger.error('Invalid signer private key type for EVM transaction. Expected secp256k1 (0x...)');
        throw new Error('Signer private key must be an ECDSA secp256k1 key starting with 0x... and 64 hex chars');
      }

      const signer = new ethers.Wallet(signerPrivateKey, this.provider);
      const contractWithSigner = this.contract.connect(signer);

      // Call the smart contract method
      const tx = await contractWithSigner.createBNPLAgreement(
        consumerAddress,
        merchantAddress,
        principalAmount,
        interestRate,
        numInstallments,
        tokenId
      );

      logger.info('BNPL agreement transaction submitted', {
        transactionHash: tx.hash
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        // Debug: Log all events
        logger.info('Transaction receipt events', {
          eventCount: receipt.events?.length || 0,
          events: receipt.events?.map((event: any) => ({
            event: event.event,
            args: event.args
          })) || []
        });

        // Extract agreement ID from the event
        const agreementCreatedEvent = receipt.events?.find(
          (event: any) => event.event === 'AgreementCreated'
        );

        logger.info('AgreementCreated event found', {
          found: !!agreementCreatedEvent,
          event: agreementCreatedEvent
        });

        const agreementId = agreementCreatedEvent?.args?.agreementId?.toString();

        logger.info('BNPL agreement created successfully', {
          agreementId,
          transactionHash: tx.hash
        });

        return {
          success: true,
          transactionId: tx.hash,
          agreementId
        };
      } else {
        logger.error('BNPL agreement creation failed', {
          transactionHash: tx.hash,
          status: receipt.status
        });

        return {
          success: false,
          transactionId: tx.hash,
          error: 'Transaction failed'
        };
      }
    } catch (error) {
      logger.error('Error creating BNPL agreement', {
        consumerAddress,
        merchantAddress,
        principalAmount,
        interestRate,
        numInstallments,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Pay an installment for a BNPL agreement
   */
  async payInstallment(
    agreementId: string,
    signerPrivateKey: string
  ): Promise<BNPLContractResult> {
    try {
      logger.info('Paying BNPL installment', { agreementId });

      // Validate that the provided key is an ECDSA hex key
      if (!BNPLContractInfrastructure.isValidEcdsaPrivateKey(signerPrivateKey)) {
        logger.error('Invalid signer private key type for EVM transaction. Expected secp256k1 (0x...)');
        throw new Error('Signer private key must be an ECDSA secp256k1 key starting with 0x... and 64 hex chars');
      }

      const signer = new ethers.Wallet(signerPrivateKey, this.provider);
      const contractWithSigner = this.contract.connect(signer);

      // Get agreement details to calculate installment amount
      const agreement = await this.getAgreement(agreementId);
      if (!agreement) {
        return {
          success: false,
          error: 'Agreement not found'
        };
      }

      const installmentAmount = ethers.BigNumber.from(agreement.totalOwed)
        .div(agreement.numInstallments);

      // Call the smart contract method (no payment needed as we use burn/mint)
      const tx = await contractWithSigner.payInstallment(agreementId);

      logger.info('BNPL installment transaction submitted', {
        agreementId,
        installmentAmount: installmentAmount.toString(),
        transactionHash: tx.hash
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        logger.info('BNPL installment paid successfully', {
          agreementId,
          transactionHash: tx.hash
        });

        return {
          success: true,
          transactionId: tx.hash
        };
      } else {
        logger.error('BNPL installment payment failed', {
          agreementId,
          transactionHash: tx.hash,
          status: receipt.status
        });

        return {
          success: false,
          transactionId: tx.hash,
          error: 'Transaction failed'
        };
      }
    } catch (error) {
      logger.error('Error paying BNPL installment', {
        agreementId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process token payment with burn/mint operations
   */
  async processTokenPayment(
    agreementId: string,
    consumer: string,
    merchant: string,
    amount: string,
    tokenId: string,
    treasuryPrivateKey: string
  ): Promise<BNPLContractResult> {
    try {
      logger.info('Processing token payment with burn/mint', {
        agreementId,
        consumer,
        merchant,
        amount,
        tokenId
      });

      // Validate that the provided key is an ECDSA hex key
      if (!BNPLContractInfrastructure.isValidEcdsaPrivateKey(treasuryPrivateKey)) {
        logger.error('Invalid treasury private key type for EVM transaction. Expected secp256k1 (0x...)');
        throw new Error('Treasury private key must be an ECDSA secp256k1 key starting with 0x... and 64 hex chars');
      }

      const signer = new ethers.Wallet(treasuryPrivateKey, this.provider);
      const contractWithSigner = this.contract.connect(signer);

      // Determine gas limit (allow override via env, else use a safe default)
      const gasLimitEnv = process.env.BNPL_EVM_GAS_LIMIT || process.env.EVM_GAS_LIMIT;
      const gasLimit = gasLimitEnv && /^\d+$/.test(gasLimitEnv) ? Number(gasLimitEnv) : 1500000;

      // Call the smart contract method with explicit gas limit to avoid estimation failures
      const tx = await contractWithSigner.processTokenPayment(
        agreementId,
        consumer,
        merchant,
        amount,
        tokenId,
        { gasLimit }
      );

      logger.info('Token payment transaction submitted', {
        agreementId,
        amount,
        tokenId,
        transactionHash: tx.hash
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        logger.info('Token payment processed successfully', {
          agreementId,
          transactionHash: tx.hash
        });

        return {
          success: true,
          transactionId: tx.hash,
          agreementId: agreementId
        };
      } else {
        logger.error('Token payment transaction failed', {
          agreementId,
          transactionHash: tx.hash,
          status: receipt.status
        });

        return {
          success: false,
          error: `Transaction failed with status: ${receipt.status}`
        };
      }
    } catch (error) {
      logger.error('Token payment processing failed', {
        agreementId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get agreement details from the smart contract
   */
  async getAgreement(agreementId: string): Promise<BNPLAgreement | null> {
    try {
      const agreement = await this.contract.getAgreement(agreementId);
      
      return {
        consumer: agreement.consumer,
        merchant: agreement.merchant,
        principalAmount: agreement.principalAmount.toString(),
        interestRate: agreement.interestRate.toString(),
        totalOwed: agreement.totalOwed.toString(),
        numInstallments: agreement.numInstallments.toString(),
        installmentsPaid: agreement.installmentsPaid.toString(),
        isCompleted: agreement.isCompleted,
        tokenId: agreement.tokenId
      };
    } catch (error) {
      logger.error('Error getting BNPL agreement', {
        agreementId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Convert Hedera account ID to EVM address
   */
  static convertHederaAccountToEVMAddress(accountId: string): string {
    try {
      logger.debug('Converting Hedera account to EVM address', {
        accountId,
        accountIdLength: accountId.length,
        accountIdType: typeof accountId
      });

      // Validate format
      if (!/^\d+\.\d+\.\d+$/.test(accountId)) {
        logger.error('Invalid Hedera account ID format', {
          accountId,
          expectedFormat: '0.0.xxxxx'
        });
        throw new Error(`Invalid account ID format: expected format like '0.0.xxxxx', got '${accountId}'`);
      }

      // Use Hedera SDK canonical conversion
      const solidityAddress = AccountId.fromString(accountId).toSolidityAddress();
      const evmAddress = '0x' + solidityAddress;

      logger.debug('Converted Hedera account to EVM address', {
        accountId,
        evmAddress
      });

      return evmAddress;
    } catch (error) {
      logger.error('Error converting Hedera account to EVM address', {
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to convert account ID ${accountId} to EVM address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate that a private key is an ECDSA secp256k1 hex key acceptable by ethers.Wallet
   */
  private static isValidEcdsaPrivateKey(key: string): boolean {
    if (!key) return false;
    // Must be 0x-prefixed 64-66 hex chars (32 bytes)
    return /^0x[0-9a-fA-F]{64}$/.test(key);
  }
}
