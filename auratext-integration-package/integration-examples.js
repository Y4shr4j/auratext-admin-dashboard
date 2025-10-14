// AuraText Integration Examples
// Use these examples to integrate analytics into your AuraText software

// =============================================================================
// 1. INITIALIZATION - Add this to your main app file (main.js or App.js)
// =============================================================================

import AnalyticsService from './services/AnalyticsService';

// Initialize analytics service
const analytics = new AnalyticsService();

// Make it globally available
window.AnalyticsService = analytics;

// Track app startup
document.addEventListener('DOMContentLoaded', () => {
  analytics.trackUserAction({
    type: 'app_started',
    data: { 
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
  });
});

// =============================================================================
// 2. TEXT REPLACEMENT TRACKING - Add to your text replacement functions
// =============================================================================

async function replaceText(targetWindow, oldText, newText, method = 'Win32DirectReplacer') {
  const startTime = Date.now();
  
  try {
    // Your existing text replacement logic here
    const success = await performTextReplacement(targetWindow, oldText, newText);
    
    // Track successful replacement
    AnalyticsService.trackTextReplacement({
      success: success,
      method: method,
      targetApp: getTargetAppName(targetWindow), // e.g., 'notepad.exe'
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
           'unknown_app';
  } catch (error) {
    return 'unknown_app';
  }
}

// =============================================================================
// 3. ERROR TRACKING - Add to your error handling
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
// 4. USER ACTION TRACKING - Add to user interactions
// =============================================================================

// Track settings changes
function updateSetting(settingName, value) {
  // Your existing setting update logic
  updateSettingValue(settingName, value);
  
  // Track the change
  AnalyticsService.trackUserAction({
    type: 'setting_changed',
    data: { 
      setting: settingName, 
      value: value,
      timestamp: new Date().toISOString()
    }
  });
}

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

// Track button clicks
function trackButtonClick(buttonName) {
  AnalyticsService.trackUserAction({
    type: 'button_clicked',
    data: { 
      button: buttonName,
      timestamp: new Date().toISOString()
    }
  });
}

// =============================================================================
// 5. METHOD-SPECIFIC TRACKING - Add to different replacement methods
// =============================================================================

// Win32 Direct Replacement
async function win32DirectReplace(targetWindow, oldText, newText) {
  const startTime = Date.now();
  
  try {
    // Your Win32 replacement logic
    const success = await performWin32Replacement(targetWindow, oldText, newText);
    
    AnalyticsService.trackTextReplacement({
      success: success,
      method: 'Win32DirectReplacer',
      targetApp: getTargetAppName(targetWindow),
      textLength: newText.length,
      responseTime: Date.now() - startTime
    });
    
    return success;
  } catch (error) {
    AnalyticsService.trackError({
      type: 'Win32ReplacementError',
      message: error.message,
      targetApp: getTargetAppName(targetWindow),
      stack: error.stack
    });
    throw error;
  }
}

// Text Pattern Replacement
async function textPatternReplace(targetWindow, pattern, replacement) {
  const startTime = Date.now();
  
  try {
    // Your pattern replacement logic
    const success = await performPatternReplacement(targetWindow, pattern, replacement);
    
    AnalyticsService.trackTextReplacement({
      success: success,
      method: 'TextPatternReplacer',
      targetApp: getTargetAppName(targetWindow),
      textLength: replacement.length,
      responseTime: Date.now() - startTime
    });
    
    return success;
  } catch (error) {
    AnalyticsService.trackError({
      type: 'PatternReplacementError',
      message: error.message,
      targetApp: getTargetAppName(targetWindow),
      stack: error.stack
    });
    throw error;
  }
}

// Clipboard Replacement
async function clipboardReplace(targetWindow, newText) {
  const startTime = Date.now();
  
  try {
    // Your clipboard replacement logic
    const success = await performClipboardReplacement(targetWindow, newText);
    
    AnalyticsService.trackTextReplacement({
      success: success,
      method: 'ClipboardReplacer',
      targetApp: getTargetAppName(targetWindow),
      textLength: newText.length,
      responseTime: Date.now() - startTime
    });
    
    return success;
  } catch (error) {
    AnalyticsService.trackError({
      type: 'ClipboardReplacementError',
      message: error.message,
      targetApp: getTargetAppName(targetWindow),
      stack: error.stack
    });
    throw error;
  }
}

// =============================================================================
// 6. APP-SPECIFIC TRACKING - Add for different target applications
// =============================================================================

// Notepad tracking
function trackNotepadReplacement(success, textLength, responseTime) {
  AnalyticsService.trackTextReplacement({
    success: success,
    method: 'Win32DirectReplacer',
    targetApp: 'notepad.exe',
    textLength: textLength,
    responseTime: responseTime
  });
}

// Word tracking
function trackWordReplacement(success, textLength, responseTime) {
  AnalyticsService.trackTextReplacement({
    success: success,
    method: 'TextPatternReplacer',
    targetApp: 'WINWORD.EXE',
    textLength: textLength,
    responseTime: responseTime
  });
}

// Excel tracking
function trackExcelReplacement(success, textLength, responseTime) {
  AnalyticsService.trackTextReplacement({
    success: success,
    method: 'ClipboardReplacer',
    targetApp: 'EXCEL.EXE',
    textLength: textLength,
    responseTime: responseTime
  });
}

// =============================================================================
// 7. SETTINGS UI INTEGRATION - Add to your settings page
// =============================================================================

// Import the settings component
import AnalyticsSettings from './components/AnalyticsSettings';

// Add to your settings page component
function SettingsPage() {
  return (
    <div className="settings-page">
      {/* Your existing settings */}
      <div className="setting-section">
        <h3>General Settings</h3>
        {/* Your general settings */}
      </div>
      
      <div className="setting-section">
        <h3>Advanced Settings</h3>
        {/* Your advanced settings */}
      </div>
      
      {/* Analytics Settings */}
      <AnalyticsSettings />
    </div>
  );
}

// =============================================================================
// 8. TESTING INTEGRATION - Use this to test your integration
// =============================================================================

function testAnalyticsIntegration() {
  console.log('Testing analytics integration...');
  
  // Test user action tracking
  AnalyticsService.trackUserAction({
    type: 'test_action',
    data: { test: true }
  });
  
  // Test text replacement tracking
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
    message: 'This is a test error',
    targetApp: 'test_app.exe'
  });
  
  console.log('Analytics test completed. Check your dashboard for data.');
}

// =============================================================================
// 9. ENVIRONMENT CONFIGURATION - Add to your config
// =============================================================================

const ANALYTICS_CONFIG = {
  enabled: true,
  dashboardUrl: 'https://auratext-admin-dashboard.vercel.app',
  apiKey: 'auratext_secret_key_2024_launch_secure',
  batchSize: 10, // Optional: batch multiple requests
  flushInterval: 5000, // Optional: flush every 5 seconds
  debug: false // Set to true for development
};

// =============================================================================
// 10. USAGE EXAMPLES - How to use in your actual code
// =============================================================================

// Example 1: In your main replacement function
async function performTextReplacement(targetWindow, oldText, newText) {
  const startTime = Date.now();
  
  try {
    // Your replacement logic here
    const result = await actualReplacementLogic(targetWindow, oldText, newText);
    
    // Track success
    AnalyticsService.trackTextReplacement({
      success: true,
      method: 'CustomReplacer',
      targetApp: targetWindow.title || 'unknown',
      textLength: newText.length,
      responseTime: Date.now() - startTime
    });
    
    return result;
  } catch (error) {
    // Track failure
    AnalyticsService.trackTextReplacement({
      success: false,
      method: 'CustomReplacer',
      targetApp: targetWindow.title || 'unknown',
      textLength: 0,
      responseTime: Date.now() - startTime
    });
    
    throw error;
  }
}

// Example 2: In your error handling
function handleReplacementError(error, context) {
  console.error('Replacement error:', error);
  
  // Track the error
  AnalyticsService.trackError({
    type: 'ReplacementError',
    message: error.message,
    targetApp: context.targetApp || 'unknown',
    stack: error.stack
  });
  
  // Show user-friendly error message
  showErrorMessage('Text replacement failed. Please try again.');
}

// Example 3: In your UI event handlers
function onReplaceButtonClick() {
  // Track the button click
  AnalyticsService.trackUserAction({
    type: 'replace_button_clicked',
    data: { 
      timestamp: new Date().toISOString(),
      context: 'main_ui'
    }
  });
  
  // Your button click logic
  performReplacement();
}

// =============================================================================
// INTEGRATION CHECKLIST
// =============================================================================

/*
✅ Copy AnalyticsService.js to your project
✅ Initialize analytics in your main app
✅ Add tracking to text replacement functions
✅ Add error tracking with try-catch blocks
✅ Add user action tracking for key events
✅ Test with a few text replacements
✅ Check dashboard for live data
✅ Add AnalyticsSettings component (optional)
✅ Deploy your updated AuraText app

Your analytics integration is complete! 🎉
*/
