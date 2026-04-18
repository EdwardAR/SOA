#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Iniciando pruebas del sistema SOA...${NC}\n"

# Array de servicios y puertos
declare -a SERVICIOS=(
  "API Gateway:3000"
  "Alumnos:3001"
  "Matrículas:3002"
  "Profesores:3003"
  "Cursos:3004"
  "Pagos:3005"
  "Notificaciones:3006"
  "Asistencia:3007"
)

# Función para verificar si un puerto está escuchando
verificar_puerto() {
  local puerto=$1
  timeout 2 bash -c "echo >/dev/tcp/localhost/$puerto" 2>/dev/null
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Puerto $puerto - OK"
    return 0
  else
    echo -e "${RED}✗${NC} Puerto $puerto - FALLÓ"
    return 1
  fi
}

echo -e "${YELLOW}Verificando servicios...${NC}\n"

contador_ok=0
contador_error=0

for servicio in "${SERVICIOS[@]}"; do
  nombre=$(echo $servicio | cut -d':' -f1)
  puerto=$(echo $servicio | cut -d':' -f2)

  if verificar_puerto $puerto; then
    ((contador_ok++))
  else
    ((contador_error++))
  fi
done

echo -e "\n${YELLOW}Probando API Gateway...${NC}\n"

# Test de health check
echo -e "GET /api/health"
curl -s -X GET http://localhost:3000/api/health | python -m json.tool 2>/dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} API Gateway responde\n"
else
  echo -e "${RED}✗${NC} API Gateway no responde\n"
fi

# Test de login
echo -e "${YELLOW}Probando autenticación...${NC}\n"
echo -e "POST /api/auth/login"
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"director@colegio.com","password":"password123"}' | python -m json.tool 2>/dev/null

echo -e "\n${YELLOW}Resumen de pruebas:${NC}"
echo -e "${GREEN}Servicios OK: $contador_ok${NC}"
echo -e "${RED}Servicios con Error: $contador_error${NC}"

if [ $contador_error -eq 0 ]; then
  echo -e "\n${GREEN}✅ Todos los servicios están operativos${NC}"
  echo -e "\n${YELLOW}📊 Acceso rápido:${NC}"
  echo -e "  🌐 Portal: http://localhost:3000"
  echo -e "  📚 API: http://localhost:3000/api"
  echo -e "  🔑 Credencial: director@colegio.com / password123"
else
  echo -e "\n${RED}❌ Algunos servicios no están respondiendo${NC}"
  echo -e "   Asegúrate de ejecutar: npm run dev"
fi

exit $contador_error
