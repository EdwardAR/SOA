-- ============================================
-- SCHEMA: COLEGIO FUTURO DIGITAL - SOA
-- ============================================

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  tipo_usuario TEXT NOT NULL CHECK(tipo_usuario IN ('alumno', 'docente', 'administrativo', 'padre', 'director')),
  estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo', 'bloqueado')),
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: alumnos
-- ============================================
CREATE TABLE IF NOT EXISTS alumnos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT UNIQUE NOT NULL,
  numero_matricula TEXT UNIQUE,
  apellido_paterno TEXT NOT NULL,
  apellido_materno TEXT,
  primer_nombre TEXT NOT NULL,
  segundo_nombre TEXT,
  fecha_nacimiento DATE,
  numero_documento TEXT UNIQUE,
  genero TEXT CHECK(genero IN ('M', 'F', 'Otro')),
  direccion TEXT,
  telefono TEXT,
  email_contacto TEXT,
  padre_id TEXT,
  madre_id TEXT,
  apoderado_id TEXT,
  datos_completos BOOLEAN DEFAULT FALSE,
  deuda_pendiente BOOLEAN DEFAULT FALSE,
  monto_deuda DECIMAL(10, 2) DEFAULT 0.00,
  aula_asignada BOOLEAN DEFAULT FALSE,
  aula_id TEXT,
  periodo_academico TEXT,
  estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo', 'egresado')),
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (padre_id) REFERENCES usuarios(id),
  FOREIGN KEY (madre_id) REFERENCES usuarios(id),
  FOREIGN KEY (apoderado_id) REFERENCES usuarios(id)
);

-- ============================================
-- TABLA: profesores
-- ============================================
CREATE TABLE IF NOT EXISTS profesores (
  id TEXT PRIMARY KEY,
  usuario_id TEXT UNIQUE NOT NULL,
  apellido_paterno TEXT NOT NULL,
  apellido_materno TEXT,
  primer_nombre TEXT NOT NULL,
  segundo_nombre TEXT,
  numero_documento TEXT UNIQUE,
  especialidad TEXT,
  telefono TEXT,
  estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo', 'licencia')),
  fecha_contratacion DATE,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ============================================
-- TABLA: cursos
-- ============================================
CREATE TABLE IF NOT EXISTS cursos (
  id TEXT PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  grado_nivel TEXT NOT NULL,
  seccion TEXT,
  profesor_id TEXT NOT NULL,
  capacidad_maxima INT DEFAULT 40,
  capacidad_actual INT DEFAULT 0,
  aula_asignada TEXT,
  horario_inicio TIME,
  horario_fin TIME,
  periodo_academico TEXT NOT NULL,
  estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'cancelado', 'pausado')),
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profesor_id) REFERENCES profesores(id)
);

-- ============================================
-- TABLA: matriculas
-- ============================================
CREATE TABLE IF NOT EXISTS matriculas (
  id TEXT PRIMARY KEY,
  alumno_id TEXT NOT NULL,
  curso_id TEXT NOT NULL,
  aula_asignada TEXT,
  periodo_academico TEXT NOT NULL,
  fecha_matricula DATETIME DEFAULT CURRENT_TIMESTAMP,
  estado TEXT DEFAULT 'activa' CHECK(estado IN ('activa', 'cancelada', 'suspendida')),
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alumno_id, curso_id, periodo_academico),
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
  FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- ============================================
-- TABLA: asistencias
-- ============================================
CREATE TABLE IF NOT EXISTS asistencias (
  id TEXT PRIMARY KEY,
  alumno_id TEXT NOT NULL,
  curso_id TEXT NOT NULL,
  fecha DATE NOT NULL,
  estado TEXT NOT NULL CHECK(estado IN ('PRESENTE', 'FALTA', 'JUSTIFICADO')),
  registrada BOOLEAN DEFAULT FALSE,
  motivo_falta TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alumno_id, curso_id, fecha),
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
  FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- ============================================
-- TABLA: calificaciones (Notas)
-- ============================================
CREATE TABLE IF NOT EXISTS calificaciones (
  id TEXT PRIMARY KEY,
  alumno_id TEXT NOT NULL,
  curso_id TEXT NOT NULL,
  tipo_evaluacion TEXT NOT NULL CHECK(tipo_evaluacion IN ('parcial', 'final', 'extra')),
  puntuacion DECIMAL(5, 2) NOT NULL,
  peso DECIMAL(3, 2) DEFAULT 1.0,
  observaciones TEXT,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  registrada BOOLEAN DEFAULT FALSE,
  periodo_academico TEXT NOT NULL,
  fecha_limite_notas DATETIME,
  estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'registrada', 'revisada')),
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
  FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- ============================================
-- TABLA: pagos
-- ============================================
CREATE TABLE IF NOT EXISTS pagos (
  id TEXT PRIMARY KEY,
  alumno_id TEXT NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  concepto TEXT NOT NULL,
  periodo_academico TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'pagado', 'cancelado', 'rechazado')),
  fecha_vencimiento DATE,
  fecha_pago DATETIME,
  metodo_pago TEXT CHECK(metodo_pago IN ('tarjeta_credito', 'tarjeta_debito', 'transferencia', 'efectivo', 'cheque')),
  referencia_pago TEXT,
  deuda_pendiente BOOLEAN DEFAULT TRUE,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id)
);

-- ============================================
-- TABLA: notificaciones
-- ============================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('email', 'sms', 'app')),
  asunto TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'enviado', 'fallido', 'leido')),
  destinatario TEXT,
  fecha_envio DATETIME,
  fecha_intento_fallo DATETIME,
  numero_intentos INT DEFAULT 0,
  razon_fallo TEXT,
  evento_generador TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ============================================
-- TABLA: reportes_generados
-- ============================================
CREATE TABLE IF NOT EXISTS reportes_generados (
  id TEXT PRIMARY KEY,
  tipo_reporte TEXT NOT NULL,
  generado_por TEXT NOT NULL,
  periodo_academico TEXT,
  datos_reporte TEXT,
  formato TEXT CHECK(formato IN ('pdf', 'excel', 'json')),
  ruta_archivo TEXT,
  estado TEXT DEFAULT 'generado' CHECK(estado IN ('generado', 'enviado', 'descargado')),
  fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generado_por) REFERENCES usuarios(id)
);

-- ============================================
-- TABLA: logs_auditoria
-- ============================================
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id TEXT PRIMARY KEY,
  usuario_id TEXT,
  accion TEXT NOT NULL,
  tabla_afectada TEXT NOT NULL,
  registro_id TEXT,
  datos_antes TEXT,
  datos_despues TEXT,
  ip_origen TEXT,
  fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ============================================
-- INDICES PARA OPTIMIZACIÓN
-- ============================================

-- Usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

-- Alumnos
CREATE INDEX idx_alumnos_usuario_id ON alumnos(usuario_id);
CREATE INDEX idx_alumnos_numero_documento ON alumnos(numero_documento);
CREATE INDEX idx_alumnos_deuda_pendiente ON alumnos(deuda_pendiente);
CREATE INDEX idx_alumnos_aula_asignada ON alumnos(aula_asignada);
CREATE INDEX idx_alumnos_periodo ON alumnos(periodo_academico);

-- Profesores
CREATE INDEX idx_profesores_usuario_id ON profesores(usuario_id);
CREATE INDEX idx_profesores_numero_documento ON profesores(numero_documento);

-- Cursos
CREATE INDEX idx_cursos_profesor_id ON cursos(profesor_id);
CREATE INDEX idx_cursos_periodo ON cursos(periodo_academico);
CREATE INDEX idx_cursos_estado ON cursos(estado);

-- Matriculas
CREATE INDEX idx_matriculas_alumno_id ON matriculas(alumno_id);
CREATE INDEX idx_matriculas_curso_id ON matriculas(curso_id);
CREATE INDEX idx_matriculas_periodo ON matriculas(periodo_academico);
CREATE INDEX idx_matriculas_estado ON matriculas(estado);

-- Asistencias
CREATE INDEX idx_asistencias_alumno_id ON asistencias(alumno_id);
CREATE INDEX idx_asistencias_curso_id ON asistencias(curso_id);
CREATE INDEX idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX idx_asistencias_estado ON asistencias(estado);

-- Calificaciones
CREATE INDEX idx_calificaciones_alumno_id ON calificaciones(alumno_id);
CREATE INDEX idx_calificaciones_curso_id ON calificaciones(curso_id);
CREATE INDEX idx_calificaciones_periodo ON calificaciones(periodo_academico);
CREATE INDEX idx_calificaciones_estado ON calificaciones(estado);

-- Pagos
CREATE INDEX idx_pagos_alumno_id ON pagos(alumno_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_periodo ON pagos(periodo_academico);
CREATE INDEX idx_pagos_deuda_pendiente ON pagos(deuda_pendiente);

-- Notificaciones
CREATE INDEX idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_estado ON notificaciones(estado);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);

-- Logs de Auditoría
CREATE INDEX idx_logs_auditoria_usuario_id ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_auditoria_tabla ON logs_auditoria(tabla_afectada);
CREATE INDEX idx_logs_auditoria_fecha ON logs_auditoria(fecha_accion);
