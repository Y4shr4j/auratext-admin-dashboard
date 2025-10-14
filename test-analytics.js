// Test script to verify analytics integration
// Run this in your main AuraText project to test the analytics

const AnalyticsService = require('./AnalyticsService');

console.log('🧪 Testing AuraText Analytics Integration...\n');

// Test 1: Check if AnalyticsService is working
console.log('✅ AnalyticsService loaded successfully');
console.log(`📊 Dashboard URL: ${AnalyticsService.dashboardUrl}`);
console.log(`🔑 API Key: ${AnalyticsService.apiKey.substring(0, 10)}...`);
console.log(`👤 User ID: ${AnalyticsService.userId}`);

// Test 2: Track a sample user action
console.log('\n📝 Testing user action tracking...');
AnalyticsService.trackUserAction({
  type: 'test_integration',
  data: {
    test: true,
    timestamp: new Date().toISOString()
  }
});
console.log('✅ User action tracked');

// Test 3: Track a sample text replacement
console.log('\n✏️ Testing text replacement tracking...');
AnalyticsService.trackTextReplacement({
  success: true,
  method: 'Win32DirectReplacer',
  targetApp: 'notepad.exe',
  textLength: 25,
  responseTime: 150
});
console.log('✅ Text replacement tracked');

// Test 4: Track a sample error
console.log('\n⚠️ Testing error tracking...');
AnalyticsService.trackError({
  type: 'test_error',
  message: 'This is a test error for integration verification',
  targetApp: 'test-app',
  stack: 'Test stack trace'
});
console.log('✅ Error tracked');

console.log('\n🎉 Integration test completed!');
console.log('📊 Check your dashboard to see if the test data appears');
console.log('🔗 Dashboard URL:', AnalyticsService.dashboardUrl);

// Test 5: Check analytics status
console.log('\n⚙️ Analytics Status:');
console.log(`Enabled: ${AnalyticsService.isAnalyticsEnabled()}`);
console.log(`Service Enabled: ${AnalyticsService.isEnabled}`);

console.log('\n✨ Ready for integration!');
