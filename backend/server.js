const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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
      app_version TEXT,
      os TEXT,
      action_type TEXT,
      action_data TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users table (for unique user tracking)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      app_version TEXT,
      os TEXT
    )
  `);
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || token !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  next();
};

// Rate limiting (simple in-memory store)
const rateLimit = {};
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimit[ip]) {
    rateLimit[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
  } else if (now > rateLimit[ip].resetTime) {
    rateLimit[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
  } else {
    rateLimit[ip].count++;
  }
  
  if (rateLimit[ip].count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  next();
};

// API Routes

// Track text replacement
app.post('/api/track/replacement', authenticate, rateLimiter, (req, res) => {
  const { userId, appVersion, os, success, method, targetApp, textLength, responseTime } = req.body;
  
  // Validate required fields
  if (!userId || success === undefined || !method || !targetApp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Update or insert user record
  db.run(`
    INSERT OR REPLACE INTO users (user_id, last_seen, app_version, os)
    VALUES (?, CURRENT_TIMESTAMP, ?, ?)
  `, [userId, appVersion, os]);
  
  // Insert replacement record
  db.run(`
    INSERT INTO text_replacements 
    (user_id, app_version, os, success, method, target_app, text_length, response_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, appVersion, os, success, method, targetApp, textLength, responseTime], function(err) {
    if (err) {
      console.error('Error inserting replacement:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// Track error
app.post('/api/track/error', authenticate, rateLimiter, (req, res) => {
  const { userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace } = req.body;
  
  if (!userId || !errorType || !errorMessage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Update user record
  db.run(`
    INSERT OR REPLACE INTO users (user_id, last_seen, app_version, os)
    VALUES (?, CURRENT_TIMESTAMP, ?, ?)
  `, [userId, appVersion, os]);
  
  // Insert error record
  db.run(`
    INSERT INTO errors 
    (user_id, app_version, os, error_type, error_message, target_app, stack_trace)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace], function(err) {
    if (err) {
      console.error('Error inserting error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// Track user action
app.post('/api/track/user-action', authenticate, rateLimiter, (req, res) => {
  const { userId, appVersion, os, actionType, actionData } = req.body;
  
  if (!userId || !actionType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Update user record
  db.run(`
    INSERT OR REPLACE INTO users (user_id, last_seen, app_version, os)
    VALUES (?, CURRENT_TIMESTAMP, ?, ?)
  `, [userId, appVersion, os]);
  
  // Insert action record
  db.run(`
    INSERT INTO user_actions 
    (user_id, app_version, os, action_type, action_data)
    VALUES (?, ?, ?, ?, ?)
  `, [userId, appVersion, os, actionType, JSON.stringify(actionData)], function(err) {
    if (err) {
      console.error('Error inserting action:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// Dashboard API Routes (no authentication needed for dashboard access)

// Get overview metrics
app.get('/api/metrics/overview', (req, res) => {
  const queries = {
    totalUsers: 'SELECT COUNT(DISTINCT user_id) as count FROM users',
    todayUsers: 'SELECT COUNT(DISTINCT user_id) as count FROM users WHERE DATE(last_seen) = DATE("now")',
    totalReplacements: 'SELECT COUNT(*) as count FROM text_replacements',
    todayReplacements: 'SELECT COUNT(*) as count FROM text_replacements WHERE DATE(timestamp) = DATE("now")',
    successRate: 'SELECT (COUNT(CASE WHEN success = 1 THEN 1 END) * 100.0 / COUNT(*)) as rate FROM text_replacements',
    recentErrors: 'SELECT * FROM errors ORDER BY timestamp DESC LIMIT 10'
  };
  
  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;
  
  Object.entries(queries).forEach(([key, query]) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error(`Error in ${key}:`, err);
        results[key] = key === 'recentErrors' ? [] : 0;
      } else {
        results[key] = key === 'recentErrors' ? rows : (rows[0]?.count || rows[0]?.rate || 0);
      }
      
      completed++;
      if (completed === totalQueries) {
        res.json(results);
      }
    });
  });
});

// Get user statistics
app.get('/api/metrics/users', (req, res) => {
  const query = `
    SELECT 
      DATE(first_seen) as date,
      COUNT(*) as new_users
    FROM users 
    WHERE first_seen >= DATE('now', '-7 days')
    GROUP BY DATE(first_seen)
    ORDER BY date
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error getting user stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get usage statistics
app.get('/api/metrics/usage', (req, res) => {
  const query = `
    SELECT 
      target_app,
      COUNT(*) as count,
      (COUNT(CASE WHEN success = 1 THEN 1 END) * 100.0 / COUNT(*)) as success_rate
    FROM text_replacements 
    WHERE timestamp >= DATE('now', '-7 days')
    GROUP BY target_app
    ORDER BY count DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error getting usage stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get error logs
app.get('/api/metrics/errors', (req, res) => {
  const limit = req.query.limit || 50;
  const query = `
    SELECT * FROM errors 
    ORDER BY timestamp DESC 
    LIMIT ?
  `;
  
  db.all(query, [limit], (err, rows) => {
    if (err) {
      console.error('Error getting error logs:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get replacement history
app.get('/api/metrics/replacements', (req, res) => {
  const limit = req.query.limit || 100;
  const query = `
    SELECT 
      tr.*,
      u.first_seen
    FROM text_replacements tr
    LEFT JOIN users u ON tr.user_id = u.user_id
    ORDER BY tr.timestamp DESC 
    LIMIT ?
  `;
  
  db.all(query, [limit], (err, rows) => {
    if (err) {
      console.error('Error getting replacement history:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AuraText Admin Dashboard API running on port ${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log(`🔑 API Key: ${process.env.API_KEY ? 'Set' : 'Not set'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});
