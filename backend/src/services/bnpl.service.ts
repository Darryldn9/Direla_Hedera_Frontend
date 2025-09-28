import { ethers } from 'ethers';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

const ABI_PATH = path.resolve(process.cwd(), 'backend', 'artifacts', 'contracts', 'BNPL.sol', 'BNPL.json');

function loadAbi(): any {
  if (fs.existsSync(ABI_PATH)) {
    const raw = fs.readFileSync(ABI_PATH, 'utf8');
    const json = JSON.parse(raw);
    return json.abi;
  }
  throw new Error(`BNPL ABI not found at ${ABI_PATH}. Please ensure contracts were compiled to artifacts.`);
}

export class BNPLService {
  private provider: ethers.providers.JsonRpcProvider;
  private signer?: ethers.Wallet;
  private contract?: ethers.Contract;
  private abi: any;

  constructor() {
    this.abi = loadAbi();
    this.provider = new ethers.providers.JsonRpcProvider(config.bnpl.rpcUrl);

    // Only create a signer if a private key is configured. Otherwise operate read-only via provider.
    if (config.bnpl.privateKey) {
      this.signer = new ethers.Wallet(config.bnpl.privateKey, this.provider);
    }

    if (config.bnpl.address) {
      const signerOrProvider = this.signer ?? this.provider;
      this.contract = new ethers.Contract(config.bnpl.address, this.abi, signerOrProvider as any);
    }
  }

  public connectTo(address: string) {
    this.contract = new ethers.Contract(address, this.abi, this.signer);
    return this.contract;
  }

  public getContract(): ethers.Contract | undefined {
    return this.contract;
  }

  public async createAgreement(consumer: string, merchant: string, principalWei: string, interestRateBps: number, numInstallments: number) {
    if (!this.contract) throw new Error('BNPL contract not configured');
    if (!this.signer) throw new Error('BNPL write operations are disabled: missing BNPL_PRIVATE_KEY');
    const tx = await this.contract.createBNPLAgreement(consumer, merchant, principalWei, interestRateBps, numInstallments);
    const receipt = await tx.wait();
    return receipt;
  }

  public async getAgreement(agreementId: any) {
    if (!this.contract) throw new Error('BNPL contract not configured');
    const ag = await this.contract.getAgreement(agreementId);
    return ag;
  }

  public async payInstallment(agreementId: any, valueWei: string) {
    if (!this.contract) throw new Error('BNPL contract not configured');
    if (!this.signer) throw new Error('BNPL write operations are disabled: missing BNPL_PRIVATE_KEY');
    const tx = await this.contract.payInstallment(agreementId, { value: ethers.BigNumber.from(valueWei) });
    const receipt = await tx.wait();
    return receipt;
  }
}

export default BNPLService;
