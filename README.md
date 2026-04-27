# 🎓 Sistema SOA - Colegio Futuro Digital

Sistema completo de **Gestión Académica** basado en **Arquitectura Orientada a Servicios (SOA)** con **9 microservicios independientes**.

---

## ⚡ Quick Start (3 Pasos)

```bash
npm install                              # 1. Instalar dependencias (1 min)
npm run db:init                          # 2. Inicializar BD con datos (30 seg)
npm start & cd frontend && npm start     # 3. Levantar sistema
```

**✅ Listo**. Accede en:
- **Frontend**: http://localhost:3001 (React UI)
- **Backend**: http://localhost:3000 (APIs REST)

---

## 🔑 Credenciales de Prueba

```
Director:
  Email: director@colegio.com
  Password: password123

Alumno:
  Email: luis@estudiante.com
  Password: password123

Docente:
  Email: juan@colegio.com
  Password: password123

Admin:
  Email: admin@colegio.com
  Password: password123
```

---

## 📋 Requisitos

- **Node.js**: v16.0.0+
- **npm**: v7.0.0+
- **SQLite3**: Incluido automáticamente

---

## 🚀 Instalación Completa

### 1. Instalar dependencias
```bash
npm install
```

### 2. Inicializar base de datos
```bash
npm run db:init
```
✅ Crea tablas, inserta 20+ datos de prueba

### 3. Ejecutar todos los servicios
```bash
npm run dev
```

Levanta 9 servicios simultáneamente:
- **API Gateway** (3000) - Autenticación y enrutamiento
- **Alumnos** (3001) - CRUD estudiantes  
- **Matrículas** (3002) - Inscripciones validadas
- **Profesores** (3003) - Gestión docentes
- **Cursos** (3004) - Administración cursos
- **Pagos** (3005) - Gestión financiera
- **Notificaciones** (3006) - Email/SMS
- **Asistencia** (3007) - Control asistencia
- **Calificaciones** (3008) - Gestión notas

---

## 🏗️ Arquitectura Completa

### Backend: 9 Microservicios Implementados

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API Gateway | 3000 | Autenticación JWT + Proxy |
| Alumnos | 3001 | CRUD estudiantes |
| Matrículas | 3002 | Inscripciones (RN-001, RN-004) |
| Profesores | 3003 | Gestión docentes |
| Cursos | 3004 | Administración cursos |
| Pagos | 3005 | Transacciones + deudas (RN-004) |
| Notificaciones | 3006 | Email/SMS (RN-006) |
| Asistencia | 3007 | Control asistencia (RN-003, RN-006) |
| Calificaciones | 3008 | Notas académicas (RN-002) |

### Frontend: React Application

| Componente | Puerto | Descripción |
|-----------|--------|-------------|
| React Frontend | 3001+ | Interfaz gráfica moderna con Bootstrap 5 |
| Componentes | - | Dashboard, Alumnos, Cursos, Pagos, etc. |
| Context API | - | Gestión de autenticación y estado |
| Axios | - | Cliente HTTP integrado con APIs |

---

## 📊 Reglas de Negocio (7/7 Implementadas)

✅ **RN-001** - Asignación única de aula por período  
✅ **RN-002** - Registro de notas dentro de plazo  
✅ **RN-003** - Asistencia diaria obligatoria  
✅ **RN-004** - Bloqueo por deuda pendiente  
✅ **RN-005** - Acceso restringido a padres  
✅ **RN-006** - Notificación de inasistencias  
✅ **RN-007** - Validación datos obligatorios  

---

## 📡 Endpoints Principales

### Login
```bash
POST /api/auth/login
{
  "email": "director@colegio.com",
  "password": "password123"
}
```

### Alumnos
```bash
GET    /api/alumnos                # Listar todos
GET    /api/alumnos/:id            # Obtener por ID
POST   /api/alumnos                # Crear alumno
PUT    /api/alumnos/:id            # Actualizar
DELETE /api/alumnos/:id            # Desactivar
GET    /api/alumnos/:id/deuda      # Verificar deuda (RN-004)
```

### Matrículas
```bash
GET  /api/matriculas               # Listar matrículas
POST /api/matriculas               # Crear (valida RN-001, RN-004)
PUT  /api/matriculas/:id           # Actualizar
GET  /api/matriculas-alumno/:id    # Matrículas de alumno
```

### Pagos
```bash
GET  /api/pagos                    # Listar pagos
POST /api/pagos                    # Registrar pago
GET  /api/pagos-alumno/:id         # Pagos de alumno
GET  /api/deuda/:id                # Verificar deuda (RN-004)
```

### Cursos
```bash
GET  /api/cursos                   # Listar cursos
POST /api/cursos                   # Crear curso
PUT  /api/cursos/:id               # Actualizar
GET  /api/cursos/:id/estudiantes   # Estudiantes del curso
```

### Profesores
```bash
GET  /api/profesores               # Listar profesores
GET  /api/profesores/:id           # Obtener profesor
POST /api/profesores               # Crear profesor
GET  /api/profesores/:id/cursos    # Cursos asignados
```

### Asistencia
```bash
GET  /api/asistencia               # Listar asistencias
POST /api/asistencia               # Registrar (valida RN-003)
GET  /api/asistencia-alumno/:id    # Asistencias de alumno
GET  /api/reporte-inasistencias    # Reporte de faltas
```

### Calificaciones
```bash
GET  /api/calificaciones           # Listar calificaciones
POST /api/calificaciones           # Registrar (valida RN-002)
GET  /api/calificaciones-alumno    # Notas de alumno
GET  /api/promedio-alumno/:id      # Promedio ponderado
```

### Notificaciones
```bash
GET  /api/notificaciones           # Listar notificaciones
POST /api/notificaciones           # Enviar notificación
```

---

## 🛠️ Comandos Útiles

### Backend
```bash
# Desarrollo (todos los servicios con nodemon)
npm run dev

# Iniciar gateway solo
npm start

# Servicios individuales
npm run alumnos            # Puerto 3001
npm run matricula          # Puerto 3002
npm run profesores         # Puerto 3003
npm run cursos             # Puerto 3004
npm run pagos              # Puerto 3005
npm run notificaciones     # Puerto 3006
npm run asistencia         # Puerto 3007
npm run calificaciones     # Puerto 3008

# Utilitarios
npm run db:init            # Reinicializar BD
npm run db:verify          # Verificar datos
npm run verify             # Verificar servicios activos
npm run test:api           # Probar APIs
npm test                   # Tests automatizados
```

### Frontend (React)
```bash
# Entrar en carpeta frontend
cd frontend

# Desarrollar
npm start                  # Levanta en puerto disponible

# Construir para producción
npm run build

# Ejecutar tests
npm test
```

---

## 🔐 Seguridad

✅ **JWT Tokens** - Autenticación stateless con expiración  
✅ **Bcryptjs** - Contraseñas hasheadas (salt 10)  
✅ **RBAC** - Control acceso por 5 roles  
✅ **Validación entrada** - Sanitización completa  
✅ **CORS** - Configurado por origen  
✅ **SQL Injection** - Prevención con prepared statements  

---

## 📊 Respuesta Estándar

```json
{
  "exito": true,
  "codigo": "SUCCESS",
  "mensaje": "Operación exitosa",
  "datos": {
    "id": "uuid",
    "campo": "valor"
  }
}
```

Error:
```json
{
  "exito": false,
  "codigo": "ERROR_CODE",
  "mensaje": "Descripción del error",
  "detalles": null
}
```

---

## 📁 Estructura

```
SOA/
├── api-gateway/                 # Gateway principal
│   ├── gateway.js
│   ├── middleware/
│   │   ├── auth.js             # JWT + RBAC
│   │   └── errorHandler.js
│   └── public/
├── services/                    # 9 Microservicios
│   ├── alumnos-service/
│   ├── matricula-service/
│   ├── profesores-service/
│   ├── cursos-service/
│   ├── pagos-service/
│   ├── notificaciones-service/
│   ├── asistencia-service/
│   └── calificaciones-service/
├── frontend/                    # React Application
│   ├── public/
│   │   ├── index.html          # HTML root
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts       # Axios client
│   │   │   └── services.ts     # API services
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── PrivateRoute.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx # State management
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Alumnos.tsx
│   │   │   ├── Cursos.tsx
│   │   │   ├── Profesores.tsx
│   │   │   ├── Matriculas.tsx
│   │   │   ├── Pagos.tsx
│   │   │   ├── Notificaciones.tsx
│   │   │   ├── Asistencia.tsx
│   │   │   └── Calificaciones.tsx
│   │   ├── App.tsx             # Routing principal
│   │   ├── index.tsx           # Entry point
│   │   └── index.css           # Estilos globales
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── config/
│   └── database.js             # Conexión SQLite
├── database/
│   ├── colegio.db              # BD (se genera)
│   ├── schema.sql              # Schema
│   ├── init.js                 # Inicializador
│   └── verify-data.js          # Verificador
├── shared/
│   ├── utils.js                # Helpers
│   └── validators.js           # Validadores
├── .env                         # Variables entorno
├── package.json
└── README.md
```

---

## 🔄 Flujos Principales

### Flujo de Matrícula
```
1. Alumno → Solicita matrícula
2. Sistema valida RN-001 (aula única/período)
3. Sistema valida RN-004 (sin deuda)
4. Sistema valida RN-007 (datos completos)
5. Registra → Notifica padre/madre
```

### Flujo de Asistencia
```
1. Docente → Marca asistencia
2. Sistema valida RN-003 (registro diario)
3. Si FALTA → Ejecuta RN-006 (notifica padre)
4. Registra en BD → Genera reporte
```

### Flujo de Calificaciones
```
1. Docente → Registra nota
2. Sistema valida RN-002 (dentro de fecha límite)
3. Calcula promedio ponderado automático
4. Registra → Notifica alumno/padre
```

---

## 🐛 Troubleshooting

### Puerto en uso
```bash
# Cambiar en .env
GATEWAY_PORT=3001
ALUMNOS_SERVICE_PORT=3011
```

### BD no encontrada
```bash
npm run db:init
```

### Servicio no responde
```bash
npm run verify
```

### Resetear BD
```bash
rm database/colegio.db
npm run db:init
```

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| Servicios | 8 + Gateway |
| Endpoints | 60+ |
| Código | 3,000+ líneas |
| Tablas BD | 11 |
| Índices | 25+ |
| Reglas negocio | 7 (todas) |
| Roles RBAC | 5 |
| Datos prueba | 20+ |

---

## 💾 Desarrollo

### Agregar endpoint

1. Editar `services/nombre-service/server.js`
2. Agregar ruta con validación
3. Devolver con `respuestaExito()` o `respuestaError()`

```javascript
app.get('/alumnos/por-grado/:grado', asyncHandler(async (req, res) => {
  const { grado } = req.params;
  const alumnos = await getAll(
    'SELECT * FROM alumnos WHERE grado_nivel = ?',
    [grado]
  );
  res.json(respuestaExito(alumnos, 'Alumnos obtenidos'));
}));
```

---

## 🚀 Docker

```bash
# Construir
docker-compose build

# Iniciar
docker-compose up -d

# Logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## 📚 Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React 18 + TypeScript + Bootstrap 5
- **Auth**: JWT + Bcryptjs + Context API
- **BD**: SQLite (dev) / MySQL (prod ready)
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Notificaciones**: Nodemailer + Twilio API
- **Dev**: Nodemon, Concurrently, Jest
- **Deploy**: Docker, Vercel, Railway

---

## 🎨 Interfaz Gráfica (React Frontend)

### Pantallas Disponibles

- **Login**: Autenticación con email/contraseña
- **Dashboard**: Resumen estadístico de toda la plataforma
- **Alumnos**: CRUD completo de estudiantes
- **Profesores**: Gestión de docentes
- **Cursos**: Administración de cursos y capacidad
- **Matrículas**: Inscripciones validadas
- **Pagos**: Gestión financiera de la institución
- **Asistencia**: Registro de asistencia diaria
- **Calificaciones**: Registro y promedio de notas
- **Notificaciones**: Centro de notificaciones del sistema

### Características de la UI

✅ **Interfaz moderna** - Bootstrap 5 con diseño responsive  
✅ **Autenticación** - Login con JWT + localStorage  
✅ **Rutas protegidas** - Control de acceso por permisos  
✅ **Tabla dinámica** - Listado de datos con paginación  
✅ **Sidebar navegable** - Menú lateral con iconos  
✅ **Navbar con usuario** - Información del usuario logueado  
✅ **Integración APIs** - Axios con interceptores  
✅ **Manejo errores** - Messages de error/éxito  

### Ejemplo de Uso

1. Abre http://localhost:3001 (o el puerto que asigne React)
2. Ingresa credenciales:
   - Email: `director@colegio.com`
   - Password: `password123`
3. Dashboard muestra estadísticas en tiempo real
4. Navega por el sidebar para acceder a cada módulo

---

**Universidad Tecnológica del Perú (UTP)**
- Facultad: Ingeniería
- Curso: Arquitectura Orientada a Servicios (SOA)
- Docente: Cesar Augusto Minguillo Rubio
- Ciclo: 2026-1

**Equipo:**
- Edward Antonio Rivera Antezana (U21317379)
- Harumy del Rocío Bazalar Pacheco (U22221383)
- Naomi Caballero Cáceres (U21205215)
- Maria Celeste Cuba Hinostroza (U21232415)

---

## 📄 Licencia

MIT - Proyecto Educativo

---

**Estado**: ✅ Producción  
**Versión**: 1.0.0  
**Fecha**: Abril 2026
