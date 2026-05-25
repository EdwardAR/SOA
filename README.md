# Sistema SOA - Colegio Futuro Digital

Sistema de gestión académica basado en una arquitectura orientada a servicios (SOA) con API Gateway, frontend en React y base de datos SQLite.

## 📋 Contenido de esta Documentación

- [¿Qué es SOA? (Conceptos)](#-qué-es-soa-conceptos)
- [Modelo de Datos (ER Diagram)](#-modelo-de-datos-diagrama-entidad-relación)
- [Arquitectura por Capas](#-diagrama-de-arquitectura-por-capas)
- [Orquestación de Procesos](#-diagrama-de-orquestación-de-procesos)
- [Instalación y Arranque](#-instalación-y-arranque)
- [Servicios del Sistema](#-servicios-del-sistema)

---

## 💡 ¿Qué es SOA? (Conceptos)

**SOA (Service-Oriented Architecture)** es un patrón arquitectónico empresarial donde el sistema se construye como un conjunto de servicios independientes que se comunican entre sí.

### Principios de SOA en este proyecto:

| Principio | Implementación en el Sistema |
|-----------|------------------------------|
| **Modularidad** | Cada dominio (alumnos, cursos, pagos, etc.) es un servicio independiente |
| **Reusabilidad** | Servicios exponen funcionalidad reutilizable a través de APIs REST |
| **Escalabilidad** | Cada servicio puede escalarse independientemente según demanda |
| **Mantenibilidad** | Cambios en un servicio no afectan a otros (bajo acoplamiento) |
| **Independencia Tecnológica** | Servicios pueden cambiar internamente sin afectar la interfaz |
| **Interoperabilidad** | Comunicación mediante estándares abiertos (HTTP/JSON) |

### Características Clave de este Sistema SOA:

🎯 **API Gateway Centralizado**
- Punto de entrada único para toda la aplicación
- Maneja autenticación y autorización centralmente
- Enruta solicitudes a los servicios correspondientes

🧩 **8 Microservicios Independientes**
- Alumnos, Matrículas, Profesores, Cursos, Pagos, Notificaciones, Asistencia, Calificaciones
- Cada uno con su propio servidor Express
- Comunicación sin estado (stateless)

🔐 **Seguridad Centralizada**
- JWT para autenticación
- Control basado en roles (RBAC) en el gateway
- Filtrado de datos por permisos del usuario

💾 **Base de Datos Compartida**
- SQLite centralizada
- Todos los servicios acceden a la misma BD
- Mantiene consistencia de datos

📊 **Integración de Datos**
- El gateway puede consultar múltiples servicios para consolidar datos
- Ejemplo: Dashboard que obtiene alumnos, cursos, matrículas, pagos en una sola llamada

---

## 📊 Modelo de Datos (Diagrama Entidad-Relación)

El siguiente diagrama ER muestra todas las entidades del sistema, sus atributos principales, relaciones y cardinalidades:

```mermaid
erDiagram
    USUARIOS ||--o{ ALUMNOS : "usuario_id"
    USUARIOS ||--o{ PROFESORES : "usuario_id"
    USUARIOS ||--o{ NOTIFICACIONES : "usuario_id"
    USUARIOS ||--o{ REPORTES_GENERADOS : "generado_por"
    USUARIOS ||--o{ LOGS_AUDITORIA : "usuario_id"
    
    ALUMNOS ||--o{ MATRICULAS : "alumno_id"
    ALUMNOS ||--o{ ASISTENCIAS : "alumno_id"
    ALUMNOS ||--o{ CALIFICACIONES : "alumno_id"
    ALUMNOS ||--o{ PAGOS : "alumno_id"
    
    PROFESORES ||--o{ CURSOS : "profesor_id"
    
    CURSOS ||--o{ MATRICULAS : "curso_id"
    CURSOS ||--o{ ASISTENCIAS : "curso_id"
    CURSOS ||--o{ CALIFICACIONES : "curso_id"
    
    USUARIOS {
        string id PK
        string nombre
        string email UK
        string password
        string tipo_usuario "alumno|docente|administrativo|padre|director"
        string estado "activo|inactivo|bloqueado"
        datetime fecha_creacion
        datetime fecha_actualizacion
    }
    
    ALUMNOS {
        string id PK
        string usuario_id FK
        string numero_matricula UK
        string apellido_paterno
        string apellido_materno
        string primer_nombre
        string segundo_nombre
        date fecha_nacimiento
        string numero_documento UK
        string genero "M|F|Otro"
        string direccion
        string telefono
        string email_contacto
        string padre_id FK
        string madre_id FK
        string apoderado_id FK
        boolean datos_completos
        boolean deuda_pendiente
        decimal monto_deuda
        string aula_id
        string periodo_academico
        string estado "activo|inactivo|egresado"
    }
    
    PROFESORES {
        string id PK
        string usuario_id FK
        string apellido_paterno
        string apellido_materno
        string primer_nombre
        string segundo_nombre
        string numero_documento UK
        string especialidad
        string telefono
        string estado "activo|inactivo|licencia"
        date fecha_contratacion
    }
    
    CURSOS {
        string id PK
        string codigo UK
        string nombre
        string descripcion
        string grado_nivel
        string seccion
        string profesor_id FK
        int capacidad_maxima
        int capacidad_actual
        string aula_asignada
        time horario_inicio
        time horario_fin
        string periodo_academico
        string estado "activo|cancelado|pausado"
    }
    
    MATRICULAS {
        string id PK
        string alumno_id FK
        string curso_id FK
        string aula_asignada
        string periodo_academico
        datetime fecha_matricula
        string estado "activa|cancelada|suspendida"
    }
    
    ASISTENCIAS {
        string id PK
        string alumno_id FK
        string curso_id FK
        date fecha
        string estado "PRESENTE|FALTA|JUSTIFICADO"
        boolean registrada
        string motivo_falta
    }
    
    CALIFICACIONES {
        string id PK
        string alumno_id FK
        string curso_id FK
        string tipo_evaluacion "parcial|final|extra"
        decimal puntuacion
        decimal peso
        string observaciones
        string periodo_academico
        string estado "pendiente|registrada|revisada"
    }
    
    PAGOS {
        string id PK
        string alumno_id FK
        decimal monto
        string concepto
        string periodo_academico
        string estado "pendiente|pagado|cancelado|rechazado"
        date fecha_vencimiento
        datetime fecha_pago
        string metodo_pago
        string referencia_pago
        boolean deuda_pendiente
    }
    
    NOTIFICACIONES {
        string id PK
        string usuario_id FK
        string tipo "email|sms|app"
        string asunto
        string mensaje
        string estado "pendiente|enviado|fallido|leido"
        string destinatario
        datetime fecha_envio
        int numero_intentos
        string evento_generador
    }
    
    REPORTES_GENERADOS {
        string id PK
        string tipo_reporte
        string generado_por FK
        string periodo_academico
        string datos_reporte
        string formato "pdf|excel|json"
        string ruta_archivo
        string estado "generado|enviado|descargado"
    }
    
    LOGS_AUDITORIA {
        string id PK
        string usuario_id FK
        string accion
        string tabla_afectada
        string registro_id
        string datos_antes
        string datos_despues
        string ip_origen
        datetime fecha_accion
    }
```

### Cardinalidades Principales:
- **Usuario → Alumno** (1:0..1): Un usuario puede ser alumno o no
- **Usuario → Profesor** (1:0..1): Un usuario puede ser profesor o no
- **Alumno → Matrícula** (1:N): Un alumno se matricula en múltiples cursos
- **Profesor → Curso** (1:N): Un profesor dicta múltiples cursos
- **Curso → Matrícula** (1:N): Un curso tiene múltiples matrículas
- **Alumno → Asistencia, Calificación, Pago** (1:N): Un alumno tiene múltiples registros en estas tablas

---

## 🏛️ Diagrama de Arquitectura por Capas

La arquitectura del sistema está organizada en capas independientes que se comunican a través del API Gateway:

```mermaid
graph TD
    subgraph Presentacion["🎨 Capa de Presentación"]
        FE["React Frontend<br/>Puerto 3001"]
    end
    
    subgraph APIGateway["🔐 API Gateway<br/>Puerto 3000"]
        AUTH["Autenticación JWT"]
        CORS["CORS & Middleware"]
        ROLES["Control de Roles<br/>director|administrativo|docente|padre|alumno"]
        ROUTING["Enrutamiento de Solicitudes"]
    end
    
    subgraph Services["🧩 Capa de Servicios Microservicios"]
        S1["Alumnos Service<br/>:3001"]
        S2["Matrículas Service<br/>:3002"]
        S3["Profesores Service<br/>:3003"]
        S4["Cursos Service<br/>:3004"]
        S5["Pagos Service<br/>:3005"]
        S6["Notificaciones Service<br/>:3006"]
        S7["Asistencia Service<br/>:3007"]
        S8["Calificaciones Service<br/>:3008"]
    end
    
    subgraph Data["💾 Capa de Datos"]
        DB["SQLite<br/>colegio.db"]
        CACHE["Índices de Optimización"]
    end
    
    FE -->|HTTP/JSON<br/>JWT Token| AUTH
    AUTH -->|Validación| ROLES
    ROLES -->|Filtrado de Datos| ROUTING
    
    ROUTING -->|Ruta /alumnos| S1
    ROUTING -->|Ruta /matriculas| S2
    ROUTING -->|Ruta /profesores| S3
    ROUTING -->|Ruta /cursos| S4
    ROUTING -->|Ruta /pagos| S5
    ROUTING -->|Ruta /notificaciones| S6
    ROUTING -->|Ruta /asistencia| S7
    ROUTING -->|Ruta /calificaciones| S8
    
    S1 --> DB
    S2 --> DB
    S3 --> DB
    S4 --> DB
    S5 --> DB
    S6 --> DB
    S7 --> DB
    S8 --> DB
    
    DB --> CACHE
    
    style Presentacion fill:#e1f5ff
    style APIGateway fill:#fff3e0
    style Services fill:#f3e5f5
    style Data fill:#e8f5e9
```

### Características de Cada Capa:

**🎨 Capa de Presentación (Frontend)**
- Aplicación React para interfaz de usuario
- Consumo de APIs RESTful a través del gateway
- Gestión de estado y autenticación del lado cliente

**🔐 API Gateway**
- Punto de entrada único para todas las solicitudes
- Autenticación mediante JWT
- Control de acceso basado en roles (RBAC)
- Validación y CORS
- Enrutamiento dinámico hacia servicios

**🧩 Capa de Servicios (Microservicios)**
- 8 servicios especializados independientes
- Cada servicio expone un conjunto de endpoints REST
- Comunicación sin estado (stateless)
- Compartición de base de datos centralizada (patrón moderno de SOA)

**💾 Capa de Datos**
- Base de datos SQLite centralizada
- Índices para optimización de consultas
- Persistencia de todas las entidades del sistema

---

## 🔄 Diagrama de Orquestación de Procesos

Este diagrama muestra el flujo principal de autenticación y operación del sistema:

```mermaid
sequenceDiagram
    participant User as 👤 Usuario
    participant Browser as 🌐 Navegador
    participant Gateway as 🔐 API Gateway
    participant Auth as 🔑 Auth Service
    participant MicroSvc as 🧩 Microservicio
    participant DB as 💾 SQLite DB

    User->>Browser: 1. Acceder a aplicación
    Browser->>Gateway: 2. POST /api/auth/login
    
    Gateway->>Auth: 3. Validar credenciales
    Auth->>DB: 4. SELECT usuario WHERE email=?
    DB-->>Auth: 5. Usuario encontrado
    Auth->>Auth: 6. Comparar hash de contraseña
    Auth-->>Gateway: 7. ✓ Credenciales válidas
    
    Gateway->>Gateway: 8. Generar JWT Token
    Gateway-->>Browser: 9. { token, rol, usuario }
    
    Browser->>Browser: 10. Guardar token en localStorage
    Browser->>Gateway: 11. GET /api/alumnos (+ Authorization: Bearer {token})
    
    Gateway->>Gateway: 12. Verificar JWT válido
    Gateway->>Gateway: 13. Extraer rol del token
    Gateway->>Gateway: 14. Validar permiso de rol
    
    alt Rol tiene acceso
        Gateway->>MicroSvc: 15. GET /alumnos
        MicroSvc->>DB: 16. Query según permisos del rol
        DB-->>MicroSvc: 17. Datos filtrados
        MicroSvc-->>Gateway: 18. Response con datos
        Gateway-->>Browser: 19. Datos filtrados por rol
        Browser->>Browser: 20. Renderizar en UI
        Browser-->>User: 21. 📊 Ver datos permitidos
    else Rol sin acceso
        Gateway-->>Browser: 19. Error 403 Forbidden
        Browser-->>User: 21. ❌ Acceso denegado
    end
```

### Flujos de Caso de Uso Clave:

**1️⃣ Caso: Alumno visualiza sus calificaciones**
```mermaid
flowchart TD
    A["Alumno accede al portal"] --> B["Envía GET /calificaciones con token"]
    B --> C["Gateway valida token y rol"]
    C --> D{"¿Rol = alumno?"}
    D -->|Sí| E["Aplica filtro: WHERE alumno_id = su_id"]
    E --> F["Calificaciones Service consulta DB"]
    F --> G["Retorna solo sus calificaciones"]
    G --> H["Alumno ve sus notas ✓"]
    
    D -->|No| I["Error 403 Forbidden"]
    I --> J["Usuario no autorizado ❌"]
```

**2️⃣ Caso: Docente registra asistencia**
```mermaid
flowchart TD
    A["Profesor inicia sesión"] --> B["Accede a módulo Asistencia"]
    B --> C["Selecciona curso y fecha"]
    C --> D["Marca presentes/faltas"]
    D --> E["POST /asistencia con datos"]
    E --> F["Gateway valida token"]
    F --> G{"¿Profesor asignado a ese curso?"}
    G -->|Sí| H["Asistencia Service valida datos"]
    H --> I["INSERT en tabla asistencias"]
    I --> J["✓ Asistencia registrada"]
    
    G -->|No| K["Error 403: No puede registrar"]
    K --> L["❌ Acceso denegado"]
```

**3️⃣ Caso: Administrador gestiona matrículas**
```mermaid
flowchart TD
    A["Admin selecciona alumno"] --> B["Elige curso y período"]
    B --> C["POST /matriculas"]
    C --> D["Gateway valida rol administrativo"]
    D -->|Admin| E["Valida alumno y curso existen"]
    E --> F["Valida capacidad del curso"]
    F --> G{"¿Cupo disponible?"}
    G -->|Sí| H["INSERT matrícula"]
    H --> I["UPDATE capacidad_actual del curso"]
    I --> J["✓ Matrícula creada"]
    
    G -->|No| K["Error: Curso lleno"]
    K --> L["❌ No hay cupos"]
    
    D -->|No Admin| M["Error 403"]
    M --> L
```

---

## 🏗️ Patrones y Mejores Prácticas Implementadas

### 1. **API Gateway Pattern** ✅
- Centraliza autenticación y autorización
- Actúa como proxy entre cliente y servicios
- Maneja CORS y transformación de datos

### 2. **JWT (JSON Web Tokens)** ✅
- Autenticación sin estado (stateless)
- Token incluye: id usuario, rol, permisos
- Cada solicitud debe incluir: `Authorization: Bearer {token}`

### 3. **Role-Based Access Control (RBAC)** ✅
Roles implementados:
- **director**: acceso total al sistema
- **administrativo**: gestión académica y administrativa
- **docente**: consulta de cursos, registro de asistencia y notas
- **alumno**: visualización de datos propios
- **padre**: visualización de datos de hijo/a

### 4. **Microservicios Independientes** ✅
- Cada servicio expone endpoints REST
- Sin dependencias directas entre servicios
- Comunicación a través del gateway

### 5. **Base de Datos Centralizada** ✅
- SQLite compartida por todos los servicios
- Índices para optimizar consultas frecuentes
- Transacciones para mantener integridad

### 6. **Validación y Sanitización** ✅
- Validación de email, UUID, datos académicos
- Sanitización de entrada de usuarios
- Errores con mensajes claros

### 7. **Respuestas Estándar** ✅
Formato JSON consistente:
```json
{
  "exito": true,
  "codigo": "OPERACION_EXITOSA",
  "mensaje": "Alumnos obtenidos",
  "datos": { ... }
}
```

---

## Requisitos

- Node.js 16 o superior
- npm 7 o superior
- Docker y docker-compose, solo si quieres usar contenedores


## Instalación y arranque (Windows - PowerShell)

Sigue estos pasos desde la carpeta raíz del proyecto (`C:\Users\USUARIO\Downloads\SOA\SOA`).

1) Instala dependencias en la raíz:

```powershell
npm install
```

2) Instala dependencias del frontend:

```powershell
Set-Location .\frontend
npm install
Set-Location ..
```

3) Crea el archivo `.env` en la raíz copiando el ejemplo incluido:

```powershell
Copy-Item .env.example .env
```

Si quieres editarlo después, como mínimo asegúrate de tener `JWT_SECRET`, `GATEWAY_PORT=3000`, `DB_PATH=./database/colegio.db` y `ALLOWED_ORIGINS` con `http://localhost:3000` y `http://localhost:3001`.

4) Inicializa la base de datos y carga los datos de prueba. Ejecuta este paso solo desde la raíz:

```powershell
npm run db:init
```

5) Levanta el backend completo. Este comando inicia el API Gateway y todos los microservicios definidos en `package.json`:

```powershell
npm run dev
```

6) En otro terminal, levanta el frontend:

```powershell
Set-Location .\frontend
npm start
```

El frontend normalmente se abrirá en `http://localhost:3001` porque `3000` ya está ocupado por el gateway. Si ese puerto también está ocupado, React elegirá otro libre y te lo mostrará en consola.

7) Abre la aplicación en el navegador y usa el usuario de prueba del directorio de abajo.

Nota: el archivo `start-all.bat` no refleja el flujo actual del proyecto; usa los comandos anteriores para evitar errores de arranque.


## Alternativa: Docker (recomendado para despliegue uniforme)

Si prefieres usar Docker, parte del archivo `.env.example` y ajusta `JWT_SECRET` antes de arrancar:

```powershell
Copy-Item .env.example .env
docker-compose up --build
```

Nota: Docker Compose montará `./database` para persistir la base de datos SQLite.

## Usuarios de prueba

Las credenciales de ejemplo se cargan con `npm run db:init`.

| Usuario | Rol | Relación / contexto | Qué ve y qué puede hacer | Credenciales |
| --- | --- | --- | --- | --- |
| Dr. Luis Fernando Herrera | `director` | Director general del colegio y cuenta administradora del sistema | Acceso total al sistema, dashboards, alumnos, profesores, cursos, matrículas, pagos, asistencia, calificaciones y notificaciones | `luis.herrera@colegiofuturo.edu` / `password123` |
| Lic. Andrea Montalvo | `administrativo` | Área administrativa y de control académico | Gestión de alumnos, matrículas, cursos, pagos y consultas administrativas | `andrea.montalvo@colegiofuturo.edu` / `password123` |
| Prof. Juan Carlos Paredes | `docente` | Docente asignado a secciones de secundaria del seed | Consulta de cursos asignados, asistencia, calificaciones y datos relacionados a sus estudiantes | `juan.paredes@colegiofuturo.edu` / `password123` |
| Prof. María Elena Ríos | `docente` | Docente asignada a otras secciones de secundaria del seed | Consulta de cursos asignados, asistencia, calificaciones y datos relacionados a sus estudiantes | `maria.rios@colegiofuturo.edu` / `password123` |
| Valeria Sánchez | `alumno` | Estudiante vinculada a Patricia Sánchez | Visualiza sus propios datos, matrículas, pagos, asistencia, calificaciones y notificaciones relacionadas | `valeria.sanchez@colegiofuturo.edu` / `password123` |
| Diego Torres | `alumno` | Estudiante del seed sin tutor principal visible en el perfil | Visualiza sus propios datos, matrículas, pagos, asistencia, calificaciones y notificaciones relacionadas | `diego.torres@colegiofuturo.edu` / `password123` |
| Patricia Sánchez | `padre` | Apoderada/tutora de Valeria Sánchez | Visualiza solo la información de su hija o hijo, sus pagos, asistencia, calificaciones y notificaciones asociadas. El perfil muestra un panel tipo dashboard y no permite acciones de edición o eliminación | `patricia.sanchez@colegiofuturo.edu` / `password123` |

## Qué verás en cada módulo

- Dashboard: resumen general con conteos de alumnos, cursos, profesores y pagos.
- Alumnos: listado de alumnos sembrados en la base de datos.
- Profesores: listado de docentes con usuario, nombre, especialidad y contacto.
- Cursos: cursos con código, grado, sección y salón.
- Matrículas: relación alumno-curso cargada desde SQLite con periodo académico y sección académica.
- Pagos: pagos iniciales con estado pagado y pendiente.
- Asistencia: registros de asistencia sembrados para probar el listado.
- Calificaciones: notas de ejemplo visibles en el módulo.
- Notificaciones: notificaciones de prueba visibles en la interfaz.

Los listados ya respetan la relación del usuario autenticado: un alumno ve solo sus datos, un padre ve solo los datos de su hijo, y un docente ve solo la información ligada a sus cursos y alumnos relacionados. Además, las tablas principales permiten ordenar los registros haciendo clic en el encabezado de cada columna.

## Roles Del Sistema

| Rol | Acceso principal | Restricciones |
| --- | --- | --- |
| `director` | Ve y administra todo el sistema | Sin restricciones funcionales |
| `administrativo` | Gestiona alumnos, matrículas, cursos y pagos | No actúa como padre ni alumno |
| `docente` | Consulta sus cursos, asistencia y calificaciones | No puede borrar registros críticos |
| `alumno` | Ve solo su información académica y de pagos permitidos | No puede editar otros usuarios |
| `padre` | Ve el dashboard/resumen de su hija o hijo, asistencia, pagos, calificaciones y notificaciones relacionadas | No puede editar ni eliminar la información de su hija o hijo |

En el perfil del padre se muestra una vista general del estudiante vinculado, con asistencia reciente y estado general.

Relaciones de ejemplo en el seed:

- Patricia Sánchez es la tutora visible de Valeria Sánchez.
- Valeria Sánchez está matriculada en Secundaria 1ro Grado A con periodo académico `2026-1`.
- Diego Torres está matriculado en Secundaria 2do Grado A con periodo académico `2026-1`.
- Los docentes Juan Carlos Paredes y María Elena Ríos cubren las secciones académicas sembradas de 1ro a 5to.

## Servicios del sistema

El proyecto está organizado como una arquitectura orientada a servicios. El navegador habla con el API Gateway y este centraliza autenticación, permisos y acceso a la base de datos.

| Servicio | Puerto | Responsabilidad |
| --- | --- | --- |
| API Gateway | `3000` | Punto de entrada único, autenticación JWT, CORS, autorización por rol y consultas consolidadas de datos |
| Alumnos | `3001` | Gestión de estudiantes, relación con usuarios y vinculación con padres |
| Matrículas | `3002` | Inscripciones alumno-curso, estados y observaciones |
| Profesores | `3003` | Gestión de docentes, datos de contacto y especialidades |
| Cursos | `3004` | Catálogo de cursos, grados, secciones, salones y profesor responsable |
| Pagos | `3005` | Registro de pagos, deuda pendiente, conceptos y estados de cobro |
| Notificaciones | `3006` | Mensajes informativos, recordatorios y alertas para usuarios vinculados |
| Asistencia | `3007` | Registro y consulta de asistencias, faltas y justificaciones |
| Calificaciones | `3008` | Registro de notas, períodos académicos y observaciones |

Flujo resumido: el frontend llama al Gateway, el Gateway valida el token, aplica el filtro por rol y devuelve únicamente la información permitida por usuario.

Las secciones académicas del seed están limitadas a secundaria de 1ro a 5to y las matrículas incluyen su periodo académico para mantener la relación correcta entre alumno, curso y año lectivo.

## Variables importantes

- `JWT_SECRET`: clave para firmar el token.
- `GATEWAY_PORT`: puerto del API Gateway.
- `ALLOWED_ORIGINS`: lista de orígenes permitidos por CORS, por ejemplo `http://localhost:3001`.

## Troubleshooting

- Si el login no responde desde el frontend, revisa que el gateway esté corriendo en `http://localhost:3000` y que `ALLOWED_ORIGINS` incluya el puerto del frontend.
- Si el frontend arrancó en otro puerto, no debería fallar: el gateway acepta `localhost`/`127.0.0.1` en cualquier puerto.
- Si quieres reiniciar la base de datos, vuelve a ejecutar `npm run db:init` desde la raíz.
- `npm run db:init` puede mostrar advertencias de índices antiguos; en este proyecto eso no siempre significa error, mientras el proceso termine bien.

## Estructura general

- `api-gateway/`: autenticación, middleware y endpoints principales.
- `services/`: microservicios del dominio académico.
- `frontend/`: interfaz React.
- `database/`: esquema, inicialización y verificación de datos.
- `config/` y `shared/`: utilidades comunes del backend.
