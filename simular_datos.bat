@echo off
chcp 65001 >nul
title Simulador de Datos - Semana de la Carrera 2026 INACAP
color 0F

:MENU
cls
echo ===============================================================================
echo         SEMANA DE LA CARRERA 2026 • INACAP SEDE ANTOFAGASTA
echo                    GESTOR DE DATOS Y SIMULACIÓN
echo ===============================================================================
echo.
echo   Seleccione una opción:
echo.
echo     [1] INYECTAR DATOS SIMULADOS COMPLETOS
echo         - Carga puntajes competitivos (Terror: ~23k, Shooter: ~22k, Action: ~14k)
echo         - Inscribe alumnos de muestra en las nóminas por actividad
echo         - Carga evaluaciones de desafíos creativos y Copa Tarreo
echo         - Genera sanciones, reclamos y avisos de prueba
echo.
echo     [2] ELIMINAR TODOS LOS DATOS SIMULADOS (LIMPIEZA TOTAL A CERO)
echo         - Reinicia todas las actividades a "Pendiente" con 0 puntos
echo         - Vacía todas las nóminas de participantes
echo         - Elimina sanciones, reclamos y evaluaciones de desafíos
echo         - Deja la base de datos impecable para el evento oficial del 19
echo.
echo     [3] VER ESTADO ACTUAL DEL MARCADOR Y PUNTAJES
echo.
echo     [4] SALIR
echo.
echo ===============================================================================
set /p OPCION="Ingrese una opción (1-4) y presione Enter: "

if "%OPCION%"=="1" goto SIMULAR
if "%OPCION%"=="2" goto LIMPIAR
if "%OPCION%"=="3" goto ESTADO
if "%OPCION%"=="4" goto SALIR

echo.
echo [!] Opción inválida. Intente de nuevo.
timeout /t 2 >nul
goto MENU

:SIMULAR
cls
echo ===============================================================================
echo                  INYECTANDO DATOS SIMULADOS EN LA PLATAFORMA...
echo ===============================================================================
echo.
node scripts\manage_simulation.js simulate
echo.
echo Presione cualquier tecla para volver al menú...
pause >nul
goto MENU

:LIMPIAR
cls
echo ===============================================================================
echo                  LIMPIANDO BASE DE DATOS A CERO...
echo ===============================================================================
echo.
node scripts\manage_simulation.js clean
echo.
echo Presione cualquier tecla para volver al menú...
pause >nul
goto MENU

:ESTADO
cls
node scripts\manage_simulation.js status
echo Presione cualquier tecla para volver al menú...
pause >nul
goto MENU

:SALIR
cls
echo Gracias por usar el Gestor de Simulación de INACAP.
timeout /t 1 >nul
exit /b 0
