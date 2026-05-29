@echo off
REM Script para iniciar el sistema completo en Windows.
REM Backend API: http://localhost:3000
REM Frontend React: http://localhost:3009

echo.
echo ================================================
echo   Iniciando Sistema SOA - Colegio Futuro Digital
echo ================================================
echo.

REM Inicializar base de datos si es necesario
echo [1/3] Verificando base de datos...
node config/init-db.js >nul 2>&1
echo Base de datos lista

REM Iniciar Backend desde la raiz del proyecto
echo [2/3] Iniciando Backend API (Puerto 3000)...
start "Backend API" cmd /k "npm start"
echo Backend iniciado

REM Esperar a que el backend este listo
timeout /t 3 /nobreak >nul

REM Iniciar Frontend en puerto separado para no chocar con el API
echo [3/3] Iniciando Frontend React (Puerto 3009)...
start "Frontend React" cmd /k "cd frontend && npm start"
echo Frontend iniciado

echo.
echo ================================================
echo   Sistema iniciado correctamente
echo ================================================
echo Frontend: http://localhost:3009
echo Backend:  http://localhost:3000
echo.
echo Credenciales de prueba:
echo Director:        luis.herrera@colegiofuturo.edu / password123
echo Administrativo: andrea.montalvo@colegiofuturo.edu / password123
echo Docente:         juan.paredes@colegiofuturo.edu / password123
echo Alumno:          valeria.sanchez@colegiofuturo.edu / password123
echo Padre:           patricia.sanchez@colegiofuturo.edu / password123
echo.
echo Cierra las ventanas de Backend API y Frontend React para detener el sistema.
echo.
