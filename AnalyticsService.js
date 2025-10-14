// AuraText Analytics Service
// This file should be added to your main AuraText project at: src/services/AnalyticsService.js

class AnalyticsService {
  constructor() {
    // Update this URL after deploying your dashboard to Vercel
    this.dashboardUrl = 'https://your-dashboard-backend-url.vercel.app';
    this.apiKey = 'auratext-analytics-2024';
    this.isEnabled = this.isAnalyticsEnabled();
    this.userId = this.getUserId();
  }

  // Track text replacement events
  trackTextReplacement(data) {
    if (!this.isEnabled) return;

    const payload = {
      userId: this.userId,
      appVersion: this.getAppVersion(),
      os: this.getOS(),
      success: data.success,
      method: data.method, // 'Win32DirectReplacer', 'TextPatternReplacer', etc.
      targetApp: data.targetApp, // 'notepad.exe', 'WINWORD.EXE', etc.
      textLength: data.textLength,
      responseTime: data.responseTime,
      timestamp: new Date().toISOString()
    };

    this.sendToDashboard('/api/track/replacement', payload);
  }

  // Track errors
  trackError(error) {
    if (!this.isEnabled) return;

    const payload = {
      userId: this.userId,
      appVersion: this.getAppVersion(),
      os: this.getOS(),
      errorType: error.type,
      errorMessage: error.message,
      targetApp: error.targetApp || 'unknown',
      stackTrace: error.stack,
      timestamp: new Date().toISOString()
    };

    this.sendToDashboard('/api/track/error', payload);
  }

  // Track user actions
  trackUserAction(action) {
    if (!this.isEnabled) return;

    const payload = {
      userId: this.userId,
      appVersion: this.getAppVersion(),
      os: this.getOS(),
      actionType: action.type,
      actionData: action.data,
      timestamp: new Date().toISOString()
    };

    this.sendToDashboard('/api/track/user-action', payload);
  }

  // Send data to dashboard (fire-and-forget approach)
  async sendToDashboard(endpoint, data) {
    try {
      // Use fetch if available (Electron renderer process)
      if (typeof fetch !== 'undefined') {
        fetch(`${this.dashboardUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(data)
        }).catch(err => {
          console.log('Analytics send failed:', err.message);
        });
      } else {
        // Use node-fetch for main process
        const fetch = require('node-fetch');
        await fetch(`${this.dashboardUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(data)
        });
      }
    } catch (error) {
      console.log('Analytics error:', error.message);
      // Don't throw - analytics should never break the app
    }
  }

  // Get or create anonymous user ID
  getUserId() {
    const { remote } = require('electron');
    const { app } = remote || require('electron');
    
    // Try to get from localStorage (renderer process)
    if (typeof localStorage !== 'undefined') {
      let userId = localStorage.getItem('auratext_user_id');
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('auratext_user_id', userId);
      }
      return userId;
    }
    
    // For main process, use app data directory
    const userDataPath = app.getPath('userData');
    const fs = require('fs');
    const path = require('path');
    const userIdFile = path.join(userDataPath, 'auratext_user_id.txt');
    
    try {
      if (fs.existsSync(userIdFile)) {
        return fs.readFileSync(userIdFile, 'utf8');
      } else {
        const userId = 'user_' + Math.random().toString(36).substr(2, 9);
        fs.writeFileSync(userIdFile, userId);
        return userId;
      }
    } catch (error) {
      // Fallback to random ID
      return 'user_' + Math.random().toString(36).substr(2, 9);
    }
  }

  // Get app version
  getAppVersion() {
    const { remote } = require('electron');
    const { app } = remote || require('electron');
    return app.getVersion();
  }

  // Get operating system
  getOS() {
    return process.platform;
  }

  // Enable/disable analytics
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auratext_analytics_enabled', enabled.toString());
    } else {
      // For main process, store in userData
      const { remote } = require('electron');
      const { app } = remote || require('electron');
      const fs = require('fs');
      const path = require('path');
      const userDataPath = app.getPath('userData');
      const settingsFile = path.join(userDataPath, 'auratext_settings.json');
      
      try {
        let settings = {};
        if (fs.existsSync(settingsFile)) {
          settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        }
        settings.analyticsEnabled = enabled;
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
      } catch (error) {
        console.log('Could not save analytics setting:', error.message);
      }
    }
  }

  // Check if analytics is enabled
  isAnalyticsEnabled() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('auratext_analytics_enabled') !== 'false';
    } else {
      // For main process, read from userData
      const { remote } = require('electron');
      const { app } = remote || require('electron');
      const fs = require('fs');
      const path = require('path');
      const userDataPath = app.getPath('userData');
      const settingsFile = path.join(userDataPath, 'auratext_settings.json');
      
      try {
        if (fs.existsSync(settingsFile)) {
          const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
          return settings.analyticsEnabled !== false;
        }
      } catch (error) {
        console.log('Could not read analytics setting:', error.message);
      }
      
      return true; // Default to enabled
    }
  }

  // Update dashboard URL (call this after deployment)
  updateDashboardUrl(newUrl) {
    this.dashboardUrl = newUrl;
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = new AnalyticsService();
} else {
  window.AnalyticsService = new AnalyticsService();
}
