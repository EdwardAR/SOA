# Sistema SOA de Gestion Escolar

Plataforma de gestion escolar basada en Arquitectura Orientada a Servicios (SOA) con microservicios, API Gateway, MySQL/MariaDB y autenticacion JWT.

## Resumen de arquitectura

La solucion expone un API Gateway que enruta solicitudes hacia servicios independientes:

- API Gateway (3000)
- Auth Service (3008)
- Student Service (3001)
- Teacher Service (3002)
- Enrollment Service (3003)
- Academic Service (3004)
- Attendance Service (3005)
- Payment Service (3006)
- Notification Service (3007)

## Requisitos previos

- Windows 10/11
- Node.js 18+ (recomendado)
- npm
- Motor de BD MySQL o MariaDB

## Estructura del proyecto

- api-gateway/: enrutamiento principal
- services/: microservicios por dominio
- shared/: DB, auth, errores y validaciones
- database/: esquema SQL
- API_DOCUMENTATION.md: referencia de endpoints
- EXAMPLES.md: ejemplos de requests
- ARCHITECTURE.md: decisiones de arquitectura

## Configuracion inicial (paso a paso)

### 1. Instalar dependencias Node

```bash
npm install
```

### 2. Crear archivo de entorno

```bash
copy .env.example .env
```

### 3. Revisar variables en .env

Valores recomendados para entorno local:

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

Nota: si usas password en root o un usuario dedicado, ajusta DB_USER y DB_PASSWORD.

### 4. Crear base de datos y cargar esquema

Si tienes mysql/mariadb en PATH:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS school_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root school_management < database/schema.sql
```

Si no esta en PATH (caso comun en Windows con MariaDB):

```powershell
& "C:\Program Files\MariaDB 12.2\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS school_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
Get-Content .\database\schema.sql | & "C:\Program Files\MariaDB 12.2\bin\mysql.exe" -u root school_management
```

### 5. Verificar tablas creadas

```bash
mysql -u root -e "USE school_management; SHOW TABLES;"
```

Debes ver 11 tablas:

- users
- students
- teachers
- classrooms
- enrollments
- courses
- teacher_courses
- grades
- attendance
- payments
- notifications

## Como levantar el sistema

### Opcion A: por scripts (recomendada)

```bash
npm run ops:start-all
npm run ops:health
```

Para detener:

```bash
npm run ops:stop-all
```

### Opcion B: manual por servicio

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

## Verificacion rapida de funcionamiento

### 1. Health checks

```bash
npm run ops:health
```

Todos deben responder OK (puertos 3000 a 3008).

### 2. Prueba end-to-end minima (auth)

Registro:

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "admin_local",
  "email": "admin_local@example.com",
  "password": "AdminPass123!",
  "role": "admin"
}
```

Login:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin_local@example.com",
  "password": "AdminPass123!"
}
```

## Arranque automatico de BD en Windows

Se dejo un script de inicio automatico por usuario en:

- C:/Users/edwar/AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup/start-mariadb-soa.cmd

Esto inicia MariaDB al iniciar sesion sin requerir instalar un servicio de Windows con permisos de administrador.

## Troubleshooting

### Error: ECONNREFUSED en base de datos

Posibles causas:

- MariaDB/MySQL no esta iniciado
- Credenciales de .env no coinciden
- Puerto 3306 ocupado o bloqueado

Acciones:

1. Verifica proceso:

```powershell
Get-Process mariadbd,mysqld -ErrorAction SilentlyContinue
```

2. Prueba conexion:

```powershell
& "C:\Program Files\MariaDB 12.2\bin\mysql.exe" -u root -e "SELECT VERSION();"
```

### Error: EADDRINUSE al iniciar servicios

Significa que el puerto ya esta en uso.

Acciones:

1. Detener procesos Node:

```bash
npm run ops:stop-all
```

2. Levantar nuevamente:

```bash
npm run ops:start-all
```

### Error: mysql no se reconoce

Usa ruta completa del ejecutable MariaDB en los comandos o agrega la carpeta bin al PATH.

## Endpoints principales

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/verify
- GET /api/auth/profile
- PUT /api/auth/profile
- POST /api/auth/change-password

### Students
- POST /api/students
- GET /api/students
- GET /api/students/:id
- PUT /api/students/:id
- DELETE /api/students/:id

### Teachers
- POST /api/teachers
- GET /api/teachers
- GET /api/teachers/:id
- POST /api/teachers/:teacherId/courses

### Enrollments
- POST /api/enrollments
- GET /api/enrollments/student/:studentId
- GET /api/enrollments/classroom/:classroomId
- PUT /api/enrollments/:enrollmentId/status

### Academic
- POST /api/academic/grades
- GET /api/academic/students/:studentId/history
- GET /api/academic/students/:studentId/gpa
- GET /api/academic/courses/:courseId/grades

### Attendance
- POST /api/attendance
- GET /api/attendance/students/:studentId
- GET /api/attendance/students/:studentId/summary
- GET /api/attendance/report/classroom

### Payments
- POST /api/payments/invoices
- GET /api/payments/:paymentId
- POST /api/payments/:paymentId/record
- GET /api/payments/report/overdue

### Notifications
- POST /api/notifications/send/email
- POST /api/notifications/send/sms
- POST /api/notifications/send/in-app
- POST /api/notifications/broadcast
- GET /api/notifications/users/:userId

## Seguridad y buenas practicas

- JWT en endpoints protegidos
- Passwords con bcryptjs
- Validacion de entrada con express-validator
- SQL parametrizado
- Arquitectura por capas: controller, service, repository
- Principios SOLID y DRY

## Documentacion complementaria

- API_DOCUMENTATION.md
- EXAMPLES.md
- ARCHITECTURE.md
