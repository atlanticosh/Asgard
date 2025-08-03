import { ethers } from 'ethers';

// ERC-20 Token ABI for reading balances
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

// Common token addresses (Ethereum Mainnet)
const TOKEN_ADDRESSES = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USD Coin
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Wrapped Ether
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // Dai Stablecoin
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Tether USD
  LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA', // Chainlink
  UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // Uniswap
  AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // Aave
  MATIC: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608aCafEBB0', // Polygon
  CRV: '0xD533a949740bb3306d119CC777fa900bA034cd52', // Curve DAO Token
  COMP: '0xc00e94Cb662C3520282E6f5717214004A7f26888' // Compound
};

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  contractAddress: string;
  value: number;
  change24h: number;
  icon: string;
  chain: string;
}

export interface WalletData {
  address: string;
  ethBalance: string;
  ethValue: number;
  tokens: TokenBalance[];
  totalValue: number;
}

class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connectWallet(): Promise<string> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      return accounts[0];
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  async getWalletData(address: string): Promise<WalletData> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get ETH balance
      const ethBalance = await this.provider.getBalance(address);
      const ethValue = await this.getEthPrice() * parseFloat(ethers.formatEther(ethBalance));

      // Get token balances
      const tokens = await this.getTokenBalances(address);

      // Calculate total value
      const totalValue = ethValue + tokens.reduce((sum, token) => sum + token.value, 0);

      return {
        address,
        ethBalance: ethers.formatEther(ethBalance),
        ethValue,
        tokens,
        totalValue
      };
    } catch (error) {
      console.error('Error getting wallet data:', error);
      throw error;
    }
  }

  private async getTokenBalances(address: string): Promise<TokenBalance[]> {
    const tokens: TokenBalance[] = [];

    for (const [symbol, contractAddress] of Object.entries(TOKEN_ADDRESSES)) {
      try {
        const contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider!);
        
        const [balance, decimals, name] = await Promise.all([
          contract.balanceOf(address),
          contract.decimals(),
          contract.name()
        ]);

        const formattedBalance = ethers.formatUnits(balance, decimals);
        
        // Skip if balance is 0
        if (parseFloat(formattedBalance) === 0) continue;

        // Get token price and 24h change
        const price = await this.getTokenPrice(symbol);
        const change24h = await this.getToken24hChange(symbol);
        const value = parseFloat(formattedBalance) * price;

        tokens.push({
          symbol,
          name,
          balance: formattedBalance,
          decimals,
          contractAddress,
          value,
          change24h,
          icon: this.getTokenIcon(symbol),
          chain: 'ethereum'
        });
      } catch (error) {
        console.error(`Error getting ${symbol} balance:`, error);
      }
    }

    return tokens;
  }

  private async getEthPrice(): Promise<number> {
    try {
      // Using CoinGecko API for price data
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.error('Error getting ETH price:', error);
      return 2500; // Fallback price
    }
  }

  private async getTokenPrice(symbol: string): Promise<number> {
    try {
      const tokenIds = {
        'USDC': 'usd-coin',
        'WETH': 'weth',
        'DAI': 'dai',
        'USDT': 'tether',
        'LINK': 'chainlink',
        'UNI': 'uniswap',
        'AAVE': 'aave',
        'MATIC': 'matic-network',
        'CRV': 'curve-dao-token',
        'COMP': 'compound-governance-token'
      };

      const tokenId = tokenIds[symbol as keyof typeof tokenIds];
      if (!tokenId) return 0;

      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`);
      const data = await response.json();
      return data[tokenId].usd;
    } catch (error) {
      console.error(`Error getting ${symbol} price:`, error);
      return 0;
    }
  }

  private async getToken24hChange(symbol: string): Promise<number> {
    try {
      const tokenIds = {
        'USDC': 'usd-coin',
        'WETH': 'weth',
        'DAI': 'dai',
        'USDT': 'tether',
        'LINK': 'chainlink',
        'UNI': 'uniswap',
        'AAVE': 'aave',
        'MATIC': 'matic-network',
        'CRV': 'curve-dao-token',
        'COMP': 'compound-governance-token'
      };

      const tokenId = tokenIds[symbol as keyof typeof tokenIds];
      if (!tokenId) return 0;

      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=1`);
      const data = await response.json();
      
      if (data.prices && data.prices.length >= 2) {
        const currentPrice = data.prices[data.prices.length - 1][1];
        const previousPrice = data.prices[0][1];
        return ((currentPrice - previousPrice) / previousPrice) * 100;
      }
      
      return 0;
    } catch (error) {
      console.error(`Error getting ${symbol} 24h change:`, error);
      return 0;
    }
  }

  private getTokenIcon(symbol: string): string {
    const icons: { [key: string]: string } = {
      'ETH': '🔵',
      'WETH': '🔵',
      'USDC': '💙',
      'DAI': '🟡',
      'USDT': '🟢',
      'LINK': '🔗',
      'UNI': '🦄',
      'AAVE': '👻',
      'MATIC': '💜',
      'CRV': '🔄',
      'COMP': '🏦',
      'XLM': '⭐'
    };
    return icons[symbol] || '🪙';
  }

  async sendTransaction(transaction: {
    to: string;
    value?: string;
    data?: string;
  }) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.signer.sendTransaction(transaction);
      return await tx.wait();
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      return await this.signer.signMessage(message);
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  async getNetwork(): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const network = await this.provider.getNetwork();
      return network.name;
    } catch (error) {
      console.error('Error getting network:', error);
      return 'unknown';
    }
  }
}

export const web3Service = new Web3Service(); 