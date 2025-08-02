const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool = null;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'stellar_bridge_db',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};

// Create connection pool
async function connectDatabase() {
  try {
    if (pool) {
      logger.warn('Database pool already exists');
      return pool;
    }

    // Use DATABASE_URL if provided (common in production)
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      });
    } else {
      pool = new Pool(dbConfig);
    }

    // Test the connection
    const client = await pool.connect();

    try {
      const result = await client.query('SELECT NOW()');
      logger.info(`Database connected at ${result.rows[0].now}`);

      // Run initial setup/migrations if needed
      await runInitialSetup(client);
    } finally {
      client.release();
    }

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client:', err);
    });

    return pool;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

// Run initial database setup
async function runInitialSetup(client) {
  try {
    // Check if tables exist, create if they don't
    const tablesExist = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tablesExist.rows[0].exists) {
      logger.info('Tables do not exist, creating initial schema...');
      await createTables(client);
    } else {
      logger.info('Database tables already exist');
    }
  } catch (error) {
    logger.error('Error in initial database setup:', error);
    throw error;
  }
}

// Create database tables
async function createTables(client) {
  const createTablesSQL = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ethereum_address VARCHAR(42) UNIQUE,
      stellar_address VARCHAR(56),
      username VARCHAR(50) UNIQUE,
      email VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_login TIMESTAMP WITH TIME ZONE,
      is_active BOOLEAN DEFAULT true
    );

    -- Swaps table
    CREATE TABLE IF NOT EXISTS swaps (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      from_chain VARCHAR(20) NOT NULL,
      to_chain VARCHAR(20) NOT NULL,
      token_in VARCHAR(42) NOT NULL,
      token_out VARCHAR(42) NOT NULL,
      amount_in DECIMAL(36, 18) NOT NULL,
      amount_out DECIMAL(36, 18),
      expected_amount_out DECIMAL(36, 18),
      hashlock VARCHAR(66) NOT NULL UNIQUE,
      preimage VARCHAR(66),
      timelock BIGINT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'locked', 'completed', 'refunded', 'failed')),
      ethereum_tx_hash VARCHAR(66),
      stellar_tx_hash VARCHAR(64),
      one_inch_quote JSONB,
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE,
      expires_at TIMESTAMP WITH TIME ZONE
    );

    -- Transactions table for detailed tracking
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      swap_id UUID REFERENCES swaps(id) ON DELETE CASCADE,
      chain VARCHAR(20) NOT NULL,
      tx_hash VARCHAR(66) NOT NULL,
      tx_type VARCHAR(30) NOT NULL, -- 'lock', 'unlock', 'refund', 'approve'
      block_number BIGINT,
      gas_used BIGINT,
      gas_price DECIMAL(36, 18),
      fee DECIMAL(36, 18),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
      raw_transaction JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      confirmed_at TIMESTAMP WITH TIME ZONE
    );

    -- Game stats table
    CREATE TABLE IF NOT EXISTS game_stats (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      total_volume DECIMAL(36, 18) DEFAULT 0,
      total_saved DECIMAL(36, 18) DEFAULT 0,
      total_swaps INTEGER DEFAULT 0,
      fastest_swap_time INTEGER, -- in seconds
      largest_swap DECIMAL(36, 18) DEFAULT 0,
      achievements JSONB DEFAULT '[]',
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Achievements table (reference data)
    CREATE TABLE IF NOT EXISTS achievements (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      icon VARCHAR(100),
      xp_reward INTEGER DEFAULT 0,
      criteria JSONB NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- User achievements (many-to-many)
    CREATE TABLE IF NOT EXISTS user_achievements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      achievement_id VARCHAR(50) REFERENCES achievements(id),
      unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      UNIQUE(user_id, achievement_id)
    );

    -- Analytics/metrics table
    CREATE TABLE IF NOT EXISTS daily_metrics (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      date DATE NOT NULL UNIQUE,
      total_volume DECIMAL(36, 18) DEFAULT 0,
      total_swaps INTEGER DEFAULT 0,
      unique_users INTEGER DEFAULT 0,
      total_fees_saved DECIMAL(36, 18) DEFAULT 0,
      avg_swap_time DECIMAL(10, 2),
      success_rate DECIMAL(5, 4),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Arbitrage opportunities table
    CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      token_symbol VARCHAR(10) NOT NULL,
      ethereum_price DECIMAL(36, 18) NOT NULL,
      stellar_price DECIMAL(36, 18) NOT NULL,
      price_difference DECIMAL(36, 18) NOT NULL,
      potential_profit DECIMAL(36, 18) NOT NULL,
      volume_available DECIMAL(36, 18),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create updated_at trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_swaps_hashlock ON swaps(hashlock);
    CREATE INDEX IF NOT EXISTS idx_swaps_status ON swaps(status);
    CREATE INDEX IF NOT EXISTS idx_swaps_user_id ON swaps(user_id);
    CREATE INDEX IF NOT EXISTS idx_swaps_created_at ON swaps(created_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_swap_id ON transactions(swap_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_chain ON transactions(chain);
    CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
    CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON game_stats(user_id);
    CREATE INDEX IF NOT EXISTS idx_game_stats_level ON game_stats(level);
    CREATE INDEX IF NOT EXISTS idx_game_stats_xp ON game_stats(xp);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
    CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
    CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_token ON arbitrage_opportunities(token_symbol);
    CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_expires ON arbitrage_opportunities(expires_at);
    CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_active ON arbitrage_opportunities(is_active);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

    -- Add triggers for updated_at
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_game_stats_updated_at BEFORE UPDATE ON game_stats
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;

  await client.query(createTablesSQL);
  logger.info('Database tables created successfully');

  // Insert default achievements
  await insertDefaultAchievements(client);
}

// Insert default achievements
async function insertDefaultAchievements(client) {
  const achievements = [
    {
      id: 'first_swap',
      name: 'First Bridge',
      description: 'Complete your first cross-chain swap',
      icon: '🌉',
      xp_reward: 100,
      criteria: { swaps_completed: 1 },
    },
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Complete a swap in under 5 seconds',
      icon: '⚡',
      xp_reward: 200,
      criteria: { max_swap_time: 5 },
    },
    {
      id: 'whale_hunter',
      name: 'Whale Hunter',
      description: 'Complete a single swap worth over $10,000',
      icon: '🐋',
      xp_reward: 500,
      criteria: { min_swap_value: 10000 },
    },
    {
      id: 'arbitrage_master',
      name: 'Arbitrage Master',
      description: 'Profit from 10 arbitrage opportunities',
      icon: '💰',
      xp_reward: 300,
      criteria: { arbitrage_profits: 10 },
    },
    {
      id: 'bridge_regular',
      name: 'Bridge Regular',
      description: 'Complete 50 swaps',
      icon: '🎯',
      xp_reward: 250,
      criteria: { swaps_completed: 50 },
    },
    {
      id: 'fee_saver',
      name: 'Fee Saver',
      description: 'Save over $1000 in fees',
      icon: '💎',
      xp_reward: 400,
      criteria: { total_fees_saved: 1000 },
    },
  ];

  for (const achievement of achievements) {
    await client.query(
      `
      INSERT INTO achievements (id, name, description, icon, xp_reward, criteria)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `,
      [
        achievement.id,
        achievement.name,
        achievement.description,
        achievement.icon,
        achievement.xp_reward,
        JSON.stringify(achievement.criteria),
      ]
    );
  }

  logger.info('Default achievements inserted');
}

// Get database pool
function getPool() {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
}

// Query helper function
async function query(text, params) {
  const client = await getPool().connect();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Executed query', {
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rows: result.rowCount,
    });

    return result;
  } catch (error) {
    logger.error('Database query error:', {
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      params,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
}

// Transaction helper
async function withTransaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Close database connection
async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
}

module.exports = {
  connectDatabase,
  getPool,
  query,
  withTransaction,
  closeDatabase,
};
