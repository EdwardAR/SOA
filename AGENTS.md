# AGENTS.md — SOA (Colegio Futuro Digital)

## Setup & Dev

- `npm install` installs backend deps (root). Frontend deps live in `frontend/package.json` and need `cd frontend && npm install`.
- Copy `.env.example` → `.env`. The app will not start without it.
- `npm run db:init` drops/creates the DB from `database/schema.sql` and seeds test data (see README for users).
- `npm run dev` starts all 9 processes (gateway + 8 services) in parallel via `concurrently` + `nodemon`.
- Docker is optional: `docker compose up --build` runs 9 containers sharing a single SQLite volume.

## Architecture Reality

- **The API Gateway (`api-gateway/gateway.js`) is the real backend.** It contains ALL CRUD logic, directly querying the single SQLite DB. The 8 microservices under `services/` exist but the gateway does **not** proxy to them (proxy code is commented out — "DESHABILITADO - Usando BD directa").
- **All services share one SQLite file** (`database/colegio.db`). This is not production SOA, but is the current architecture.
- Frontend (React + TS) talks **only** to the gateway on `localhost:3000`.

## Key Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start all services with auto-reload |
| `npm start` | Start gateway only (no auto-reload) |
| `npm test` | `jest --detectOpenHandles` (no test files exist yet) |
| `npm run test:api` | References `test-api.js` — **file does not exist** |
| `npm run verify` | References `verify-services.js` — **file does not exist** |
| `npm run db:init` | Initialize + seed the SQLite database |
| `npm run db:verify` | Verify seeded data counts |

## Service Ports

- Gateway: `3000` — frontend talks here
- Alumnos: `3001`, Matricula: `3002`, Profesores: `3003`, Cursos: `3004`, Pagos: `3005`, Notificaciones: `3006`, Asistencia: `3007`, Calificaciones: `3008`

## Tunnel / Compartir con VS Code

Para compartir el sistema externamente usando VS Code Port Forwarding:

1. **Primero construir el frontend:** `cd frontend && npm run build` (desde la raíz)
2. **Iniciar solo el gateway:** `npm start` (o `npm run dev` para editar en vivo, pero el build ya está compilado)
3. **En VS Code:** Pestaña "Puertos" → click derecho en puerto **3000** → "Port Visibility" → "Public"
4. **Abrir la URL del túnel** (ej: `https://xxxx-3000.preview.app.github.dev`)

El gateway sirve tanto la API (`/api/*`) como el frontend build (cualquier otra ruta). El `resolveApiBaseUrl()` detecta automáticamente el dominio del túnel y apunta al mismo origen.

> **No usar el túnel en el puerto del dev server de React** (salvo desarrollo local). Para compartir externamente, siempre usar el puerto 3000 (gateway) con el frontend compilado.

- **Backend:** Node.js (plain CommonJS JS, no TS), Express 4, SQLite3, JWT, bcryptjs
- **Frontend:** React 18 + TypeScript (strict mode), react-router-dom 6, Bootstrap 5, axios
- **Testing (backend):** Jest + supertest installed but **zero test files exist**
- **Linting:** Only frontend has eslint (via `react-app` preset). No backend linter, no formatter config.

## Code Conventions

- CommonJS (`require`/`module.exports`) everywhere in backend. No ES modules.
- UUID v4 (`uuid` package) for all entity IDs.
- `shared/utils.js` has common helpers (`respuestas`, `generarId`, `formatearFecha`, `paginacion`).
- `shared/validators.js` has validation functions per entity.
- `api-gateway/middleware/auth.js` has `requireRole()` middleware and token generation.
- `api-gateway/middleware/errorHandler.js` has global error handler + `asyncHandler` wrapper.
- `.env` variables used via `process.env.VAR` with `||` fallbacks throughout.

## CORS

CORS whitelist includes localhost ports 3000–3008 plus `*.ngrok-free.app` and `*.trycloudflare.com` for tunnel testing.

## Notable Gaps (no CI, no migrations, no tests)

- No CI pipelines, no pre-commit hooks, no deployment automation.
- DB schema changes are manual: edit `database/schema.sql`, re-run `npm run db:init` (destructive — drops all data unless `RESET_DB` env is managed).
- A manual migration pattern exists (`ensureColumn` functions in `database/init.js`) — repeat this pattern for column additions.
- `frontend/tools/ngrok.exe` bundled for public URL testing.
