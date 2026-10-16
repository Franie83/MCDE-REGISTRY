# dev.ps1 - run backend + frontend from one PowerShell window.
# Usage:  .\dev.ps1
# Stop:   press Ctrl+C

$root = $PSScriptRoot
$backend = Join-Path $root "backend_flask"

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "  MOCDE Registry - local dev (backend + frontend)" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:  http://127.0.0.1:5000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "  Press Ctrl+C to stop both servers." -ForegroundColor Yellow
Write-Host ""

$backendExe = Join-Path $backend "venv\Scripts\python.exe"
$backendScript = Join-Path $backend "app.py"

if (-not (Test-Path $backendExe)) {
    Write-Host "ERROR: $backendExe not found." -ForegroundColor Red
    Write-Host "Run 'python -m venv venv' in backend_flask first." -ForegroundColor Yellow
    exit 1
}
if (-not (Test-Path $backendScript)) {
    Write-Host "ERROR: $backendScript not found." -ForegroundColor Red
    exit 1
}

# Force-quote the script path so any spaces survive.
$quotedArg = '"' + $backendScript + '"'

$backendProcess = Start-Process `
    -FilePath $backendExe `
    -ArgumentList $quotedArg `
    -WorkingDirectory $backend `
    -NoNewWindow `
    -PassThru

Write-Host "Flask started (PID $($backendProcess.Id))" -ForegroundColor Green
Write-Host ""

Start-Sleep -Milliseconds 800

try {
    Set-Location $root
    npm run dev
}
finally {
    Write-Host ""
    Write-Host "Stopping Flask (PID $($backendProcess.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "All servers stopped." -ForegroundColor Green
}
