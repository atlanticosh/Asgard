const express = require('express');
const router = express.Router();
const BridgeService = require('../services/bridgeService');
const logger = require('../utils/logger');

// Initialize bridge service
const bridgeService = new BridgeService();

// Function to inject ethereum service
function setEthereumService(service) {
  ethereumService = service;
}

function setCoordinatorService(service) {
  coordinatorService = service;
}

// Middleware to get ethereum service instance
const getEthereumService = (req, res, next) => {
  if (!ethereumService) {
    return res.status(503).json({
      success: false,
      error: 'Ethereum service not available',
    });
  }
  req.ethereumService = ethereumService;
  next();
};

const getCoordinatorService = (req, res, next) => {
  if (!coordinatorService) {
    return res.status(503).json({
      success: false,
      error: 'Bridge coordinator service not available',
    });
  }
  req.coordinatorService = coordinatorService;
  next();
};

/**
 * POST /api/bridge/quote - Get quote for bridge swap
 */
router.post('/quote', async (req, res) => {
  try {
    const { fromChain, toChain, fromToken, amount } = req.body;
    logger.info('Bridge quote request received', { body: req.body });

    // Validate required parameters
    if (!fromChain || !toChain || !fromToken || !amount) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required parameters: fromChain, toChain, fromToken, amount',
      });
    }

    // Get bridge quote
    const quote = await bridgeService.getBridgeQuote(
      fromChain,
      toChain,
      fromToken,
      amount
    );

    res.json({
      success: true,
      quote,
    });
  } catch (error) {
    logger.error('Bridge quote error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/bridge/initiate - Initiate bridge swap
 */
router.post('/initiate', async (req, res) => {
  try {
    const { fromChain, toChain, fromToken, amount, toAddress } = req.body;
    logger.info('Bridge initiate request received', { body: req.body });

    // Validate required parameters
    if (!fromChain || !toChain || !fromToken || !amount || !toAddress) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required parameters: fromChain, toChain, fromToken, amount, toAddress',
      });
    }

    // Validate bridge parameters
    const errors = bridgeService.validateBridgeParams(
      fromChain,
      toChain,
      fromToken,
      amount,
      toAddress
    );
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join(', '),
      });
    }

    // Execute bridge
    const result = await bridgeService.executeBridge(
      fromChain,
      toChain,
      fromToken,
      amount,
      toAddress
    );

    res.json({
      success: true,
      transaction: result,
    });
  } catch (error) {
    logger.error('Bridge initiate error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bridge/status/:txHash - Get bridge transaction status
 */
router.get('/status/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    logger.info('Bridge status request received', { txHash });

    const status = await bridgeService.getBridgeStatus(txHash);
    const timestamp = parseInt(txHash.substring(2, 18), 16);
    const elapsed = Date.now() - timestamp;

    res.json({
      success: true,
      txHash,
      status,
      timestamp,
      elapsed,
      estimatedTime: '10-20 minutes',
      progress:
        status === 'pending' ? '25%' : status === 'processing' ? '75%' : '100%',
    });
  } catch (error) {
    logger.error('Bridge status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/bridge/complete - Complete bridge swap
 */
router.post('/complete', async (req, res) => {
  try {
    logger.info('Bridge complete request received', { body: req.body });

    res.json({
      success: true,
      message: 'Bridge complete endpoint - NOT YET IMPLEMENTED',
      status: 'stub',
    });
  } catch (error) {
    logger.error('Bridge complete error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bridge/test - Test contract interactions (development only)
 */
router.get('/test', getEthereumService, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({
        success: false,
        error: 'Test endpoint not available in production',
      });
    }

    logger.info('Testing contract interactions...');

    // Test contract interactions
    const testResults = await req.ethereumService.testContractInteractions();

    // Get network info
    const networkInfo = await req.ethereumService.getNetworkInfo();

    // Get current block
    const currentBlock = await req.ethereumService.getCurrentBlock();

    res.json({
      success: true,
      message: 'Contract interaction test completed',
      data: {
        network: networkInfo,
        currentBlock,
        contracts: testResults,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Contract test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bridge/contracts - Get contract information
 */
router.get('/contracts', getEthereumService, async (req, res) => {
  try {
    const config = req.ethereumService.config;

    res.json({
      success: true,
      message: 'Contract information retrieved',
      data: {
        network: config.network,
        chainId: config.networkConfig.chainId,
        addresses: config.addresses,
        contracts: Object.keys(config.contracts).reduce((acc, key) => {
          acc[key] = {
            address: config.contracts[key].address,
            hasABI: !!config.contracts[key].abi,
          };
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    logger.error('Contract info error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test HTLC creation on Ethereum
router.post('/test-htlc', getEthereumService, async (req, res) => {
  try {
    const { contractId, participant, amount, hashlock, timelock, asset } =
      req.body;

    if (!contractId || !participant || !amount || !hashlock || !timelock) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: contractId, participant, amount, hashlock, timelock',
      });
    }

    // Convert contractId to bytes32 if it's a string
    const ethers = require('ethers');
    const hashedContractId = ethers.keccak256(ethers.toUtf8Bytes(contractId));

    let result;
    if (asset === 'ETH') {
      result = await req.ethereumService.createHTLCForETH({
        contractId: hashedContractId,
        participant,
        amount,
        hashlock,
        timelock,
        stellarAddress:
          'GCLTXZ72C6SXZT73NW4SAMHE7RJXOY2B7N66UMX7MMIUEAJBDW752JTN',
      });
    } else {
      result = await req.ethereumService.createHTLCForToken({
        contractId: hashedContractId,
        participant,
        tokenAddress: req.ethereumService.config.addresses.MockUSDC,
        amount,
        hashlock,
        timelock,
        stellarAddress:
          'GCLTXZ72C6SXZT73NW4SAMHE7RJXOY2B7N66UMX7MMIUEAJBDW752JTN',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to create Ethereum HTLC', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create Ethereum HTLC',
    });
  }
});

// Get HTLC details
router.get('/htlc/:contractId', getEthereumService, async (req, res) => {
  try {
    const { contractId } = req.params;

    if (!contractId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: contractId',
      });
    }

    const result = await req.ethereumService.getHTLCDetails(contractId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to get HTLC details', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get HTLC details',
    });
  }
});

// Withdraw HTLC on Ethereum
router.post('/withdraw-htlc', getEthereumService, async (req, res) => {
  try {
    const { contractId, preimage } = req.body;

    if (!contractId || !preimage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractId, preimage',
      });
    }

    // Convert contractId to bytes32 if it's a string
    const ethers = require('ethers');
    const hashedContractId = ethers.keccak256(ethers.toUtf8Bytes(contractId));

    const result = await req.ethereumService.withdrawHTLC(
      hashedContractId,
      preimage
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to withdraw Ethereum HTLC', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw Ethereum HTLC',
    });
  }
});

/**
 * @route POST /api/bridge/initiate-swap
 * @desc Initiate a cross-chain swap
 * @access Public
 */
router.post('/initiate-swap', getCoordinatorService, async (req, res) => {
  try {
    const {
      swapId,
      fromChain,
      toChain,
      fromAsset,
      toAsset,
      fromAmount,
      toAmount,
      fromAddress,
      toAddress,
      timelock,
    } = req.body;

    if (
      !swapId ||
      !fromChain ||
      !toChain ||
      !fromAsset ||
      !toAsset ||
      !fromAmount ||
      !toAmount ||
      !fromAddress ||
      !toAddress
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: swapId, fromChain, toChain, fromAsset, toAsset, fromAmount, toAmount, fromAddress, toAddress',
      });
    }

    const result = await req.coordinatorService.initiateSwap({
      swapId,
      fromChain,
      toChain,
      fromAsset,
      toAsset,
      fromAmount,
      toAmount,
      fromAddress,
      toAddress,
      timelock,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to initiate swap', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to initiate swap',
    });
  }
});

/**
 * @route POST /api/bridge/create-source-htlc
 * @desc Create HTLC on source chain
 * @access Public
 */
router.post('/create-source-htlc', getCoordinatorService, async (req, res) => {
  try {
    const { swapId } = req.body;

    if (!swapId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: swapId',
      });
    }

    const result = await req.coordinatorService.createSourceHTLC(swapId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to create source HTLC', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create source HTLC',
    });
  }
});

/**
 * @route POST /api/bridge/create-destination-htlc
 * @desc Create HTLC on destination chain
 * @access Public
 */
router.post(
  '/create-destination-htlc',
  getCoordinatorService,
  async (req, res) => {
    try {
      const { swapId } = req.body;

      if (!swapId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: swapId',
        });
      }

      const result = await req.coordinatorService.createDestinationHTLC(swapId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to create destination HTLC', {
        error: error.message,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to create destination HTLC',
      });
    }
  }
);

/**
 * @route POST /api/bridge/complete-swap
 * @desc Complete a swap by withdrawing from destination HTLC
 * @access Public
 */
router.post('/complete-swap', getCoordinatorService, async (req, res) => {
  try {
    const { swapId } = req.body;

    if (!swapId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: swapId',
      });
    }

    const result = await req.coordinatorService.completeSwap(swapId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to complete swap', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to complete swap',
    });
  }
});

/**
 * @route POST /api/bridge/refund-swap
 * @desc Refund a swap from source HTLC
 * @access Public
 */
router.post('/refund-swap', getCoordinatorService, async (req, res) => {
  try {
    const { swapId } = req.body;

    if (!swapId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: swapId',
      });
    }

    const result = await req.coordinatorService.refundSwap(swapId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to refund swap', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to refund swap',
    });
  }
});

/**
 * @route GET /api/bridge/swap/:swapId
 * @desc Get swap details
 * @access Public
 */
router.get('/swap/:swapId', getCoordinatorService, async (req, res) => {
  try {
    const { swapId } = req.params;

    const result = req.coordinatorService.getSwap(swapId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to get swap details', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get swap details',
    });
  }
});

/**
 * @route GET /api/bridge/swaps
 * @desc Get all swaps
 * @access Public
 */
router.get('/swaps', getCoordinatorService, async (req, res) => {
  try {
    const result = req.coordinatorService.getAllSwaps();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to get swaps', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get swaps',
    });
  }
});

/**
 * @route GET /api/bridge/health
 * @desc Get bridge coordinator health status
 * @access Public
 */
router.get('/health', getCoordinatorService, async (req, res) => {
  try {
    const result = await req.coordinatorService.healthCheck();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to get bridge health', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get bridge health',
    });
  }
});

module.exports = { router, setEthereumService, setCoordinatorService };
