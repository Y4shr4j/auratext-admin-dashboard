const { Pool } = require('pg');
require('dotenv').config();

// Database configuration for PostgreSQL
const dbConfig = {
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
let pool = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool(dbConfig);
  }
  return pool;
};

// Initialize database tables
const initializeDatabase = async () => {
  const pool = getPool();
  
  try {
    // Create text_replacements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS text_replacements (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        app_version VARCHAR(50),
        os VARCHAR(50),
        success BOOLEAN,
        method VARCHAR(50),
        target_app VARCHAR(100),
        text_length INT,
        response_time INT,
        user_agent TEXT,
        ip_address VARCHAR(45),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_id ON text_replacements (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_timestamp ON text_replacements (timestamp)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_success ON text_replacements (success)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_target_app ON text_replacements (target_app)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_method ON text_replacements (method)`);

    // Create errors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS errors (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        app_version VARCHAR(50),
        os VARCHAR(50),
        error_type VARCHAR(100),
        error_message TEXT,
        target_app VARCHAR(100),
        stack_trace TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for errors table
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_errors_user_id ON errors (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON errors (timestamp)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_errors_type ON errors (error_type)`);

    // Create user_actions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_actions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        action_type VARCHAR(100),
        target_app VARCHAR(100),
        app_version VARCHAR(50),
        os VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for user_actions table
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_actions_user_id ON user_actions (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_actions_timestamp ON user_actions (timestamp)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_actions_type ON user_actions (action_type)`);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  getPool,
  initializeDatabase
};
