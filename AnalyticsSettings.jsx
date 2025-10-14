// AuraText Analytics Settings Component
// Add this file to your main AuraText project at: src/components/AnalyticsSettings.jsx

import React, { useState, useEffect } from 'react';
import AnalyticsService from '../services/AnalyticsService';

const AnalyticsSettings = () => {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEnabled(AnalyticsService.isAnalyticsEnabled());
  }, []);

  const handleToggle = async (newEnabled) => {
    setLoading(true);
    
    try {
      AnalyticsService.setEnabled(newEnabled);
      setEnabled(newEnabled);
      
      // Track the setting change
      AnalyticsService.trackUserAction({
        type: 'analytics_setting_changed',
        data: {
          enabled: newEnabled
        }
      });
    } catch (error) {
      console.error('Error updating analytics setting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-settings">
      <h3>📊 Analytics & Privacy</h3>
      <div className="setting-item">
        <label className="setting-label">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={loading}
            className="setting-checkbox"
          />
          <span className="setting-text">
            Help improve AuraText by sharing anonymous usage data
          </span>
        </label>
        <p className="setting-description">
          We collect anonymous data about app usage, performance, and errors to help us improve AuraText. 
          No personal information or text content is ever collected.
        </p>
        <div className="setting-details">
          <details>
            <summary>What data is collected?</summary>
            <ul>
              <li>✅ App usage statistics (which apps you use AuraText with)</li>
              <li>✅ Success/failure rates of text replacements</li>
              <li>✅ Performance metrics (response times)</li>
              <li>✅ Error reports (to help us fix bugs)</li>
              <li>❌ No personal information</li>
              <li>❌ No text content you're working with</li>
              <li>❌ No file names or document content</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSettings;
