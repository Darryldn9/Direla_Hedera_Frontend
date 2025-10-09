// scripts/bnpl-usage.js
// Example usage: create agreement, pay installments

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const BNPL = await hre.ethers.getContractFactory("BNPL");
  const bnpl = await BNPL.attach(process.env.BNPL_ADDRESS);

  // Use deployer as both consumer and merchant for demo
  const consumer = deployer;
  const merchant = deployer;

  // 1. Create agreement with principal, interestRate, numInstallments
  const principalAmount = hre.ethers.utils.parseEther("1.0");
  const interestRate = 500; // 5% in basis points
  const numInstallments = 4;
  const interest = principalAmount.mul(interestRate).div(10000);
  const totalOwed = principalAmount.add(interest);
  const expectedInstallment = totalOwed.div(numInstallments);
  console.log("Debug: principalAmount:", principalAmount.toString());
  console.log("Debug: interestRate (bps):", interestRate);
  console.log("Debug: interest:", interest.toString());
  console.log("Debug: totalOwed:", totalOwed.toString());
  console.log("Debug: expectedInstallment:", expectedInstallment.toString());

  const tx = await bnpl.createBNPLAgreement(consumer.address, merchant.address, principalAmount, interestRate, numInstallments);
  const receipt = await tx.wait();
  const agreementId = receipt.events.find(e => e.event === "AgreementCreated").args.agreementId;
  console.log("Agreement created with ID:", agreementId.toString());

  // 2. Consumer pays installments
  const agreement = await bnpl.getAgreement(agreementId);
  console.log("Contract totalOwed:", agreement.totalOwed.toString());
  console.log("Contract numInstallments:", agreement.numInstallments.toString());
  const contractExpectedInstallment = agreement.totalOwed.div(agreement.numInstallments);
  console.log("Contract expectedInstallment:", contractExpectedInstallment.toString());
  for (let i = 0; i < numInstallments; i++) {
    const payTx = await bnpl.connect(consumer).payInstallment(agreementId, { value: contractExpectedInstallment });
    await payTx.wait();
    console.log(`Installment ${i+1} paid by consumer.`);
  }

  // 3. Check agreement status
  const ag = await bnpl.getAgreement(agreementId);
  console.log("Agreement completed:", ag.isCompleted);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
