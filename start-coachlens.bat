@echo off
echo ========================================
echo    CoachLens 2.0 - Quick Start Script
echo ========================================
echo.

echo 1. Checking if backend dependencies are installed...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 2. Starting CoachLens backend server...
echo Server will run on http://localhost:8787
echo.
echo ✅ API Key configured: %GEMINI_API_KEY:~0,20%...
echo ✅ Using Gemini 2.5 Flash model
echo.
echo 🚀 Starting server...
echo.
echo ========================================
echo  Backend server is now running!
echo  
echo  📊 Health: http://localhost:8787/health
echo  🤖 API: http://localhost:8787/gemini
echo  
echo  Next steps:
echo  1. Open Chrome
echo  2. Go to chrome://extensions/
echo  3. Enable Developer mode
echo  4. Click "Load unpacked"
echo  5. Select the 'extension' folder
echo  6. Test on: test-extension.html
echo ========================================
echo.

node server-simple.js