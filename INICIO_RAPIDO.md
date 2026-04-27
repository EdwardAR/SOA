# 🚀 INICIO RÁPIDO - SOA COLEGIO FUTURO DIGITAL

## 1️⃣ Instalación (30 segundos)

```bash
npm install
npm run db:init
```

## 2️⃣ Ejecutar Sistema (2 minutos)

```bash
npm run dev
```

## 3️⃣ Verificar Servicios (1 minuto)

```bash
npm run verify
```

## 4️⃣ Probar APIs (2 minutos)

```bash
npm run test:api
```

## 📍 Acceso

- **API Gateway**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## 🔑 Login

```bash
POST http://localhost:3000/api/auth/login

Body:
{
  "email": "director@colegio.com",
  "password": "password123"
}
```

## 📚 Documentación

- **README_COMPLETO.md** - Guía detallada
- **RESUMEN_IMPLEMENTACION.md** - Resumen técnico
- **SERVICES_QUICK_REFERENCE.md** - Referencia de APIs

## ✨ Características Principales

✅ 8 Microservicios independientes  
✅ Autenticación JWT segura  
✅ 7 Reglas de negocio implementadas  
✅ 60+ Endpoints REST  
✅ Base de datos normalizada  
✅ Notificaciones automáticas  
✅ Control de acceso por roles  

## 🎯 Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API Gateway | 3000 | Autenticación y enrutamiento |
| Alumnos | 3001 | Gestión de estudiantes |
| Matrículas | 3002 | Inscripciones con validaciones |
| Profesores | 3003 | Gestión de docentes |
| Cursos | 3004 | Administración de cursos |
| Pagos | 3005 | Gestión financiera |
| Notificaciones | 3006 | Email y SMS |
| Asistencia | 3007 | Control de asistencia |
| Calificaciones | 3008 | Gestión de notas |

## 🧪 Usuarios de Prueba

```
1. Director
   Email: director@colegio.com
   Pass: password123

2. Alumno
   Email: luis@estudiante.com
   Pass: password123

3. Docente
   Email: juan@colegio.com
   Pass: password123
```

## 🐛 Problemas Comunes

**Error: Port already in use**
```bash
# Cambiar puerto en .env
GATEWAY_PORT=3001
```

**BD corrupta**
```bash
rm database/colegio.db
npm run db:init
```

**Servicios no responden**
```bash
npm run verify
```

---

**¡Sistema listo para usar! 🎉**
