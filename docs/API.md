# 📡 Documentación de la API - Sistema SOA Colegio Futuro Digital

Base URL: `http://localhost:3000`

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <token>
```

---

## 🔐 Autenticación

### POST `/api/auth/login`
Inicia sesión y devuelve un token JWT.

**Body:**
```json
{
  "email": "director@colegio.com",
  "password": "password123"
}
```

**Respuesta 200:**
```json
{
  "exito": true,
  "datos": {
    "token": "eyJhbGc...",
    "usuario": {
      "id": "uuid",
      "nombre": "Dr. Carlos Martinez",
      "email": "director@colegio.com",
      "tipo_usuario": "director"
    }
  }
}
```

### POST `/api/auth/registro`
Registra un nuevo usuario.

**Body:**
```json
{
  "nombre": "Nombre Apellido",
  "email": "usuario@colegio.com",
  "password": "contraseña",
  "tipo_usuario": "alumno"
}
```

---

## 👥 Alumnos

| Método | Ruta | Roles permitidos | Descripción |
|--------|------|-----------------|-------------|
| GET | `/api/alumnos` | Autenticado | Listar todos los alumnos |
| GET | `/api/alumnos/:id` | Autenticado | Obtener alumno por ID |
| POST | `/api/alumnos` | administrativo, director | Crear alumno |
| PUT | `/api/alumnos/:id` | administrativo, director | Actualizar alumno |
| DELETE | `/api/alumnos/:id` | director | Eliminar alumno |

---

## 📝 Matrículas

| Método | Ruta | Roles permitidos | Descripción |
|--------|------|-----------------|-------------|
| GET | `/api/matriculas` | Autenticado | Listar matrículas |
| GET | `/api/matriculas/:id` | Autenticado | Obtener matrícula |
| POST | `/api/matriculas` | administrativo, alumno | Crear matrícula (valida RN-001, RN-004) |
| PUT | `/api/matriculas/:id` | administrativo | Actualizar matrícula |

---

## 👨‍🏫 Profesores

| Método | Ruta | Roles permitidos | Descripción |
|--------|------|-----------------|-------------|
| GET | `/api/profesores` | Autenticado | Listar profesores |
| GET | `/api/profesores/:id` | Autenticado | Obtener profesor |
| POST | `/api/profesores` | director | Crear profesor |
| PUT | `/api/profesores/:id` | director | Actualizar profesor |

---

## 📚 Cursos

| Método | Ruta | Roles permitidos | Descripción |
|--------|------|-----------------|-------------|
| GET | `/api/cursos` | Autenticado | Listar cursos |
| GET | `/api/cursos/:id` | Autenticado | Obtener curso |
| POST | `/api/cursos` | director, administrativo | Crear curso |
| PUT | `/api/cursos/:id` | director, administrativo | Actualizar curso |

---

## 💰 Pagos

| Método | Ruta | Roles permitidos | Descripción |
|--------|------|-----------------|-------------|
| GET | `/api/pagos` | Autenticado | Listar pagos |
| GET | `/api/pagos/:id` | Autenticado | Obtener pago |
| POST | `/api/pagos` | Autenticado | Registrar pago |
| PUT | `/api/pagos/:id/procesar` | administrativo | Procesar pago |
| GET | `/api/pagos-alumno/:alumno_id` | Autenticado | Pagos de un alumno |
| GET | `/api/deuda/:alumno_id` | Autenticado | Deuda de un alumno (RN-004) |

---

## 📧 Notificaciones

| Método | Ruta | Roles permitidos | Descripción |
|--------|------|-----------------|-------------|
| GET | `/api/notificaciones` | Autenticado | Listar notificaciones |
| POST | `/api/notificaciones` | Autenticado | Crear notificación |
| POST | `/api/notificaciones/inasistencia` | docente | Notificar inasistencia (RN-006) |

---

## ✅ Asistencia

| Método | Ruta | Roles permitidos | Descripción |
|--------|------|-----------------|-------------|
| GET | `/api/asistencia` | Autenticado | Listar registros de asistencia |
| GET | `/api/asistencia/:id` | Autenticado | Obtener registro |
| POST | `/api/asistencia` | docente | Registrar asistencia (RN-003, RN-006) |
| GET | `/api/asistencia-alumno/:alumno_id` | Autenticado | Asistencia de un alumno |

---

## 🛠️ Utilidades

### GET `/api/health`
Verifica el estado del gateway y muestra URLs de servicios. No requiere autenticación.

### GET `/api/me`
Devuelve información del usuario autenticado.

---

## 📋 Formato de Respuestas

**Éxito:**
```json
{
  "exito": true,
  "datos": { ... },
  "mensaje": "Operación exitosa"
}
```

**Error:**
```json
{
  "exito": false,
  "error": "Descripción del error",
  "codigo": "ERROR_CODE"
}
```
