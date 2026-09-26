@echo off
setlocal enabledelayedexpansion
title Smart Campus AI - Team Launcher
echo =====================================================================
echo           STARTING SMART CAMPUS AI MANAGEMENT SYSTEM
echo =====================================================================
echo.

:: Get local IP address for LAN sharing
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr "192.168. 10. 172."') do (
    set LOCAL_IP=%%a
    set LOCAL_IP=!LOCAL_IP: =!
    goto :ip_found
)
set LOCAL_IP=localhost
:ip_found

echo [1/2] Launching FastAPI Backend (Port 8000)...
start "Smart Campus AI Backend" cmd /k "cd /d %~dp0sci\backend && venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [2/2] Launching Vite React Frontend (Port 5175)...
start "Smart Campus AI Frontend" cmd /k "cd /d %~dp0sci\frontend && npm run dev"

echo.
echo =====================================================================
echo Servers are launching in separate windows!
echo.
echo [Local Access]
echo  - Frontend App:      http://localhost:5175
echo  - Backend API Docs:  http://localhost:8000/docs
echo.
echo [Team Access (Same Wi-Fi / LAN)]
echo  - Teammate URL:      http://!LOCAL_IP!:5175
echo  - Teammate API:      http://!LOCAL_IP!:8000/docs
echo.
echo [Demo Accounts - One-Click Login or Password: password123]
echo  - Student:  student1@campus.com
echo  - Faculty:  faculty1@campus.com
echo  - HOD:      hod1@campus.com
echo  - Warden:   warden@campus.com
echo  - Admin:    admin@campus.com
echo  - Security: security@campus.com
echo  - Guardian: guardian@campus.com
echo =====================================================================
echo Press any key to exit this launcher (servers will keep running in background)...
pause > nul
