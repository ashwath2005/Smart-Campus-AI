@echo off
echo =====================================================================
echo           STARTING SMART CAMPUS AI MANAGEMENT SYSTEM
echo =====================================================================
echo.
echo [1/2] Launching FastAPI Backend (Port 8000)...
start "Smart Campus AI Backend" cmd /k "cd /d %~dp0sci\backend && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching Vite React Frontend (Port 5174)...
start "Smart Campus AI Frontend" cmd /k "cd /d %~dp0sci\frontend && npm run dev"

echo.
echo =====================================================================
echo Servers are launching in separate windows!
echo - Backend API Docs: http://localhost:8000/docs
echo - Frontend App:      http://localhost:5174
echo =====================================================================
echo Press any key to exit this script (servers will keep running)...
pause > nul
