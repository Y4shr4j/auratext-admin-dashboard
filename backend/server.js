const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { getPool, initializeDatabase } = require('./database');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://auratext-admin-dashboard-gpbl.vercel.app',
    'https://auratext-admin-dashboard-gbpl.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(console.error);

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token || token !== 'auratext_secret_key_2024_launch_secure') {
    return res.sendStatus(403);
  }
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Analytics endpoints
app.post('/api/analytics/text-replacement', authenticate, async (req, res) => {
  const { userId, appVersion, os, success, method, targetApp, textLength, responseTime, userAgent, ipAddress } = req.body;
  
  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO text_replacements (user_id, app_version, os, success, method, target_app, text_length, response_time, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [userId, appVersion, os, success, method, targetApp, textLength, responseTime, userAgent, ipAddress]
    );
    
    // Log successful tracking
    console.log(`✅ Text replacement tracked: User ${userId}, App ${targetApp}, Success: ${success}`);
    
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/analytics/error', authenticate, async (req, res) => {
  const { userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace } = req.body;
  
  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO errors (user_id, app_version, os, error_type, error_message, target_app, stack_trace)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/analytics/user-action', authenticate, async (req, res) => {
  const { userId, actionType, targetApp, appVersion, os } = req.body;
  
  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO user_actions (user_id, action_type, target_app, app_version, os)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, actionType, targetApp, appVersion, os]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Metrics endpoints
app.get('/api/metrics/overview', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const queries = [
      'SELECT COUNT(*) as total_replacements FROM text_replacements',
      'SELECT COUNT(DISTINCT user_id) as unique_users FROM text_replacements',
      'SELECT COUNT(*) as total_errors FROM errors',
      'SELECT AVG(response_time) as avg_response_time FROM text_replacements WHERE response_time IS NOT NULL'
    ];

    const results = await Promise.all(queries.map(query => pool.query(query)));
    
    res.json({
      totalReplacements: results[0].rows[0].total_replacements || 0,
      uniqueUsers: results[1].rows[0].unique_users || 0,
      totalErrors: results[2].rows[0].total_errors || 0,
      avgResponseTime: Math.round(results[3].rows[0].avg_response_time || 0)
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/metrics/users', authenticate, async (req, res) => {
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
    res.json(result.rows || []);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/metrics/usage', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as replacements,
        COUNT(DISTINCT user_id) as unique_users
      FROM text_replacements 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(timestamp) 
      ORDER BY date DESC
    `);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/metrics/errors', authenticate, async (req, res) => {
  const limit = req.query.limit || 10;
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
      LIMIT ?
    `, [limit]);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Advanced Analytics Endpoints
app.get('/api/metrics/apps', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        target_app,
        COUNT(*) as usage_count,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(response_time) as avg_response_time,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100 as success_rate
      FROM text_replacements 
      GROUP BY target_app 
      ORDER BY usage_count DESC 
      LIMIT 20
    `);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/metrics/methods', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        method,
        COUNT(*) as usage_count,
        AVG(response_time) as avg_response_time,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100 as success_rate
      FROM text_replacements 
      GROUP BY method 
      ORDER BY usage_count DESC
    `);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/metrics/real-time', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:00') as minute,
        COUNT(*) as replacements,
        COUNT(DISTINCT user_id) as unique_users
      FROM text_replacements 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:00')
      ORDER BY minute DESC
      LIMIT 60
    `);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Export the app for Vercel serverless functions
module.exports = app;