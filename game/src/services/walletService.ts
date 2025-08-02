import { ethers } from 'ethers';

export interface WalletInfo {
  address: string;
  balance: string;
  network: string;
}

class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connectWallet(): Promise<WalletInfo | null> {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask to play ASGARD.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      const address = accounts[0];

      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Get balance
      const balance = await this.provider.getBalance(address);
      const balanceInEth = ethers.formatEther(balance);

      // Get network
      const network = await this.provider.getNetwork();
      const networkName = network.name === 'unknown' ? 'Unknown Network' : network.name;

      return {
        address,
        balance: balanceInEth,
        network: networkName,
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
  }

  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.provider || !this.signer) {
      return null;
    }

    try {
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      return {
        address,
        balance: ethers.formatEther(balance),
        network: network.name === 'unknown' ? 'Unknown Network' : network.name,
      };
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      return null;
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.signer.sendTransaction(transaction);
      return tx;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }
}

export const walletService = new WalletService();

// Add ethereum to window type
declare global {
  interface Window {
    ethereum?: any;
  }
} 