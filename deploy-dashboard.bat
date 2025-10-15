@echo off
echo 🚀 Deploying AuraText Admin Dashboard...

echo.
echo 📦 Building Frontend...
cd frontend
call npm install
call npm run build
cd ..

echo.
echo 🌐 Deploying to Vercel...
call vercel --prod

echo.
echo ✅ Deployment Complete!
echo 📊 Dashboard URL: https://auratext-admin-dashboard-gpbl.vercel.app
echo.
echo 🔧 To connect your AuraText app:
echo 1. Update your AnalyticsService.js with the dashboard URL
echo 2. Add tracking calls to your app
echo 3. Start sending data!
echo.
pause