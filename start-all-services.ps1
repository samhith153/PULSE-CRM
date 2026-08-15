$ErrorActionPreference = "Stop"
$Base = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-Port([int]$Port) {
    $r = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $r
}

Write-Host "=== PULSE-CRM Service Launcher ===" -ForegroundColor Cyan

# Backend (8000)
if (Test-Port 8000) {
    Write-Host "[OK] Backend already running on :8000" -ForegroundColor Green
} else {
    Write-Host "Starting Backend on :8000..." -ForegroundColor Yellow
    Start-Process -FilePath "$Base\backend\venv\Scripts\python.exe" -ArgumentList "main.py" -WorkingDirectory "$Base\backend" -WindowStyle Hidden
}

# AI Service (8001)
if (Test-Port 8001) {
    Write-Host "[OK] AI Service already running on :8001" -ForegroundColor Green
} else {
    Write-Host "Starting AI Service on :8001..." -ForegroundColor Yellow
    Start-Process -FilePath "$Base\ai-service\venv\Scripts\python.exe" -ArgumentList "main.py" -WorkingDirectory "$Base\ai-service" -WindowStyle Hidden
}

# Frontend (3000)
if (Test-Port 3000) {
    Write-Host "[OK] Frontend already running on :3000" -ForegroundColor Green
} else {
    Write-Host "Starting Frontend on :3000..." -ForegroundColor Yellow
    Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev" -WorkingDirectory "$Base\frontend" -WindowStyle Hidden
}

Write-Host ""
Write-Host "Waiting up to 60s for services to become ready..." -ForegroundColor Cyan
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
    $f = Test-Port 3000
    $b = Test-Port 8000
    $a = Test-Port 8001
    if ($f -and $b -and $a) { break }
    Start-Sleep -Seconds 2
}

[string]$frontend = if (Test-Port 3000) { "RUNNING" } else { "FAILED" }
[string]$backend  = if (Test-Port 8000) { "RUNNING" } else { "FAILED" }
[string]$ai       = if (Test-Port 8001) { "RUNNING" } else { "FAILED" }

Write-Host ""
Write-Host "=== Status ===" -ForegroundColor Cyan
Write-Host ("  Frontend  :3000  " + $frontend + "   http://localhost:3000") -ForegroundColor $(if ($frontend -eq "RUNNING") {"Green"} else {"Red"})
Write-Host ("  Backend   :8000  " + $backend  + "   http://localhost:8000/health") -ForegroundColor $(if ($backend -eq "RUNNING") {"Green"} else {"Red"})
Write-Host ("  AI Service :8001 " + $ai       + "   http://localhost:8001/health") -ForegroundColor $(if ($ai -eq "RUNNING") {"Green"} else {"Red"})
Write-Host ""
if ($frontend -eq "FAILED") {
    Write-Host "Frontend did not start. Run manually:" -ForegroundColor Red
    Write-Host "  cd $Base\frontend && npm run dev"
}
