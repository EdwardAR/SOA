# Ejemplos de uso - Sistema SOA de Gestion Escolar

Este documento incluye flujos practicos para probar el sistema de punta a punta.

## 1. Flujo minimo de autenticacion

### 1.1 Registrar usuario

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "demo_admin",
  "email": "demo_admin@example.com",
  "password": "DemoPass123!",
  "role": "admin"
}
```

### 1.2 Login

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "demo_admin@example.com",
  "password": "DemoPass123!"
}
```

Guardar `data.token` para solicitudes protegidas.

## 2. Flujo de estudiantes

### 2.1 Crear estudiante

```http
POST http://localhost:3000/api/students
Content-Type: application/json

{
  "enrollmentNumber": "STU-2026-001",
  "firstName": "Ana",
  "lastName": "Lopez",
  "email": "ana.lopez@example.com",
  "password": "Pass12345",
  "dateOfBirth": "2007-02-10",
  "gender": "F"
}
```

### 2.2 Listar estudiantes

```http
GET http://localhost:3000/api/students
Authorization: Bearer <token>
```

### 2.3 Consultar estudiante

```http
GET http://localhost:3000/api/students/1
Authorization: Bearer <token>
```

## 3. Flujo de docentes

### 3.1 Crear docente

```http
POST http://localhost:3000/api/teachers
Content-Type: application/json

{
  "employeeId": "EMP-2026-001",
  "firstName": "Carlos",
  "lastName": "Diaz",
  "email": "carlos.diaz@example.com",
  "password": "Pass12345",
  "specialization": "Matematicas",
  "hireDate": "2024-01-10"
}
```

### 3.2 Listar docentes

```http
GET http://localhost:3000/api/teachers
Authorization: Bearer <token>
```

## 4. Flujo de matricula

Antes de matricular, valida que exista un classroom (ejemplo `id=1`).

### 4.1 Matricular

```http
POST http://localhost:3000/api/enrollments
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": 1,
  "classroomId": 1,
  "enrollmentDate": "2026-04-15"
}
```

### 4.2 Consultar matriculas de estudiante

```http
GET http://localhost:3000/api/enrollments/student/1
Authorization: Bearer <token>
```

## 5. Flujo academico

### 5.1 Registrar notas

```http
POST http://localhost:3000/api/academic/grades
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": 1,
  "courseId": 1,
  "teacherId": 1,
  "midtermScore": 82.5,
  "finalScore": 91.0,
  "recordedDate": "2026-04-15"
}
```

### 5.2 Historial academico

```http
GET http://localhost:3000/api/academic/students/1/history
Authorization: Bearer <token>
```

## 6. Flujo de asistencia

### 6.1 Marcar asistencia

```http
POST http://localhost:3000/api/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": 1,
  "classroomId": 1,
  "attendanceDate": "2026-04-15",
  "status": "present"
}
```

### 6.2 Consultar asistencia

```http
GET http://localhost:3000/api/attendance/students/1
Authorization: Bearer <token>
```

## 7. Flujo de pagos

### 7.1 Generar factura

```http
POST http://localhost:3000/api/payments/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": 1,
  "amount": 1200.00,
  "feeType": "Mensualidad",
  "dueDate": "2026-05-10"
}
```

### 7.2 Consultar facturas

```http
GET http://localhost:3000/api/payments/students/1/invoices
Authorization: Bearer <token>
```

## 8. Flujo de notificaciones

### 8.1 Enviar notificacion in-app

```http
POST http://localhost:3000/api/notifications/send/in-app
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientUserId": 1,
  "subject": "Aviso",
  "message": "Notificacion de prueba"
}
```

### 8.2 Consultar notificaciones

```http
GET http://localhost:3000/api/notifications/users/1
Authorization: Bearer <token>
```

## 9. Validacion rapida desde interfaz visual

Puedes ejecutar estos flujos sin Postman en:

- `http://localhost:3000/portal`

Orden sugerido:

1. Autenticacion (Registrar + Iniciar sesion)
2. Estudiantes (Crear + Listar)
3. Docentes (Crear + Listar)
4. Matricula
5. Asistencia
6. Pagos
7. Notificaciones

## 10. Errores comunes y correccion

### `Cannot GET /api/auth/login`

Es normal al abrir la URL en navegador (envia GET). Login requiere POST.

### `401 Invalid or expired token`

Repetir login y usar token nuevo.

### `404 Classroom not found`

Insertar datos base en `classrooms`.

### `500 Registration failed`

Verificar conectividad a base de datos y credenciales en `.env`.
