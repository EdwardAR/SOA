# 🚀 Guía Rápida - Sistema SOA Colegio Futuro Digital

## 1️⃣ Iniciar el Sistema

### Windows
```bash
cd d:\UTP\MARZO 2026\SOA
start.bat
```

### Linux/Mac
```bash
cd "path/to/SOA"
bash start.sh
```

### Manual (Cualquier SO)
```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

---

## 2️⃣ Acceso al Sistema

### Frontend (Interfaz Gráfica)
- **URL**: http://localhost:3001
- **Framework**: React 18 + Bootstrap 5

### Backend (APIs REST)
- **API Gateway**: http://localhost:3000
- **Microservicios**: 3001-3008

---

## 3️⃣ Credenciales de Prueba

```
Email: director@colegio.com
Contraseña: password123
```

Otros usuarios disponibles:
- `luis@estudiante.com` (Alumno)
- `juan@colegio.com` (Docente)
- `admin@colegio.com` (Administrador)

---

## 4️⃣ Funcionalidades Principales

### Dashboard
- Estadísticas en tiempo real
- Contador de alumnos, cursos, profesores, pagos

### Gestión de Alumnos
- Crear, leer, actualizar, eliminar estudiantes
- Ver información personal y académica

### Gestión Académica
- **Cursos**: Crear y administrar cursos
- **Profesores**: Gestionar docentes
- **Matrículas**: Inscribir alumnos (con validaciones)
- **Calificaciones**: Registrar notas

### Gestión Administrativa
- **Pagos**: Control financiero
- **Asistencia**: Registro diario
- **Notificaciones**: Centro de alertas

---

## 5️⃣ Estructura de Carpetas

```
SOA/
├── api-gateway/           # Gateway principal
├── services/              # 9 Microservicios
├── frontend/              # React app
├── database/              # Base de datos SQLite
├── config/                # Configuraciones
└── README.md
```

---

## 6️⃣ Comandos Útiles

```bash
# Backend
npm run dev              # Todos los servicios con hot-reload
npm start                # Gateway principal
npm run verify           # Verificar servicios activos
npm run test:api         # Probar endpoints
npm run db:init          # Reiniciar base de datos

# Frontend
cd frontend
npm start                # Iniciar servidor de desarrollo
npm run build            # Build para producción
npm test                 # Tests
```

---

## 7️⃣ Troubleshooting

### Puerto en uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Base de datos corrompida
```bash
rm database/colegio.db
npm run db:init
```

### Node modules corrupted
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 8️⃣ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Bootstrap 5 |
| Backend | Node.js + Express.js |
| Autenticación | JWT + Bcryptjs |
| Base de Datos | SQLite |
| HTTP Client | Axios |
| Routing | React Router v6 |
| State Management | Context API |

---

## 9️⃣ Endpoints Principales

### Auth
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/verify
```

### Alumnos
```
GET    /api/alumnos
GET    /api/alumnos/:id
POST   /api/alumnos
PUT    /api/alumnos/:id
DELETE /api/alumnos/:id
```

### Cursos
```
GET  /api/cursos
GET  /api/cursos/:id
POST /api/cursos
PUT  /api/cursos/:id
```

---

## 🔟 Soporte & Documentación

- **README.md** - Documentación completa
- **API Gateway** - http://localhost:3000
- **Frontend UI** - http://localhost:3001

---

**¡Listo para usar! 🎉**

Cualquier duda, revisa el README.md o contacta al equipo de desarrollo.
