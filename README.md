# Sistema SOA - Colegio Futuro Digital

Sistema de gestión académica basado en una arquitectura orientada a servicios con API Gateway, frontend en React y base de datos SQLite.

## Requisitos

- Node.js 16 o superior
- npm 7 o superior
- Docker y docker-compose, solo si quieres usar contenedores


## Instalación y arranque (Windows - PowerShell)

Sigue estos pasos en el orden indicado desde la carpeta raíz del proyecto (`C:\Users\USUARIO\Downloads\SOA\SOA`). Copia y pega cada bloque en PowerShell.

1) Instalar dependencias (raíz):

```powershell
npm install
```

2) Instalar dependencias del frontend:

```powershell
cd frontend
npm install
cd ..
```

3) Crear archivo `.env` en la raíz (mínimo):

```powershell
notepad .\.env
# agregar al archivo:
JWT_SECRET=tu_secreto_aqui
GATEWAY_PORT=3000
# guardar y cerrar notepad
```

4) Inicializar la base de datos (semillas). IMPORTANTE: ejecutar desde la raíz del proyecto, no desde `frontend`:

```powershell
npm run db:init
```

5) Levantar todos los servicios (API Gateway y microservicios) en modo desarrollo:

```powershell
npm run dev
```

6) En otro terminal abrir el `frontend`. Si el puerto `3001` está en uso (por servicios backend), arranca en otro puerto, por ejemplo `3009`:

```powershell
cd frontend
$env:PORT=3009; npm start
```

Ahora la app estará disponible en `http://localhost:3009` (o `http://localhost:3001` si usaste el puerto por defecto y estaba libre).

Importante: si React cambia de puerto porque `3001` ya está ocupado, no pasa nada. El API Gateway ya permite orígenes locales (`localhost` y `127.0.0.1`) en cualquier puerto, así evitas el error de red al iniciar sesión.


## Alternativa: Docker (recomendado para despliegue uniforme)

Si prefieres usar Docker, crea un archivo `.env` con `JWT_SECRET` y luego:

```powershell
$env:JWT_SECRET='tu_secreto_aqui'
docker-compose up --build
```

Nota: Docker Compose montará `./database` para persistir la base de datos SQLite.

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
- Si el frontend arrancó en otro puerto, no debería fallar: el gateway acepta `localhost`/`127.0.0.1` en cualquier puerto.
- Si quieres reiniciar la base de datos, vuelve a ejecutar `npm run db:init`.
- Si el frontend no abre, revisa que esté corriendo en el puerto `3001`.

## Estructura general

- `api-gateway/`: autenticación, middleware y endpoints principales.
- `services/`: microservicios del dominio académico.
- `frontend/`: interfaz React.
- `database/`: esquema, inicialización y verificación de datos.
- `config/` y `shared/`: utilidades comunes del backend.
