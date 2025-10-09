# BNPL Smart Contract (Solidity)

This directory contains the Buy Now Pay Later (BNPL) smart contract for Hedera, written in Solidity.

## How to Compile, Deploy, and Use the BNPL Contract

### Prerequisites
- Node.js v18 (recommended for Hardhat compatibility)
- Yarn or npm
- Hardhat (installed as a dev dependency)
- EVM-compatible private key (e.g., from MetaMask) with test HBAR on Hedera testnet
- .env file with `PRIVATE_KEY` and `BNPL_ADDRESS` (see below)

### 1. Install Dependencies
```sh
cd backend
npm install
```

### 2. Compile the Contract
```sh
npx hardhat compile --network hedera --config hardhat.config.cjs
```

### 3. Deploy the Contract
```sh
npx hardhat run scripts/deploy-bnpl.js --network hedera --config hardhat.config.cjs
```
- The script will print the deployed contract address. Copy this address to your `.env` file as `BNPL_ADDRESS`.

### 4. Run the Usage Script
```sh
npx hardhat run scripts/bnpl-usage.js --network hedera --config hardhat.config.cjs
```
- This script demonstrates creating a BNPL agreement and paying all installments.
- It will print debug output and contract state.

### 5. Environment Variables
Create a `.env` file in the `backend/` directory with the following:
```
PRIVATE_KEY=your_evm_private_key
BNPL_ADDRESS=your_deployed_contract_address
```

### 6. Troubleshooting
- If you see `Incorrect amount` errors, ensure your Node.js version is compatible and your .env is correct.
- For debugging, check the `DebugInstallment` event in the contract for on-chain values.

### 7. Contract Location
- Solidity contract: `backend/contracts/BNPL.sol`
- Deployment script: `backend/scripts/deploy-bnpl.js`
- Usage script: `backend/scripts/bnpl-usage.js`

---
For more details, see the main project README or contact the project maintainers.
