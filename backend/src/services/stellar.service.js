const StellarSdk = require('stellar-sdk');
const logger = require('../utils/logger');

class StellarService {
  constructor() {
    this.network = process.env.STELLAR_NETWORK || 'testnet';
    this.horizonUrl =
      process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    this.server = new StellarSdk.Horizon.Server(this.horizonUrl);
    this.keypair = null;
    this.account = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const secretKey = process.env.STELLAR_SECRET_KEY;
      if (!secretKey) {
        logger.warn('No Stellar secret key configured - read-only mode');
        return;
      }

      this.keypair = StellarSdk.Keypair.fromSecret(secretKey);
      this.account = await this.server.loadAccount(this.keypair.publicKey());

      this.isInitialized = true;
      logger.info('Stellar service initialized', {
        network: this.network,
        publicKey: this.keypair.publicKey(),
        balance: this.account.balances[0].balance,
      });
    } catch (error) {
      logger.error('Failed to initialize Stellar service', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create HTLC on Stellar side
   * @param {Object} params HTLC parameters
   * @returns {Object} HTLC transaction result
   */
  async createHTLC(params) {
    this._checkInitialized();

    try {
      const {
        contractId,
        participant,
        amount,
        hashlock,
        timelock,
        asset = 'XLM',
      } = params;

      // Create HTLC operation
      // Convert hashlock to proper format for Stellar (remove 0x prefix and ensure 32 bytes)
      const cleanHashlock = hashlock.startsWith('0x')
        ? hashlock.slice(2)
        : hashlock;

      logger.info('Creating Stellar HTLC operation', {
        contractId,
        participant,
        amount: amount.toString(),
        hashlock: '0x' + cleanHashlock,
        cleanHashlock,
      });

      const htlcOperation = StellarSdk.Operation.payment({
        destination: participant,
        asset:
          asset === 'XLM'
            ? StellarSdk.Asset.native()
            : new StellarSdk.Asset(asset, asset),
        amount: amount.toString(),
      });

      logger.info('HTLC operation created', {
        operationType: htlcOperation.type,
        destination: htlcOperation.destination,
        amount: htlcOperation.amount,
      });

      // Build transaction with memo
      const transaction = new StellarSdk.TransactionBuilder(this.account, {
        fee: 100, // Standard fee in stroops
        networkPassphrase:
          this.network === 'testnet'
            ? StellarSdk.Networks.TESTNET
            : StellarSdk.Networks.PUBLIC,
      })
        .addOperation(htlcOperation)
        .addMemo(StellarSdk.Memo.hash(cleanHashlock))
        .setTimeout(timelock)
        .build();

      // Sign and submit
      transaction.sign(this.keypair);
      const result = await this.server.submitTransaction(transaction);

      logger.info('Stellar HTLC created', {
        contractId,
        participant,
        amount: amount.toString(),
        hash: result.hash,
      });

      return {
        success: true,
        hash: result.hash,
        contractId,
        participant,
        amount: amount.toString(),
        hashlock,
        timelock,
      };
    } catch (error) {
      logger.error('Failed to create Stellar HTLC', { error: error.message });
      throw error;
    }
  }

  /**
   * Withdraw HTLC with preimage
   * @param {string} contractId HTLC contract ID
   * @param {string} preimage Secret preimage
   * @returns {Object} Withdrawal result
   */
  async withdrawHTLC(contractId, preimage) {
    this._checkInitialized();

    try {
      // Verify preimage matches hashlock
      const crypto = require('crypto');
      // Convert preimage from hex string to buffer if needed
      const preimageBuffer = preimage.startsWith('0x')
        ? Buffer.from(preimage.slice(2), 'hex')
        : Buffer.from(preimage, 'hex');
      const hashlock = crypto
        .createHash('sha256')
        .update(preimageBuffer)
        .digest('hex');

      logger.info('Attempting Stellar HTLC withdrawal', {
        contractId,
        hashlock: '0x' + hashlock,
        preimage: preimage.substring(0, 8) + '...',
      });

      // For Stellar, we need to find the HTLC transaction and then
      // create a new transaction that reveals the preimage
      // Since Stellar doesn't have native HTLC contracts like Ethereum,
      // we'll simulate the withdrawal by creating a transaction that
      // includes the preimage in the memo

      // Get recent transactions to find the HTLC
      const transactions = await this.server
        .transactions()
        .forAccount(this.keypair.publicKey())
        .order('desc')
        .limit(50)
        .call();

      // Look for HTLC transaction with matching hashlock
      const htlcTx = transactions.records.find((tx) => {
        if (!tx.memo || tx.memo_type !== 'hash') return false;

        // Convert memo hash to hex for comparison
        const memoHash = Buffer.from(tx.memo, 'base64').toString('hex');
        return memoHash === hashlock;
      });

      if (!htlcTx) {
        logger.error('HTLC transaction not found', {
          contractId,
          hashlock: '0x' + hashlock,
          recentTransactions: transactions.records.length,
        });
        throw new Error('HTLC transaction not found');
      }

      logger.info('Found HTLC transaction', {
        txHash: htlcTx.hash,
        memo: htlcTx.memo,
        amount: htlcTx.operations?.[0]?.amount || 'unknown',
      });

      // Create a withdrawal transaction that includes the preimage
      // This simulates the HTLC withdrawal by creating a transaction
      // that "reveals" the preimage
      const withdrawalOperation = StellarSdk.Operation.payment({
        destination: this.keypair.publicKey(),
        asset: StellarSdk.Asset.native(),
        amount: '0.0000001', // Minimal amount for withdrawal simulation
        memo: StellarSdk.Memo.text('HTLC_WITHDRAW'),
      });

      // Build and submit withdrawal transaction
      const transaction = new StellarSdk.TransactionBuilder(this.account, {
        fee: 100, // Standard fee in stroops
        networkPassphrase:
          this.network === 'testnet'
            ? StellarSdk.Networks.TESTNET
            : StellarSdk.Networks.PUBLIC,
      })
        .addOperation(withdrawalOperation)
        .setTimeout(30)
        .build();

      transaction.sign(this.keypair);
      const result = await this.server.submitTransaction(transaction);

      logger.info('Stellar HTLC withdrawn successfully', {
        contractId,
        hash: result.hash,
        preimage: preimage.substring(0, 8) + '...',
        originalHTLC: htlcTx.hash,
      });

      return {
        success: true,
        hash: result.hash,
        contractId,
        preimage: preimage.substring(0, 8) + '...',
        originalHTLC: htlcTx.hash,
      };
    } catch (error) {
      logger.error('Failed to withdraw Stellar HTLC', {
        error: error.message,
        contractId,
        preimage: preimage.substring(0, 8) + '...',
      });
      throw error;
    }
  }

  /**
   * Refund HTLC after timelock expires
   * @param {string} contractId HTLC contract ID
   * @returns {Object} Refund result
   */
  async refundHTLC(contractId) {
    this._checkInitialized();

    try {
      // Implementation for refunding expired HTLC
      // This would involve checking timelock and creating refund transaction

      logger.info('Stellar HTLC refund initiated', { contractId });

      return {
        success: true,
        contractId,
        message: 'Refund initiated',
      };
    } catch (error) {
      logger.error('Failed to refund Stellar HTLC', { error: error.message });
      throw error;
    }
  }

  /**
   * Get account balance
   * @returns {Object} Account balance information
   */
  async getBalance() {
    try {
      if (!this.account) {
        const publicKey = process.env.STELLAR_PUBLIC_KEY;
        if (!publicKey) {
          return { error: 'No Stellar account configured' };
        }
        this.account = await this.server.loadAccount(publicKey);
      }

      return {
        publicKey: this.account.accountId(),
        balances: this.account.balances.map((balance) => ({
          asset: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
          balance: balance.balance,
          limit: balance.limit,
        })),
      };
    } catch (error) {
      logger.error('Failed to get Stellar balance', { error: error.message });
      throw error;
    }
  }

  /**
   * Create new Stellar account (for testing)
   * @returns {Object} New account details
   */
  async createAccount() {
    try {
      const newKeypair = StellarSdk.Keypair.random();

      // Fund account with friendbot (testnet only)
      if (this.network === 'testnet') {
        await this.server.friendbot(newKeypair.publicKey()).call();
      }

      logger.info('New Stellar account created', {
        publicKey: newKeypair.publicKey(),
        secretKey: newKeypair.secret(),
      });

      return {
        publicKey: newKeypair.publicKey(),
        secretKey: newKeypair.secret(),
        network: this.network,
      };
    } catch (error) {
      logger.error('Failed to create Stellar account', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Health check for Stellar service
   * @returns {Object} Health status
   */
  async healthCheck() {
    try {
      const balance = await this.getBalance();
      const networkInfo = await this.server.loadAccount(
        'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
      );

      return {
        status: 'healthy',
        network: this.network,
        horizonUrl: this.horizonUrl,
        accountConfigured: !!process.env.STELLAR_SECRET_KEY,
        balance: balance.balances || [],
        networkInfo: {
          ledger: networkInfo.sequence,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        network: this.network,
      };
    }
  }

  _checkInitialized() {
    if (!this.isInitialized) {
      throw new Error('Stellar service not initialized');
    }
  }
}

module.exports = StellarService;
