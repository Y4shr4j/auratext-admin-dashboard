// AuraText Analytics API Serverless Function
// This includes all endpoints from server.js adapted for Vercel

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
    // Don't throw error in serverless function, just log it
  }
};

// Initialize database on first load
let dbInitialized = false;
const ensureDatabaseInitialized = async () => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
};

module.exports = async (req, res) => {
  // Ensure database is initialized
  await ensureDatabaseInitialized();
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Authentication middleware
  const authenticate = (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    return token === 'auratext_secret_key_2024_launch_secure';
  };

  // Root endpoint
  if (req.url === '/' && req.method === 'GET') {
    return res.json({
      message: '🚀 AuraText Analytics API Server is Running!',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      endpoints: {
        health: '/api/health',
        overview: '/api/metrics/overview',
        usage: '/api/metrics/usage',
        errors: '/api/metrics/errors',
        apps: '/api/metrics/apps',
        methods: '/api/metrics/methods',
        realTime: '/api/metrics/real-time',
        users: '/api/metrics/users'
      },
      documentation: 'Visit your frontend dashboard to view analytics data'
    });
  }

  // Favicon handler
  if (req.url === '/favicon.ico' && req.method === 'GET') {
    res.status(204).end();
    return;
  }

  // Health check endpoint
  if (req.url === '/api/health' && req.method === 'GET') {
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  }

  // Metrics overview endpoint
  if (req.url === '/api/metrics/overview' && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
      const pool = getPool();
      const queries = [
        'SELECT COUNT(*) as total_replacements FROM text_replacements',
        'SELECT COUNT(DISTINCT user_id) as unique_users FROM text_replacements',
        'SELECT COUNT(*) as total_errors FROM errors',
        'SELECT AVG(response_time) as avg_response_time FROM text_replacements WHERE response_time IS NOT NULL'
      ];

      const results = await Promise.all(queries.map(query => pool.query(query)));
      
      return res.json({
        totalReplacements: parseInt(results[0].rows[0].total_replacements) || 0,
        uniqueUsers: parseInt(results[1].rows[0].unique_users) || 0,
        totalErrors: parseInt(results[2].rows[0].total_errors) || 0,
        avgResponseTime: Math.round(parseFloat(results[3].rows[0].avg_response_time) || 0)
      });
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Metrics usage endpoint
  if (req.url === '/api/metrics/usage' && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as replacements,
          COUNT(DISTINCT user_id) as unique_users
        FROM text_replacements 
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp) 
        ORDER BY date DESC
      `);
      return res.json(result.rows || []);
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Metrics errors endpoint
  if (req.url.startsWith('/api/metrics/errors') && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const limit = req.url.includes('?') ? 
      new URLSearchParams(req.url.split('?')[1]).get('limit') || 10 : 10;

    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT 
          error_type,
          error_message,
          target_app,
          timestamp,
          user_id
        FROM errors 
        ORDER BY timestamp DESC 
        LIMIT $1
      `, [parseInt(limit)]);
      return res.json(result.rows || []);
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Metrics users endpoint
  if (req.url === '/api/metrics/users' && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT 
          user_id,
          COUNT(*) as replacement_count,
          AVG(response_time) as avg_response_time,
          MAX(timestamp) as last_seen
        FROM text_replacements 
        GROUP BY user_id 
        ORDER BY replacement_count DESC 
        LIMIT 10
      `);
      return res.json(result.rows || []);
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Metrics apps endpoint
  if (req.url === '/api/metrics/apps' && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT 
          target_app,
          COUNT(*) as usage_count,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(response_time) as avg_response_time,
          (SUM(CASE WHEN success = true THEN 1 ELSE 0 END)::float / COUNT(*) * 100) as success_rate
        FROM text_replacements 
        GROUP BY target_app 
        ORDER BY usage_count DESC 
        LIMIT 20
      `);
      return res.json(result.rows || []);
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Metrics methods endpoint
  if (req.url === '/api/metrics/methods' && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT 
          method,
          COUNT(*) as usage_count,
          AVG(response_time) as avg_response_time,
          (SUM(CASE WHEN success = true THEN 1 ELSE 0 END)::float / COUNT(*) * 100) as success_rate
        FROM text_replacements 
        GROUP BY method 
        ORDER BY usage_count DESC
      `);
      return res.json(result.rows || []);
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Metrics real-time endpoint
  if (req.url === '/api/metrics/real-time' && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT 
          DATE_TRUNC('minute', timestamp) as minute,
          COUNT(*) as replacements,
          COUNT(DISTINCT user_id) as unique_users
        FROM text_replacements 
        WHERE timestamp >= NOW() - INTERVAL '1 hour'
        GROUP BY DATE_TRUNC('minute', timestamp)
        ORDER BY minute DESC
        LIMIT 60
      `);
      return res.json(result.rows || []);
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Analytics tracking endpoints
  if (req.url === '/api/analytics/text-replacement' && req.method === 'POST') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { userId, appVersion, os, success, method, targetApp, textLength, responseTime, userAgent, ipAddress } = req.body;
    
    try {
      const pool = getPool();
      const result = await pool.query(
        `INSERT INTO text_replacements (user_id, app_version, os, success, method, target_app, text_length, response_time, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [userId, appVersion, os, success, method, targetApp, textLength, responseTime, userAgent, ipAddress]
      );
      
      console.log(`✅ Text replacement tracked: User ${userId}, App ${targetApp}, Success: ${success}`);
      return res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.url === '/api/analytics/error' && req.method === 'POST') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace } = req.body;
    
    try {
      const pool = getPool();
      const result = await pool.query(
        `INSERT INTO errors (user_id, app_version, os, error_type, error_message, target_app, stack_trace)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace]
      );
      
      console.log(`❌ Error tracked: ${errorType} - ${errorMessage}`);
      return res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.url === '/api/analytics/user-action' && req.method === 'POST') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { userId, actionType, targetApp, appVersion, os } = req.body;
    
    try {
      const pool = getPool();
      const result = await pool.query(
        `INSERT INTO user_actions (user_id, action_type, target_app, app_version, os)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [userId, actionType, targetApp, appVersion, os]
      );
      
      console.log(`📊 User action tracked: ${actionType} by ${userId}`);
      return res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Default 404
  res.status(404).json({ error: 'Not found' });
};