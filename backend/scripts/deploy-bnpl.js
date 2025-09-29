// scripts/deploy-bnpl.js
// Deploys BNPL.sol to Hedera testnet using Hardhat

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Use the deployer's address as the treasury address
  const treasuryAddress = deployer.address;
  console.log("Treasury address:", treasuryAddress);

  const BNPL = await hre.ethers.getContractFactory("BNPL");
  const bnpl = await BNPL.deploy(treasuryAddress);
  await bnpl.deployed();

  console.log("BNPL deployed to:", bnpl.address);
  console.log("Contract address:", bnpl.address);
  console.log("Treasury address:", treasuryAddress);
  
  // Save deployment info
  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", bnpl.address);
  console.log("Treasury Address:", treasuryAddress);
  console.log("Deployer Address:", deployer.address);
  console.log("Network:", hre.network.name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
