@echo off
setlocal enabledelayedexpansion
title Semana de las Carreras 2026 - Mesa de Control Admin
color 0C

cd /d "%~dp0"
set PORT=5173

echo =======================================================
echo     SEMANA DE LAS CARRERAS 2026 - TI ^& DISENO
echo     Consola Central de Administracion (/admin)
echo =======================================================
echo.

:: 1. Verificar Node.js y npm
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro Node.js instalado en el sistema.
  echo Descargalo desde https://nodejs.org/ e intenta nuevamente.
  pause
  exit /b 1
)

:: 2. Instalar / verificar dependencias npm
echo [1/3] Verificando e instalando dependencias (npm install)...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo [ERROR] Fallo npm install. Revisa tu conexion o permisos.
  pause
  exit /b 1
)
echo.

:: 3. Verificar o instalar cloudflared (para Tunel y QR de Docentes)
echo [2/3] Verificando cloudflared...
set "CF_FOUND=0"
where cloudflared >nul 2>nul && set "CF_FOUND=1"
if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" set "CF_FOUND=1"
if exist "C:\Program Files\cloudflared\cloudflared.exe" set "CF_FOUND=1"
if exist "%~dp0bin\cloudflared.exe" set "CF_FOUND=1"

if "%CF_FOUND%"=="0" (
  echo cloudflared no encontrado. Intentando instalar con winget...
  where winget >nul 2>nul
  if not errorlevel 1 (
    winget install --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements -e
    where cloudflared >nul 2>nul && set "CF_FOUND=1"
    if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" set "CF_FOUND=1"
    if exist "C:\Program Files\cloudflared\cloudflared.exe" set "CF_FOUND=1"
  )
)

if "%CF_FOUND%"=="0" (
  echo Descargando cloudflared portatil en bin\cloudflared.exe...
  if not exist "%~dp0bin" mkdir "%~dp0bin"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0bin\cloudflared.exe'"
  if exist "%~dp0bin\cloudflared.exe" (
    set "CF_FOUND=1"
    echo [OK] cloudflared descargado en bin\cloudflared.exe
  ) else (
    echo [AVISO] No se pudo instalar cloudflared. El servidor funcionara localmente, pero sin tunel externo.
  )
) else (
  echo [OK] cloudflared disponible.
)
echo.

:: 4. Abrir navegador automaticamente en /admin tras 2 segundos
echo [3/3] Iniciando servidor en http://localhost:%PORT%/admin ...
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:%PORT%/admin"

:: 5. Iniciar servidor Node.js
node server.js

pause
