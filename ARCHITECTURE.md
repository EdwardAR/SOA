# Arquitectura y buenas practicas - Sistema SOA

## 1. Objetivo arquitectonico

Separar el dominio escolar en microservicios independientes para mejorar:

- escalabilidad por modulo,
- mantenibilidad del codigo,
- despliegue incremental,
- aislamiento de fallos.

## 2. Componentes principales

### 2.1 API Gateway

Responsabilidades:

- punto unico de entrada,
- enrutamiento por path,
- simplificacion para clientes,
- consolidacion de acceso.

### 2.2 Microservicios por dominio

- Auth
- Students
- Teachers
- Enrollment
- Academic
- Attendance
- Payments
- Notifications

Cada servicio mantiene su logica de negocio y endpoints REST.

### 2.3 Capa compartida (`shared`)

- conexion a base de datos,
- middleware JWT,
- validadores,
- manejo de errores.

## 3. Estilo de diseño interno

Cada servicio sigue la separacion:

1. Controller: gestiona request/response HTTP.
2. Service: aplica reglas de negocio.
3. Repository: acceso a datos (cuando aplica).

Beneficios:

- menor acoplamiento,
- mayor testabilidad,
- codigo mas claro.

## 4. Principios aplicados

## 4.1 SOLID

- SRP: cada clase tiene una responsabilidad clara.
- OCP: se extiende sin reescribir comportamiento base.
- LSP: sustitucion de implementaciones sin romper contratos.
- ISP: interfaces enfocadas por necesidad.
- DIP: dependencias hacia abstracciones cuando es posible.

## 4.2 DRY

- validaciones centralizadas,
- middleware reutilizable,
- manejo de errores unificado.

## 5. Seguridad

- JWT para autenticacion,
- contrasenas con bcrypt,
- validacion de entrada con `express-validator`,
- consultas parametrizadas para evitar SQL injection,
- separacion de responsabilidades para reducir errores de seguridad.

## 6. Modelo de datos

Entidades principales:

- usuarios,
- estudiantes,
- docentes,
- aulas,
- matriculas,
- cursos,
- asignacion docente-curso,
- notas,
- asistencia,
- pagos,
- notificaciones.

Relaciones clave:

- `students` y `teachers` dependen de `users`.
- `enrollments` relaciona estudiantes con aulas.
- `grades` relaciona estudiante, curso y docente.
- `attendance` relaciona estudiante y aula por fecha.
- `payments` relaciona estudiante y facturacion.

## 7. Flujo de una solicitud

Ejemplo: crear estudiante

1. Cliente llama `POST /api/students` al gateway.
2. Gateway enruta a Student Service.
3. Controller valida entrada.
4. Service aplica reglas de negocio.
5. Repository persiste en BD.
6. Service responde con objeto creado.
7. Controller retorna respuesta estandar.

## 8. Observabilidad operativa

Actualmente:

- logs basicos por servicio,
- endpoints `/health` en gateway y servicios,
- script `ops:health` para verificacion rapida.

Recomendado para evolucion:

- request-id por llamada,
- logging estructurado JSON,
- metricas y alertas.

## 9. Rendimiento y escalabilidad

Practicas actuales:

- pool de conexiones a BD,
- indices en tablas criticas,
- paginacion en listados.

Siguientes mejoras sugeridas:

- cache para lecturas frecuentes,
- desacoplar notificaciones mediante cola,
- replicacion/particion segun crecimiento.

## 10. Estrategia de pruebas

Niveles sugeridos:

1. unitarias (services),
2. integracion (service + DB),
3. smoke tests via gateway,
4. pruebas manuales con `portal` y `test`.

## 11. Decisiones tecnicas y trade-offs

- MySQL/MariaDB relacional: facilita integridad y reporting.
- Microservicios en Node/Express: rapidez de desarrollo.
- Gateway simple por proxy: menor complejidad inicial.

Trade-off principal:

- simplicidad operativa inicial vs. robustez enterprise (service discovery, observabilidad avanzada, CI/CD completo).

## 12. Roadmap recomendado

1. hardening de seguridad (rate limit, CORS estricto, usuarios DB no-root),
2. pruebas automatizadas por modulo,
3. dockerizacion,
4. pipeline CI/CD,
5. frontend de gestion completo sobre el backend existente.
