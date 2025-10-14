const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  },
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000
};

// Create connection pool
let pool = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// Initialize database tables
const initializeDatabase = async () => {
  const pool = getPool();
  
  try {
    // Create text_replacements table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS text_replacements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255),
        app_version VARCHAR(50),
        os VARCHAR(50),
        success BOOLEAN,
        method VARCHAR(50),
        target_app VARCHAR(100),
        text_length INT,
        response_time INT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_success (success)
      )
    `);

    // Create errors table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS errors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255),
        app_version VARCHAR(50),
        os VARCHAR(50),
        error_type VARCHAR(100),
        error_message TEXT,
        target_app VARCHAR(100),
        stack_trace TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_error_type (error_type)
      )
    `);

    // Create user_actions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_actions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255),
        action_type VARCHAR(100),
        target_app VARCHAR(100),
        app_version VARCHAR(50),
        os VARCHAR(50),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_action_type (action_type)
      )
    `);

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
