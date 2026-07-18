@echo off
echo ==========================================
echo Démarrage de FacturaPro (Dev Environment)
echo ==========================================

REM Check if php is in PATH, otherwise use XAMPP php if it exists
where php >nul 2>nul
if %ERRORLEVEL% == 0 (
    set PHP_CMD=php
) else (
    if exist "C:\xampp\php\php.exe" (
        set PHP_CMD="C:\xampp\php\php.exe"
    ) else (
        echo [ERREUR] PHP n'est pas reconnu et XAMPP n'a pas ete trouve.
        echo Veuillez installer PHP ou l'ajouter a vos variables d'environnement.
        pause
        exit /b
    )
)

echo [1/2] Démarrage du backend PHP sur le port 8000...
cd backend
start /b cmd /c %PHP_CMD% -S localhost:8000
cd ..

REM Start the Vite frontend server
echo [2/2] Démarrage du frontend Vite sur le port 3003...
start /b npm run dev -- --port 3003

echo.
echo Les deux serveurs sont en cours d'exécution.
echo Frontend : http://localhost:3003
echo Backend API : http://localhost:8000
echo.
echo Gardez cette fenêtre ouverte pour voir les logs du backend (si activés).
echo Appuyez sur n'importe quelle touche pour fermer les serveurs (nécessite parfois de tuer les processus manuellement).
pause
