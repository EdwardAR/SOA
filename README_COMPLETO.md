# 🎓 Sistema SOA - Colegio Futuro Digital

## Descripción General

Sistema de Gestión Académica implementado con una Arquitectura Orientada a Servicios (SOA). Desarrollado para el Colegio Futuro Digital con el objetivo de integrar procesos académicos, administrativos y de comunicación mediante servicios independientes y escalables.

## 📋 Requisitos

- **Node.js**: v14+ 
- **npm**: v6+
- **SQLite3**: (se instala automáticamente vía npm)

## 🚀 Instalación y Configuración

### 1. Instalación de dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

El archivo `.env` ya está configurado con valores por defecto:

```
NODE_ENV=development
DB_PATH=./database/colegio.db
JWT_SECRET=tu_secreto_jwt_super_seguro_2024_soa_colegio
```

### 3. Inicializar la base de datos

```bash
npm run db:init
```

Esto crea el esquema de base de datos e inserta datos de prueba.

### 4. Iniciar todos los servicios

```bash
npm run dev
```

Esto inicia:
- 🚀 API Gateway (puerto 3000)
- 🎓 Servicio de Alumnos (puerto 3001)
- 📝 Servicio de Matrículas (puerto 3002)
- 👨‍🏫 Servicio de Profesores (puerto 3003)
- 📚 Servicio de Cursos (puerto 3004)
- 💳 Servicio de Pagos (puerto 3005)
- 📧 Servicio de Notificaciones (puerto 3006)
- ✅ Servicio de Asistencia (puerto 3007)
- 📊 Servicio de Calificaciones (puerto 3008)

## 🔐 Autenticación

### Credenciales de Prueba

```
Director:
  Email: director@colegio.com
  Contraseña: password123
  Tipo: director

Alumno:
  Email: luis@estudiante.com
  Contraseña: password123
  Tipo: alumno

Docente:
  Email: juan@colegio.com
  Contraseña: password123
  Tipo: docente
```

### Obtener Token JWT

**POST** `/api/auth/login`

```json
{
  "email": "director@colegio.com",
  "password": "password123"
}
```

**Respuesta:**

```json
{
  "exito": true,
  "codigo": "LOGIN_SUCCESS",
  "mensaje": "Login exitoso",
  "datos": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": "usuario-id",
      "nombre": "Dr. Carlos Martinez",
      "email": "director@colegio.com",
      "tipo_usuario": "director"
    }
  }
}
```

## 📚 Estructura de Servicios

### API Gateway (Puerto 3000)

Punto de entrada centralizado que:
- Gestiona autenticación JWT
- Enruta solicitudes a microservicios
- Controla autorización por roles
- Maneja errores globales

**Roles disponibles:**
- `director` - Acceso total
- `administrativo` - Gestión administrativa
- `docente` - Gestión académica
- `alumno` - Acceso a información propia
- `padre` - Visualización de información de hijos

### 1. Servicio de Alumnos (Puerto 3001)

**Endpoints:**

- `GET /alumnos` - Listar todos los alumnos (paginado)
- `GET /alumnos/:id` - Obtener alumno por ID
- `POST /alumnos` - Crear nuevo alumno
- `PUT /alumnos/:id` - Actualizar alumno
- `DELETE /alumnos/:id` - Desactivar alumno
- `GET /alumnos/:id/deuda` - Verificar deuda del alumno
- `GET /alumnos-por-padre/:padre_id` - Listar alumnos de un padre

**Reglas de Negocio:**
- RN-007: Validación de datos obligatorios

### 2. Servicio de Matrículas (Puerto 3002)

**Endpoints:**

- `GET /matriculas` - Listar todas las matrículas
- `GET /matriculas/:id` - Obtener matrícula por ID
- `POST /matriculas` - Crear nueva matrícula
- `PUT /matriculas/:id` - Actualizar matrícula
- `GET /matriculas-alumno/:alumno_id` - Matrículas de un alumno

**Reglas de Negocio:**
- RN-001: Un alumno solo puede estar en un aula por período académico
- RN-004: No puede matricularse si tiene deuda pendiente

### 3. Servicio de Profesores (Puerto 3003)

**Endpoints:**

- `GET /profesores` - Listar todos los profesores
- `GET /profesores/:id` - Obtener profesor por ID
- `POST /profesores` - Crear nuevo profesor
- `PUT /profesores/:id` - Actualizar profesor
- `DELETE /profesores/:id` - Desactivar profesor
- `GET /profesores/:id/cursos` - Cursos asignados al profesor

### 4. Servicio de Cursos (Puerto 3004)

**Endpoints:**

- `GET /cursos` - Listar todos los cursos
- `GET /cursos/:id` - Obtener curso por ID
- `POST /cursos` - Crear nuevo curso
- `PUT /cursos/:id` - Actualizar curso
- `DELETE /cursos/:id` - Desactivar curso
- `GET /cursos/:id/estudiantes` - Estudiantes del curso
- `GET /cursos-profesor/:profesor_id` - Cursos de un profesor

### 5. Servicio de Pagos (Puerto 3005)

**Endpoints:**

- `GET /pagos` - Listar todos los pagos
- `GET /pagos/:id` - Obtener pago por ID
- `POST /pagos` - Registrar nuevo pago
- `PUT /pagos/:id/procesar` - Procesar pago
- `GET /pagos-alumno/:alumno_id` - Pagos de un alumno
- `GET /deuda/:alumno_id` - Verificar deuda de alumno

**Reglas de Negocio:**
- RN-004: Valida deudas pendientes

### 6. Servicio de Asistencia (Puerto 3007)

**Endpoints:**

- `GET /asistencia` - Listar asistencias
- `GET /asistencia/:id` - Obtener asistencia por ID
- `POST /asistencia` - Registrar asistencia
- `PUT /asistencia/:id` - Actualizar asistencia
- `GET /asistencia-alumno/:alumno_id` - Asistencias de un alumno
- `GET /asistencia-curso/:curso_id` - Asistencias del curso
- `GET /reporte-inasistencias/:fecha` - Reporte de faltas por fecha

**Reglas de Negocio:**
- RN-003: Registro diario de asistencia
- RN-006: Notificación automática de inasistencias

### 7. Servicio de Calificaciones (Puerto 3008)

**Endpoints:**

- `GET /calificaciones` - Listar calificaciones
- `GET /calificaciones/:id` - Obtener calificación por ID
- `POST /calificaciones` - Registrar calificación
- `PUT /calificaciones/:id` - Actualizar calificación
- `GET /calificaciones-alumno/:alumno_id` - Calificaciones de un alumno
- `GET /calificaciones-curso/:curso_id` - Calificaciones del curso
- `GET /promedio-alumno/:alumno_id` - Promedio del alumno

**Reglas de Negocio:**
- RN-002: Las notas deben registrarse dentro del período establecido

### 8. Servicio de Notificaciones (Puerto 3006)

**Endpoints:**

- `GET /notificaciones` - Listar notificaciones
- `POST /notificaciones` - Enviar notificación
- `GET /notificaciones/:id` - Obtener notificación por ID

**Tipos de Notificación:**
- Email
- SMS (Twilio)
- Notificación en app

## 📊 Modelo de Datos

### Tablas Principales

- **usuarios** - Gestión de usuarios del sistema
- **alumnos** - Información de estudiantes
- **profesores** - Información de docentes
- **cursos** - Cursos y clases
- **matriculas** - Inscripciones de estudiantes
- **asistencias** - Control de asistencia
- **calificaciones** - Notas y evaluaciones
- **pagos** - Transacciones y deudas
- **notificaciones** - Log de notificaciones
- **reportes_generados** - Reportes académicos
- **logs_auditoria** - Auditoría del sistema

## 🔄 Flujos Principales

### Flujo de Matrícula

1. Alumno solicita matrícula
2. Sistema valida:
   - Datos completos del alumno (RN-007)
   - No hay deuda pendiente (RN-004)
   - No está en otro aula del mismo período (RN-001)
3. Se registra la matrícula
4. Se notifica al padre (si aplica)

### Flujo de Calificaciones

1. Docente registra notas
2. Sistema valida fecha límite (RN-002)
3. Se registra la calificación
4. Se calcula promedio automáticamente
5. Se notifica al estudiante/padre

### Flujo de Asistencia

1. Docente marca asistencia
2. Sistema valida registro diario (RN-003)
3. Se registra la asistencia
4. Si es falta, se notifica al padre (RN-006)

## 🧪 Testing

### Ejecutar tests

```bash
npm run test
```

### Verificar datos de base de datos

```bash
npm run db:verify
```

## 📦 Despliegue Docker

### Construir imagen

```bash
docker-compose build
```

### Iniciar servicios

```bash
docker-compose up -d
```

### Detener servicios

```bash
docker-compose down
```

## 📝 Logs

Los servicios generan logs en consola. Para producción, considere usar:
- Winston
- Morgan
- ELK Stack

## 🔒 Seguridad

- **Autenticación JWT**: Tokens con expiración
- **Contraseñas hasheadas**: bcryptjs con salt
- **CORS**: Configurado por origen
- **Validación de entrada**: Sanitización de datos
- **Control de acceso**: Basado en roles (RBAC)

## 🐛 Solución de Problemas

### Puerto en uso

Si un puerto está en uso, cambiar en `.env`:

```
GATEWAY_PORT=3000
ALUMNOS_SERVICE_PORT=3001
```

### Base de datos corrupta

Eliminar y reinicializar:

```bash
rm database/colegio.db
npm run db:init
```

### Errores de conexión entre servicios

Verificar que todos los servicios estén corriendo:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3001/health
curl http://localhost:3002/health
...
```

## 📄 Licencia

MIT

## 👥 Autores

- Edward Rivera Antezana (U21317379)
- Harumy del Rocío Bazalar Pacheco (U22221383)
- Naomi Caballero Cáceres (U21205215)
- Maria Celeste Cuba Hinostroza (U21232415)

---

**Universidad Tecnológica del Perú (UTP)**
Arquitectura Orientada a Servicios - 2026
