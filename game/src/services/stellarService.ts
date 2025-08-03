// Stellar service for cross-chain bridging and HTLC operations

export interface StellarBalance {
  asset: string;
  balance: string;
  limit?: string;
}

export interface StellarAccount {
  publicKey: string;
  secretKey: string;
  balance: StellarBalance[];
}

export interface HTLCParams {
  contractId: string;
  participant: string;
  amount: string;
  hashlock: string;
  timelock: number;
  asset?: string;
}

export interface HTLCResult {
  contractId: string;
  transactionHash: string;
  status: 'pending' | 'completed' | 'failed';
  amount: string;
  asset: string;
  hashlock: string;
  timelock: number;
  participant: string;
}

export interface WithdrawParams {
  contractId: string;
  preimage: string;
}

export interface RefundParams {
  contractId: string;
}

class StellarService {
  private baseUrl = '/api/stellar';

  // Health check
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (!response.ok) {
        throw new Error('Stellar service health check failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error checking Stellar health:', error);
      throw error;
    }
  }

  // Get Stellar balance
  async getBalance(): Promise<StellarBalance[]> {
    try {
      const response = await fetch(`${this.baseUrl}/balance`);
      
      if (!response.ok) {
        throw new Error('Failed to get Stellar balance');
      }

      const data = await response.json();
      return data.data.balances;
    } catch (error) {
      console.error('Error getting Stellar balance:', error);
      throw error;
    }
  }

  // Create Stellar account (for testing)
  async createAccount(): Promise<StellarAccount> {
    try {
      const response = await fetch(`${this.baseUrl}/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create Stellar account');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating Stellar account:', error);
      throw error;
    }
  }

  // Create HTLC for cross-chain bridging
  async createHTLC(params: HTLCParams): Promise<HTLCResult> {
    try {
      const response = await fetch(`${this.baseUrl}/create-htlc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('Failed to create Stellar HTLC');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating Stellar HTLC:', error);
      throw error;
    }
  }

  // Withdraw HTLC with preimage
  async withdrawHTLC(contractId: string, preimage: string): Promise<HTLCResult> {
    try {
      const response = await fetch(`${this.baseUrl}/withdraw-htlc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractId, preimage })
      });

      if (!response.ok) {
        throw new Error('Failed to withdraw Stellar HTLC');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error withdrawing Stellar HTLC:', error);
      throw error;
    }
  }

  // Refund expired HTLC
  async refundHTLC(contractId: string): Promise<HTLCResult> {
    try {
      const response = await fetch(`${this.baseUrl}/refund-htlc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractId })
      });

      if (!response.ok) {
        throw new Error('Failed to refund Stellar HTLC');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error refunding Stellar HTLC:', error);
      throw error;
    }
  }

  // Test Stellar service
  async testService(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/test`);
      
      if (!response.ok) {
        throw new Error('Stellar service test failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error testing Stellar service:', error);
      throw error;
    }
  }

  // Generate HTLC parameters for cross-chain bridging
  generateHTLCParams(
    contractId: string,
    participant: string,
    amount: string,
    asset: string = 'XLM',
    timelockMinutes: number = 30
  ): HTLCParams {
    // Generate a random hashlock (in production, this would be from the other chain)
    const hashlock = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Calculate timelock (current time + minutes)
    const timelock = Math.floor(Date.now() / 1000) + (timelockMinutes * 60);

    return {
      contractId,
      participant,
      amount,
      hashlock,
      timelock,
      asset
    };
  }

  // Generate preimage for HTLC withdrawal
  generatePreimage(): string {
    return '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Format XLM amount (convert from lumens to stroops)
  formatXLMAmount(amount: string): string {
    return (parseFloat(amount) * 10000000).toString(); // 1 XLM = 10,000,000 stroops
  }

  // Parse XLM amount (convert from stroops to lumens)
  parseXLMAmount(stroops: string): string {
    return (parseFloat(stroops) / 10000000).toString();
  }

  // Get Stellar network info
  getNetworkInfo() {
    return {
      network: 'testnet', // or 'public'
      horizonUrl: 'https://horizon-testnet.stellar.org',
      explorerUrl: 'https://stellar.expert/explorer/testnet'
    };
  }
}

export const stellarService = new StellarService(); 