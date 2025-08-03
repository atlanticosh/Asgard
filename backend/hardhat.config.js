require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    // Local development network
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk',
        count: 10,
      },
    },

    // Sepolia testnet (for development)
    sepolia: {
      url:
        process.env.ETHEREUM_RPC_URL ||
        'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID',
      accounts:
        process.env.ETHEREUM_PRIVATE_KEY &&
        process.env.ETHEREUM_PRIVATE_KEY.length === 64
          ? [process.env.ETHEREUM_PRIVATE_KEY]
          : [],
      chainId: 11155111,
      gasPrice: 'auto',
      gas: 'auto',
    },

    // Base Sepolia testnet (alternative)
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
      accounts:
        process.env.ETHEREUM_PRIVATE_KEY &&
        process.env.ETHEREUM_PRIVATE_KEY.length === 64
          ? [process.env.ETHEREUM_PRIVATE_KEY]
          : [],
      chainId: 84532,
      gasPrice: 'auto',
      gas: 'auto',
    },

    // Ethereum mainnet (for production)
    mainnet: {
      url:
        process.env.ETHEREUM_MAINNET_RPC_URL ||
        'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
      accounts:
        process.env.ETHEREUM_PRIVATE_KEY &&
        process.env.ETHEREUM_PRIVATE_KEY.length === 64
          ? [process.env.ETHEREUM_PRIVATE_KEY]
          : [],
      chainId: 1,
      gasPrice: 'auto',
      gas: 'auto',
    },
  },

  // Etherscan verification
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  // Gas reporter for optimization
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    gasPrice: 20,
  },

  // Contract paths
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },

  // Mocha testing configuration
  mocha: {
    timeout: 60000, // 60 seconds
  },
};
