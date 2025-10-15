// Test Backend Connection
const axios = require('axios');

const API_BASE_URL = 'https://auratext-admin-dashboard.vercel.app';
const API_KEY = 'auratext_secret_key_2024_launch_secure';

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...');
  console.log('Backend URL:', API_BASE_URL);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthRes = await axios.get(`${API_BASE_URL}/api/health`);
    console.log('✅ Health check:', healthRes.data);
    
    // Test overview endpoint
    console.log('\n2. Testing overview endpoint...');
    const headers = {
      'Authorization': `Bearer ${API_KEY}`
    };
    
    const overviewRes = await axios.get(`${API_BASE_URL}/api/metrics/overview`, { headers });
    console.log('✅ Overview data:', overviewRes.data);
    
    // Test analytics endpoint
    console.log('\n3. Testing analytics endpoint...');
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
    
    const analyticsRes = await axios.post(`${API_BASE_URL}/api/analytics/text-replacement`, testData, { headers });
    console.log('✅ Analytics tracking:', analyticsRes.data);
    
    console.log('\n🎉 All tests passed! Backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBackendConnection();
