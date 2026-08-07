@echo off
setlocal EnableExtensions
title PULSE-CRM - Starting Servers
color 0A

echo ============================================================
echo           PULSE-CRM Server Launcher
echo ============================================================
echo.

set "ROOT=%~dp0"
set "NEXT_PUBLIC_API_URL=http://localhost:8000"

:: Detect venv python: prefer .venv, fall back to pulsevenv
set "PY_EXE="
if exist "%ROOT%backend\.venv\Scripts\python.exe" (
    set "PY_EXE=%ROOT%backend\.venv\Scripts\python.exe"
) else if exist "%ROOT%backend\pulsevenv\Scripts\python.exe" (
    set "PY_EXE=%ROOT%backend\pulsevenv\Scripts\python.exe"
) else (
    echo ERROR: No Python virtualenv found in backend\
    echo        Expected .venv\Scripts\python.exe or pulsevenv\Scripts\python.exe
    pause
    exit /b 1
)
echo   Using Python: %PY_EXE%
echo.

:: Kill existing processes on ports 8000, 8001, and 3000
echo [1/6] Stopping existing servers...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul

:: Build frontend for production
echo [2/6] Building frontend...
pushd "%ROOT%frontend"
call npm run build
set "BUILD_ERR=%ERRORLEVEL%"
popd
if not "%BUILD_ERR%"=="0" (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

:: Start backend
echo [3/6] Starting backend on port 8000...
start "PULSE-CRM Backend" cmd /k "cd /d ""%ROOT%backend"" && ""%PY_EXE%"" main.py"
timeout /t 4 /nobreak >nul

:: Start AI service
echo [4/6] Starting AI service on port 8001...
start "PULSE-CRM AI Service" cmd /k "cd /d ""%ROOT%ai-service"" && ""%PY_EXE%"" -m uvicorn main:app --host 0.0.0.0 --port 8001"
timeout /t 4 /nobreak >nul

:: Start frontend
echo [5/6] Starting frontend on port 3000...
start "PULSE-CRM Frontend" cmd /k "cd /d ""%ROOT%frontend"" && set NEXT_PUBLIC_API_URL=http://localhost:8000 && npx next start -p 3000"
timeout /t 5 /nobreak >nul

:: Verify
echo [6/6] Verifying servers...
echo.
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do echo   Backend:    http://localhost:8000  [PID %%a] OK
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001" ^| findstr "LISTENING"') do echo   AI Service: http://localhost:8001  [PID %%a] OK
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do echo   Frontend:   http://localhost:3000  [PID %%a] OK
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
endlocal
