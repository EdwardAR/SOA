# Documentacion de API - Sistema SOA de Gestion Escolar

## 1. Base URL y convenciones

Base URL por gateway:

- `http://localhost:3000`

Formato de respuesta recomendado:

```json
{
  "success": true,
  "message": "Operacion completada",
  "data": {}
}
```

Formato de error:

```json
{
  "success": false,
  "message": "Descripcion del error",
  "details": null,
  "timestamp": "2026-04-15T16:00:00.000Z"
}
```

## 2. Autenticacion

Header para rutas protegidas:

```http
Authorization: Bearer <jwt_token>
```

### Registro

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin_local",
  "email": "admin_local@example.com",
  "password": "AdminPass123!",
  "role": "admin"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin_local@example.com",
  "password": "AdminPass123!"
}
```

### Perfil

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

## 3. Endpoints por modulo

## 3.1 Estudiantes

- `POST /api/students` crear estudiante
- `GET /api/students` listar estudiantes
- `GET /api/students/:id` detalle
- `PUT /api/students/:id` actualizar
- `DELETE /api/students/:id` eliminar
- `GET /api/students/:id/academic-record` historial academico
- `GET /api/students/:id/enrollment-history` historial de matriculas

Payload de creacion:

```json
{
  "enrollmentNumber": "STU-2026-001",
  "firstName": "Ana",
  "lastName": "Perez",
  "email": "ana.perez@example.com",
  "password": "Pass12345",
  "dateOfBirth": "2007-05-12",
  "gender": "F"
}
```

## 3.2 Docentes

- `POST /api/teachers` crear docente
- `GET /api/teachers` listar
- `GET /api/teachers/:id` detalle
- `PUT /api/teachers/:id` actualizar
- `DELETE /api/teachers/:id` eliminar
- `POST /api/teachers/:teacherId/courses` asignar curso
- `GET /api/teachers/:teacherId/courses` listar cursos del docente

## 3.3 Matriculas

- `POST /api/enrollments` matricular estudiante
- `GET /api/enrollments/student/:studentId` ver matriculas por estudiante
- `GET /api/enrollments/classroom/:classroomId` ver matriculas por aula
- `PUT /api/enrollments/:enrollmentId/status` cambiar estado
- `DELETE /api/enrollments/:enrollmentId` eliminar matricula

Estados permitidos:

- `active`
- `graduated`
- `dropped`
- `suspended`

## 3.4 Academico

- `POST /api/academic/grades` registrar notas
- `GET /api/academic/students/:studentId/history` historial academico
- `GET /api/academic/students/:studentId/gpa` resumen de rendimiento
- `GET /api/academic/courses/:courseId/grades` notas por curso
- `GET /api/academic/courses/:courseId/average` promedio del curso
- `PUT /api/academic/grades/:gradeId` actualizar nota

## 3.5 Asistencia

- `POST /api/attendance` marcar asistencia
- `GET /api/attendance/students/:studentId` consultar asistencia
- `GET /api/attendance/students/:studentId/summary` resumen
- `GET /api/attendance/students/:studentId/monthly?month=4&year=2026` reporte mensual
- `GET /api/attendance/report/classroom?classroomId=1&attendanceDate=2026-04-15` reporte por aula
- `PUT /api/attendance/:attendanceId` actualizar asistencia

Estados permitidos:

- `present`
- `absent`
- `late`
- `excused`

## 3.6 Pagos

- `POST /api/payments/invoices` generar factura
- `GET /api/payments/:paymentId` detalle de pago
- `POST /api/payments/:paymentId/record` registrar pago
- `PUT /api/payments/:paymentId/cancel` cancelar pago
- `GET /api/payments/students/:studentId/invoices` facturas por estudiante
- `GET /api/payments/students/:studentId/summary` resumen financiero
- `GET /api/payments/report/overdue` vencidos

## 3.7 Notificaciones

- `POST /api/notifications/send/email` envio email
- `POST /api/notifications/send/sms` envio SMS
- `POST /api/notifications/send/in-app` envio interno
- `POST /api/notifications/broadcast` envio masivo
- `GET /api/notifications/users/:userId` consultar notificaciones
- `PUT /api/notifications/:notificationId/read` marcar leida
- `DELETE /api/notifications/:notificationId` eliminar

## 4. Codigos HTTP comunes

- `200`: exito
- `201`: creado
- `400`: validacion o request invalido
- `401`: token ausente/invalido
- `403`: sin permisos
- `404`: recurso no encontrado
- `409`: conflicto (duplicado)
- `500`: error interno

## 5. Notas funcionales importantes

1. El sistema expone microservicios REST, no un frontend de negocio completo por defecto.
2. Para pruebas visuales usa `http://localhost:3000/portal`.
3. Para pruebas tecnicas de endpoints usa `http://localhost:3000/test` o Postman.
4. Para matriculas/asistencia pueden requerirse datos base previos en tablas como `classrooms` y `courses`.
