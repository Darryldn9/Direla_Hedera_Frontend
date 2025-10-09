require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
const { PrivateKey } = require("@hashgraph/sdk");

// Convert DER format private key to hex format for Hardhat
function getHexPrivateKey() {
  if (!process.env.HEDERA_PRIVATE_KEY) return [];
  
  try {
    // If it's already in hex format, use it
    if (process.env.HEDERA_PRIVATE_KEY.startsWith('0x')) {
      return [process.env.HEDERA_PRIVATE_KEY];
    }
    
    // Convert DER format to hex
    const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
    const hexKey = privateKey.toStringRaw();
    return [`0x${hexKey}`];
  } catch (error) {
    console.error("Error converting private key:", error.message);
    return [];
  }
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: getHexPrivateKey(),
      chainId: 296
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
