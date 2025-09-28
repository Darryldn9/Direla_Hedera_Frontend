
// example/bnpl-call.js
// Example: How to call the BNPL contract from Node.js using ethers.js

// --- Get EVM address from Hedera account using Hedera SDK ---
// Uncomment and install @hashgraph/sdk if needed
// const { AccountId } = require("@hashgraph/sdk");
// const accountId = AccountId.fromString("0.0.12345");
// const evmAddress = accountId.toSolidityAddress();
// console.log("EVM Address:", evmAddress);

require('dotenv').config();
const { ethers } = require('ethers');
const BNPL_ABI = require('../artifacts/contracts/BNPL.sol/BNPL.json').abi;

async function main() {
  // Set up provider and signer
  const provider = new ethers.providers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Connect to the deployed contract
  const contract = new ethers.Contract(process.env.BNPL_ADDRESS, BNPL_ABI, signer);

  // Example: Create a BNPL agreement
  // Replace these with real EVM addresses and values
  const consumerAddress = signer.address; // for demo, use signer as consumer
  const merchantAddress = signer.address; // for demo, use signer as merchant
  const principalAmount = ethers.utils.parseEther('1.0'); // 1 HBAR (in wei)
  const interestRate = 500; // 5% in basis points
  const numInstallments = 4;

  // Create agreement
  const createTx = await contract.createBNPLAgreement(
    consumerAddress,
    merchantAddress,
    principalAmount,
    interestRate,
    numInstallments
  );
  const receipt = await createTx.wait();
  const agreementId = receipt.events.find(e => e.event === 'AgreementCreated').args.agreementId;
  console.log('Created agreement with ID:', agreementId.toString());

  // Read the agreement from the contract
  const agreement = await contract.getAgreement(agreementId);
  console.log('Agreement:', agreement);

  // Example: Pay an installment (uncomment to use)
  // const expectedInstallment = agreement.totalOwed.div(agreement.numInstallments);
  // const payTx = await contract.payInstallment(agreementId, { value: expectedInstallment });
  // await payTx.wait();
  // console.log('Installment paid!');
}

main().catch(console.error);