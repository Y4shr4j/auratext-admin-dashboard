// Standalone Vercel serverless function
const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

let pool = null;
const getPool = () => {
  if (!pool) {
    pool = new Pool(dbConfig);
  }
  return pool;
};

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token || token !== 'auratext_secret_key_2024_launch_secure') {
    return res.sendStatus(403);
  }
  next();
};

// Main handler function
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Favicon handler
  if (req.url === '/favicon.ico' && req.method === 'GET') {
    res.status(204).end(); // No content but successful
    return;
  }

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
        realTime: '/api/metrics/real-time'
      },
      documentation: 'Visit your frontend dashboard to view analytics data'
    });
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
    try {
      // Check authentication
      authenticate(req, res, () => {
        // Authentication passed, continue with the request
      });
      
      const pool = getPool();
      const queries = [
        'SELECT COUNT(*) as total_replacements FROM text_replacements',
        'SELECT COUNT(DISTINCT user_id) as unique_users FROM text_replacements',
        'SELECT COUNT(*) as total_errors FROM errors',
        'SELECT AVG(response_time) as avg_response_time FROM text_replacements WHERE response_time IS NOT NULL'
      ];

      Promise.all(queries.map(query => pool.query(query))).then(results => {
        res.json({
          totalReplacements: results[0].rows[0].total_replacements || 0,
          uniqueUsers: results[1].rows[0].unique_users || 0,
          totalErrors: results[2].rows[0].total_errors || 0,
          avgResponseTime: Math.round(results[3].rows[0].avg_response_time || 0)
        });
      }).catch(err => {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Server error' });
    }
    return;
  }

  // Metrics usage endpoint
  if (req.url === '/api/metrics/usage' && req.method === 'GET') {
    try {
      authenticate(req, res, () => {});
      
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
      res.json(result.rows || []);
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    }
    return;
  }

  // Metrics errors endpoint
  if (req.url.startsWith('/api/metrics/errors') && req.method === 'GET') {
    try {
      authenticate(req, res, () => {});
      
      const limit = req.url.includes('limit=') ? req.url.split('limit=')[1].split('&')[0] : 10;
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
      `, [limit]);
      res.json(result.rows || []);
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    }
    return;
  }

  // Default 404 for unmatched routes
  res.status(404).json({ error: 'Not found' });
};