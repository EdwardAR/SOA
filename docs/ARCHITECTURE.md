# 🏗️ Arquitectura del Sistema SOA - Futuro Digital

## Visión General

El sistema implementa una **Arquitectura Orientada a Servicios (SOA)** compuesta por un API Gateway central y siete microservicios independientes, todos comunicándose mediante HTTP/REST.

```
                        ┌─────────────────────────────┐
                        │        Cliente Web           │
                        │   (Navegador / HTTP Client)  │
                        └─────────────┬───────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │         API Gateway          │
                        │         Puerto 3000          │
                        │  - Autenticación JWT         │
                        │  - Autorización por Roles    │
                        │  - Proxy a Servicios         │
                        │  - Portal Web (HTML/CSS/JS)  │
                        └──────────────┬──────────────┘
                                       │
              ┌───────────┬────────────┼────────────┬───────────┐
              ▼           ▼            ▼            ▼           ▼
         ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
         │Alumnos  │ │Matrículas│ │Profesores│ │ Cursos  │ │  Pagos  │
         │:3001    │ │:3002    │ │:3003    │ │:3004    │ │:3005    │
         └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘

              ┌────────────────────┐
              ▼                    ▼
         ┌─────────┐        ┌─────────────┐
         │Notific. │        │ Asistencia  │
         │:3006    │        │:3007        │
         └─────────┘        └─────────────┘

              Todos los servicios acceden a:
              ┌─────────────────────────────┐
              │     Base de Datos SQLite     │
              │     database/colegio.db      │
              └─────────────────────────────┘
```

---

## Componentes Principales

### API Gateway (`api-gateway/gateway.js`)
- **Puerto:** 3000
- **Responsabilidades:**
  - Autenticación y validación de tokens JWT
  - Autorización basada en roles (`alumno`, `docente`, `administrativo`, `padre`, `director`)
  - Proxy de peticiones a los microservicios
  - Servir el portal web estático (`api-gateway/public/`)
  - Registro de usuarios y login
- **Tecnologías:** Express.js, JWT (jsonwebtoken), bcryptjs

### Microservicios

| Servicio | Puerto | Archivo | Responsabilidades |
|---------|--------|---------|------------------|
| Alumnos | 3001 | `services/alumnos-service/server.js` | CRUD de estudiantes, RN-005 |
| Matrículas | 3002 | `services/matricula-service/server.js` | Inscripciones, RN-001, RN-004 |
| Profesores | 3003 | `services/profesores-service/server.js` | Gestión docente |
| Cursos | 3004 | `services/cursos-service/server.js` | Creación y gestión de cursos, RN-002 |
| Pagos | 3005 | `services/pagos-service/server.js` | Transacciones y deudas, RN-004 |
| Notificaciones | 3006 | `services/notificaciones-service/server.js` | Email y SMS, RN-006 |
| Asistencia | 3007 | `services/asistencia-service/server.js` | Control de asistencia, RN-003, RN-006 |

---

## Módulos Compartidos

### `config/database.js`
Proporciona acceso unificado a SQLite para todos los servicios mediante las funciones:
- `initDatabase()` — inicializa la base de datos desde el schema
- `getDatabase()` — devuelve la instancia de la DB
- `getOne(sql, params)` — ejecuta una consulta y devuelve una fila
- `getAll(sql, params)` — ejecuta una consulta y devuelve todas las filas
- `runQuery(sql, params)` — ejecuta una sentencia de escritura

### `shared/utils.js`
Utilidades comunes:
- `respuestaExito(datos, mensaje, codigo)` — formatea respuestas exitosas
- `respuestaError(error, codigo)` — formatea respuestas de error
- `generarId()` — genera un UUID v4

### `shared/validators.js`
Validadores de datos:
- `validadores.esEmailValido(email)`
- `validadores.esTelefonoValido(telefono)`
- `validadores.esRequeridoValido(valor)`

---

## Base de Datos

**Motor:** SQLite (archivo `database/colegio.db`)

**Tablas principales:**

| Tabla | Descripción |
|-------|-----------|
| `usuarios` | Cuentas de acceso (todos los roles) |
| `alumnos` | Datos académicos de estudiantes |
| `profesores` | Datos de docentes |
| `cursos` | Cursos disponibles |
| `matriculas` | Inscripciones alumno-curso |
| `pagos` | Transacciones y estados de deuda |
| `asistencia` | Registros diarios de presencia |
| `notificaciones` | Historial de notificaciones enviadas |

Para ver el schema completo: [`database/schema.sql`](../database/schema.sql)

---

## Flujo de Autenticación

```
1. Cliente → POST /api/auth/login { email, password }
2. Gateway verifica credenciales contra tabla `usuarios`
3. Genera JWT firmado con JWT_SECRET (payload: id, email, tipo_usuario)
4. Cliente almacena token y lo envía en cabecera: Authorization: Bearer <token>
5. Gateway valida token en cada petición protegida
6. Gateway verifica rol del usuario contra los roles permitidos del endpoint
```

---

## Reglas de Negocio

| ID | Descripción | Servicio responsable |
|----|-------------|---------------------|
| RN-001 | Un alumno no puede estar matriculado en dos cursos del mismo período | Matrículas |
| RN-002 | Solo se pueden registrar notas durante el plazo activo del curso | Cursos |
| RN-003 | La asistencia se registra una vez por día por alumno y curso | Asistencia |
| RN-004 | Un alumno con deuda pendiente no puede matricularse | Pagos & Matrículas |
| RN-005 | Los padres solo pueden ver datos de sus hijos | Alumnos |
| RN-006 | Al registrar una falta, se envía notificación automática al padre | Notificaciones & Asistencia |
| RN-007 | Todos los endpoints validan campos obligatorios antes de procesar | Todos |

---

## Despliegue con Docker

El proyecto incluye `docker-compose.yml` para despliegue en contenedores. Cada servicio tiene su propio contenedor y se comunican a través de la red `soa-network`.

Requisitos:
- Docker y Docker Compose instalados
- Variable de entorno `JWT_SECRET` configurada en el sistema o en un archivo `.env`

```bash
docker-compose up -d
```

---

## Decisiones de Diseño

- **SQLite para desarrollo:** Facilita el onboarding sin necesidad de instalar un servidor de base de datos. En producción se recomienda migrar a PostgreSQL.
- **Un archivo de DB compartido:** Todos los microservicios comparten el mismo archivo SQLite montado como volumen. En una arquitectura de producción cada servicio debería tener su propia base de datos.
- **Proxy en gateway:** El API Gateway hace de proxy para todos los servicios, centralizando la autenticación y el control de acceso.
