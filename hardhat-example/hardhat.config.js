require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
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
    poa: {
      url: process.env.RPC_URL || "http://localhost:8545",
      chainId: parseInt(process.env.CHAIN_ID || "1337"),
      ...(process.env.PRIVATE_KEY ? { accounts: [process.env.PRIVATE_KEY] } : {}),
      gas: 8000000,
      gasPrice: 1000000000,
      httpHeaders: { "Connection": "close" }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 2025,
      httpHeaders: { "Connection": "close" }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
