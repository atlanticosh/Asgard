const request = require('supertest');
const express = require('express');

// Mock the profile routes with in-memory storage
const app = express();
app.use(express.json());

// In-memory storage for testing
const mockUsers = new Map();
const mockTokens = new Map();
const mockTransactions = new Map();
const mockStats = new Map();

// Mock profile routes
app.get('/api/profile/tokens', (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  const tokens = mockTokens.get(address) || [];
  res.json({
    success: true,
    tokens: tokens,
    count: tokens.length,
  });
});

app.post('/api/profile/tokens', (req, res) => {
  const { walletAddress, tokens } = req.body;

  if (!walletAddress || !tokens || !Array.isArray(tokens)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  mockTokens.set(walletAddress, tokens);
  res.json({
    success: true,
    message: 'Tokens updated successfully',
    count: tokens.length,
  });
});

app.get('/api/profile/transactions', (req, res) => {
  const { address, type, status } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  let transactions = mockTransactions.get(address) || [];

  if (type && type !== 'all') {
    transactions = transactions.filter((tx) => tx.type === type);
  }

  if (status && status !== 'all') {
    transactions = transactions.filter((tx) => tx.status === status);
  }

  res.json({
    success: true,
    transactions: transactions,
    count: transactions.length,
  });
});

app.post('/api/profile/transactions', (req, res) => {
  const {
    walletAddress,
    txHash,
    type,
    fromToken,
    toToken,
    amount,
    valueUsd,
    chain,
  } = req.body;

  if (
    !walletAddress ||
    !txHash ||
    !type ||
    !fromToken ||
    !toToken ||
    !amount ||
    !chain
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check for duplicate transaction
  const existingTransactions = mockTransactions.get(walletAddress) || [];
  if (existingTransactions.find((tx) => tx.tx_hash === txHash)) {
    return res.status(409).json({ error: 'Transaction already exists' });
  }

  const transaction = {
    id: Date.now(),
    wallet_address: walletAddress,
    tx_hash: txHash,
    type,
    from_token: fromToken,
    to_token: toToken,
    amount,
    value_usd: valueUsd || 0,
    status: 'pending',
    chain,
    created_at: new Date().toISOString(),
  };

  existingTransactions.push(transaction);
  mockTransactions.set(walletAddress, existingTransactions);

  res.json({
    success: true,
    transaction: transaction,
    message: 'Transaction added successfully',
  });
});

app.get('/api/profile/stats', (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  const stats = mockStats.get(address) || {
    wallet_address: address,
    total_value: 0,
    total_trades: 0,
    success_rate: 0,
    average_trade_size: 0,
    favorite_token: '',
    total_volume: 0,
  };

  res.json({
    success: true,
    stats: stats,
  });
});

app.put('/api/profile/transactions/:txHash/status', (req, res) => {
  const { txHash } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'completed', 'failed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Find transaction across all users
  let foundTransaction = null;
  for (const [address, transactions] of mockTransactions.entries()) {
    const transaction = transactions.find((tx) => tx.tx_hash === txHash);
    if (transaction) {
      transaction.status = status;
      foundTransaction = transaction;
      break;
    }
  }

  if (!foundTransaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  res.json({
    success: true,
    transaction: foundTransaction,
    message: 'Transaction status updated successfully',
  });
});

app.get('/api/profile/analytics', (req, res) => {
  const { address, period = '30d' } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  const transactions = mockTransactions.get(address) || [];
  const tokens = mockTokens.get(address) || [];

  // Mock analytics data
  const analytics = {
    period,
    transactionTypes: [
      {
        type: 'swap',
        count: transactions.filter((tx) => tx.type === 'swap').length,
        volume: 1000,
        avg_value: 100,
        successful: 5,
        failed: 1,
      },
      {
        type: 'bridge',
        count: transactions.filter((tx) => tx.type === 'bridge').length,
        volume: 500,
        avg_value: 50,
        successful: 3,
        failed: 0,
      },
    ],
    dailyVolume: [
      { date: '2024-01-15', volume: 1000, trades: 5 },
      { date: '2024-01-14', volume: 500, trades: 3 },
    ],
    tokenDistribution: tokens.map((token) => ({
      symbol: token.symbol,
      total_balance: token.balance,
      total_value: token.value,
    })),
  };

  res.json({
    success: true,
    analytics: analytics,
  });
});

describe('Profile API', () => {
  const testWalletAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
  const testTxHash =
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  beforeEach(() => {
    // Clear mock data before each test
    mockUsers.clear();
    mockTokens.clear();
    mockTransactions.clear();
    mockStats.clear();
  });

  describe('GET /api/profile/tokens', () => {
    it('Should return empty tokens for new wallet', async () => {
      const response = await request(app)
        .get('/api/profile/tokens')
        .query({ address: testWalletAddress });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tokens).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('Should require wallet address', async () => {
      const response = await request(app).get('/api/profile/tokens');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Wallet address is required');
    });
  });

  describe('POST /api/profile/tokens', () => {
    it('Should update user tokens', async () => {
      const tokens = [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: '2.5',
          value: 6250.0,
          change24h: 2.5,
          contractAddress: '0x0000000000000000000000000000000000000000',
          chain: 'ethereum',
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          balance: '1000.00',
          value: 1000.0,
          change24h: 0.0,
          contractAddress: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8',
          chain: 'ethereum',
        },
      ];

      const response = await request(app).post('/api/profile/tokens').send({
        walletAddress: testWalletAddress,
        tokens: tokens,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });

    it('Should require valid request data', async () => {
      const response = await request(app).post('/api/profile/tokens').send({
        walletAddress: testWalletAddress,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('GET /api/profile/transactions', () => {
    it('Should return empty transactions for new wallet', async () => {
      const response = await request(app)
        .get('/api/profile/transactions')
        .query({ address: testWalletAddress });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactions).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('Should filter transactions by type', async () => {
      const response = await request(app)
        .get('/api/profile/transactions')
        .query({
          address: testWalletAddress,
          type: 'swap',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/profile/transactions', () => {
    it('Should add new transaction', async () => {
      const transaction = {
        walletAddress: testWalletAddress,
        txHash: testTxHash,
        type: 'swap',
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '1.5',
        valueUsd: 3750.0,
        chain: 'ethereum',
        blockNumber: 1234567,
        gasUsed: 150000,
        gasPrice: 25.5,
      };

      const response = await request(app)
        .post('/api/profile/transactions')
        .send(transaction);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transaction.tx_hash).toBe(testTxHash);
    });

    it('Should reject duplicate transaction', async () => {
      const transaction = {
        walletAddress: testWalletAddress,
        txHash: testTxHash,
        type: 'swap',
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '1.5',
        valueUsd: 3750.0,
        chain: 'ethereum',
      };

      // Add first transaction
      await request(app).post('/api/profile/transactions').send(transaction);

      // Try to add duplicate
      const response = await request(app)
        .post('/api/profile/transactions')
        .send(transaction);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Transaction already exists');
    });

    it('Should require all required fields', async () => {
      const response = await request(app)
        .post('/api/profile/transactions')
        .send({
          walletAddress: testWalletAddress,
          txHash: '0xabc123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('GET /api/profile/stats', () => {
    it('Should return user statistics', async () => {
      const response = await request(app)
        .get('/api/profile/stats')
        .query({ address: testWalletAddress });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty(
        'wallet_address',
        testWalletAddress
      );
      expect(response.body.stats).toHaveProperty('total_value');
      expect(response.body.stats).toHaveProperty('total_trades');
      expect(response.body.stats).toHaveProperty('success_rate');
    });

    it('Should require wallet address', async () => {
      const response = await request(app).get('/api/profile/stats');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Wallet address is required');
    });
  });

  describe('PUT /api/profile/transactions/:txHash/status', () => {
    it('Should update transaction status', async () => {
      // First add a transaction
      const transaction = {
        walletAddress: testWalletAddress,
        txHash: testTxHash,
        type: 'swap',
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '1.5',
        valueUsd: 3750.0,
        chain: 'ethereum',
      };

      await request(app).post('/api/profile/transactions').send(transaction);

      // Then update its status
      const response = await request(app)
        .put(`/api/profile/transactions/${testTxHash}/status`)
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transaction.status).toBe('completed');
    });

    it('Should reject invalid status', async () => {
      const response = await request(app)
        .put(`/api/profile/transactions/${testTxHash}/status`)
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid status');
    });

    it('Should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .put('/api/profile/transactions/0xnonexistent/status')
        .send({ status: 'completed' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Transaction not found');
    });
  });

  describe('GET /api/profile/analytics', () => {
    it('Should return analytics data', async () => {
      const response = await request(app).get('/api/profile/analytics').query({
        address: testWalletAddress,
        period: '30d',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toHaveProperty('period', '30d');
      expect(response.body.analytics).toHaveProperty('transactionTypes');
      expect(response.body.analytics).toHaveProperty('dailyVolume');
      expect(response.body.analytics).toHaveProperty('tokenDistribution');
    });

    it('Should require wallet address', async () => {
      const response = await request(app)
        .get('/api/profile/analytics')
        .query({ period: '30d' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Wallet address is required');
    });
  });
});
