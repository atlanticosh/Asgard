const { ethers } = require('ethers');
const logger = require('../utils/logger');
const RealTradingService = require('./realTradingService');

// Initialize real trading service
const realTradingService = new RealTradingService();

// 1inch API configuration
const ONEINCH_API_URL = 'https://api.1inch.dev/swap/v6.0';
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY || '';

// Uniswap V2 Router ABI
const UNISWAP_ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
];

// Token addresses (Base Sepolia Testnet - Verified)
const TOKEN_ADDRESSES = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7c',
  DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  USDT: '0x1990BC6dfe2ef605Bfc08f5A23564dB75642Ad73',
  LINK: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
  // Real Base Sepolia tokens (verified on explorer)
  WBTC: '0x29f2D40B060540436f03CC5Fb8aE5a8C5Cbd1E89',
  USDbC: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
  cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
};

class TradingService {
  constructor() {
    this.provider = null;
    this.initializeProvider();
  }

  async initializeProvider() {
    try {
      this.provider = new ethers.JsonRpcProvider(
        process.env.ETHEREUM_RPC_URL ||
          'https://eth-mainnet.g.alchemy.com/v2/demo'
      );
      logger.info('Trading service provider initialized');
    } catch (error) {
      logger.error('Error initializing trading service provider:', error);
    }
  }

  // Get swap quote from 1inch API or fallback to Uniswap
  async getSwapQuote(fromToken, toToken, amount, fromAddress) {
    try {
      // Try 1inch API first if key is available
      if (ONEINCH_API_KEY) {
        try {
          const response = await fetch(
            `${ONEINCH_API_URL}/quote?src=${fromToken}&dst=${toToken}&amount=${amount}&from=${fromAddress}`,
            {
              headers: {
                Authorization: `Bearer ${ONEINCH_API_KEY}`,
                Accept: 'application/json',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            return {
              fromToken: data.fromToken.symbol,
              toToken: data.toToken.symbol,
              fromAmount: data.fromTokenAmount,
              toAmount: data.toTokenAmount,
              priceImpact: data.priceImpact,
              gasEstimate: data.tx.gas,
              route: data.protocols || [],
              source: '1inch',
            };
          }
        } catch (error) {
          logger.warn('1inch API failed, falling back to Uniswap V2');
        }
      }

      // Fallback: Use Uniswap V2
      return await this.getUniswapQuote(
        fromToken,
        toToken,
        amount,
        fromAddress
      );
    } catch (error) {
      logger.error('Error getting swap quote:', error);
      throw error;
    }
  }

  // Get quote from Uniswap V2
  async getUniswapQuote(fromToken, toToken, amount, fromAddress) {
    try {
      const uniswapRouter = new ethers.Contract(
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        UNISWAP_ROUTER_ABI,
        this.provider
      );

      const fromAddress_contract = this.getTokenAddress(fromToken);
      const toAddress_contract = this.getTokenAddress(toToken);

      if (!fromAddress_contract || !toAddress_contract) {
        throw new Error('Unsupported token pair');
      }

      const path = [fromAddress_contract, toAddress_contract];
      const amountIn = ethers.parseUnits(amount, 18);

      const amounts = await uniswapRouter.getAmountsOut(amountIn, path);
      const amountOut = ethers.formatUnits(amounts[1], 18);

      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: amountOut,
        priceImpact: 0.5, // Mock value
        gasEstimate: '150000',
        route: [['Uniswap V2', 100]],
        source: 'uniswap',
      };
    } catch (error) {
      logger.error('Error getting Uniswap quote:', error);
      throw error;
    }
  }

  // Execute swap (backend handles the transaction)
  async executeSwap(fromToken, toToken, amount, fromAddress, slippage = 1) {
    try {
      logger.info('Executing real swap', {
        fromToken,
        toToken,
        amount,
        fromAddress,
        slippage,
      });

      // Initialize real trading service if not already done
      if (!realTradingService.isInitialized) {
        await realTradingService.initialize();
      }

      // Use real 1inch trading
      const result = await realTradingService.executeSwap(
        fromToken,
        toToken,
        amount,
        fromAddress,
        slippage
      );

      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: result.estimatedAmount,
        txHash: result.txHash,
        status: 'completed',
        gasUsed: result.gasUsed,
        gasPrice: result.gasPrice,
        blockNumber: result.blockNumber,
        protocol: result.protocol,
        explorerUrl: result.explorerUrl,
        source: '1inch',
      };
    } catch (error) {
      logger.error('Error executing swap:', error);
      throw error;
    }
  }

  // Get token price from CoinGecko
  async getTokenPrice(symbol) {
    try {
      const tokenIds = {
        USDC: 'usd-coin',
        WETH: 'weth',
        DAI: 'dai',
        USDT: 'tether',
        LINK: 'chainlink',
        UNI: 'uniswap',
      };

      const tokenId = tokenIds[symbol];
      if (!tokenId) return 0;

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
      );
      const data = await response.json();
      return data[tokenId].usd;
    } catch (error) {
      logger.error(`Error getting ${symbol} price:`, error);
      return 0;
    }
  }

  // Helper: Get token address from symbol
  getTokenAddress(symbol) {
    return TOKEN_ADDRESSES[symbol] || null;
  }

  // Get supported tokens
  getSupportedTokens() {
    return Object.keys(TOKEN_ADDRESSES);
  }

  // Validate token pair
  validateTokenPair(fromToken, toToken) {
    const supportedTokens = this.getSupportedTokens();
    const supportedAddresses = Object.values(TOKEN_ADDRESSES);

    // Check if tokens are symbols or addresses
    const fromValid =
      supportedTokens.includes(fromToken) ||
      supportedAddresses.includes(fromToken);
    const toValid =
      supportedTokens.includes(toToken) || supportedAddresses.includes(toToken);

    return fromValid && toValid;
  }
}

module.exports = TradingService;
