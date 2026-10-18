@echo off
title Nirantar v3 - Platform Launcher
color 0A
echo ======================================================================
echo           NIRANTAR v3 - LAUNCHING ALL SERVICES (3 TIERS)
echo ======================================================================
echo.

echo [1/3] Launching Python FastAPI AI Microservice on Port 8000...
start "Nirantar AI Microservice (Port 8000)" cmd /k "cd /d %~dp0ai-service && venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul

echo [2/3] Launching Node.js Express Backend API on Port 5000...
start "Nirantar Main Backend (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] Launching React Vite Frontend Client on Port 5173...
start "Nirantar Frontend Client (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ======================================================================
echo  All 3 services have been launched in separate terminal windows!
echo.
echo  - Frontend Web App:     http://localhost:5173
echo  - Backend REST API:     http://localhost:5000/api/v1/health
echo  - Python AI Service:    http://localhost:8000/health
echo.
echo  Hospital & NGO Staff Accounts (1-Click on Login):
echo    - Hospital MOIC (Admin):  admin@nirantar.org / admin123
echo    - NGO Field Lead (ASHA):  asha.sunita@nirantar.org / worker123
echo    - Hospital Staff Nurse:   anm.priya@nirantar.org / worker123
echo ======================================================================
pause
