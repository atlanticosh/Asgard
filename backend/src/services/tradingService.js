const { ethers } = require('ethers');
const logger = require('../utils/logger');

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

// Token addresses (Ethereum Mainnet)
const TOKEN_ADDRESSES = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
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
      // Get quote first
      const quote = await this.getSwapQuote(
        fromToken,
        toToken,
        amount,
        fromAddress
      );

      // For now, return a simulated transaction
      // In production, you would execute the actual transaction here
      const txHash =
        '0x' +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: quote.toAmount,
        txHash,
        status: 'pending',
        gasUsed: '150000',
        gasPrice: '20000000000', // 20 gwei
        quote,
        source: quote.source,
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
    return (
      supportedTokens.includes(fromToken) && supportedTokens.includes(toToken)
    );
  }
}

module.exports = TradingService;
