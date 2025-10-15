const express = require('express');
const cors = require('cors');

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

// In-memory storage for testing
let textReplacements = [];
let errors = [];
let userActions = [];

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token || token !== 'auratext_secret_key_2024_launch_secure') {
    return res.sendStatus(403);
  }
  next();
};

// Root endpoint - Landing page
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AuraText Analytics API Server is Running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'in-memory',
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
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'in-memory'
  });
});

// Analytics endpoints
app.post('/api/analytics/text-replacement', authenticate, async (req, res) => {
  const { userId, appVersion, os, success, method, targetApp, textLength, responseTime, userAgent, ipAddress } = req.body;
  
  const replacement = {
    id: Date.now(),
    userId, appVersion, os, success, method, targetApp, textLength, responseTime, userAgent, ipAddress,
    timestamp: new Date().toISOString()
  };
  
  textReplacements.push(replacement);
  
  console.log(`✅ Text replacement tracked: User ${userId}, App ${targetApp}, Success: ${success}`);
  res.json({ success: true, id: replacement.id });
});

app.post('/api/analytics/error', authenticate, async (req, res) => {
  const { userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace } = req.body;
  
  const error = {
    id: Date.now(),
    userId, appVersion, os, errorType, errorMessage, targetApp, stackTrace,
    timestamp: new Date().toISOString()
  };
  
  errors.push(error);
  res.json({ success: true, id: error.id });
});

app.post('/api/analytics/user-action', authenticate, async (req, res) => {
  const { userId, actionType, targetApp, appVersion, os } = req.body;
  
  const action = {
    id: Date.now(),
    userId, actionType, targetApp, appVersion, os,
    timestamp: new Date().toISOString()
  };
  
  userActions.push(action);
  res.json({ success: true, id: action.id });
});

// Metrics endpoints
app.get('/api/metrics/overview', authenticate, async (req, res) => {
  const uniqueUsers = new Set(textReplacements.map(r => r.userId)).size;
  const totalErrors = errors.length;
  const avgResponseTime = textReplacements.length > 0 
    ? Math.round(textReplacements.reduce((sum, r) => sum + (r.responseTime || 0), 0) / textReplacements.length)
    : 0;
  
  res.json({
    totalReplacements: textReplacements.length,
    uniqueUsers,
    totalErrors,
    avgResponseTime
  });
});

app.get('/api/metrics/users', authenticate, async (req, res) => {
  const userStats = {};
  textReplacements.forEach(r => {
    if (!userStats[r.userId]) {
      userStats[r.userId] = { count: 0, responseTimes: [] };
    }
    userStats[r.userId].count++;
    if (r.responseTime) userStats[r.userId].responseTimes.push(r.responseTime);
  });
  
  const users = Object.entries(userStats)
    .map(([userId, stats]) => ({
      user_id: userId,
      replacement_count: stats.count,
      avg_response_time: stats.responseTimes.length > 0 
        ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
        : 0,
      last_seen: textReplacements.filter(r => r.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]?.timestamp
    }))
    .sort((a, b) => b.replacement_count - a.replacement_count)
    .slice(0, 10);
    
  res.json(users);
});

app.get('/api/metrics/usage', authenticate, async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentReplacements = textReplacements.filter(r => new Date(r.timestamp) >= thirtyDaysAgo);
  
  const dailyStats = {};
  recentReplacements.forEach(r => {
    const date = r.timestamp.split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { replacements: 0, users: new Set() };
    }
    dailyStats[date].replacements++;
    dailyStats[date].users.add(r.userId);
  });
  
  const usage = Object.entries(dailyStats)
    .map(([date, stats]) => ({
      date,
      replacements: stats.replacements,
      unique_users: stats.users.size
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
    
  res.json(usage);
});

app.get('/api/metrics/errors', authenticate, async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const recentErrors = errors
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
    .map(err => ({
      error_type: err.errorType,
      error_message: err.errorMessage,
      target_app: err.targetApp,
      timestamp: err.timestamp,
      user_id: err.userId
    }));
    
  res.json(recentErrors);
});

app.get('/api/metrics/apps', authenticate, async (req, res) => {
  const appStats = {};
  textReplacements.forEach(r => {
    if (!appStats[r.targetApp]) {
      appStats[r.targetApp] = { count: 0, users: new Set(), responseTimes: [], successes: 0 };
    }
    appStats[r.targetApp].count++;
    appStats[r.targetApp].users.add(r.userId);
    if (r.responseTime) appStats[r.targetApp].responseTimes.push(r.responseTime);
    if (r.success) appStats[r.targetApp].successes++;
  });
  
  const apps = Object.entries(appStats)
    .map(([targetApp, stats]) => ({
      target_app: targetApp,
      usage_count: stats.count,
      unique_users: stats.users.size,
      avg_response_time: stats.responseTimes.length > 0 
        ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
        : 0,
      success_rate: Math.round((stats.successes / stats.count) * 100)
    }))
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 20);
    
  res.json(apps);
});

app.get('/api/metrics/methods', authenticate, async (req, res) => {
  const methodStats = {};
  textReplacements.forEach(r => {
    if (!methodStats[r.method]) {
      methodStats[r.method] = { count: 0, responseTimes: [], successes: 0 };
    }
    methodStats[r.method].count++;
    if (r.responseTime) methodStats[r.method].responseTimes.push(r.responseTime);
    if (r.success) methodStats[r.method].successes++;
  });
  
  const methods = Object.entries(methodStats)
    .map(([method, stats]) => ({
      method,
      usage_count: stats.count,
      avg_response_time: stats.responseTimes.length > 0 
        ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
        : 0,
      success_rate: Math.round((stats.successes / stats.count) * 100)
    }))
    .sort((a, b) => b.usage_count - a.usage_count);
    
  res.json(methods);
});

app.get('/api/metrics/real-time', authenticate, async (req, res) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentReplacements = textReplacements.filter(r => new Date(r.timestamp) >= oneHourAgo);
  
  const minuteStats = {};
  recentReplacements.forEach(r => {
    const minute = new Date(r.timestamp);
    minute.setSeconds(0, 0);
    const minuteKey = minute.toISOString().slice(0, 16) + ':00';
    
    if (!minuteStats[minuteKey]) {
      minuteStats[minuteKey] = { replacements: 0, users: new Set() };
    }
    minuteStats[minuteKey].replacements++;
    minuteStats[minuteKey].users.add(r.userId);
  });
  
  const realTime = Object.entries(minuteStats)
    .map(([minute, stats]) => ({
      minute,
      replacements: stats.replacements,
      unique_users: stats.users.size
    }))
    .sort((a, b) => new Date(b.minute) - new Date(a.minute))
    .slice(0, 60);
    
  res.json(realTime);
});

// Start server for local development
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 AuraText Analytics API Server (Simple) running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard endpoints available at http://localhost:${PORT}/api/*`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💾 Using in-memory storage for testing`);
  });
}

module.exports = app;
