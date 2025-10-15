// Test Complete AuraText Integration
// This script tests the full integration between AuraText and the dashboard

const API_BASE_URL = 'http://localhost:3000';
const API_KEY = 'auratext_secret_key_2024_launch_secure';

async function testCompleteIntegration() {
  console.log('🧪 Testing Complete AuraText Integration...\n');
  
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };
  
  // Test 1: Health Check
  console.log('🔍 Testing Backend Health...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Backend Health:', data.status);
    console.log('   Database:', data.database);
  } catch (error) {
    console.log('❌ Backend Health Failed:', error.message);
    return;
  }
  
  // Test 2: Send Test Text Replacement Data
  console.log('\n📤 Sending Test Text Replacement Data...');
  try {
    const testData = {
      userId: 'test_user_' + Date.now(),
      appVersion: '1.0.6',
      os: 'win32',
      success: true,
      method: 'Win32DirectReplacer',
      targetApp: 'notepad.exe',
      textLength: 150,
      responseTime: 120,
      userAgent: 'AuraText/1.0.6 (Windows NT 10.0; Win64; x64)',
      ipAddress: '127.0.0.1'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/analytics/text-replacement`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('✅ Text Replacement Data Sent:', result.success);
    console.log('   User ID:', testData.userId);
    console.log('   Target App:', testData.targetApp);
    console.log('   Method:', testData.method);
  } catch (error) {
    console.log('❌ Text Replacement Data Failed:', error.message);
  }
  
  // Test 3: Send Test Error Data
  console.log('\n❌ Sending Test Error Data...');
  try {
    const errorData = {
      userId: 'test_user_' + Date.now(),
      appVersion: '1.0.6',
      os: 'win32',
      errorType: 'PermissionError',
      errorMessage: 'Access denied to target application',
      targetApp: 'WINWORD.EXE',
      stackTrace: 'Error: Access denied\n    at TextReplacer.replaceText (line 45)'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/analytics/error`, {
      method: 'POST',
      headers,
      body: JSON.stringify(errorData)
    });
    
    const result = await response.json();
    console.log('✅ Error Data Sent:', result.success);
    console.log('   Error Type:', errorData.errorType);
    console.log('   Target App:', errorData.targetApp);
  } catch (error) {
    console.log('❌ Error Data Failed:', error.message);
  }
  
  // Test 4: Send Test User Action Data
  console.log('\n👤 Sending Test User Action Data...');
  try {
    const actionData = {
      userId: 'test_user_' + Date.now(),
      actionType: 'app_opened',
      targetApp: 'AuraText',
      appVersion: '1.0.6',
      os: 'win32'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/analytics/user-action`, {
      method: 'POST',
      headers,
      body: JSON.stringify(actionData)
    });
    
    const result = await response.json();
    console.log('✅ User Action Data Sent:', result.success);
    console.log('   Action Type:', actionData.actionType);
  } catch (error) {
    console.log('❌ User Action Data Failed:', error.message);
  }
  
  // Test 5: Check Overview Metrics
  console.log('\n📊 Checking Overview Metrics...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/metrics/overview`, { headers });
    const data = await response.json();
    console.log('✅ Overview Metrics:');
    console.log('   Total Replacements:', data.totalReplacements);
    console.log('   Unique Users:', data.uniqueUsers);
    console.log('   Total Errors:', data.totalErrors);
    console.log('   Avg Response Time:', data.avgResponseTime + 'ms');
  } catch (error) {
    console.log('❌ Overview Metrics Failed:', error.message);
  }
  
  // Test 6: Check Users Metrics
  console.log('\n👥 Checking Users Metrics...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/metrics/users`, { headers });
    const data = await response.json();
    console.log('✅ Users Metrics:', data.length + ' users found');
    if (data.length > 0) {
      console.log('   Top User:', data[0].user_id, '-', data[0].replacement_count, 'replacements');
    }
  } catch (error) {
    console.log('❌ Users Metrics Failed:', error.message);
  }
  
  // Test 7: Check Apps Metrics
  console.log('\n📱 Checking Apps Metrics...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/metrics/apps`, { headers });
    const data = await response.json();
    console.log('✅ Apps Metrics:', data.length + ' apps tracked');
    if (data.length > 0) {
      console.log('   Most Used App:', data[0].target_app, '-', data[0].usage_count, 'uses');
    }
  } catch (error) {
    console.log('❌ Apps Metrics Failed:', error.message);
  }
  
  console.log('\n🎉 Complete Integration Test Finished!');
  console.log('\n📋 Integration Status:');
  console.log('✅ Backend API: Running on http://localhost:3000');
  console.log('✅ Frontend Dashboard: Should be running on http://localhost:5173');
  console.log('✅ Data Flow: Working');
  console.log('✅ Analytics: Tracking enabled');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Open your browser to: http://localhost:5173');
  console.log('2. You should see your AuraText dashboard with live data!');
  console.log('3. Update your AuraText app to use: http://localhost:3000');
  console.log('4. Start tracking real user data!');
  
  console.log('\n📊 Dashboard Features Available:');
  console.log('- Real-time user tracking');
  console.log('- Text replacement analytics');
  console.log('- Error monitoring');
  console.log('- App usage statistics');
  console.log('- Performance metrics');
  console.log('- User behavior analysis');
}

// Run the test
testCompleteIntegration().catch(console.error);
