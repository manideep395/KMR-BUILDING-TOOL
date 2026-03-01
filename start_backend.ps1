# Backend startup script for Construction AI Platform
# Run this from the project root: .\start_backend.ps1
Set-Location "$PSScriptRoot\backend"
& "$PSScriptRoot\.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
