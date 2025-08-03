const { ethers } = require('ethers');
const logger = require('../utils/logger');

class RealHtlcService {
  constructor() {
    this.network = 'baseSepolia';
    this.provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://sepolia.base.org'
    );
    this.wallet = null;
    this.htlcContract = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const privateKey = process.env.ETHEREUM_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('ETHEREUM_PRIVATE_KEY not configured');
      }

      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // HTLC Contract ABI (from Remix deployment - exact working version)
      const htlcABI = require('../../artifacts/contracts/EthereumHTLC.sol/remix-abi.json');

      const htlcAddress = process.env.HTLC_CONTRACT_ADDRESS;
      if (!htlcAddress) {
        throw new Error('HTLC_CONTRACT_ADDRESS not configured');
      }

      this.htlcContract = new ethers.Contract(
        htlcAddress,
        htlcABI,
        this.wallet
      );
      this.isInitialized = true;

      logger.info('Real HTLC service initialized', {
        network: this.network,
        address: this.wallet.address,
        contractAddress: htlcAddress,
      });
    } catch (error) {
      logger.error('Failed to initialize Real HTLC service', error);
      throw error;
    }
  }

  // Create real HTLC on Ethereum/Base Sepolia
  async createHTLC(params) {
    this._checkInitialized();

    try {
      const {
        contractId,
        participant,
        amount,
        hashlock,
        timelock,
        asset = 'ETH',
        stellarAddress = '',
      } = params;

      logger.info('Creating real HTLC', {
        contractId,
        participant,
        amount,
        hashlock: '0x' + hashlock,
        timelock,
        asset,
      });

      // Convert contractId to bytes32
      const contractIdBytes = ethers.keccak256(ethers.toUtf8Bytes(contractId));

      // Convert hashlock to bytes32 (remove 0x if present)
      const hashlockBytes = hashlock.startsWith('0x')
        ? hashlock
        : '0x' + hashlock;

      // Convert amount to wei
      const amountWei = ethers.parseEther(amount.toString());

      // Calculate timelock (current time + timelock minutes)
      const timelockSeconds = Math.floor(Date.now() / 1000) + timelock * 60;

      // Create transaction
      // Use newContractETH for ETH transactions
      const tx =
        asset === 'ETH'
          ? await this.htlcContract.newContractETH(
              contractIdBytes,
              participant,
              hashlockBytes,
              timelockSeconds,
              stellarAddress,
              {
                value: amountWei,
                gasLimit: 300000, // Reduced gas limit
              }
            )
          : await this.htlcContract.newContract(
              contractIdBytes,
              participant,
              '0x4200000000000000000000000000000000000006', // WETH address for ETH
              amountWei,
              hashlockBytes,
              timelockSeconds,
              stellarAddress,
              {
                value: 0,
                gasLimit: 300000, // Reduced gas limit
              }
            );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      logger.info('Real HTLC created successfully', {
        contractId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });

      return {
        success: true,
        txHash: receipt.hash,
        contractId,
        participant,
        amount,
        hashlock: '0x' + hashlock,
        timelock: timelockSeconds,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice.toString(),
        stellarAddress,
      };
    } catch (error) {
      logger.error('Failed to create real HTLC', error);
      throw error;
    }
  }

  // Withdraw HTLC with preimage
  async withdrawHTLC(contractId, preimage) {
    this._checkInitialized();

    try {
      const contractIdBytes = ethers.keccak256(ethers.toUtf8Bytes(contractId));
      const preimageBytes = preimage.startsWith('0x')
        ? preimage
        : '0x' + preimage;

      logger.info('Withdrawing real HTLC', {
        contractId,
        preimage: preimage.substring(0, 8) + '...',
      });

      const tx = await this.htlcContract.withdraw(
        contractIdBytes,
        preimageBytes,
        {
          gasLimit: 300000,
        }
      );

      const receipt = await tx.wait();

      logger.info('Real HTLC withdrawn successfully', {
        contractId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return {
        success: true,
        txHash: receipt.hash,
        contractId,
        preimage: preimage.substring(0, 8) + '...',
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error('Failed to withdraw real HTLC', error);
      throw error;
    }
  }

  // Refund expired HTLC
  async refundHTLC(contractId) {
    this._checkInitialized();

    try {
      const contractIdBytes = ethers.keccak256(ethers.toUtf8Bytes(contractId));

      logger.info('Refunding real HTLC', { contractId });

      const tx = await this.htlcContract.refund(contractIdBytes, {
        gasLimit: 300000,
      });

      const receipt = await tx.wait();

      logger.info('Real HTLC refunded successfully', {
        contractId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return {
        success: true,
        txHash: receipt.hash,
        contractId,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error('Failed to refund real HTLC', error);
      throw error;
    }
  }

  // Get contract details
  async getContractDetails(contractId) {
    this._checkInitialized();

    try {
      const contractIdBytes = ethers.keccak256(ethers.toUtf8Bytes(contractId));
      const contract = await this.htlcContract.getContract(contractIdBytes);

      return {
        initiator: contract[0],
        participant: contract[1],
        token: contract[2],
        amount: ethers.formatEther(contract[3]),
        hashlock: contract[4],
        timelock: contract[5].toString(),
        withdrawn: contract[6],
        refunded: contract[7],
        stellarAddress: contract[8],
        createdAt: contract[9].toString(),
      };
    } catch (error) {
      logger.error('Failed to get contract details', error);
      throw error;
    }
  }

  // Get transaction info with explorer links
  getTransactionInfo(txHash) {
    return {
      txHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${txHash}`,
      network: 'base-sepolia',
      timestamp: Date.now(),
    };
  }

  _checkInitialized() {
    if (!this.isInitialized) {
      throw new Error('Real HTLC service not initialized');
    }
  }
}

module.exports = RealHtlcService;
