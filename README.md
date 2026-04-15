# Sistema SOA de Gestion Escolar

Plataforma de gestion escolar implementada con arquitectura SOA y microservicios, API Gateway, autenticacion JWT y base de datos relacional MySQL/MariaDB.

## Vision general

El sistema se divide en servicios independientes por dominio y un API Gateway central:

- API Gateway: `3000`
- Auth Service: `3008`
- Student Service: `3001`
- Teacher Service: `3002`
- Enrollment Service: `3003`
- Academic Service: `3004`
- Attendance Service: `3005`
- Payment Service: `3006`
- Notification Service: `3007`

## Requisitos

- Windows 10/11
- Node.js 18+
- npm
- MySQL o MariaDB

## Estructura del proyecto

- `api-gateway/`: gateway de entrada, UI de pruebas y proxy a servicios
- `services/`: microservicios por modulo
- `shared/`: utilidades compartidas (auth, errores, validaciones, DB)
- `database/schema.sql`: esquema relacional
- `scripts/`: scripts de arranque, parada y health checks

## Configuracion inicial

1. Instalar dependencias

```bash
npm install
```

2. Crear variables de entorno

```bash
copy .env.example .env
```

3. Revisar `.env`

```env
PORT=3000
AUTH_SERVICE_PORT=3008
STUDENT_SERVICE_PORT=3001
TEACHER_SERVICE_PORT=3002
ENROLLMENT_SERVICE_PORT=3003
ACADEMIC_SERVICE_PORT=3004
ATTENDANCE_SERVICE_PORT=3005
PAYMENT_SERVICE_PORT=3006
NOTIFICATION_SERVICE_PORT=3007

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=school_management

JWT_SECRET=cambia_este_valor_por_uno_largo_y_seguro
JWT_EXPIRY=7d
NODE_ENV=development
```

4. Crear base de datos y tablas

Si `mysql` esta en PATH:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS school_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root school_management < database/schema.sql
```

Si usas MariaDB en ruta local:

```powershell
& "C:\Program Files\MariaDB 12.2\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS school_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
Get-Content .\database\schema.sql | & "C:\Program Files\MariaDB 12.2\bin\mysql.exe" -u root school_management
```

## Levantar el sistema

### Opcion recomendada

```bash
npm run ops:start-all
npm run ops:health
```

Para detener:

```bash
npm run ops:stop-all
```

### Opcion manual

En terminales separadas:

```bash
npm run gateway
npm run service:auth
npm run service:student
npm run service:teacher
npm run service:enrollment
npm run service:academic
npm run service:attendance
npm run service:payment
npm run service:notification
```

## Portal visual y consola de pruebas

- Portal funcional: `http://localhost:3000/portal`
- Consola tecnica simple: `http://localhost:3000/test`
- Estado gateway: `http://localhost:3000/health`

## Flujo recomendado para validar rapido

1. Entrar a `http://localhost:3000/portal`.
2. Modulo Autenticacion: registrar usuario y luego iniciar sesion.
3. Modulo Estudiantes: crear estudiante y listar.
4. Modulo Docentes: crear docente y listar.
5. Modulo Matricula: matricular estudiante (requiere `classroom` existente).
6. Modulo Asistencia/Pagos/Notificaciones: ejecutar operaciones basicas.

## Solucion de problemas

### `Cannot GET /api/...` en navegador

Si abres una URL en la barra del navegador, se envia `GET`. Muchos endpoints de negocio usan `POST` o `PUT`.

Usa el portal en `http://localhost:3000/portal`, Postman o la consola `test`.

### `EADDRINUSE`

Puerto en uso.

```bash
npm run ops:stop-all
npm run ops:start-all
```

### `ECONNREFUSED` a base de datos

- Verificar proceso MySQL/MariaDB activo.
- Verificar `.env`.
- Confirmar puerto 3306 libre.

## Documentacion adicional

- `API_DOCUMENTATION.md`: referencia de endpoints y contratos
- `EXAMPLES.md`: pruebas guiadas con payloads
- `ARCHITECTURE.md`: patrones, decisiones y buenas practicas
