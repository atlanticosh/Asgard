// Centralized API service for backend communication

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  gasEstimate: string;
  route: any[];
  source: string;
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
  quote?: SwapQuote;
  source?: string;
}

export interface BridgeQuote {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  estimatedAmount: string;
  fee: string;
  estimatedTime: string;
  protocol: string;
  protocolKey: string;
}

export interface BridgeTransaction {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  estimatedAmount: string;
  txHash: string;
  status: 'pending' | 'completed' | 'failed';
  protocol: string;
  estimatedTime: string;
  fee: string;
}

class ApiService {
  private baseUrl = '/api';

  // Trading APIs
  async getSwapQuote(fromToken: string, toToken: string, amount: string, fromAddress: string): Promise<SwapQuote> {
    try {
      const response = await fetch(
        `${this.baseUrl}/trading/quote?fromToken=${fromToken}&toToken=${toToken}&amount=${amount}&fromAddress=${fromAddress}`
      );

      if (!response.ok) {
        throw new Error('Failed to get swap quote');
      }

      const data = await response.json();
      return data.quote;
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw error;
    }
  }

  async executeSwap(fromToken: string, toToken: string, amount: string, fromAddress: string, slippage: number = 1): Promise<SwapTransaction> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount,
          fromAddress,
          slippage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute swap');
      }

      const data = await response.json();
      return data.transaction;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }

  async getSupportedTokens(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/tokens`);
      
      if (!response.ok) {
        throw new Error('Failed to get supported tokens');
      }

      const data = await response.json();
      return data.tokens;
    } catch (error) {
      console.error('Error getting supported tokens:', error);
      return [];
    }
  }

  async getTokenPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/price/${symbol}`);
      
      if (!response.ok) {
        throw new Error('Failed to get token price');
      }

      const data = await response.json();
      return data.price;
    } catch (error) {
      console.error('Error getting token price:', error);
      return 0;
    }
  }

  async getTransactionStatus(txHash: string): Promise<'pending' | 'completed' | 'failed'> {
    try {
      const response = await fetch(`${this.baseUrl}/trading/status/${txHash}`);
      
      if (!response.ok) {
        throw new Error('Failed to get transaction status');
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return 'failed';
    }
  }

  // Bridge APIs
  async getBridgeQuote(fromChain: string, toChain: string, fromToken: string, amount: string): Promise<BridgeQuote> {
    try {
      const response = await fetch(`${this.baseUrl}/bridge/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromChain,
          toChain,
          fromToken,
          amount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get bridge quote');
      }

      const data = await response.json();
      return data.quote;
    } catch (error) {
      console.error('Error getting bridge quote:', error);
      throw error;
    }
  }

  async executeBridge(fromChain: string, toChain: string, fromToken: string, amount: string, toAddress: string): Promise<BridgeTransaction> {
    try {
      const response = await fetch(`${this.baseUrl}/bridge/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromChain,
          toChain,
          fromToken,
          amount,
          toAddress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute bridge');
      }

      const data = await response.json();
      return data.transaction;
    } catch (error) {
      console.error('Error executing bridge:', error);
      throw error;
    }
  }

  async getBridgeStatus(txHash: string): Promise<'pending' | 'completed' | 'failed'> {
    try {
      const response = await fetch(`${this.baseUrl}/bridge/status/${txHash}`);
      
      if (!response.ok) {
        throw new Error('Failed to get bridge status');
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error getting bridge status:', error);
      return 'failed';
    }
  }

  // Profile APIs (already being used)
  async getProfileTokens(walletAddress: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/profile/tokens?address=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to get profile tokens');
      }

      const data = await response.json();
      return data.tokens || [];
    } catch (error) {
      console.error('Error getting profile tokens:', error);
      return [];
    }
  }

  async updateProfileTokens(walletAddress: string, tokens: any[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/profile/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          tokens
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating profile tokens:', error);
      return false;
    }
  }

  async getProfileTransactions(walletAddress: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/profile/transactions?address=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to get profile transactions');
      }

      const data = await response.json();
      return data.transactions || [];
    } catch (error) {
      console.error('Error getting profile transactions:', error);
      return [];
    }
  }

  async addProfileTransaction(transaction: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/profile/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction)
      });

      return response.ok;
    } catch (error) {
      console.error('Error adding profile transaction:', error);
      return false;
    }
  }

  async getProfileStats(walletAddress: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/profile/stats?address=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to get profile stats');
      }

      const data = await response.json();
      return data.stats || {};
    } catch (error) {
      console.error('Error getting profile stats:', error);
      return {};
    }
  }
}

export const apiService = new ApiService(); 