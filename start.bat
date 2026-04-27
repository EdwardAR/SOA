@echo off
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  🚀 INICIANDO SISTEMA SOA - COLEGIO FUTURO DIGITAL 🚀   ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo [1/3] Instalando dependencias backend...
    call npm install
) else (
    echo [1/3] Dependencias backend ya instaladas ✓
)

REM Check if frontend node_modules exists
if not exist frontend\node_modules (
    echo [2/3] Instalando dependencias frontend...
    cd frontend
    call npm install
    cd ..
) else (
    echo [2/3] Dependencias frontend ya instaladas ✓
)

echo.
echo [3/3] Levantando servicios...
echo.
echo 📡 Backend (Puerto 3000):   http://localhost:3000
echo 🎨 Frontend (Puerto 3001+): http://localhost:3001
echo.
echo Credenciales de prueba:
echo   Email: director@colegio.com
echo   Password: password123
echo.
echo Presiona Ctrl+C para detener todos los servicios
echo.

REM Start backend and frontend
start cmd /k "npm start"
timeout /t 5 /nobreak
start cmd /k "cd frontend && npm start"

pause
