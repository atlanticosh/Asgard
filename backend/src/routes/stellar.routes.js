const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Service registry - will be injected
let stellarService = null;

// Function to inject stellar service
function setStellarService(service) {
  stellarService = service;
}

// Middleware to get stellar service instance
const getStellarService = (req, res, next) => {
  if (!stellarService) {
    return res
      .status(500)
      .json({ success: false, error: 'Stellar service not available' });
  }
  req.stellarService = stellarService;
  next();
};

/**
 * @route GET /api/stellar/health
 * @desc Get Stellar service health status
 * @access Public
 */
router.get('/health', getStellarService, async (req, res) => {
  try {
    const health = await req.stellarService.healthCheck();
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error('Stellar health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Stellar service health check failed',
    });
  }
});

/**
 * @route GET /api/stellar/balance
 * @desc Get Stellar account balance
 * @access Public
 */
router.get('/balance', getStellarService, async (req, res) => {
  try {
    const balance = await req.stellarService.getBalance();
    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    logger.error('Failed to get Stellar balance', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get Stellar balance',
    });
  }
});

/**
 * @route POST /api/stellar/create-account
 * @desc Create new Stellar account (for testing)
 * @access Public
 */
router.post('/create-account', getStellarService, async (req, res) => {
  try {
    const account = await req.stellarService.createAccount();
    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    logger.error('Failed to create Stellar account', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create Stellar account',
    });
  }
});

/**
 * @route POST /api/stellar/create-htlc
 * @desc Create HTLC on Stellar
 * @access Public
 */
router.post('/create-htlc', getStellarService, async (req, res) => {
  try {
    const {
      contractId,
      participant,
      amount,
      hashlock,
      timelock,
      asset = 'XLM',
    } = req.body;

    // Validate required fields
    if (!contractId || !participant || !amount || !hashlock || !timelock) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: contractId, participant, amount, hashlock, timelock',
      });
    }

    const result = await req.stellarService.createHTLC({
      contractId,
      participant,
      amount,
      hashlock,
      timelock,
      asset,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to create Stellar HTLC', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create Stellar HTLC',
    });
  }
});

/**
 * @route POST /api/stellar/withdraw-htlc
 * @desc Withdraw HTLC with preimage
 * @access Public
 */
router.post('/withdraw-htlc', getStellarService, async (req, res) => {
  try {
    const { contractId, preimage } = req.body;

    if (!contractId || !preimage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractId, preimage',
      });
    }

    const result = await req.stellarService.withdrawHTLC(contractId, preimage);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to withdraw Stellar HTLC', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw Stellar HTLC',
    });
  }
});

/**
 * @route POST /api/stellar/refund-htlc
 * @desc Refund expired HTLC
 * @access Public
 */
router.post('/refund-htlc', getStellarService, async (req, res) => {
  try {
    const { contractId } = req.body;

    if (!contractId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: contractId',
      });
    }

    const result = await req.stellarService.refundHTLC(contractId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to refund Stellar HTLC', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to refund Stellar HTLC',
    });
  }
});

/**
 * @route GET /api/stellar/test
 * @desc Test Stellar service functionality
 * @access Public
 */
router.get('/test', getStellarService, async (req, res) => {
  try {
    // Test basic functionality
    const health = await req.stellarService.healthCheck();
    const balance = await req.stellarService.getBalance();

    res.json({
      success: true,
      message: 'Stellar service test completed',
      data: {
        health,
        balance,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Stellar service test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Stellar service test failed',
    });
  }
});

module.exports = { router, setStellarService };
