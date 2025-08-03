const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

// Initialize database tables if they don't exist
const initializeTables = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        username VARCHAR(100),
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        survival_credits INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_tokens (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        name VARCHAR(100) NOT NULL,
        balance DECIMAL(20, 8) NOT NULL,
        value_usd DECIMAL(15, 2) NOT NULL,
        change_24h DECIMAL(5, 2) DEFAULT 0,
        contract_address VARCHAR(42),
        chain VARCHAR(20) NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
      )
    `);

    // Transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        tx_hash VARCHAR(66) UNIQUE NOT NULL,
        type VARCHAR(20) NOT NULL,
        from_token VARCHAR(10) NOT NULL,
        to_token VARCHAR(10) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        value_usd DECIMAL(15, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        chain VARCHAR(20) NOT NULL,
        block_number INTEGER,
        gas_used INTEGER,
        gas_price DECIMAL(20, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
      )
    `);

    // User stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        total_value DECIMAL(15, 2) DEFAULT 0,
        total_trades INTEGER DEFAULT 0,
        success_rate DECIMAL(5, 2) DEFAULT 0,
        average_trade_size DECIMAL(15, 2) DEFAULT 0,
        favorite_token VARCHAR(10),
        total_volume DECIMAL(15, 2) DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
};

// Initialize tables on startup
initializeTables();

// Helper function to get or create user
const getOrCreateUser = async (walletAddress) => {
  try {
    let result = await pool.query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO users (wallet_address) VALUES ($1) RETURNING *',
        [walletAddress]
      );

      // Create initial stats record
      await pool.query('INSERT INTO user_stats (wallet_address) VALUES ($1)', [
        walletAddress,
      ]);
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error getting/creating user:', error);
    throw error;
  }
};

// GET /api/profile/tokens - Get user tokens
router.get('/tokens', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Get or create user
    await getOrCreateUser(address);

    // Get tokens
    const result = await pool.query(
      'SELECT * FROM user_tokens WHERE wallet_address = $1 ORDER BY value_usd DESC',
      [address]
    );

    res.json({
      success: true,
      tokens: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profile/tokens - Update user tokens
router.post('/tokens', async (req, res) => {
  try {
    const { walletAddress, tokens } = req.body;

    if (!walletAddress || !tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Get or create user
    await getOrCreateUser(walletAddress);

    // Clear existing tokens
    await pool.query('DELETE FROM user_tokens WHERE wallet_address = $1', [
      walletAddress,
    ]);

    // Insert new tokens
    for (const token of tokens) {
      await pool.query(
        `INSERT INTO user_tokens 
         (wallet_address, symbol, name, balance, value_usd, change_24h, contract_address, chain) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          walletAddress,
          token.symbol,
          token.name,
          token.balance,
          token.value,
          token.change24h || 0,
          token.contractAddress || null,
          token.chain,
        ]
      );
    }

    res.json({
      success: true,
      message: 'Tokens updated successfully',
      count: tokens.length,
    });
  } catch (error) {
    console.error('Error updating tokens:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/profile/transactions - Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const { address, type, status, limit = 50, offset = 0 } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Get or create user
    await getOrCreateUser(address);

    // Build query with filters
    let query = 'SELECT * FROM transactions WHERE wallet_address = $1';
    let params = [address];
    let paramCount = 1;

    if (type && type !== 'all') {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }

    if (status && status !== 'all') {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    query +=
      ' ORDER BY created_at DESC LIMIT $' +
      (paramCount + 1) +
      ' OFFSET $' +
      (paramCount + 2);
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      transactions: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profile/transactions - Add new transaction
router.post('/transactions', async (req, res) => {
  try {
    const {
      walletAddress,
      txHash,
      type,
      fromToken,
      toToken,
      amount,
      valueUsd,
      chain,
      blockNumber,
      gasUsed,
      gasPrice,
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

    // Get or create user
    await getOrCreateUser(walletAddress);

    // Insert transaction
    const result = await pool.query(
      `INSERT INTO transactions 
       (wallet_address, tx_hash, type, from_token, to_token, amount, value_usd, chain, block_number, gas_used, gas_price) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        walletAddress,
        txHash,
        type,
        fromToken,
        toToken,
        amount,
        valueUsd || 0,
        chain,
        blockNumber || null,
        gasUsed || null,
        gasPrice || null,
      ]
    );

    // Update user stats
    await updateUserStats(walletAddress);

    res.json({
      success: true,
      transaction: result.rows[0],
      message: 'Transaction added successfully',
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({ error: 'Transaction already exists' });
    }
    console.error('Error adding transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/profile/stats - Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Get or create user
    await getOrCreateUser(address);

    // Get stats
    const result = await pool.query(
      'SELECT * FROM user_stats WHERE wallet_address = $1',
      [address]
    );

    if (result.rows.length === 0) {
      // Create initial stats
      await pool.query('INSERT INTO user_stats (wallet_address) VALUES ($1)', [
        address,
      ]);

      const newResult = await pool.query(
        'SELECT * FROM user_stats WHERE wallet_address = $1',
        [address]
      );

      return res.json({
        success: true,
        stats: newResult.rows[0],
      });
    }

    res.json({
      success: true,
      stats: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to update user stats
const updateUserStats = async (walletAddress) => {
  try {
    // Calculate total value from tokens
    const tokensResult = await pool.query(
      'SELECT SUM(value_usd) as total_value FROM user_tokens WHERE wallet_address = $1',
      [walletAddress]
    );
    const totalValue = parseFloat(tokensResult.rows[0]?.total_value || 0);

    // Get transaction stats
    const txResult = await pool.query(
      `SELECT 
        COUNT(*) as total_trades,
        AVG(value_usd) as avg_trade_size,
        SUM(value_usd) as total_volume,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as success_rate
       FROM transactions 
       WHERE wallet_address = $1`,
      [walletAddress]
    );

    // Get favorite token
    const favoriteTokenResult = await pool.query(
      `SELECT from_token, COUNT(*) as count 
       FROM transactions 
       WHERE wallet_address = $1 
       GROUP BY from_token 
       ORDER BY count DESC 
       LIMIT 1`,
      [walletAddress]
    );

    const favoriteToken = favoriteTokenResult.rows[0]?.from_token || '';

    // Update stats
    await pool.query(
      `UPDATE user_stats 
       SET total_value = $2, 
           total_trades = $3, 
           success_rate = $4, 
           average_trade_size = $5, 
           favorite_token = $6, 
           total_volume = $7,
           last_updated = CURRENT_TIMESTAMP
       WHERE wallet_address = $1`,
      [
        walletAddress,
        totalValue,
        parseInt(txResult.rows[0]?.total_trades || 0),
        parseFloat(txResult.rows[0]?.success_rate || 0),
        parseFloat(txResult.rows[0]?.avg_trade_size || 0),
        favoriteToken,
        parseFloat(txResult.rows[0]?.total_volume || 0),
      ]
    );
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

// PUT /api/profile/transactions/:txHash/status - Update transaction status
router.put('/transactions/:txHash/status', async (req, res) => {
  try {
    const { txHash } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE transactions SET status = $1 WHERE tx_hash = $2 RETURNING *',
      [status, txHash]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update user stats
    await updateUserStats(result.rows[0].wallet_address);

    res.json({
      success: true,
      transaction: result.rows[0],
      message: 'Transaction status updated successfully',
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/profile/analytics - Get detailed analytics
router.get('/analytics', async (req, res) => {
  try {
    const { address, period = '30d' } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Get or create user
    await getOrCreateUser(address);

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get transaction analytics
    const analyticsResult = await pool.query(
      `SELECT 
        type,
        COUNT(*) as count,
        SUM(value_usd) as volume,
        AVG(value_usd) as avg_value,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
       FROM transactions 
       WHERE wallet_address = $1 AND created_at >= $2
       GROUP BY type`,
      [address, startDate]
    );

    // Get daily volume
    const dailyVolumeResult = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        SUM(value_usd) as volume,
        COUNT(*) as trades
       FROM transactions 
       WHERE wallet_address = $1 AND created_at >= $2
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [address, startDate]
    );

    // Get token distribution
    const tokenDistributionResult = await pool.query(
      `SELECT 
        symbol,
        SUM(balance) as total_balance,
        SUM(value_usd) as total_value
       FROM user_tokens 
       WHERE wallet_address = $1
       GROUP BY symbol
       ORDER BY total_value DESC`,
      [address]
    );

    res.json({
      success: true,
      analytics: {
        period,
        transactionTypes: analyticsResult.rows,
        dailyVolume: dailyVolumeResult.rows,
        tokenDistribution: tokenDistributionResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
