// Test all available endpoints
const axios = require('axios');

const API_BASE_URL = 'https://auratext-admin-dashboard.vercel.app';
const API_KEY = 'auratext_secret_key_2024_launch_secure';

async function testAllEndpoints() {
  console.log('🔍 Testing all available endpoints...');
  console.log('Backend URL:', API_BASE_URL);
  
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };
  
  const endpoints = [
    { method: 'GET', url: '/', name: 'Root' },
    { method: 'GET', url: '/api/health', name: 'Health' },
    { method: 'GET', url: '/api/metrics/overview', name: 'Overview' },
    { method: 'GET', url: '/api/metrics/usage', name: 'Usage' },
    { method: 'GET', url: '/api/metrics/errors', name: 'Errors' },
    { method: 'GET', url: '/api/metrics/users', name: 'Users' },
    { method: 'POST', url: '/api/analytics/text-replacement', name: 'Text Replacement' },
    { method: 'POST', url: '/api/analytics/error', name: 'Error Tracking' },
    { method: 'POST', url: '/api/analytics/user-action', name: 'User Action' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n${endpoint.method} ${endpoint.url} (${endpoint.name})...`);
      
      if (endpoint.method === 'GET') {
        const response = await axios.get(`${API_BASE_URL}${endpoint.url}`, { headers });
        console.log(`✅ ${endpoint.name}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
      } else {
        const testData = {
          userId: 'test_user_123',
          appVersion: '1.0.0',
          os: 'Windows 10',
          success: true,
          method: 'Win32DirectReplacer',
          targetApp: 'notepad.exe',
          textLength: 50,
          responseTime: 120
        };
        
        const response = await axios.post(`${API_BASE_URL}${endpoint.url}`, testData, { headers });
        console.log(`✅ ${endpoint.name}: ${response.status} - ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.response?.status || 'Error'} - ${error.response?.data?.error || error.message}`);
    }
  }
}

testAllEndpoints();
