#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🚀 INICIANDO SISTEMA SOA - COLEGIO FUTURO DIGITAL 🚀   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[1/3] Instalando dependencias backend..."
    npm install
else
    echo "[1/3] Dependencias backend ya instaladas ✓"
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "[2/3] Instalando dependencias frontend..."
    cd frontend
    npm install
    cd ..
else
    echo "[2/3] Dependencias frontend ya instaladas ✓"
fi

echo ""
echo "[3/3] Levantando servicios..."
echo ""
echo "📡 Backend (Puerto 3000):   http://localhost:3000"
echo "🎨 Frontend (Puerto 3001+): http://localhost:3001"
echo ""
echo "Credenciales de prueba:"
echo "   Email: director@colegio.com"
echo "   Password: password123"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"
echo ""

# Start backend and frontend in parallel
npm start &
sleep 5
cd frontend && npm start
