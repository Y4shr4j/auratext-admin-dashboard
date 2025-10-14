@echo off
echo 🚀 Deploying AuraText Admin Dashboard...

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Deploy backend
echo 📡 Deploying backend...
cd backend
vercel --prod --yes
echo ✅ Backend deployed

REM Deploy frontend
echo 🎨 Deploying frontend...
cd ..\frontend
vercel --prod --yes
echo ✅ Frontend deployed

echo.
echo 🎉 Deployment Complete!
echo.
echo 📝 Next steps:
echo 1. Get your Vercel URLs from: vercel ls
echo 2. Update AnalyticsService.js with the API URL
echo 3. Test the dashboard
echo 4. Integrate AnalyticsService into your main AuraText app
echo.
echo 🔑 API Key: auratext_secret_key_2024_launch_secure
echo 📚 Full integration guide: See README.md

pause
