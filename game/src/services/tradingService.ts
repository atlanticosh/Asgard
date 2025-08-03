import { ethers } from 'ethers';
import { web3Service } from './web3Service';

// 1inch API configuration
const ONEINCH_API_URL = 'https://api.1inch.dev/swap/v6.0';
const ONEINCH_API_KEY = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '';

// Uniswap V2 Router ABI (for basic swaps)
const UNISWAP_ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];

// Common token addresses (Ethereum Mainnet)
const TOKEN_ADDRESSES = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8', // Replace with actual USDC address
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
};

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  gasEstimate: string;
  route: any[];
}

export interface SwapTransaction {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  txHash: string;
  status: 'pending' | 'completed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
}

class TradingService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async initialize() {
    if (!this.provider) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
    }
  }

  // Get swap quote from 1inch API
  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: string
  ): Promise<SwapQuote> {
    try {
      // Try 1inch API first if key is available
      if (ONEINCH_API_KEY) {
        const response = await fetch(
          `${ONEINCH_API_URL}/quote?src=${fromToken}&dst=${toToken}&amount=${amount}&from=${fromAddress}`,
          {
            headers: {
              'Authorization': `Bearer ${ONEINCH_API_KEY}`,
              'Accept': 'application/json'
            }
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
            route: data.protocols || []
          };
        }
      }

      // Fallback: Use Uniswap V2 for basic swaps
      return await this.getUniswapQuote(fromToken, toToken, amount, fromAddress);
    } catch (error) {
      console.error('Error getting swap quote:', error);
      // Fallback to Uniswap V2
      return await this.getUniswapQuote(fromToken, toToken, amount, fromAddress);
    }
  }

  // Fallback: Get quote from Uniswap V2
  private async getUniswapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: string
  ): Promise<SwapQuote> {
    try {
      await this.initialize();

      const uniswapRouter = new ethers.Contract(
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
        UNISWAP_ROUTER_ABI,
        this.provider!
      );

      // Convert token symbols to addresses
      const fromAddress_contract = this.getTokenAddress(fromToken);
      const toAddress_contract = this.getTokenAddress(toToken);

      if (!fromAddress_contract || !toAddress_contract) {
        throw new Error('Unsupported token pair');
      }

      const path = [fromAddress_contract, toAddress_contract];
      const amountIn = ethers.parseUnits(amount, 18); // Assuming 18 decimals

      const amounts = await uniswapRouter.getAmountsOut(amountIn, path);
      const amountOut = ethers.formatUnits(amounts[1], 18);

      // Calculate price impact (simplified)
      const priceImpact = 0.5; // Mock value
      const gasEstimate = '150000'; // Estimated gas

      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: amountOut,
        priceImpact,
        gasEstimate,
        route: [['Uniswap V2', 100]] // Mock route
      };
    } catch (error) {
      console.error('Error getting Uniswap quote:', error);
      throw error;
    }
  }

  // Helper: Get token address from symbol
  private getTokenAddress(symbol: string): string | null {
    const addresses: { [key: string]: string } = {
      'ETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
    };
    return addresses[symbol] || null;
  }

  // Execute swap using 1inch API or fallback to Uniswap V2
  async executeSwap(
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1
  ): Promise<SwapTransaction> {
    try {
      await this.initialize();

      // Try 1inch API first if key is available
      if (ONEINCH_API_KEY) {
        try {
          const response = await fetch(
            `${ONEINCH_API_URL}/swap?src=${fromToken}&dst=${toToken}&amount=${amount}&from=${fromAddress}&slippage=${slippage}`,
            {
              headers: {
                'Authorization': `Bearer ${ONEINCH_API_KEY}`,
                'Accept': 'application/json'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            
            // Execute the transaction
            const tx = await this.signer!.sendTransaction({
              to: data.tx.to,
              data: data.tx.data,
              value: data.tx.value || '0x0',
              gasLimit: ethers.parseUnits(data.tx.gas, 'wei')
            });

            const receipt = await tx.wait();

            return {
              fromToken,
              toToken,
              fromAmount: amount,
              toAmount: '0', // Will be updated after transaction
              txHash: receipt!.hash,
              status: 'pending',
              gasUsed: receipt!.gasUsed?.toString(),
              gasPrice: receipt!.gasPrice?.toString()
            };
          }
        } catch (error) {
          console.log('1inch API failed, falling back to Uniswap V2');
        }
      }

      // Fallback: Use Uniswap V2 for basic swaps
      return await this.executeUniswapSwap(fromToken, toToken, amount, fromAddress, slippage);
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }

  // Fallback: Execute swap using Uniswap V2
  private async executeUniswapSwap(
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1
  ): Promise<SwapTransaction> {
    try {
      const fromAddress_contract = this.getTokenAddress(fromToken);
      const toAddress_contract = this.getTokenAddress(toToken);

      if (!fromAddress_contract || !toAddress_contract) {
        throw new Error('Unsupported token pair');
      }

      // Get quote first
      const quote = await this.getUniswapQuote(fromToken, toToken, amount, fromAddress);
      const minAmountOut = parseFloat(quote.toAmount) * (1 - slippage / 100);

      let tx;
      if (fromToken === 'ETH') {
        // ETH to Token swap
        tx = await this.swapEthForToken(toAddress_contract, amount, minAmountOut.toString());
      } else if (toToken === 'ETH') {
        // Token to ETH swap
        tx = await this.swapTokenForEth(fromAddress_contract, amount, minAmountOut.toString());
      } else {
        // Token to Token swap (via ETH)
        throw new Error('Token to Token swaps not supported in fallback mode');
      }

      return tx;
    } catch (error) {
      console.error('Error executing Uniswap swap:', error);
      throw error;
    }
  }

  // Simple ETH to Token swap using Uniswap V2
  async swapEthForToken(
    tokenAddress: string,
    ethAmount: string,
    minTokenAmount: string
  ): Promise<SwapTransaction> {
    try {
      await this.initialize();

      const uniswapRouter = new ethers.Contract(
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
        UNISWAP_ROUTER_ABI,
        this.signer!
      );

      const path = [TOKEN_ADDRESSES.WETH, tokenAddress];
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      const tx = await uniswapRouter.swapExactETHForTokens(
        ethers.parseUnits(minTokenAmount, 18),
        path,
        await this.signer!.getAddress(),
        deadline,
        { value: ethers.parseEther(ethAmount) }
      );

      const receipt = await tx.wait();

      return {
        fromToken: 'ETH',
        toToken: 'TOKEN',
        fromAmount: ethAmount,
        toAmount: minTokenAmount,
        txHash: receipt!.hash,
        status: 'pending',
        gasUsed: receipt!.gasUsed?.toString(),
        gasPrice: receipt!.gasPrice?.toString()
      };
    } catch (error) {
      console.error('Error swapping ETH for token:', error);
      throw error;
    }
  }

  // Simple Token to ETH swap using Uniswap V2
  async swapTokenForEth(
    tokenAddress: string,
    tokenAmount: string,
    minEthAmount: string
  ): Promise<SwapTransaction> {
    try {
      await this.initialize();

      const uniswapRouter = new ethers.Contract(
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
        UNISWAP_ROUTER_ABI,
        this.signer!
      );

      const path = [tokenAddress, TOKEN_ADDRESSES.WETH];
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      // First approve the router to spend tokens
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) external returns (bool)'],
        this.signer!
      );

      const approveTx = await tokenContract.approve(
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        ethers.parseUnits(tokenAmount, 18)
      );
      await approveTx.wait();

      // Then execute the swap
      const tx = await uniswapRouter.swapExactTokensForETH(
        ethers.parseUnits(tokenAmount, 18),
        ethers.parseEther(minEthAmount),
        path,
        await this.signer!.getAddress(),
        deadline
      );

      const receipt = await tx.wait();

      return {
        fromToken: 'TOKEN',
        toToken: 'ETH',
        fromAmount: tokenAmount,
        toAmount: minEthAmount,
        txHash: receipt!.hash,
        status: 'pending',
        gasUsed: receipt!.gasUsed?.toString(),
        gasPrice: receipt!.gasPrice?.toString()
      };
    } catch (error) {
      console.error('Error swapping token for ETH:', error);
      throw error;
    }
  }

  // Get token price from 1inch API
  async getTokenPrice(tokenAddress: string): Promise<number> {
    try {
      const response = await fetch(
        `${ONEINCH_API_URL}/quote?src=${tokenAddress}&dst=${TOKEN_ADDRESSES.USDC}&amount=1000000000000000000`, // 1 token
        {
          headers: {
            'Authorization': `Bearer ${ONEINCH_API_KEY}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get token price');
      }

      const data = await response.json();
      return parseFloat(data.toTokenAmount) / 1000000; // USDC has 6 decimals
    } catch (error) {
      console.error('Error getting token price:', error);
      return 0;
    }
  }

  // Monitor transaction status
  async getTransactionStatus(txHash: string): Promise<'pending' | 'completed' | 'failed'> {
    try {
      await this.initialize();
      
      const receipt = await this.provider!.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return 'pending';
      }
      
      return receipt.status === 1 ? 'completed' : 'failed';
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return 'failed';
    }
  }

  // Get gas price estimate
  async getGasPrice(): Promise<string> {
    try {
      await this.initialize();
      const gasPrice = await this.provider!.getFeeData();
      return gasPrice.gasPrice?.toString() || '0';
    } catch (error) {
      console.error('Error getting gas price:', error);
      return '0';
    }
  }
}

export const tradingService = new TradingService(); 