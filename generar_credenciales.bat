@echo off
title Generador de Credenciales - Semana de la Carrera 2026 INACAP
color 0E

cls
echo ===================================================================
echo     SEMANA DE LA CARRERA 2026 - INACAP SEDE ANTOFAGASTA
echo            GESTION DE CREDENCIALES ADMINISTRATIVAS
echo ===================================================================
echo.
echo   [1] Ver / Restablecer credenciales predeterminadas seguras
echo   [2] Generar NUEVAS contraseñas aleatorias de 16 caracteres (Rotacion)
echo   [3] Salir
echo.
set /p opc="Elige una opcion (1, 2 o 3): "

if "%opc%"=="1" (
    cls
    python setup_security.py
    pause
    exit
)

if "%opc%"=="2" (
    cls
    echo Generando nuevas contraseñas aleatorias de alta seguridad...
    python setup_security.py --rotate
    pause
    exit
)

exit
