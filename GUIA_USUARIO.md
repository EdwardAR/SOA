# 📖 Guía de Usuario - Sistema SOA Colegio Futuro Digital

## 🎯 Inicio Rápido

### 1. **Levantar el Sistema Completo**

```bash

npm run dev
```

Espera a que aparezca este mensaje para cada servicio:

```
╔════════════════════════════════════════╗
║  ✅ SERVICIO ACTIVO               ✅ ║
╚════════════════════════════════════════╝
```

### 2. **Acceder al Portal**

Abre tu navegador en:
```
http://localhost:3000
```

### 3. **Usar Credenciales de Prueba**

Elige una según tu rol:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| 👔 Director | director@colegio.com | password123 |
| 👨‍🎓 Alumno | luis@estudiante.com | password123 |
| 👨‍🏫 Docente | juan@colegio.com | password123 |
| 🔧 Admin | admin@colegio.com | password123 |

---

## 🗂️ Estructura del Proyecto

```
SOA/
├── api-gateway/          ← Portal web + autenticación
│   ├── gateway.js        (servidor principal)
│   ├── middleware/       (autenticación, errores)
│   └── public/           (HTML, CSS, JS)
│
├── services/             ← 7 Microservicios independientes
│   ├── alumnos-service/
│   ├── matricula-service/
│   ├── profesores-service/
│   ├── cursos-service/
│   ├── pagos-service/
│   ├── notificaciones-service/
│   └── asistencia-service/
│
├── database/
│   ├── schema.sql        (estructura de DB)
│   ├── colegio.db        (base de datos SQLite)
│   └── init.js           (script de inicialización)
│
├── config/               (configuración compartida)
├── shared/               (validadores, utilidades)
├── docs/                 (documentación)
└── README.md             (este archivo)
```

---

## 🔌 Puertos y Servicios

| Servicio | Puerto | Rol |
|----------|--------|-----|
| 🌐 API Gateway | 3000 | Portal web + Auth JWT |
| 👥 Alumnos | 3001 | Gestión de estudiantes |
| 📝 Matrículas | 3002 | Inscripciones (RN-001, RN-004) |
| 👨‍🏫 Profesores | 3003 | Gestión docentes |
| 📚 Cursos | 3004 | Creación y gestión de cursos |
| 💰 Pagos | 3005 | Transacciones y deudas |
| 📧 Notificaciones | 3006 | Emails y SMS automáticos |
| ✅ Asistencia | 3007 | Control de asistencias |

---

## 📊 Flujos de Negocio Principales

### 1. **Inscripción de un Nuevo Alumno**

```
1. Admin → Servicio Alumnos: Crear nuevo alumno
2. Verificar: Documento no duplicado ✓
3. Guardar datos completos ✓
4. Alumno puede ahora matricularse
```

### 2. **Matrícula en un Curso**

```
1. Alumno → Servicio Matrículas: Crear matrícula
2. Validar: No tener deudas pendientes (RN-004) ✓
3. Validar: No estar ya matriculado (RN-001) ✓
4. Validar: Curso disponible ✓
5. Registrar matrícula ✓
6. Actualizar capacidad del curso ✓
```

### 3. **Registrar Pagos**

```
1. Tesorería → Servicio Pagos: Procesar pago
2. Validar monto y concepto ✓
3. Cambiar estado a "pagado" ✓
4. Actualizar deuda del alumno (RN-004) ✓
5. Notificar al padre (si es necesario)
```

### 4. **Registrar Asistencia**

```
1. Docente → Servicio Asistencia: Registrar por alumno
2. Validar: Fecha correcta ✓
3. Guardar estado (PRESENTE/FALTA/JUSTIFICADO) ✓
4. Si es FALTA:
   a. Generar notificación (RN-006)
   b. Enviar email al padre
```

---

## 🔍 Pruebas Manuales con cURL

### Autenticación

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "director@colegio.com",
    "password": "password123"
  }'
```

Respuesta:
```json
{
  "exito": true,
  "datos": {
    "token": "eyJhbGc...",
    "usuario": {
      "id": "uuid-123",
      "nombre": "Dr. Carlos Martinez",
      "email": "director@colegio.com",
      "tipo_usuario": "director"
    }
  }
}
```

### Obtener Token y Usar en Siguiente Llamada

```bash
# 1. Guardar token
TOKEN="eyJhbGc..."

# 2. Usar token en headers
curl -X GET http://localhost:3000/api/alumnos \
  -H "Authorization: Bearer $TOKEN"
```

### Crear Matrícula (Prueba de RN-001 y RN-004)

```bash
curl -X POST http://localhost:3000/api/matriculas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alumno_id": "alumno-uuid",
    "curso_id": "curso-uuid",
    "periodo_academico": "2024-1"
  }'
```

### Registrar Asistencia (Prueba de RN-003, RN-006)

```bash
curl -X POST http://localhost:3000/api/asistencia \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alumno_id": "alumno-uuid",
    "curso_id": "curso-uuid",
    "fecha": "2024-04-18",
    "estado": "FALTA",
    "motivo_falta": "Enfermedad"
  }'
```

---

## 🛠️ Solución de Problemas

### "Puerto 3000 ya está en uso"
```bash
# Opción 1: Cambiar puerto en .env
GATEWAY_PORT=3001

# Opción 2: Matar proceso en puerto
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :3000
kill -9 <PID>
```

### "Base de datos no encontrada"
```bash
# Reinicializar
npm run db:init
```

### "Error de conexión entre servicios"
```bash
# Verificar que todos los servicios estén corriendo:
npm run dev

# Verificar logs de errores (buscar mensajes rojo)
```

### "Token inválido o expirado"
```bash
# Obtener nuevo token con login
# El token es válido por 7 días
```

---

## 📋 Checklist de Validación

- [ ] Todos los 8 servicios están corriendo (puertos 3000-3007)
- [ ] Puedo acceder a http://localhost:3000
- [ ] Login funciona con `director@colegio.com / password123`
- [ ] Ver opción "Inicio" en el dashboard
- [ ] Menú lateral muestra opciones según el rol
- [ ] Base de datos tiene datos de prueba
- [ ] API responde a `GET /api/health`

---

## 🔐 Reglas de Negocio en Acción

### RN-001: Asignación Única de Aula
**Prueba:**
1. Matricular alumno en Curso A
2. Intentar matricular en Curso B del mismo período
3. **Esperado:** Error - "Ya está matriculado"

### RN-004: Restricción por Deuda
**Prueba:**
1. Alumno tiene pago pendiente
2. Intentar matricularse
3. **Esperado:** Error - "No se puede matricular con deudas"

### RN-006: Notificación de Inasistencias
**Prueba:**
1. Registrar asistencia como "FALTA"
2. **Esperado:** Simular envío de email al padre (ver logs)

---

## 🚀 Siguientes Pasos (Futuro)

- [ ] Integración con pasarela de pagos real (Stripe, PayPal)
- [ ] Integración con SMS real (Twilio)
- [ ] Aula Virtual (Moodle LMS)
- [ ] Reportes PDF avanzados
- [ ] Aplicación móvil
- [ ] Autenticación con OAuth (Google, Microsoft)
- [ ] Sistema de calificaciones avanzado
- [ ] Chat en tiempo real
- [ ] Videoconferencias integradas

---

## 📞 Soporte

Si algo no funciona:

1. Verificar que `npm run dev` está ejecutándose
2. Ver logs de errores (consola roja)
3. Reinicializar base de datos: `npm run db:init`
4. Limpiar caché del navegador: `Ctrl+Shift+Del`
5. Reiniciar todos los servicios

---

## 📝 Notas Importantes

- La base de datos es **SQLite** (archivo local)
- En producción, cambiar a **PostgreSQL**
- El **JWT secret** debe ser más seguro en producción
- No comprometer credenciales en repositorio
- Usar HTTPS en producción

---

**¡El sistema está listo para usar! 🎉**

Cualquier pregunta, revisar documentación en `/docs`
