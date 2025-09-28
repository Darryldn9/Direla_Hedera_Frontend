// scripts/deploy-bnpl.js
// Deploys BNPL.sol to Hedera testnet using Hardhat

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const BNPL = await hre.ethers.getContractFactory("BNPL");
  const bnpl = await BNPL.deploy();
  await bnpl.deployed();

  console.log("BNPL deployed to:", bnpl.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
