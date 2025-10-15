# 🚀 AuraText Analytics Integration Guide

This guide shows you exactly what features your AuraText project needs to make the admin dashboard work perfectly with **real data**.

## 📊 Dashboard Features & Required Integration

### **1. 📈 Text Replacement Tracking**
**Dashboard Feature:** Tracks every text replacement operation
**Your App Needs:**
```javascript
// Track successful text replacements
AnalyticsService.trackTextReplacement({
  success: true,
  method: 'Win32DirectReplacer', // or 'TextPatternReplacer', 'ClipboardReplacer'
  targetApp: 'notepad.exe', // Target application name
  textLength: 150, // Length of replaced text
  responseTime: 120 // Time taken in milliseconds
});

// Track failed replacements
AnalyticsService.trackTextReplacement({
  success: false,
  method: 'Win32DirectReplacer',
  targetApp: 'WINWORD.EXE',
  textLength: 0,
  responseTime: 500
});
```

### **2. ❌ Error Tracking**
**Dashboard Feature:** Monitors all errors and failures
**Your App Needs:**
```javascript
// Track errors with detailed information
try {
  // Your text replacement logic here
} catch (error) {
  AnalyticsService.trackError({
    type: 'TextReplacementError',
    message: error.message,
    targetApp: 'notepad.exe',
    stack: error.stack
  });
}
```

### **3. 👤 User Action Tracking**
**Dashboard Feature:** Monitors user behavior and app usage
**Your App Needs:**
```javascript
// Track user actions
AnalyticsService.trackUserAction({
  type: 'app_started',
  data: { version: '1.0.0' }
});

AnalyticsService.trackUserAction({
  type: 'settings_changed',
  data: { setting: 'auto_replace', value: true }
});

AnalyticsService.trackUserAction({
  type: 'hotkey_used',
  data: { hotkey: 'Ctrl+Shift+R' }
});
```

## 🔧 Required Integration Steps

### **Step 1: Add AnalyticsService to Your Project**
1. Copy `AnalyticsService.js` to your project: `src/services/AnalyticsService.js`
2. Update the dashboard URL in the service:
```javascript
// In AnalyticsService.js, update this line:
this.dashboardUrl = 'https://auratext-admin-dashboard.vercel.app';
```

### **Step 2: Initialize Analytics**
```javascript
// In your main app file (e.g., main.js or App.js)
import AnalyticsService from './services/AnalyticsService';

// Initialize analytics
const analytics = new AnalyticsService();

// Make it globally available
window.AnalyticsService = analytics;
```

### **Step 3: Track Text Replacements**
In your text replacement functions:
```javascript
async function replaceText(targetWindow, oldText, newText, method = 'Win32DirectReplacer') {
  const startTime = Date.now();
  
  try {
    // Your replacement logic here
    const success = await performTextReplacement(targetWindow, oldText, newText);
    
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
```

### **Step 4: Track User Actions**
```javascript
// Track app startup
document.addEventListener('DOMContentLoaded', () => {
  AnalyticsService.trackUserAction({
    type: 'app_started',
    data: { version: '1.0.0', timestamp: new Date().toISOString() }
  });
});

// Track settings changes
function updateSetting(settingName, value) {
  // Your setting update logic
  updateSettingValue(settingName, value);
  
  // Track the change
  AnalyticsService.trackUserAction({
    type: 'setting_changed',
    data: { setting: settingName, value: value }
  });
}

// Track hotkey usage
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'R') {
    AnalyticsService.trackUserAction({
      type: 'hotkey_used',
      data: { hotkey: 'Ctrl+Shift+R' }
    });
  }
});
```

### **Step 5: Add Settings UI (Optional)**
Add the analytics settings component to your settings page:
```javascript
// Copy AnalyticsSettings.jsx to your project
import AnalyticsSettings from './components/AnalyticsSettings';

// Add to your settings page
function SettingsPage() {
  return (
    <div>
      {/* Your other settings */}
      <AnalyticsSettings />
    </div>
  );
}
```

## 📊 Dashboard Data Requirements

### **Text Replacements Table**
Your app needs to send this data for each replacement:
- `userId` - Unique user identifier (auto-generated)
- `appVersion` - Your app version (e.g., "1.0.0")
- `os` - Operating system (auto-detected)
- `success` - Boolean (true/false)
- `method` - Replacement method used
- `targetApp` - Target application name
- `textLength` - Length of replaced text
- `responseTime` - Time taken in milliseconds
- `userAgent` - Browser/system info (auto-detected)
- `ipAddress` - User's IP (auto-detected)

### **Errors Table**
For each error, send:
- `userId` - User identifier
- `appVersion` - App version
- `os` - Operating system
- `errorType` - Error category (e.g., "TextReplacementError")
- `errorMessage` - Error description
- `targetApp` - Application where error occurred
- `stackTrace` - Full error stack (optional)

### **User Actions Table**
For user interactions, send:
- `userId` - User identifier
- `actionType` - Type of action (e.g., "app_started", "setting_changed")
- `targetApp` - Related application (if applicable)
- `appVersion` - App version
- `os` - Operating system

## 🎯 Dashboard Features You'll Get

### **📊 Overview Tab**
- Total text replacements across all users
- Unique user count
- Total errors and success rate
- Average response time

### **👥 Users Tab**
- Top users by replacement count
- User activity patterns
- Response time per user
- Last seen timestamps

### **📱 Apps Tab**
- Most popular target applications
- Success rates per app
- Usage statistics per app
- Performance metrics per app

### **🔧 Methods Tab**
- Replacement method popularity
- Success rates per method
- Performance comparison
- Usage trends

### **⚡ Real-time Tab**
- Live activity monitoring
- Minute-by-minute usage
- Current active users
- Real-time performance

### **❌ Errors Tab**
- Recent error reports
- Error categorization
- Debugging information
- Error trends

## 🔑 API Configuration

### **Required Environment Variables**
Your AuraText app needs these environment variables:
```env
# Analytics Dashboard URL
ANALYTICS_DASHBOARD_URL=https://auratext-admin-dashboard.vercel.app

# API Key (keep this secret)
ANALYTICS_API_KEY=auratext_secret_key_2024_launch_secure
```

### **API Endpoints Your App Will Use**
- `POST /api/analytics/text-replacement` - Track replacements
- `POST /api/analytics/error` - Track errors
- `POST /api/analytics/user-action` - Track user actions

## 🚀 Getting Started Checklist

- [ ] Copy `AnalyticsService.js` to your project
- [ ] Update dashboard URL in AnalyticsService
- [ ] Initialize AnalyticsService in your main app
- [ ] Add text replacement tracking to your replacement functions
- [ ] Add error tracking with try-catch blocks
- [ ] Add user action tracking for key events
- [ ] Test with a few text replacements
- [ ] Check dashboard for live data
- [ ] Add AnalyticsSettings component (optional)
- [ ] Deploy your updated AuraText app

## 📈 Expected Results

Once integrated, your dashboard will show:
- **Real user data** instead of mock data
- **Live analytics** as users use your app
- **Performance insights** to optimize your app
- **Error tracking** to improve reliability
- **Usage patterns** to guide development

## 🔧 Troubleshooting

### **No Data Appearing?**
1. Check browser console for network errors
2. Verify API key is correct
3. Ensure dashboard URL is accessible
4. Check if analytics is enabled in settings

### **Database Connection Issues?**
1. Verify PostgreSQL connection string
2. Check Vercel environment variables
3. Ensure database tables are created
4. Check Vercel function logs

### **Performance Issues?**
1. Analytics calls are fire-and-forget (non-blocking)
2. Failed analytics won't affect app functionality
3. Consider batching requests if needed
4. Monitor dashboard for data volume

## 📞 Support

If you need help with integration:
1. Check the dashboard logs in Vercel
2. Verify all API endpoints are working
3. Test with simple replacement tracking first
4. Gradually add more complex tracking

Your dashboard is now ready for **real data**! 🎉
