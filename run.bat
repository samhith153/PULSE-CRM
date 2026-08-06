@echo off
title PULSE-CRM - Starting Servers
color 0A

echo ============================================================
echo           PULSE-CRM Server Launcher
echo ============================================================
echo.

set "ROOT=%~dp0"

:: Kill existing processes on ports 8000, 8001, and 3000
echo [1/5] Stopping existing servers...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start backend
echo [2/5] Starting backend on port 8000...
start "PULSE-CRM Backend" cmd /k "cd /d "%ROOT%backend" && .venv\Scripts\python.exe main.py"
timeout /t 3 /nobreak >nul

:: Start AI service
echo [3/5] Starting AI service on port 8001...
start "PULSE-CRM AI Service" cmd /k "cd /d "%ROOT%ai-service" && "%ROOT%backend\.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8001"
timeout /t 3 /nobreak >nul

:: Start frontend
echo [4/5] Starting frontend on port 3000...
start "PULSE-CRM Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"
timeout /t 5 /nobreak >nul

:: Verify
echo [5/5] Verifying servers...
echo.
echo   Backend:     http://localhost:8000
echo   AI Service:  http://localhost:8001
echo   Frontend:    http://localhost:3000
echo.
echo ============================================================
echo   All servers started! You can close this window.
echo ============================================================
echo.
pause
