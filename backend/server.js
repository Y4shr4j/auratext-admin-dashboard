const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
// Remove PORT since we're not listening in serverless mode

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'analytics.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Text replacements table
  db.run(`
    CREATE TABLE IF NOT EXISTS text_replacements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      app_version TEXT,
      os TEXT,
      success BOOLEAN,
      method TEXT,
      target_app TEXT,
      text_length INTEGER,
      response_time INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Errors table
  db.run(`
    CREATE TABLE IF NOT EXISTS errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      app_version TEXT,
      os TEXT,
      error_type TEXT,
      error_message TEXT,
      target_app TEXT,
      stack_trace TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User actions table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action_type TEXT,
      target_app TEXT,
      app_version TEXT,
      os TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

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
app.post('/api/analytics/text-replacement', authenticate, (req, res) => {
  const { userId, appVersion, os, success, method, targetApp, textLength, responseTime } = req.body;
  
  db.run(
    `INSERT INTO text_replacements (user_id, app_version, os, success, method, target_app, text_length, response_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, appVersion, os, success, method, targetApp, textLength, responseTime],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.post('/api/analytics/error', authenticate, (req, res) => {
  const { userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace } = req.body;
  
  db.run(
    `INSERT INTO errors (user_id, app_version, os, error_type, error_message, target_app, stack_trace)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.post('/api/analytics/user-action', authenticate, (req, res) => {
  const { userId, actionType, targetApp, appVersion, os } = req.body;
  
  db.run(
    `INSERT INTO user_actions (user_id, action_type, target_app, app_version, os)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, actionType, targetApp, appVersion, os],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Metrics endpoints
app.get('/api/metrics/overview', authenticate, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_replacements FROM text_replacements',
    'SELECT COUNT(DISTINCT user_id) as unique_users FROM text_replacements',
    'SELECT COUNT(*) as total_errors FROM errors',
    'SELECT AVG(response_time) as avg_response_time FROM text_replacements WHERE response_time IS NOT NULL'
  ];

  Promise.all(queries.map(query => new Promise((resolve, reject) => {
    db.get(query, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }))).then(results => {
    res.json({
      totalReplacements: results[0].total_replacements || 0,
      uniqueUsers: results[1].unique_users || 0,
      totalErrors: results[2].total_errors || 0,
      avgResponseTime: Math.round(results[3].avg_response_time || 0)
    });
  }).catch(err => {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  });
});

app.get('/api/metrics/users', authenticate, (req, res) => {
  db.all(`
    SELECT 
      user_id,
      COUNT(*) as replacement_count,
      AVG(response_time) as avg_response_time,
      MAX(timestamp) as last_seen
    FROM text_replacements 
    GROUP BY user_id 
    ORDER BY replacement_count DESC 
    LIMIT 10
  `, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
});

app.get('/api/metrics/usage', authenticate, (req, res) => {
  db.all(`
    SELECT 
      DATE(timestamp) as date,
      COUNT(*) as replacements,
      COUNT(DISTINCT user_id) as unique_users
    FROM text_replacements 
    WHERE timestamp >= datetime('now', '-30 days')
    GROUP BY DATE(timestamp) 
    ORDER BY date DESC
  `, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
});

app.get('/api/metrics/errors', authenticate, (req, res) => {
  const limit = req.query.limit || 10;
  db.all(`
    SELECT 
      error_type,
      error_message,
      target_app,
      timestamp,
      user_id
    FROM errors 
    ORDER BY timestamp DESC 
    LIMIT ?
  `, [limit], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
});

// Export the app for Vercel serverless functions
module.exports = app;