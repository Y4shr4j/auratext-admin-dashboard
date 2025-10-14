// 🚀 Quick Integration Script for AuraText
// Copy this code to your AuraText project and modify as needed

// =============================================================================
// STEP 1: Copy this code to your main.js or App.js file
// =============================================================================

// Import the analytics service (adjust path as needed)
import AnalyticsService from './services/AnalyticsService';

// Initialize analytics
const analytics = new AnalyticsService();
window.AnalyticsService = analytics;

// Track app startup
analytics.trackUserAction({
  type: 'app_started',
  data: { 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }
});

console.log('✅ Analytics initialized successfully!');

// =============================================================================
// STEP 2: Wrap your text replacement function with analytics
// =============================================================================

// Example: Wrap your existing replacement function
async function replaceTextWithAnalytics(targetWindow, oldText, newText, method = 'Win32DirectReplacer') {
  const startTime = Date.now();
  
  try {
    // Call your existing replacement function here
    const success = await yourExistingReplacementFunction(targetWindow, oldText, newText);
    
    // Track successful replacement
    AnalyticsService.trackTextReplacement({
      success: success,
      method: method,
      targetApp: getTargetAppName(targetWindow),
      textLength: newText.length,
      responseTime: Date.now() - startTime
    });
    
    return success;
  } catch (error) {
    // Track failed replacement
    AnalyticsService.trackTextReplacement({
      success: false,
      method: method,
      targetApp: getTargetAppName(targetWindow),
      textLength: 0,
      responseTime: Date.now() - startTime
    });
    
    // Track the error
    AnalyticsService.trackError({
      type: 'TextReplacementError',
      message: error.message,
      targetApp: getTargetAppName(targetWindow),
      stack: error.stack
    });
    
    throw error;
  }
}

// Helper function to get target app name
function getTargetAppName(targetWindow) {
  try {
    return targetWindow.process?.mainModule?.filename || 
           targetWindow.location?.hostname || 
           targetWindow.title ||
           'unknown_app';
  } catch (error) {
    return 'unknown_app';
  }
}

// =============================================================================
// STEP 3: Add error tracking (copy this to your error handling)
// =============================================================================

// Global error handler
window.addEventListener('error', (event) => {
  AnalyticsService.trackError({
    type: 'JavaScriptError',
    message: event.error?.message || 'Unknown error',
    targetApp: 'auratext_main',
    stack: event.error?.stack
  });
});

// Promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  AnalyticsService.trackError({
    type: 'PromiseRejectionError',
    message: event.reason?.message || 'Unhandled promise rejection',
    targetApp: 'auratext_main',
    stack: event.reason?.stack
  });
});

// =============================================================================
// STEP 4: Add user action tracking (copy this to your event handlers)
// =============================================================================

// Track hotkey usage
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'R') {
    AnalyticsService.trackUserAction({
      type: 'hotkey_used',
      data: { 
        hotkey: 'Ctrl+Shift+R',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Track button clicks (modify button names as needed)
document.addEventListener('click', (event) => {
  if (event.target.id === 'replace-button') {
    AnalyticsService.trackUserAction({
      type: 'replace_button_clicked',
      data: { 
        button: 'replace',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  if (event.target.id === 'settings-button') {
    AnalyticsService.trackUserAction({
      type: 'settings_button_clicked',
      data: { 
        button: 'settings',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// =============================================================================
// STEP 5: Test function (call this to verify integration works)
// =============================================================================

function testAnalyticsIntegration() {
  console.log('🧪 Testing analytics integration...');
  
  // Test user action
  AnalyticsService.trackUserAction({
    type: 'test_action',
    data: { test: true, timestamp: new Date().toISOString() }
  });
  
  // Test text replacement
  AnalyticsService.trackTextReplacement({
    success: true,
    method: 'TestReplacer',
    targetApp: 'test_app.exe',
    textLength: 100,
    responseTime: 50
  });
  
  // Test error tracking
  AnalyticsService.trackError({
    type: 'TestError',
    message: 'This is a test error from AuraText',
    targetApp: 'test_app.exe'
  });
  
  console.log('✅ Analytics test completed! Check your dashboard for data.');
  console.log('📊 Dashboard URL: https://auratext-admin-dashboard.vercel.app');
}

// Make test function globally available
window.testAnalytics = testAnalyticsIntegration;

// =============================================================================
// STEP 6: Integration checklist
// =============================================================================

/*
INTEGRATION CHECKLIST:

✅ Copy AnalyticsService.js to your project
✅ Copy this code to your main.js or App.js
✅ Replace 'yourExistingReplacementFunction' with your actual function name
✅ Modify button IDs in the click handler to match your UI
✅ Test with testAnalytics() function
✅ Check dashboard for live data
✅ Deploy your updated AuraText app

Your analytics integration is complete! 🎉
*/

// =============================================================================
// STEP 7: Optional - Add settings UI
// =============================================================================

// If you want to add analytics settings to your UI:
/*
import AnalyticsSettings from './components/AnalyticsSettings';

// Add to your settings page:
function SettingsPage() {
  return (
    <div>
      <h2>Settings</h2>
      <AnalyticsSettings />
      {/* Your other settings */}
    </div>
  );
}
*/

console.log('🚀 Quick integration script loaded! Call testAnalytics() to test.');
