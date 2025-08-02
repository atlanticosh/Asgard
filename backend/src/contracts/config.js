const path = require('path');
const fs = require('fs');

/**
 * Contract Configuration for Stellar-Ethereum Bridge
 * Manages ABIs, addresses, and network-specific configurations
 */

// Load contract ABIs
function loadABI(contractName) {
  try {
    const artifactPath = path.join(
      __dirname,
      'artifacts',
      `${contractName}.sol`,
      `${contractName}.json`
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return artifact.abi;
  } catch (error) {
    console.error(`Failed to load ABI for ${contractName}:`, error.message);
    return null;
  }
}

// Contract ABIs
const ABIS = {
  EthereumHTLC: loadABI('EthereumHTLC'),
  BridgeController: loadABI('BridgeController'),
  MockUSDC: loadABI('MockUSDC'),
  MockWETH: loadABI('MockWETH'),
};

// Network configurations
const NETWORKS = {
  hardhat: {
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: null,
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.ETHEREUM_MAINNET_RPC_URL,
    blockExplorer: 'https://etherscan.io',
  },
};

// Contract addresses (loaded from environment or deployment files)
function getContractAddresses(network = 'hardhat') {
  // Try to load from environment first
  const envAddresses = {
    EthereumHTLC: process.env.ETHEREUM_HTLC_ADDRESS,
    BridgeController: process.env.BRIDGE_CONTROLLER_ADDRESS,
    MockUSDC: process.env.MOCK_USDC_ADDRESS,
    MockWETH: process.env.MOCK_WETH_ADDRESS,
  };

  // If env addresses exist, use them
  if (envAddresses.EthereumHTLC) {
    return envAddresses;
  }

  // Otherwise, try to load from deployment file
  try {
    const deploymentPath = path.join(
      __dirname,
      '../../deployments',
      `${network}.json`
    );
    if (fs.existsSync(deploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      return deployment.contracts;
    }
  } catch (error) {
    console.warn(
      `Could not load deployment file for ${network}:`,
      error.message
    );
  }

  // Fallback addresses for hardhat network (from our deployment)
  if (network === 'hardhat') {
    return {
      EthereumHTLC: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      BridgeController: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      MockUSDC: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      MockWETH: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    };
  }

  return {};
}

// Get current network configuration
function getCurrentNetwork() {
  const nodeEnv = process.env.NODE_ENV;
  const networkName = process.env.ETHEREUM_NETWORK || 'hardhat';

  if (nodeEnv === 'production') {
    return 'mainnet';
  } else if (networkName === 'sepolia') {
    return 'sepolia';
  }

  return 'hardhat';
}

// Contract configuration for current network
function getContractConfig() {
  const network = getCurrentNetwork();
  const addresses = getContractAddresses(network);
  const networkConfig = NETWORKS[network];

  return {
    network,
    networkConfig,
    addresses,
    abis: ABIS,
    contracts: {
      EthereumHTLC: {
        address: addresses.EthereumHTLC,
        abi: ABIS.EthereumHTLC,
      },
      BridgeController: {
        address: addresses.BridgeController,
        abi: ABIS.BridgeController,
      },
      MockUSDC: {
        address: addresses.MockUSDC,
        abi: ABIS.MockUSDC,
      },
      MockWETH: {
        address: addresses.MockWETH,
        abi: ABIS.MockWETH,
      },
    },
  };
}

// Validate contract configuration
function validateContractConfig() {
  const config = getContractConfig();
  const errors = [];

  // Check if ABIs are loaded
  Object.keys(ABIS).forEach((contractName) => {
    if (!ABIS[contractName]) {
      errors.push(`Missing ABI for ${contractName}`);
    }
  });

  // Check if addresses are configured
  const requiredContracts = ['EthereumHTLC', 'BridgeController'];
  requiredContracts.forEach((contractName) => {
    if (!config.addresses[contractName]) {
      errors.push(`Missing address for ${contractName}`);
    }
  });

  // Check network configuration
  if (!config.networkConfig.rpcUrl) {
    errors.push(`Missing RPC URL for network ${config.network}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    config,
  };
}

// Export configuration and utilities
module.exports = {
  ABIS,
  NETWORKS,
  getContractAddresses,
  getCurrentNetwork,
  getContractConfig,
  validateContractConfig,
  loadABI,
};

// Log configuration on startup
if (require.main !== module) {
  const validation = validateContractConfig();
  if (validation.isValid) {
    console.log(
      `✅ Contract configuration loaded for ${validation.config.network}`
    );
  } else {
    console.warn(`⚠️  Contract configuration issues:`, validation.errors);
  }
}
