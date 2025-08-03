const axios = require('axios');
const { ethers } = require('ethers');
const logger = require('../utils/logger');

class RealTradingService {
  constructor() {
    this.apiKey = process.env.ONEINCH_API_KEY;
    this.baseUrl = process.env.ONEINCH_BASE_URL || 'https://api.1inch.dev';
    this.provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://sepolia.base.org'
    );
    this.wallet = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('ONEINCH_API_KEY not configured');
      }

      const privateKey = process.env.ETHEREUM_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('ETHEREUM_PRIVATE_KEY not configured');
      }

      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.isInitialized = true;

      logger.info('Real Trading service initialized', {
        address: this.wallet.address,
        network: 'base-sepolia',
      });
    } catch (error) {
      logger.error('Failed to initialize Real Trading service', error);
      throw error;
    }
  }

  // Get swap quote from 1inch
  async getSwapQuote(fromToken, toToken, amount, fromAddress) {
    try {
      const response = await axios.get(`${this.baseUrl}/swap/v6.0/1/quote`, {
        params: {
          src: fromToken,
          dst: toToken,
          amount: amount,
          from: fromAddress,
          slippage: 1, // 1% slippage
          disableEstimate: false,
          allowPartialFill: false,
        },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      logger.error('1inch quote error:', error.response?.data || error.message);
      throw new Error(
        `Failed to get swap quote: ${
          error.response?.data?.description || error.message
        }`
      );
    }
  }

  // Execute swap using 1inch
  async executeSwap(fromToken, toToken, amount, fromAddress, slippage = 1) {
    try {
      this._checkInitialized();

      // Get quote first
      const quote = await this.getSwapQuote(
        fromToken,
        toToken,
        amount,
        fromAddress
      );

      // Get swap transaction data
      const swapResponse = await axios.get(`${this.baseUrl}/swap/v6.0/1/swap`, {
        params: {
          src: fromToken,
          dst: toToken,
          amount: amount,
          from: fromAddress,
          slippage: slippage,
          disableEstimate: false,
          allowPartialFill: false,
        },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
      });

      const swapData = swapResponse.data;

      // Execute the transaction
      const tx = {
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value,
        gasLimit: ethers.parseUnits(swapData.tx.gas, 'wei'),
        gasPrice: await this.provider.getFeeData().then((fee) => fee.gasPrice),
      };

      // Send transaction
      const transaction = await this.wallet.sendTransaction(tx);
      const receipt = await transaction.wait();

      logger.info('Real swap executed successfully', {
        fromToken,
        toToken,
        amount,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });

      return {
        success: true,
        txHash: receipt.hash,
        fromToken,
        toToken,
        amount,
        estimatedAmount: quote.toTokenAmount,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice.toString(),
        protocol: '1inch',
        explorerUrl: `https://sepolia.basescan.org/tx/${receipt.hash}`,
      };
    } catch (error) {
      logger.error('Real swap execution failed:', error);
      throw error;
    }
  }

  // Get token prices from 1inch
  async getTokenPrices(tokens) {
    try {
      const prices = {};

      for (const token of tokens) {
        try {
          // Get price relative to USDC
          const response = await axios.get(
            `${this.baseUrl}/swap/v6.0/1/quote`,
            {
              params: {
                src: token,
                dst: '0xA0b86a33E6441b8c4C8C0C8C0C8C0C8C0C8C0C8C', // USDC on Base Sepolia
                amount: ethers.parseUnits('1', 18).toString(),
                from: this.wallet.address,
                slippage: 1,
                disableEstimate: true,
              },
              headers: {
                Authorization: `Bearer ${this.apiKey}`,
                Accept: 'application/json',
              },
            }
          );

          prices[token] = {
            price: response.data.toTokenAmount,
            timestamp: Date.now(),
          };
        } catch (error) {
          logger.warn(`Failed to get price for token ${token}:`, error.message);
          prices[token] = { price: '0', timestamp: Date.now() };
        }
      }

      return prices;
    } catch (error) {
      logger.error('Failed to get token prices:', error);
      throw error;
    }
  }

  // Get supported tokens from 1inch
  async getSupportedTokens() {
    try {
      const response = await axios.get(`${this.baseUrl}/swap/v6.0/1/tokens`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
      });

      return response.data.tokens;
    } catch (error) {
      logger.error('Failed to get supported tokens:', error);
      throw error;
    }
  }

  // Get swap history for an address
  async getSwapHistory(address, limit = 10) {
    try {
      // This would typically come from 1inch API or blockchain events
      // For now, return mock data
      return {
        swaps: [],
        total: 0,
        address,
      };
    } catch (error) {
      logger.error('Failed to get swap history:', error);
      throw error;
    }
  }

  _checkInitialized() {
    if (!this.isInitialized) {
      throw new Error('Real Trading service not initialized');
    }
  }
}

module.exports = RealTradingService;
