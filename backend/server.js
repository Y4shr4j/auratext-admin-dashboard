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
  const { userId, appVersion, os, success, method, targetApp, textLength, responseTime } = req.body;
  
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      `INSERT INTO text_replacements (user_id, app_version, os, success, method, target_app, text_length, response_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, appVersion, os, success, method, targetApp, textLength, responseTime]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/analytics/error', authenticate, async (req, res) => {
  const { userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace } = req.body;
  
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      `INSERT INTO errors (user_id, app_version, os, error_type, error_message, target_app, stack_trace)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/analytics/user-action', authenticate, async (req, res) => {
  const { userId, actionType, targetApp, appVersion, os } = req.body;
  
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      `INSERT INTO user_actions (user_id, action_type, target_app, app_version, os)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, actionType, targetApp, appVersion, os]
    );
    res.json({ success: true, id: result.insertId });
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

    const results = await Promise.all(queries.map(query => pool.execute(query)));
    
    res.json({
      totalReplacements: results[0][0][0].total_replacements || 0,
      uniqueUsers: results[1][0][0].unique_users || 0,
      totalErrors: results[2][0][0].total_errors || 0,
      avgResponseTime: Math.round(results[3][0][0].avg_response_time || 0)
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/metrics/users', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(`
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
    res.json(rows || []);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/metrics/usage', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as replacements,
        COUNT(DISTINCT user_id) as unique_users
      FROM text_replacements 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(timestamp) 
      ORDER BY date DESC
    `);
    res.json(rows || []);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/metrics/errors', authenticate, async (req, res) => {
  const limit = req.query.limit || 10;
  try {
    const pool = getPool();
    const [rows] = await pool.execute(`
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
    res.json(rows || []);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Export the app for Vercel serverless functions
module.exports = app;