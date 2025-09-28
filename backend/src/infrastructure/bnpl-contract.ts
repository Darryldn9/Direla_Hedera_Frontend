import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { config } from '../config';

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
    "stateMutability": "payable",
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
            "name": "totalAmount",
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
   * Create a BNPL agreement on the smart contract
   */
  async createBNPLAgreement(
    consumerAddress: string,
    merchantAddress: string,
    principalAmount: string, // in wei
    interestRate: number, // in basis points (e.g., 500 = 5%)
    numInstallments: number,
    signerPrivateKey: string
  ): Promise<BNPLContractResult> {
    try {
      logger.info('Creating BNPL agreement on smart contract', {
        consumerAddress,
        merchantAddress,
        principalAmount,
        interestRate,
        numInstallments
      });

      // Create signer from private key
      const signer = new ethers.Wallet(signerPrivateKey, this.provider);
      const contractWithSigner = this.contract.connect(signer);

      // Call the smart contract method
      const tx = await contractWithSigner.createBNPLAgreement(
        consumerAddress,
        merchantAddress,
        principalAmount,
        interestRate,
        numInstallments
      );

      logger.info('BNPL agreement transaction submitted', {
        transactionHash: tx.hash
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        // Extract agreement ID from the event
        const agreementCreatedEvent = receipt.events?.find(
          (event: any) => event.event === 'AgreementCreated'
        );

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

      // Create signer from private key
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

      // Call the smart contract method with payment
      const tx = await contractWithSigner.payInstallment(agreementId, {
        value: installmentAmount
      });

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
        isCompleted: agreement.isCompleted
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
      // Remove any dots and convert to number
      const accountNumber = accountId.replace(/\./g, '');
      const accountNum = parseInt(accountNumber, 10);
      
      // Convert to EVM address format (20 bytes)
      const evmAddress = '0x' + accountNum.toString(16).padStart(40, '0');
      
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
      throw new Error(`Failed to convert account ID ${accountId} to EVM address`);
    }
  }
}
