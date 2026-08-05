@echo off
title PULSE-CRM - Starting Servers
color 0A

echo ============================================================
echo           PULSE-CRM Server Launcher
echo ============================================================
echo.

:: Kill existing processes on ports 8000 and 3000
echo [1/4] Stopping existing servers...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start backend
echo [2/4] Starting backend on port 8000...
start "PULSE-CRM Backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe main.py"
timeout /t 3 /nobreak >nul

:: Start frontend
echo [3/4] Starting frontend on port 3000...
start "PULSE-CRM Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 5 /nobreak >nul

:: Verify
echo [4/4] Verifying servers...
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo.
echo ============================================================
echo   Both servers started! You can close this window.
echo ============================================================
echo.
pause
