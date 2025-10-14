# 🚀 AuraText Admin Dashboard

A real-time analytics dashboard for monitoring your AuraText application usage, performance, and errors.

## 📁 Project Structure

```
auratext-admin-dashboard/
├── backend/                 # Node.js API server
│   ├── server.js           # Main server file
│   ├── config.js           # Configuration
│   ├── package.json        # Dependencies
│   └── analytics.db        # SQLite database (created on first run)
├── frontend/               # React dashboard
│   ├── src/
│   │   ├── App.jsx         # Main dashboard component
│   │   ├── App.css         # Dashboard styles
│   │   └── main.jsx        # Entry point
│   ├── index.html          # HTML template
│   ├── package.json        # Dependencies
│   └── vite.config.js      # Vite configuration
├── AnalyticsService.js     # Integration file for your main app
├── main.js.integration.example  # Integration examples
├── App.js.integration.example   # Integration examples
└── AnalyticsSettings.jsx   # Settings component
```

## 🚀 Quick Start

### 1. Set Up Backend

```bash
cd backend
npm install
npm start
```

The backend will run on `http://localhost:3001`

### 2. Set Up Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard will run on `http://localhost:3000`

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy backend
cd backend
vercel --prod

# Deploy frontend
cd ../frontend
vercel --prod
```

## 🔗 Integration with Your AuraText App

### Step 1: Add AnalyticsService to Your Main App

1. Copy `AnalyticsService.js` to your main AuraText project:
   ```
   src/services/AnalyticsService.js
   ```

2. Install node-fetch if not already installed:
   ```bash
   npm install node-fetch
   ```

### Step 2: Update Your main.js

Add analytics tracking to your existing `accept-suggestion` handler:

```javascript
const AnalyticsService = require('./src/services/AnalyticsService');

ipcMain.handle('accept-suggestion', async (event, suggestionData) => {
  const startTime = Date.now();
  
  try {
    // ... your existing replacement logic ...
    
    // Track successful replacement
    AnalyticsService.trackTextReplacement({
      success: true,
      method: result.method,
      targetApp: suggestionData.app,
      textLength: suggestionData.newText?.length || 0,
      responseTime: Date.now() - startTime
    });
    
    return result;
  } catch (error) {
    // Track failed replacement
    AnalyticsService.trackError({
      type: 'replacement_failed',
      message: error.message,
      targetApp: suggestionData.app,
      stack: error.stack
    });
    
    throw error;
  }
});
```

### Step 3: Update Your App.js

Add analytics tracking to your React components:

```javascript
import AnalyticsService from './services/AnalyticsService';

// Track app opened
useEffect(() => {
  AnalyticsService.trackUserAction({
    type: 'app_opened',
    data: {
      version: process.env.npm_package_version || 'unknown',
      platform: process.platform
    }
  });
}, []);
```

### Step 4: Add Settings Component (Optional)

Add the analytics settings component to your settings panel:

```javascript
import AnalyticsSettings from './components/AnalyticsSettings';

// In your settings component
<AnalyticsSettings />
```

## 📊 Dashboard Features

### Overview Page
- **Total Users**: Number of unique users
- **Text Replacements**: Total and daily counts
- **Success Rate**: Overall performance percentage
- **Recent Errors**: Latest error reports

### Charts
- **User Growth**: New users over the last 7 days
- **App Usage Distribution**: Which applications are most used

### Real-time Updates
- Dashboard refreshes every 30 seconds
- Live error monitoring
- Performance metrics

## 🔐 Security & Privacy

### Data Privacy
- ✅ **Anonymous user IDs**: No personal information collected
- ✅ **No text content**: Actual text is never sent to dashboard
- ✅ **Opt-in by default**: Users can disable analytics
- ✅ **Local storage**: User preferences stored locally

### API Security
- ✅ **API Key authentication**: Only your app can send data
- ✅ **Rate limiting**: Prevents abuse (100 requests/minute)
- ✅ **HTTPS**: Secure data transmission
- ✅ **Input validation**: All data is validated before storage

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3001
API_KEY=your_super_secret_api_key_here
DATABASE_PATH=./analytics.db
CORS_ORIGIN=*
```

### Update Dashboard URL

After deploying to Vercel, update the dashboard URL in `AnalyticsService.js`:

```javascript
this.dashboardUrl = 'https://your-dashboard-name.vercel.app';
```

## 📈 API Endpoints

### Analytics Endpoints (POST)
- `/api/track/replacement` - Track text replacements
- `/api/track/error` - Track errors
- `/api/track/user-action` - Track user actions

### Dashboard Endpoints (GET)
- `/api/metrics/overview` - Get overview metrics
- `/api/metrics/users` - Get user statistics
- `/api/metrics/usage` - Get usage statistics
- `/api/metrics/errors` - Get error logs
- `/api/metrics/replacements` - Get replacement history
- `/api/health` - Health check

## 🚀 Deployment Checklist

### Before Launch
- [ ] Deploy backend to Vercel
- [ ] Deploy frontend to Vercel
- [ ] Update dashboard URL in AnalyticsService.js
- [ ] Test analytics integration in your app
- [ ] Verify dashboard shows data correctly

### Post-Launch
- [ ] Monitor dashboard for errors
- [ ] Check user adoption rates
- [ ] Review error reports
- [ ] Monitor performance metrics

## 🐛 Troubleshooting

### Common Issues

1. **Analytics not sending data**
   - Check if API key is correct
   - Verify dashboard URL is updated
   - Check network connectivity

2. **Dashboard not loading**
   - Verify backend is running
   - Check CORS settings
   - Ensure database is created

3. **Charts not displaying**
   - Check browser console for errors
   - Verify Chart.js is loaded
   - Check API responses

### Debug Mode

Enable debug logging by adding to your main app:

```javascript
// In your main process
process.env.DEBUG = 'auratext:*';
```

## 📞 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check the backend logs for API errors

## 🎯 Next Steps

After launch, consider adding:

- **Real-time WebSocket updates**
- **Advanced user segmentation**
- **Performance monitoring**
- **Automated alerts**
- **Data export features**
- **Advanced charts and insights**

---

**Ready for launch! 🚀**

This dashboard will give you the insights you need to monitor your AuraText app's performance and user behavior from day one.
