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
  numero_empleado TEXT,
  nombre TEXT,
  apellido_paterno TEXT NOT NULL,
  apellido_materno TEXT,
  primer_nombre TEXT NOT NULL,
  segundo_nombre TEXT,
  numero_documento TEXT UNIQUE,
  email TEXT,
  email_contacto TEXT,
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
  grado TEXT NOT NULL,
  seccion TEXT,
  profesor_id TEXT NOT NULL,
  salon TEXT,
  capacidad INT DEFAULT 40,
  estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'cancelado', 'pausado')),
  periodo_academico TEXT,
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
  observaciones TEXT,
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
  nota DECIMAL(5,2),
  periodo TEXT,
  tipo_evaluacion TEXT,
  puntuacion DECIMAL(5,2),
  peso DECIMAL(3,2) DEFAULT 1.0,
  observaciones TEXT,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  registrada BOOLEAN DEFAULT FALSE,
  periodo_academico TEXT,
  fecha_limite_notas DATETIME,
  estado TEXT DEFAULT 'pendiente',
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
  estado_pago TEXT DEFAULT 'pendiente',
  estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'pagado', 'cancelado', 'rechazado')),
  fecha_vencimiento DATE,
  fecha_pago DATETIME,
  metodo_pago TEXT,
  referencia_pago TEXT,
  deuda_pendiente BOOLEAN DEFAULT TRUE,
  observaciones TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id)
);

-- ============================================
-- TABLA: notificaciones
-- ============================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id TEXT PRIMARY KEY,
  destinatario_id TEXT NOT NULL,
  tipo TEXT,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  fecha_lectura DATETIME,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (destinatario_id) REFERENCES usuarios(id)
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

-- ============================================
-- TABLA: horarios_grado
-- Define los cursos y franjas horarias por grado (no por alumno)
-- campos: id, grado, curso, dia_semana (1=Lunes..7=Dom), hora_inicio, hora_fin, aula, periodo_academico
-- ============================================
CREATE TABLE IF NOT EXISTS horarios_grado (
  id TEXT PRIMARY KEY,
  grado TEXT NOT NULL,
  curso TEXT NOT NULL,
  dia_semana INTEGER NOT NULL,
  hora_inicio TEXT,
  hora_fin TEXT,
  aula TEXT,
  periodo_academico TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_horarios_grado_grado ON horarios_grado(grado);
CREATE INDEX idx_horarios_grado_dia ON horarios_grado(dia_semana);
