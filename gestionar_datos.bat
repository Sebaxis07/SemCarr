@echo off
title Gestor de Datos - Semana de la Carrera 2026 INACAP
color 0B

:MENU
cls
echo ===================================================================
echo     SEMANA DE LA CARRERA 2026 - INACAP SEDE ANTOFAGASTA
echo           PANEL DE CONTROL Y GESTION DE DATOS
echo ===================================================================
echo.
echo   Elige la operacion que deseas realizar:
echo.
echo   [1] LIMPIAR TODOS LOS DATOS FALSOS / RESTABLECER A CERO
echo       - Borra cualquier puntaje simulado, tiempos ficticios e incidentes.
echo       - Deja la plataforma 100%% en estado oficial previo al evento.
echo       - Conserva intacto el padron oficial de los 281 estudiantes.
echo.
echo   [2] CARGAR DATOS SIMULADOS COMPLETOS (MODO DEMO / PRESENTACION)
echo       - Puebla puntajes coherentes, partidos, tiempos reales de cancha,
echo         notas de docentes, torneos del tarreo y metricas directivas.
echo       - Ideal para mostrar el funcionamiento a Jefatura de Carrera.
echo.
echo   [3] VER ESTADO ACTUAL DE LA BASE DE DATOS
echo       - Muestra el marcador acumulado, actividades y participantes.
echo.
echo   [4] SALIR
echo.
echo ===================================================================
set /p opcion="Ingresa una opcion (1, 2, 3 o 4) y presiona ENTER: "

if "%opcion%"=="1" goto LIMPIAR
if "%opcion%"=="2" goto SIMULAR
if "%opcion%"=="3" goto ESTADO
if "%opcion%"=="4" goto SALIR

echo.
echo [!] Opcion no valida. Por favor elige 1, 2, 3 o 4.
pause
goto MENU

:LIMPIAR
cls
echo ===================================================================
echo           CONFIRMACION DE LIMPIEZA DE DATOS
echo ===================================================================
echo.
echo Estas a punto de eliminar todos los datos simulados y volver
echo el sistema a su estado oficial en cero (pre-evento).
echo.
set /p confirm="Seguro que deseas continuar? (S/N): "
if /i not "%confirm%"=="S" (
    echo Operacion cancelada. Volviendo al menu...
    timeout /t 2 >nul
    goto MENU
)

echo.
echo Limpiando datos y restableciendo estado pre-evento...
python manage_data.py --clean
echo.
echo Operacion finalizada con exito.
echo.
pause
goto MENU

:SIMULAR
cls
echo ===================================================================
echo           CARGA DE DATOS SIMULADOS PARA DEMO
echo ===================================================================
echo.
echo Cargando simulacion completa para demostracion a Jefatura...
echo.
python manage_data.py --simulate
echo.
echo Operacion finalizada con exito.
echo.
pause
goto MENU

:ESTADO
cls
python manage_data.py --status
pause
goto MENU

:SALIR
cls
echo Saliendo del gestor de datos.
timeout /t 1 >nul
exit
