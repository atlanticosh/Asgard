const express = require('express');
const router = express.Router();
const TradingService = require('../services/tradingService');
const logger = require('../utils/logger');

// Initialize trading service
const tradingService = new TradingService();

/**
 * GET /api/trading/quote - Get swap quote
 */
router.get('/quote', async (req, res) => {
  try {
    const { fromToken, toToken, amount, fromAddress } = req.query;

    // Validate required parameters
    if (!fromToken || !toToken || !amount || !fromAddress) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required parameters: fromToken, toToken, amount, fromAddress',
      });
    }

    // Validate token pair
    if (!tradingService.validateTokenPair(fromToken, toToken)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported token pair',
      });
    }

    // Get quote
    const quote = await tradingService.getSwapQuote(
      fromToken,
      toToken,
      amount,
      fromAddress
    );

    res.json({
      success: true,
      quote,
    });
  } catch (error) {
    logger.error('Trading quote error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/trading/swap - Execute swap
 */
router.post('/swap', async (req, res) => {
  try {
    const { fromToken, toToken, amount, fromAddress, slippage = 1 } = req.body;

    // Validate required parameters
    if (!fromToken || !toToken || !amount || !fromAddress) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required parameters: fromToken, toToken, amount, fromAddress',
      });
    }

    // Validate token pair
    if (!tradingService.validateTokenPair(fromToken, toToken)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported token pair',
      });
    }

    // Execute swap
    const result = await tradingService.executeSwap(
      fromToken,
      toToken,
      amount,
      fromAddress,
      slippage
    );

    res.json({
      success: true,
      transaction: result,
    });
  } catch (error) {
    logger.error('Trading swap error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trading/tokens - Get supported tokens
 */
router.get('/tokens', async (req, res) => {
  try {
    const tokens = tradingService.getSupportedTokens();

    res.json({
      success: true,
      tokens,
    });
  } catch (error) {
    logger.error('Get tokens error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trading/price/:symbol - Get token price
 */
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = await tradingService.getTokenPrice(symbol);

    res.json({
      success: true,
      symbol,
      price,
    });
  } catch (error) {
    logger.error('Get token price error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trading/status/:txHash - Get transaction status
 */
router.get('/status/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    // In production, you would check the actual transaction status
    // For now, return a mock status
    const status = 'pending';

    res.json({
      success: true,
      txHash,
      status,
    });
  } catch (error) {
    logger.error('Get transaction status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
