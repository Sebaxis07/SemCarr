@echo off
title Semana de las Carreras 2026 - TI & Diseño
color 0C

echo =======================================================
echo     SEMANA DE LAS CARRERAS 2026 & TARREO GAMER
echo     Informatica, Analista, Telecom y Diseno Web
echo =======================================================
echo.
echo Iniciando servidor en el puerto 5173...
echo.

cd /d "%~dp0"
set PORT=5173

:: Abrir navegador automáticamente tras 2 segundos
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173"

:: Iniciar servidor Node.js
node server.js

pause
