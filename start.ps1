# ============================================================
#  FacturaPro - Script de demarrage (start.ps1)
#  Lance le serveur PHP backend (port 8000) et le serveur
#  de dev Vite/React (port 3003) simultanement.
# ============================================================

$rootDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$phpExe     = "C:\xampp\php\php.exe"
$backendDir = Join-Path $rootDir "backend"
$apiFile    = Join-Path $backendDir "api.php"

# --- Verification que PHP est disponible ---
if (-not (Test-Path $phpExe)) {
    Write-Error "PHP introuvable a : $phpExe -- Verifiez que XAMPP est installe."
    exit 1
}

# --- Tuer tout serveur PHP existant sur le port 8000 ---
$existing = netstat -ano | Select-String ":8000.*LISTEN"
if ($existing) {
    $pid8000 = ($existing -split '\s+')[-1]
    Write-Host "INFO: Port 8000 occupe (PID $pid8000), fermeture..." -ForegroundColor Yellow
    Stop-Process -Id $pid8000 -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# --- Demarrer le serveur PHP en arriere-plan ---
Write-Host "START: Demarrage du serveur PHP sur http://localhost:8000 ..." -ForegroundColor Cyan
$phpProcess = Start-Process -FilePath $phpExe `
    -ArgumentList "-S localhost:8000 -t `"$backendDir`" `"$apiFile`"" `
    -WorkingDirectory $backendDir `
    -PassThru -NoNewWindow
Start-Sleep -Seconds 2

# Verification que PHP a bien demarre
$check = netstat -ano | Select-String ":8000.*LISTEN"
if ($check) {
    Write-Host "OK: Serveur PHP demarre (PID $($phpProcess.Id))" -ForegroundColor Green
} else {
    Write-Warning "WARN: Le serveur PHP ne semble pas demarrer correctement."
}

# --- Demarrer Vite/React ---
Write-Host "START: Demarrage du serveur Vite sur http://localhost:3003 ..." -ForegroundColor Cyan
$npmProcess = Start-Process -FilePath "cmd" `
    -ArgumentList "/c npm run dev" `
    -WorkingDirectory $rootDir `
    -PassThru -NoNewWindow

Write-Host ""
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "  FacturaPro est pret !" -ForegroundColor Magenta
Write-Host "  Frontend : http://localhost:3003" -ForegroundColor White
Write-Host "  Backend  : http://localhost:8000" -ForegroundColor White
Write-Host "  Admin    : http://localhost:3003/admin" -ForegroundColor White
Write-Host "  Arret    : Ctrl+C puis fermer cette fenetre" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host ""

# --- Attendre (garder le script actif) ---
try {
    while ($true) {
        Start-Sleep -Seconds 5
        if ($phpProcess.HasExited) {
            Write-Warning "WARN: Serveur PHP crashe, redemarrage..."
            $phpProcess = Start-Process -FilePath $phpExe `
                -ArgumentList "-S localhost:8000 -t `"$backendDir`" `"$apiFile`"" `
                -WorkingDirectory $backendDir `
                -PassThru -NoNewWindow
        }
    }
} finally {
    Write-Host "STOP: Arret des serveurs..." -ForegroundColor Red
    Stop-Process -Id $phpProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $npmProcess.Id -Force -ErrorAction SilentlyContinue
}
