# AGENTS.md — SOA (Colegio Futuro Digital)

## Setup & Dev

- `npm install` at root (backend deps). Frontend: `cd frontend && npm install`.
- Copy `.env.example` → `.env`. Required vars: `JWT_SECRET`, `DB_PATH`. Also accepts `PERIODO_ACADEMICO` (defaults to `<currentYear>-1`) and `RESET_DB=true` to force re-seed.
- `npm run db:init` reads `database/schema.sql` and seeds — skips if DB file already exists unless `RESET_DB=true`.
- `npm run dev` starts 9 processes (gateway + 8 services) via `concurrently` + `nodemon`.
- `npm start` starts gateway-only (no reload). Also useful for production: `cd frontend && npm run build && cd .. && npm start`.
- `start-all.bat` convenience script for Windows: runs `db:init`, starts backend, then frontend dev server.
- Docker: `docker compose up --build` (9 containers, shared SQLite volume).

## Architecture Reality

- **The gateway (`api-gateway/gateway.js`) does all CRUD directly against SQLite.** The 8 microservices in `services/` exist and run as independent Express processes, but all proxy code in the gateway is disabled (marked `DESHABILITADO - Usando BD directa`).
- **Single SQLite file** `database/colegio.db` shared by all processes. Not production SOA — this is the current architecture.
- Frontend (React 18 + TS strict, Bootstrap 5, react-router-dom 6, axios) talks **only** to gateway at `localhost:3000`.
- Gateway serves both API (`/api/*`) and static frontend build (`frontend/build/`, `api-gateway/public/`).

## Key Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start all 9 processes with auto-reload |
| `npm start` | Start gateway only, no reload |
| `npm test` | `jest --detectOpenHandles` (no test files exist) |
| `npm run db:init` | Init/seed SQLite DB |
| `npm run db:verify` | Verify seeded data counts |

`npm run test:api` and `npm run verify` are defined in `package.json` but reference non-existent `test-api.js` and `verify-services.js`.

## Code Conventions

- Backend: CommonJS (`require`/`module.exports`), no ES modules, no TypeScript. UUID v4 for all entity IDs.
- `shared/utils.js`: helpers (`respuestaExito`, `respuestaError`, `generarId`, `formatearFecha`, `obtenerParametrosPaginacion`, `auditar`).
- `shared/validators.js`: per-entity validation functions.
- `api-gateway/middleware/auth.js`: `authMiddleware`, `requireRole()`, `generarToken`.
- `api-gateway/middleware/errorHandler.js`: global error handler + `asyncHandler` wrapper.
- `config/database.js`: promisified SQLite helpers (`getOne`, `getAll`, `runQuery`). `PRAGMA foreign_keys = ON` set at init.
- `.env` vars accessed via `process.env.VAR || fallback` throughout.
- Gateway defines `ROLES_CON_ACCESO_TOTAL = new Set(['director', 'administrativo'])` — these roles see all data; others get role-filtered SQL WHERE clauses.

## CORS

Whitelist: explicit `ALLOWED_ORIGINS` env var, plus automatic pass-through for localhost/127.0.0.1 (any port), `*.ngrok.io`, `*.trycloudflare.com`, `*.preview.app.github.dev`, `*.devtunnels.ms`.

## Notable Gaps

- No test files (zero `.test.*` or `.spec.*` anywhere). Jest + supertest installed but unused.
- No CI, no pre-commit hooks, no deployment automation.
- No linter/formatter for backend; frontend has eslint via `react-app` preset.
- DB schema changes: edit `database/schema.sql`, re-run `npm run db:init` with `RESET_DB=true` (destructive). No migration system.
- `frontend/tools/ngrok.exe` bundled for public URL testing.
