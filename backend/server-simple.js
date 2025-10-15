const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Database setup
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'analytics.db');
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
      action_details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// API Key Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token || token !== 'auratext_secret_key_2024_launch_secure') {
    return res.status(403).json({ message: 'Forbidden: Invalid API Key' });
  }
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='text_replacements'", (err, row) => {
    if (err) {
      return res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: err.message });
    }
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString(), database: row ? 'connected' : 'not initialized' });
  });
});

// Analytics Endpoints
app.post('/api/analytics/text-replacement', authenticate, (req, res) => {
  const { userId, appVersion, os, success, method, targetApp, textLength, responseTime } = req.body;
  db.run(
    `INSERT INTO text_replacements (user_id, app_version, os, success, method, target_app, text_length, response_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, appVersion, os, success, method, targetApp, textLength, responseTime],
    function (err) {
      if (err) {
        console.error('Error inserting text replacement:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Text replacement tracked', id: this.lastID });
    }
  );
});

app.post('/api/analytics/error', authenticate, (req, res) => {
  const { userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace } = req.body;
  db.run(
    `INSERT INTO errors (user_id, app_version, os, error_type, error_message, target_app, stack_trace) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace],
    function (err) {
      if (err) {
        console.error('Error inserting error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Error tracked', id: this.lastID });
    }
  );
});

app.post('/api/analytics/user-action', authenticate, (req, res) => {
  const { userId, appVersion, os, actionType, actionDetails } = req.body;
  db.run(
    `INSERT INTO user_actions (user_id, app_version, os, action_type, action_details) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, appVersion, os, actionType, actionDetails],
    function (err) {
      if (err) {
        console.error('Error inserting user action:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'User action tracked', id: this.lastID });
    }
  );
});

// Metrics Endpoints (for the dashboard)
app.get('/api/metrics/overview', async (req, res) => {
  try {
    const totalReplacements = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) AS count FROM text_replacements', (err, row) => err ? reject(err) : resolve(row.count));
    });
    const successfulReplacements = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) AS count FROM text_replacements WHERE success = TRUE', (err, row) => err ? reject(err) : resolve(row.count));
    });
    const totalErrors = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) AS count FROM errors', (err, row) => err ? reject(err) : resolve(row.count));
    });
    const uniqueUsers = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(DISTINCT user_id) AS count FROM user_actions', (err, row) => err ? reject(err) : resolve(row.count));
    });
  
  res.json({
      totalReplacements,
      successfulReplacements,
      failedReplacements: totalReplacements - successfulReplacements,
      totalErrors,
    uniqueUsers,
      successRate: totalReplacements > 0 ? (successfulReplacements / totalReplacements) * 100 : 0
    });
  } catch (err) {
    console.error('Error fetching overview metrics:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/metrics/users', async (req, res) => {
  try {
    const usersByOs = await new Promise((resolve, reject) => {
      db.all('SELECT os, COUNT(DISTINCT user_id) AS count FROM user_actions GROUP BY os', (err, rows) => err ? reject(err) : resolve(rows));
    });
    const usersByVersion = await new Promise((resolve, reject) => {
      db.all('SELECT app_version, COUNT(DISTINCT user_id) AS count FROM user_actions GROUP BY app_version', (err, rows) => err ? reject(err) : resolve(rows));
    });
    res.json({ usersByOs, usersByVersion });
  } catch (err) {
    console.error('Error fetching user metrics:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/metrics/usage', async (req, res) => {
  try {
    const replacementsOverTime = await new Promise((resolve, reject) => {
      db.all(`
        SELECT
          strftime('%Y-%m-%d %H:00:00', timestamp) AS hour,
          COUNT(*) AS count
        FROM text_replacements
        GROUP BY hour
        ORDER BY hour
        LIMIT 24
      `, (err, rows) => err ? reject(err) : resolve(rows));
    });
    const actionsByType = await new Promise((resolve, reject) => {
      db.all('SELECT action_type, COUNT(*) AS count FROM user_actions GROUP BY action_type', (err, rows) => err ? reject(err) : resolve(rows));
    });
    res.json({ replacementsOverTime, actionsByType });
  } catch (err) {
    console.error('Error fetching usage metrics:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/metrics/errors', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recentErrors = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM errors ORDER BY timestamp DESC LIMIT ?', [limit], (err, rows) => err ? reject(err) : resolve(rows));
    });
    const errorTypes = await new Promise((resolve, reject) => {
      db.all('SELECT error_type, COUNT(*) AS count FROM errors GROUP BY error_type', (err, rows) => err ? reject(err) : resolve(rows));
    });
    res.json({ recentErrors, errorTypes });
  } catch (err) {
    console.error('Error fetching error metrics:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Dashboard API running on port ${PORT}`);
});

module.exports = app;
