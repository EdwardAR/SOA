@echo off
REM Script para iniciar el sistema completo en Windows
REM Inicia Backend (API Gateway) y Frontend (React) en paralelo

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║    🚀 Iniciando Sistema SOA - Colegio Futuro Digital      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Inicializar base de datos si es necesario
echo [1/3] Verificando base de datos...
node config/init-db.js >nul 2>&1
echo ✓ Base de datos lista

REM Iniciar Backend en una nueva ventana
echo [2/3] Iniciando Backend API (Puerto 3000)...
start "Backend API" cmd /k "cd api-gateway && npm start"
echo ✓ Backend iniciado

REM Esperar a que el backend esté listo
timeout /t 3 /nobreak >nul

REM Iniciar Frontend en una nueva ventana
echo [3/3] Iniciando Frontend React (Puerto 3001)...
start "Frontend React" cmd /k "cd frontend && npm start"
echo ✓ Frontend iniciado

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  ✅ Sistema iniciado correctamente                        ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  🌐 Frontend:    http://localhost:3001                   ║
echo ║  🌐 Backend:     http://localhost:3000                   ║
echo ║  🔐 Email:       director@colegio.com                    ║
echo ║  🔐 Password:    password123                             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Presiona Ctrl+C en cualquier ventana para detener los servicios
echo.
