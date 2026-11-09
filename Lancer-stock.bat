@echo off
cd /d "%~dp0"
if not exist "%~dp0start.ps1" (
    echo start.ps1 introuvable dans %~dp0
    pause
    exit /b 1
)
echo Dans cette fenetre, appuyer sur CTRL+C puis repondre a la question pour arreter le serveur.

start "" powershell -NoProfile -WindowStyle Hidden -Command "for ($i=0; $i -lt 30; $i++) { try { Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 1 | Out-Null; Start-Process http://localhost:3000; break } catch { Start-Sleep -Seconds 1 } }"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
echo.
echo Le serveur s'est arrete. Lis le message ci-dessus.
pause