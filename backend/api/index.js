// Simple working serverless function
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

  // Root endpoint
  if (req.url === '/' && req.method === 'GET') {
    return res.json({
      message: '🚀 AuraText Analytics API Server is Running!',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      endpoints: {
        health: '/api/health',
        overview: '/api/metrics/overview'
      }
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

  // Metrics overview endpoint (simplified)
  if (req.url === '/api/metrics/overview' && req.method === 'GET') {
    // Check authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token || token !== 'auratext_secret_key_2024_launch_secure') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Return mock data for now
    return res.json({
      totalReplacements: 0,
      uniqueUsers: 0,
      totalErrors: 0,
      avgResponseTime: 0
    });
  }

  // Metrics usage endpoint (simplified)
  if (req.url === '/api/metrics/usage' && req.method === 'GET') {
    // Check authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token || token !== 'auratext_secret_key_2024_launch_secure') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    return res.json([]);
  }

  // Metrics errors endpoint (simplified)
  if (req.url.startsWith('/api/metrics/errors') && req.method === 'GET') {
    // Check authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token || token !== 'auratext_secret_key_2024_launch_secure') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    return res.json([]);
  }

  // Default 404
  res.status(404).json({ error: 'Not found' });
};