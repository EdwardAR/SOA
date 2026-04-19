# 🎓 Sistema SOA - Colegio Futuro Digital

Sistema completo de Gestión Académica basado en Arquitectura Orientada a Servicios (SOA) con microservicios independientes.

## 📋 Requisitos Previos

- **Node.js**: v16.0.0 o superior
- **npm**: v7.0.0 o superior
- **SQLite3**: Incluido en el proyecto

## 🚀 Instalación y Levantamiento Rápido

### 1. Clonar o descargar el proyecto

```bash
cd SOA
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Inicializar la base de datos

```bash
npm run db:init
```

Este comando creará el archivo `database/colegio.db` e insertará datos de prueba.

### 4. Iniciar todos los servicios

```bash
npm run dev
```

Este comando levantará en paralelo:

- **API Gateway** (Puerto 3000)
- **Servicio de Alumnos** (Puerto 3001)
- **Servicio de Matrículas** (Puerto 3002)
- **Servicio de Profesores** (Puerto 3003)
- **Servicio de Cursos** (Puerto 3004)
- **Servicio de Pagos** (Puerto 3005)
- **Servicio de Notificaciones** (Puerto 3006)
- **Servicio de Asistencia** (Puerto 3007)

### 5. Acceder al portal

Abre tu navegador en: **http://localhost:3000**

## 👤 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Director | director@colegio.com | password123 |
| Alumno | luis@estudiante.com | password123 |
| Docente | juan@colegio.com | password123 |
| Admin | admin@colegio.com | password123 |

## 🏗️ Arquitectura

### Microservicios Implementados

1. **API Gateway** - Punto de entrada único, autenticación JWT, proxy de servicios
2. **Servicio de Alumnos** - Gestión de datos de estudiantes (CRUD)
3. **Servicio de Matrículas** - Inscripciones con validaciones (RN-001, RN-004)
4. **Servicio de Profesores** - Gestión docente
5. **Servicio de Cursos** - Creación y gestión de cursos
6. **Servicio de Pagos** - Gestión de transacciones y deudas (RN-004)
7. **Servicio de Notificaciones** - Envío automático de correos y SMS
8. **Servicio de Asistencia** - Registro y control de asistencia (RN-003, RN-006)

### Base de Datos

- **SQLite** para desarrollo local
- **Schema completo** con todas las tablas requeridas
- **Índices optimizados** para mejor rendimiento
- **Foreign keys** habilitadas para integridad referencial

## 📊 Reglas de Negocio Implementadas

| Regla | Descripción | Servicio |
|-------|-----------|---------|
| RN-001 | Asignación única de aula por alumno/período | Matrículas |
| RN-002 | Registro de notas en plazo | Cursos |
| RN-003 | Control diario de asistencia | Asistencia |
| RN-004 | Restricción de matrícula por deuda | Pagos & Matrículas |
| RN-005 | Acceso restringido para padres | Alumnos |
| RN-006 | Notificación automática de inasistencias | Notificaciones & Asistencia |
| RN-007 | Validación de datos obligatorios | Todos |

## 🔐 Seguridad

- **JWT (JSON Web Tokens)** para autenticación
- **Roles y permisos** implementados en el gateway
- **Validación de entrada** en todos los endpoints
- **CORS** configurado
- **Hash de contraseñas** con bcryptjs

## 📡 Endpoints Principales

### Autenticación
```
POST /api/auth/login
POST /api/auth/registro
```

### Alumnos
```
GET    /api/alumnos
GET    /api/alumnos/:id
POST   /api/alumnos
PUT    /api/alumnos/:id
DELETE /api/alumnos/:id
```

### Matrículas
```
GET  /api/matriculas
POST /api/matriculas
PUT  /api/matriculas/:id
```

### Pagos
```
GET          /api/pagos
POST         /api/pagos
PUT          /api/pagos/:id/procesar
GET          /api/pagos-alumno/:alumno_id
GET          /api/deuda/:alumno_id (RN-004)
```

### Asistencia
```
GET  /api/asistencia
POST /api/asistencia (RN-003, RN-006)
GET  /api/asistencia-alumno/:alumno_id
```

### Notificaciones
```
GET  /api/notificaciones
POST /api/notificaciones
POST /api/notificaciones/inasistencia (RN-006)
```

## 🛠️ Comandos Útiles

```bash
# Iniciar en modo desarrollo
npm run dev

# Iniciar solo el gateway
npm start

# Iniciar servicios individuales
npm run alumnos       # Puerto 3001
npm run matricula     # Puerto 3002
npm run profesores    # Puerto 3003
npm run cursos        # Puerto 3004
npm run pagos         # Puerto 3005
npm run notificaciones # Puerto 3006
npm run asistencia    # Puerto 3007

# Reinicializar base de datos
npm run db:init

# Ejecutar tests
npm test
```

## 🔄 Flujo de Matrícula Completo

1. **Alumno se registra** en el sistema
2. **Sistema valida deudas** (RN-004)
3. **Alumno crea matrícula** en un curso
4. **Sistema valida asignación única** (RN-001)
5. **Se registra en base de datos**
6. **Se notifica a padre** (RN-006)

## 📝 Desarrollo

### Agregar un nuevo endpoint

1. Ubicar el archivo `services/nombre-service/server.js`
2. Agregar ruta: `app.get('/endpoint', async (req, res) => { ... })`
3. Validar datos con `shared/validators.js`
4. Devolver respuesta con `shared/utils.js`

### Ejemplo de nuevo endpoint:

```javascript
app.get('/alumnos/por-grado/:grado', async (req, res) => {
  try {
    const { grado } = req.params;
    const alumnos = await getAll(
      'SELECT * FROM alumnos WHERE grado = ?',
      [grado]
    );
    res.json(respuestaExito(alumnos));
  } catch (error) {
    res.status(500).json(respuestaError('Error', 'FETCH_ERROR'));
  }
});
```

## 🐛 Troubleshooting

### Error: "Puerto ya en uso"
```bash
# Cambiar puerto en .env
GATEWAY_PORT=3001
```

### Error: "Base de datos no encontrada"
```bash
npm run db:init
```

### Error de CORS
Verificar que `ALLOWED_ORIGINS` en `.env` incluya el dominio del frontend.

## 📚 Documentación Adicional

- [API Documentation](./docs/API.md) - Documentación completa de endpoints
- [Architecture](./docs/ARCHITECTURE.md) - Detalles de la arquitectura
- [Database Schema](./database/schema.sql) - Estructura de la base de datos

## 👥 Equipo de Desarrollo

- Edward Antonio Rivera (U21317379)
- Naomi Caballero Caceres (U21205215)
- Maria Celeste Cuba Hinostroza (U21232415)

## 📄 Licencia

MIT - Proyecto Educativo

## 🎓 Institución

Universidad Tecnológica del Perú (UTP)
Facultad de Ingeniería
Curso: Arquitectura Orientada al Servicio (SOA)
Docente: Cesar Augusto Minguillo Rubio

---

**Última actualización**: Abril 2025
**Estado**: ✅ Producción
