Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          NIRANTAR v3 - LAUNCHING ALL SERVICES (3 TIERS)             " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Starting Python FastAPI AI Microservice on Port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\ai-service'; .\venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Node.js Express Backend on Port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"
Start-Sleep -Seconds 2

Write-Host "[3/3] Starting React Vite Frontend Client on Port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host " All 3 services have been launched in separate terminal windows!" -ForegroundColor Green
Write-Host ""
Write-Host " - Frontend Web App:     http://localhost:5173" -ForegroundColor White
Write-Host " - Backend REST API:     http://localhost:5000/api/v1/health" -ForegroundColor White
Write-Host " - Python AI Service:    http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host " Hospital & NGO Staff Accounts (1-Click on Login):" -ForegroundColor Gray
Write-Host "   - Hospital MOIC (Admin):  admin@nirantar.org / admin123" -ForegroundColor Gray
Write-Host "   - NGO Field Lead (ASHA):  asha.sunita@nirantar.org / worker123" -ForegroundColor Gray
Write-Host "   - Hospital Staff Nurse:   anm.priya@nirantar.org / worker123" -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Green
