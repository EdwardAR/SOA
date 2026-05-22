# Sistema SOA - Colegio Futuro Digital

Sistema de gestión académica basado en una arquitectura orientada a servicios con API Gateway, frontend en React y base de datos SQLite.

## Requisitos

- Node.js 16 o superior
- npm 7 o superior
- Docker y docker-compose, solo si quieres usar contenedores

## Instalación local

1. Instala dependencias en la raíz:

```bash
npm install
```

1. Instala dependencias del frontend:

```bash
cd frontend
npm install
cd ..
```

1. Inicializa la base de datos y los datos de prueba:

```bash
npm run db:init
```

1. Crea un archivo `.env` en la raíz con al menos:

```env
JWT_SECRET=tu_secreto_aqui
GATEWAY_PORT=3000
```

## Cómo levantar el sistema

### Windows

```powershell
.\start-all.bat
```

### Desarrollo completo

```bash
npm run dev
```

### Arranque manual

Backend:

```bash
npm start
```

Frontend en Windows:

```bash
cd frontend
npm start
```

Frontend en Linux o macOS:

```bash
cd frontend
PORT=3001 npm start
```

### Docker

```bash
docker-compose up --build
```

## Usuarios de prueba

Las credenciales de ejemplo se cargan con `npm run db:init`.

| Usuario | Tipo | Qué prueba en la interfaz | Credenciales |
| --- | --- | --- | --- |
| Director | `director` | Acceso completo al dashboard y a todos los módulos | `director@colegio.com` / `password123` |
| Administrativo | `administrativo` | Gestión de alumnos, matrículas, cursos y pagos | `admin@colegio.com` / `password123` |
| Docente | `docente` | Consulta de cursos, asistencia y calificaciones | `juan@colegio.com` / `password123` |
| Alumno | `alumno` | Consulta de información permitida por el sistema | `luis@estudiante.com` / `password123` |
| Padre / Apoderado | `padre` | Revisión de notificaciones y seguimiento | `padre@colegio.com` / `password123` |

## Qué verás en cada módulo

- Dashboard: resumen general con conteos de alumnos, cursos, profesores y pagos.
- Alumnos: listado de alumnos sembrados en la base de datos.
- Profesores: listado de docentes con usuario, nombre, especialidad y contacto.
- Cursos: cursos con código, grado, sección y salón.
- Matrículas: relación alumno-curso cargada desde SQLite.
- Pagos: pagos iniciales con estado pagado y pendiente.
- Asistencia: registros de asistencia sembrados para probar el listado.
- Calificaciones: notas de ejemplo visibles en el módulo.
- Notificaciones: notificaciones de prueba visibles en la interfaz.

## Variables importantes

- `JWT_SECRET`: clave para firmar el token.
- `GATEWAY_PORT`: puerto del API Gateway.
- `ALLOWED_ORIGINS`: lista de orígenes permitidos por CORS, por ejemplo `http://localhost:3001`.

## Troubleshooting

- Si el login no responde desde el frontend, revisa que el gateway esté permitiendo `http://localhost:3001` en CORS.
- Si quieres reiniciar la base de datos, vuelve a ejecutar `npm run db:init`.
- Si el frontend no abre, revisa que esté corriendo en el puerto `3001`.

## Estructura general

- `api-gateway/`: autenticación, middleware y endpoints principales.
- `services/`: microservicios del dominio académico.
- `frontend/`: interfaz React.
- `database/`: esquema, inicialización y verificación de datos.
- `config/` y `shared/`: utilidades comunes del backend.
