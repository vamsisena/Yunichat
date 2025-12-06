@echo off
echo ================================================
echo YuniChat Tailwind Frontend - Startup Script
echo ================================================
echo.
echo This script will:
echo 1. Navigate to the Tailwind Frontend directory
echo 2. Start the development server on port 3001
echo.
echo IMPORTANT: The proxy configuration will load automatically
echo This fixes the 404 login errors and WebSocket issues
echo.
echo ================================================
echo.

cd /d "c:\Vamsi\React js\App\YuniChat\YuniChat Tailwind Frontend"

echo Current directory: %CD%
echo.
echo Starting React development server...
echo.
echo Once started, visit: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
