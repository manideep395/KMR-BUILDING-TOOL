# Construction AI Platform - Start Both Servers
# Run this from project root: .\start.ps1
# Opens two separate persistent windows - one for backend, one frontend

$root = $PSScriptRoot

# Launch backend in its own PowerShell window (stays open)
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\backend'; Write-Host 'Starting backend on http://localhost:8000' -ForegroundColor Cyan; & '$root\.venv\Scripts\python.exe' -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# Launch frontend in its own PowerShell window (stays open)
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\frontend'; Write-Host 'Starting frontend on http://localhost:3000' -ForegroundColor Green; npm run dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "Both servers are starting in separate windows:" -ForegroundColor Yellow
Write-Host "  Backend  -> http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Frontend -> http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Open http://localhost:3000 in your browser." -ForegroundColor White
