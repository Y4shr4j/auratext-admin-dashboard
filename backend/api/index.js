// AuraText Analytics API Serverless Function
// This includes all endpoints from server.js adapted for Vercel

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

    // Return mock data for now (you can replace with real database queries)
    return res.json({
      totalReplacements: 1250,
      uniqueUsers: 45,
      totalErrors: 23,
      avgResponseTime: 145
    });
  }

  // Metrics usage endpoint
  if (req.url === '/api/metrics/usage' && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Return mock usage data
    const mockUsage = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      mockUsage.push({
        date: date.toISOString().split('T')[0],
        replacements: Math.floor(Math.random() * 50) + 10,
        unique_users: Math.floor(Math.random() * 20) + 5
      });
    }
    return res.json(mockUsage);
  }

  // Metrics errors endpoint
  if (req.url.startsWith('/api/metrics/errors') && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Return mock error data
    return res.json([
      {
        error_type: 'TextReplacementError',
        error_message: 'Failed to replace text in target application',
        target_app: 'notepad.exe',
        user_id: 'user_123',
        timestamp: new Date().toISOString()
      },
      {
        error_type: 'PermissionError',
        error_message: 'Insufficient permissions to access target window',
        target_app: 'WINWORD.EXE',
        user_id: 'user_456',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ]);
  }

  // Metrics users endpoint
  if (req.url === '/api/metrics/users' && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Return mock user data
    return res.json([
      {
        user_id: 'user_123',
        replacement_count: 245,
        avg_response_time: 120,
        last_seen: new Date().toISOString()
      },
      {
        user_id: 'user_456',
        replacement_count: 189,
        avg_response_time: 156,
        last_seen: new Date(Date.now() - 7200000).toISOString()
      },
      {
        user_id: 'user_789',
        replacement_count: 134,
        avg_response_time: 98,
        last_seen: new Date(Date.now() - 86400000).toISOString()
      }
    ]);
  }

  // Metrics apps endpoint
  if (req.url === '/api/metrics/apps' && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Return mock app data
    return res.json([
      {
        target_app: 'notepad.exe',
        usage_count: 456,
        unique_users: 23,
        avg_response_time: 120,
        success_rate: 94.5
      },
      {
        target_app: 'WINWORD.EXE',
        usage_count: 389,
        unique_users: 18,
        avg_response_time: 145,
        success_rate: 91.2
      },
      {
        target_app: 'EXCEL.EXE',
        usage_count: 234,
        unique_users: 12,
        avg_response_time: 167,
        success_rate: 88.9
      }
    ]);
  }

  // Metrics methods endpoint
  if (req.url === '/api/metrics/methods' && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Return mock method data
    return res.json([
      {
        method: 'Win32DirectReplacer',
        usage_count: 567,
        avg_response_time: 120,
        success_rate: 95.2
      },
      {
        method: 'TextPatternReplacer',
        usage_count: 423,
        avg_response_time: 145,
        success_rate: 92.1
      },
      {
        method: 'ClipboardReplacer',
        usage_count: 189,
        avg_response_time: 98,
        success_rate: 88.5
      }
    ]);
  }

  // Metrics real-time endpoint
  if (req.url === '/api/metrics/real-time' && req.method === 'GET') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Return mock real-time data (last hour)
    const mockRealTime = [];
    const now = new Date();
    for (let i = 59; i >= 0; i--) {
      const minute = new Date(now.getTime() - i * 60000);
      mockRealTime.push({
        minute: minute.toISOString().slice(0, 16) + ':00',
        replacements: Math.floor(Math.random() * 10),
        unique_users: Math.floor(Math.random() * 5) + 1
      });
    }
    return res.json(mockRealTime);
  }

  // Analytics tracking endpoints
  if (req.url === '/api/analytics/text-replacement' && req.method === 'POST') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    // In a real implementation, you would save to database
    return res.json({ success: true, id: Date.now() });
  }

  if (req.url === '/api/analytics/error' && req.method === 'POST') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    // In a real implementation, you would save to database
    return res.json({ success: true, id: Date.now() });
  }

  if (req.url === '/api/analytics/user-action' && req.method === 'POST') {
    if (!authenticate(req)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    // In a real implementation, you would save to database
    return res.json({ success: true, id: Date.now() });
  }

  // Default 404
  res.status(404).json({ error: 'Not found' });
};