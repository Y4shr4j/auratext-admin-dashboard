# 🔗 AuraText Analytics Integration Guide

This guide will help you integrate the analytics dashboard with your main AuraText application.

## 📋 Integration Checklist

### ✅ Step 1: Deploy Dashboard
- [ ] Deploy backend to Vercel
- [ ] Deploy frontend to Vercel
- [ ] Get your Vercel URLs
- [ ] Update API URL in AnalyticsService.js

### ✅ Step 2: Add to Your Main App
- [ ] Copy AnalyticsService.js to your main project
- [ ] Install node-fetch dependency
- [ ] Update main.js with analytics tracking
- [ ] Update App.js with analytics tracking
- [ ] Add AnalyticsSettings component (optional)

### ✅ Step 3: Test Integration
- [ ] Test analytics data is being sent
- [ ] Verify dashboard shows data
- [ ] Check error tracking works
- [ ] Test user action tracking

## 🚀 Quick Deployment

### Option 1: Using the Script (Recommended)
```bash
# Run the deployment script
./deploy.sh        # Linux/Mac
deploy.bat         # Windows
```

### Option 2: Manual Deployment
```bash
# Deploy backend
cd backend
vercel --prod

# Deploy frontend  
cd ../frontend
vercel --prod
```

## 📁 Files to Add to Your Main AuraText Project

### 1. AnalyticsService.js
**Location:** `src/services/AnalyticsService.js`

This is the main analytics service that handles all communication with your dashboard.

### 2. AnalyticsSettings.jsx (Optional)
**Location:** `src/components/AnalyticsSettings.jsx`

A settings component that allows users to enable/disable analytics.

### 3. Integration Code
**Files to modify:** `main.js` and `src/App.js`

Add the analytics tracking code to your existing files.

## 🔧 Configuration

### Update Dashboard URL
After deployment, update the dashboard URL in `AnalyticsService.js`:

```javascript
// Change this line:
this.dashboardUrl = 'https://your-auratext-dashboard.vercel.app';

// To your actual Vercel URL:
this.dashboardUrl = 'https://auratext-admin-backend-abc123.vercel.app';
```

### API Key
The default API key is: `auratext_secret_key_2024_launch_secure`

You can change this in:
- Backend: `backend/config.js`
- Frontend: `AnalyticsService.js`

## 📊 What Data is Tracked

### Text Replacements
- Success/failure status
- Target application (notepad.exe, WINWORD.EXE, etc.)
- Replacement method used
- Response time
- Text length

### Errors
- Error type and message
- Target application
- Stack trace
- Timestamp

### User Actions
- App opened/closed
- Settings accessed
- Feature usage
- Analytics toggled

### Privacy Protection
- ✅ Anonymous user IDs only
- ✅ No personal information
- ✅ No text content
- ✅ User can opt-out
- ✅ Data stored securely

## 🧪 Testing Your Integration

### 1. Local Testing
```bash
# Start backend
cd backend
npm start

# Start frontend
cd frontend
npm run dev

# Test at http://localhost:3000
```

### 2. Test Analytics
1. Open your AuraText app
2. Perform some text replacements
3. Check the dashboard for data
4. Verify errors are tracked

### 3. Check Dashboard
- Visit your deployed dashboard URL
- Look for:
  - User count increasing
  - Replacement statistics
  - Error logs
  - Performance metrics

## 🐛 Troubleshooting

### Analytics Not Sending Data
1. Check API key is correct
2. Verify dashboard URL is updated
3. Check network connectivity
4. Look for console errors

### Dashboard Not Loading
1. Verify backend is deployed and running
2. Check CORS settings
3. Ensure database is accessible
4. Check Vercel function logs

### No Data in Dashboard
1. Verify AnalyticsService is integrated
2. Check if analytics is enabled
3. Test with a simple replacement
4. Check backend logs

## 📈 Dashboard Features

### Overview Page
- Total users and daily active users
- Text replacement counts
- Success rate percentage
- Recent error feed

### Charts
- User growth over time
- App usage distribution
- Performance trends

### Real-time Updates
- Dashboard refreshes every 30 seconds
- Live error monitoring
- Performance tracking

## 🔐 Security Features

### API Security
- API key authentication
- Rate limiting (100 requests/minute)
- Input validation
- HTTPS encryption

### Privacy Protection
- Anonymous user IDs
- No personal data collection
- User opt-out capability
- Local preference storage

## 🎯 Launch Day Checklist

### Before Launch
- [ ] Dashboard deployed and accessible
- [ ] AnalyticsService integrated
- [ ] Test data flowing to dashboard
- [ ] Error tracking working
- [ ] User settings functional

### During Launch
- [ ] Monitor dashboard for errors
- [ ] Check user adoption rates
- [ ] Watch for performance issues
- [ ] Monitor error reports

### After Launch
- [ ] Review analytics data
- [ ] Identify popular features
- [ ] Fix reported errors
- [ ] Plan improvements

## 📞 Support

If you encounter issues:

1. **Check the logs:**
   - Browser console (F12)
   - Vercel function logs
   - Your app's console output

2. **Verify configuration:**
   - API key matches
   - Dashboard URL is correct
   - Dependencies installed

3. **Test step by step:**
   - Backend health check
   - Frontend loads
   - Analytics sends data
   - Dashboard displays data

## 🎉 You're Ready!

Your AuraText admin dashboard is now ready for launch day. You'll have real-time insights into:

- How many users are using your app
- Which features are most popular
- Performance and success rates
- Error tracking and debugging

**Happy launching! 🚀**
