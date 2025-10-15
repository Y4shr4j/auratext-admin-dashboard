const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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

// Database setup
const dbPath = process.env.DATABASE_PATH || '/tmp/analytics.db';
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

// Root endpoint - Landing page
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AuraText Analytics API Server v3.0 - All Features Enabled!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
    endpoints: {
      health: '/api/health',
      overview: '/api/metrics/overview',
      usage: '/api/metrics/usage',
      errors: '/api/metrics/errors',
      users: '/api/metrics/users',
      apps: '/api/metrics/apps',
      methods: '/api/metrics/methods',
      realTime: '/api/metrics/real-time',
      analytics: {
        textReplacement: '/api/analytics/text-replacement',
        error: '/api/analytics/error',
        userAction: '/api/analytics/user-action'
      }
    },
    documentation: 'Visit your frontend dashboard to view analytics data'
  });
});

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
    `INSERT INTO user_actions (user_id, app_version, os, action_type, action_details) VALUES (?, ?, ?, ?, ?)`,
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

// Additional endpoints for the dashboard
app.get('/api/metrics/apps', async (req, res) => {
  try {
    const apps = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          target_app,
          COUNT(*) as usage_count,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(response_time) as avg_response_time,
          (SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as success_rate
        FROM text_replacements 
        WHERE target_app IS NOT NULL
        GROUP BY target_app 
        ORDER BY usage_count DESC 
        LIMIT 20
      `, (err, rows) => err ? reject(err) : resolve(rows));
    });
    res.json(apps);
  } catch (err) {
    console.error('Error fetching app metrics:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/metrics/methods', async (req, res) => {
  try {
    const methods = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          method,
          COUNT(*) as usage_count,
          AVG(response_time) as avg_response_time,
          (SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as success_rate
        FROM text_replacements 
        WHERE method IS NOT NULL
        GROUP BY method 
        ORDER BY usage_count DESC
      `, (err, rows) => err ? reject(err) : resolve(rows));
    });
    res.json(methods);
  } catch (err) {
    console.error('Error fetching method metrics:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/metrics/real-time', async (req, res) => {
  try {
    const realTime = await new Promise((resolve, reject) => {
      db.all(`
        SELECT
          strftime('%Y-%m-%d %H:%M:00', timestamp) AS minute,
          COUNT(*) as replacements,
          COUNT(DISTINCT user_id) as unique_users
        FROM text_replacements
        WHERE timestamp >= datetime('now', '-1 hour')
        GROUP BY minute
        ORDER BY minute DESC
        LIMIT 60
      `, (err, rows) => err ? reject(err) : resolve(rows));
    });
    res.json(realTime);
  } catch (err) {
    console.error('Error fetching real-time metrics:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Populate database with sample data for demonstration
const populateSampleData = () => {
  console.log('Populating database with sample data...');
  
  // Sample text replacements
  const sampleReplacements = [
    ['user_001', '1.0.0', 'Windows 10', true, 'Win32DirectReplacer', 'notepad.exe', 50, 120],
    ['user_002', '1.0.0', 'Windows 11', true, 'TextPatternReplacer', 'WINWORD.EXE', 75, 145],
    ['user_001', '1.0.0', 'Windows 10', true, 'Win32DirectReplacer', 'notepad.exe', 30, 98],
    ['user_003', '1.0.0', 'Windows 10', false, 'ClipboardReplacer', 'EXCEL.EXE', 40, 200],
    ['user_002', '1.0.0', 'Windows 11', true, 'TextPatternReplacer', 'WINWORD.EXE', 60, 130],
    ['user_001', '1.0.0', 'Windows 10', true, 'Win32DirectReplacer', 'notepad.exe', 45, 110],
    ['user_004', '1.0.0', 'Windows 10', true, 'Win32DirectReplacer', 'notepad.exe', 35, 125],
    ['user_002', '1.0.0', 'Windows 11', true, 'TextPatternReplacer', 'WINWORD.EXE', 55, 140],
    ['user_003', '1.0.0', 'Windows 10', true, 'ClipboardReplacer', 'EXCEL.EXE', 25, 95],
    ['user_001', '1.0.0', 'Windows 10', true, 'Win32DirectReplacer', 'notepad.exe', 40, 115]
  ];

  // Sample errors
  const sampleErrors = [
    ['user_003', '1.0.0', 'Windows 10', 'ClipboardError', 'Failed to access clipboard', 'EXCEL.EXE', 'Error: Access denied'],
    ['user_005', '1.0.0', 'Windows 11', 'PermissionError', 'Insufficient permissions', 'notepad.exe', 'Error: Access denied']
  ];

  // Sample user actions
  const sampleActions = [
    ['user_001', '1.0.0', 'Windows 10', 'app_started', '{"feature": "text_replacement"}'],
    ['user_002', '1.0.0', 'Windows 11', 'feature_used', '{"feature": "pattern_replacement"}'],
    ['user_003', '1.0.0', 'Windows 10', 'app_started', '{"feature": "text_replacement"}'],
    ['user_001', '1.0.0', 'Windows 10', 'settings_changed', '{"setting": "auto_replace"}'],
    ['user_004', '1.0.0', 'Windows 10', 'app_started', '{"feature": "text_replacement"}']
  ];

  // Insert sample data
  sampleReplacements.forEach(([userId, appVersion, os, success, method, targetApp, textLength, responseTime]) => {
    db.run(
      `INSERT INTO text_replacements (user_id, app_version, os, success, method, target_app, text_length, response_time, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-${Math.floor(Math.random() * 7)} days', '+${Math.floor(Math.random() * 24)} hours', '+${Math.floor(Math.random() * 60)} minutes'))`,
      [userId, appVersion, os, success, method, targetApp, textLength, responseTime]
    );
  });

  sampleErrors.forEach(([userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace]) => {
    db.run(
      `INSERT INTO errors (user_id, app_version, os, error_type, error_message, target_app, stack_trace, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-${Math.floor(Math.random() * 3)} days', '+${Math.floor(Math.random() * 24)} hours', '+${Math.floor(Math.random() * 60)} minutes'))`,
      [userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace]
    );
  });

  sampleActions.forEach(([userId, appVersion, os, actionType, actionDetails]) => {
    db.run(
      `INSERT INTO user_actions (user_id, app_version, os, action_type, action_details, timestamp) VALUES (?, ?, ?, ?, ?, datetime('now', '-${Math.floor(Math.random() * 7)} days', '+${Math.floor(Math.random() * 24)} hours', '+${Math.floor(Math.random() * 60)} minutes'))`,
      [userId, appVersion, os, actionType, actionDetails]
    );
  });

  console.log('Sample data populated successfully!');
};

// Populate sample data after a short delay
setTimeout(populateSampleData, 2000);

// Export the app for Vercel Serverless Functions
module.exports = app;