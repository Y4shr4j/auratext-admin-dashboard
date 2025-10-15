@echo off
echo 🚀 Starting AuraText Dashboard Locally...
echo.

echo 📦 Installing Backend Dependencies...
cd backend
call npm install

echo.
echo 🗄️ Setting up SQLite Database (for local testing)...
echo Creating local database file...

echo.
echo 🚀 Starting Backend Server...
echo Backend will run on: http://localhost:3000
start cmd /k "node server.js"

echo.
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak

echo.
echo 📦 Installing Frontend Dependencies...
cd ..\frontend
call npm install

echo.
echo 🚀 Starting Frontend Dashboard...
echo Frontend will run on: http://localhost:5173
start cmd /k "npm run dev"

echo.
echo ✅ Dashboard Started Locally!
echo.
echo 📊 Dashboard URLs:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3000
echo.
echo 🔧 Next Steps:
echo 1. Update your AuraText AnalyticsService.js:
echo    this.dashboardUrl = 'http://localhost:3000';
echo.
echo 2. Run your AuraText app
echo 3. Perform some text replacements
echo 4. Check http://localhost:5173 for real-time data!
echo.
pause
