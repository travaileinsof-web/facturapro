@echo off
echo ===========================================
echo Demarrage de FacturaPro (PHP + Vite)
echo ===========================================

REM Tuer les processus existants sur les ports 8000 et 5173
for /f "tokens=5" %%a in ('netstat -aon ^| find "8000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find "3003" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [1/2] Lancement du serveur Backend (PHP avec XAMPP)...
start "FacturaPro Backend" cmd /c "cd backend && C:\xampp\php\php.exe -S localhost:8000"

echo [2/2] Lancement du serveur Frontend (Vite)...
start "FacturaPro Frontend" cmd /c "npx vite"

echo.
echo Serveurs demarres ! 
echo Frontend: http://localhost:3003
echo Backend:  http://localhost:8000
echo ===========================================
