require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcryptjs = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { initDatabase, getDatabase, getOne, getAll, runQuery } = require('../config/database');
const { authMiddleware, requireRole, generarToken } = require('./middleware/auth');
const { errorHandler, asyncHandler } = require('./middleware/errorHandler');
const { respuestaExito, respuestaError, generarId, auditar } = require('../shared/utils');
const { validadores } = require('../shared/validators');

const app = express();
const GATEWAY_PORT = process.env.GATEWAY_PORT || 3000;
const PERIODO_ACADEMICO_DEFECTO = process.env.PERIODO_ACADEMICO || `${new Date().getFullYear()}-1`;

// Configuración de CORS
// Permitimos localhost/127.0.0.1 en cualquier puerto para evitar bloqueos
// cuando el frontend cambia de puerto por conflictos locales.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin Origin (ej. llamadas desde curl o servidores)
    if (!origin) return callback(null, true);

    // Orígenes explícitos configurados en ALLOWED_ORIGINS
    if (allowedOrigins.includes(origin)) return callback(null, true);

    try {
      const parsed = new URL(origin);
      const host = parsed.hostname;

      // Aceptar localhost / 127.0.0.1 en cualquier puerto
      if (host === 'localhost' || host === '127.0.0.1') return callback(null, true);

      // Aceptar subdominios ngrok (públicos) para facilitar pruebas remotas
      if (host.endsWith('.ngrok.io') || host.endsWith('.trycloudflare.com')) return callback(null, true);

      // Aceptar dominios de túneles de VS Code (preview.app.github.dev / devtunnels.ms)
      if (host.endsWith('.preview.app.github.dev') || host.endsWith('.devtunnels.ms')) return callback(null, true);
    } catch (err) {
      // Si la URL no pudo parsearse, denegar
      return callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 204
};

// Middlewares globales
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('api-gateway/public'));
app.use(express.static(path.join(__dirname, '../frontend/build')));

// URLs de los servicios
const SERVICIOS = {
  alumnos: process.env.ALUMNOS_SERVICE_URL || 'http://localhost:3001',
  matricula: process.env.MATRICULA_SERVICE_URL || 'http://localhost:3002',
  profesores: process.env.PROFESORES_SERVICE_URL || 'http://localhost:3003',
  cursos: process.env.CURSOS_SERVICE_URL || 'http://localhost:3004',
  pagos: process.env.PAGOS_SERVICE_URL || 'http://localhost:3005',
  notificaciones: process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:3006',
  asistencia: process.env.ASISTENCIA_SERVICE_URL || 'http://localhost:3007',
  calificaciones: process.env.CALIFICACIONES_SERVICE_URL || 'http://localhost:3008'
};

const ROLES_CON_ACCESO_TOTAL = new Set(['director', 'administrativo']);

// ── Audit logger ──────────────────────────────────────────────────────────────
const registrarLog = async ({ usuario_id, accion, tabla_afectada, registro_id = null, datos_antes = null, datos_despues = null, ip_origen = null }) => {
  try {
    await runQuery(
      `INSERT INTO logs_auditoria (id, usuario_id, accion, tabla_afectada, registro_id, datos_antes, datos_despues, ip_origen, fecha_accion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        generarId(),
        usuario_id || null,
        accion,
        tabla_afectada,
        registro_id || null,
        datos_antes ? JSON.stringify(datos_antes) : null,
        datos_despues ? JSON.stringify(datos_despues) : null,
        ip_origen || null,
      ]
    );
  } catch (_) { /* log silently — never break main flow */ }
};

// ── HTTP request logger middleware ────────────────────────────────────────────
// Maps HTTP methods to acciones and tabla from URL
const HTTP_ACCION = { POST: 'CREAR', PUT: 'ACTUALIZAR', PATCH: 'ACTUALIZAR', DELETE: 'ELIMINAR' };
const TABLA_DESDE_URL = (url) => {
  const parts = url.replace(/^\/api\//, '').split('/');
  const base = parts[0];
  const map = {
    'alumnos': 'alumnos', 'profesores': 'profesores', 'cursos': 'cursos',
    'matriculas': 'matriculas', 'pagos': 'pagos', 'asistencia': 'asistencias',
    'calificaciones': 'calificaciones', 'notificaciones': 'notificaciones',
    'auth': null,
  };
  return map[base] || base;
};

const httpAuditMiddleware = (req, res, next) => {
  const accion = HTTP_ACCION[req.method];
  if (!accion) return next(); // skip GET / OPTIONS / HEAD

  const tabla = TABLA_DESDE_URL(req.url);
  if (!tabla) return next(); // skip auth routes

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const usuario_id = req.usuario?.id || null;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
    const registro_id = body?.datos?.id || req.params?.id || null;

    registrarLog({
      usuario_id,
      accion: `${req.method}:${accion}`,
      tabla_afectada: tabla,
      registro_id,
      datos_antes: req.method === 'DELETE' ? (req._datosPrevios || null) : null,
      datos_despues: (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') ? req.body : null,
      ip_origen: ip,
    });

    return originalJson(body);
  };
  next();
};

app.use(httpAuditMiddleware);

const getProfesorIdPorUsuario = async (usuarioId) => {
  const profesor = await getOne('SELECT id FROM profesores WHERE usuario_id = ?', [usuarioId]);
  return profesor?.id || null;
};

const getNombreCursoDesdeProfesor = async (profesorId, nombreFallback = '') => {
  const profesor = await getOne('SELECT especialidad FROM profesores WHERE id = ?', [profesorId]);
  const nombreCurso = profesor?.especialidad?.trim();
  return nombreCurso || nombreFallback.trim();
};

// ============================================
// RUTAS DE AUTENTICACIÓN (Sin protección)
// ============================================

// Login
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json(respuestaError('Email y contraseña requeridos'));
  }

  if (!validadores.esEmailValido(email)) {
    return res.status(400).json(respuestaError('Email inválido'));
  }

  const usuario = await getOne('SELECT * FROM usuarios WHERE email = ?', [email]);

  if (!usuario) {
    return res.status(401).json(respuestaError('Usuario no encontrado', 'INVALID_CREDENTIALS'));
  }

  const passwordValido = await bcryptjs.compare(password, usuario.password);

  if (!passwordValido) {
    return res.status(401).json(respuestaError('Contraseña incorrecta', 'INVALID_CREDENTIALS'));
  }

  if (usuario.estado !== 'activo') {
    return res.status(403).json(respuestaError('Usuario inactivo o bloqueado', 'USER_BLOCKED'));
  }

  const token = generarToken(usuario);

  res.json(respuestaExito({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario
    }
  }, 'Login exitoso', 'LOGIN_SUCCESS'));
}));

// Registro (solo administrador puede crear usuarios normalmente)
app.post('/api/auth/registro', asyncHandler(async (req, res) => {
  const { nombre, email, password, tipo_usuario } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json(respuestaError('Datos incompletos'));
  }

  if (!validadores.esEmailValido(email)) {
    return res.status(400).json(respuestaError('Email inválido'));
  }

  const usuarioExistente = await getOne('SELECT id FROM usuarios WHERE email = ?', [email]);

  if (usuarioExistente) {
    return res.status(409).json(respuestaError('El email ya está registrado', 'EMAIL_EXISTS'));
  }

  const hashedPassword = await bcryptjs.hash(password, 10);
  const usuarioId = generarId();

  await runQuery(
    `INSERT INTO usuarios (id, nombre, email, password, tipo_usuario)
     VALUES (?, ?, ?, ?, ?)`,
    [usuarioId, nombre, email, hashedPassword, tipo_usuario || 'alumno']
  );

  const token = generarToken({
    id: usuarioId,
    email,
    tipo_usuario: tipo_usuario || 'alumno'
  });

  res.status(201).json(respuestaExito({
    token,
    usuario: {
      id: usuarioId,
      nombre,
      email,
      tipo_usuario: tipo_usuario || 'alumno'
    }
  }, 'Usuario registrado exitosamente', 'REGISTER_SUCCESS'));
}));

// ============================================
// RUTAS PROTEGIDAS - Proxy a Servicios (DESHABILITADO - Usando BD directa)
// ============================================
/*
const proxyServicio = (servicio) => asyncHandler(async (req, res) => {
  const TABLAS = {
    alumnos: 'alumnos',
    matricula: 'matriculas',
    profesores: 'profesores',
    cursos: 'cursos',
    pagos: 'pagos',
    notificaciones: 'notificaciones',
    asistencia: 'asistencias',
    calificaciones: 'calificaciones'
  };
  const ACCIONES = { POST: 'CREAR', PUT: 'ACTUALIZAR', PATCH: 'ACTUALIZAR', DELETE: 'ELIMINAR' };
  const esModificacion = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const tabla = TABLAS[servicio];
  let datosAntes = null;

  if (esModificacion && tabla && req.params.id) {
    try {
      datosAntes = await getOne(`SELECT * FROM ${tabla} WHERE id = ?`, [req.params.id]);
    } catch (e) {} // eslint-disable-line
  }

  try {
    const url = `${SERVICIOS[servicio]}${req.originalUrl.replace(`/api/${servicio}`, '')}`;
    const config = {
      method: req.method,
      url,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization || ''
      }
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      config.data = req.body;
    }

    const respuesta = await axios(config);
    res.status(respuesta.status).json(respuesta.data);

    // Auditar después de responder (solo operaciones exitosas)
    if (esModificacion && tabla && respuesta.data?.exito) {
      const accion = ACCIONES[req.method] || req.method;
      const registroId = req.params.id || respuesta.data?.datos?.id || null;
      const datosDespues = req.method === 'DELETE' ? null : req.body;
      if (registroId) {
        auditar(getDatabase(), req, accion, tabla, registroId, datosAntes, datosDespues);
      }
    }
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(503).json(respuestaError('Servicio no disponible', 'SERVICE_UNAVAILABLE'));
    }
  }
});

// ALUMNOS
app.get('/api/alumnos', authMiddleware, proxyServicio('alumnos'));
app.get('/api/alumnos/:id', authMiddleware, proxyServicio('alumnos'));
app.post('/api/alumnos', authMiddleware, requireRole(['administrativo', 'director']), proxyServicio('alumnos'));
app.put('/api/alumnos/:id', authMiddleware, requireRole(['administrativo', 'director']), proxyServicio('alumnos'));

// MATRÍCULAS
app.get('/api/matriculas', authMiddleware, proxyServicio('matricula'));
app.post('/api/matriculas', authMiddleware, requireRole(['administrativo', 'alumno']), proxyServicio('matricula'));
app.get('/api/matriculas/:id', authMiddleware, proxyServicio('matricula'));
app.put('/api/matriculas/:id', authMiddleware, requireRole(['administrativo']), proxyServicio('matricula'));
app.get('/api/matriculas-alumno/:alumno_id', authMiddleware, proxyServicio('matricula'));

// PROFESORES
app.get('/api/profesores', authMiddleware, proxyServicio('profesores'));
app.get('/api/profesores/:id', authMiddleware, proxyServicio('profesores'));
app.post('/api/profesores', authMiddleware, requireRole(['director']), proxyServicio('profesores'));
app.put('/api/profesores/:id', authMiddleware, requireRole(['director']), proxyServicio('profesores'));
app.get('/api/profesores/:id/cursos', authMiddleware, proxyServicio('profesores'));

// CURSOS
app.get('/api/cursos', authMiddleware, proxyServicio('cursos'));
app.get('/api/cursos/:id', authMiddleware, proxyServicio('cursos'));
app.post('/api/cursos', authMiddleware, requireRole(['director', 'administrativo']), proxyServicio('cursos'));
app.put('/api/cursos/:id', authMiddleware, requireRole(['director', 'administrativo']), proxyServicio('cursos'));
app.get('/api/cursos/:id/estudiantes', authMiddleware, proxyServicio('cursos'));
app.get('/api/cursos-profesor/:profesor_id', authMiddleware, proxyServicio('cursos'));

// PAGOS
app.get('/api/pagos', authMiddleware, proxyServicio('pagos'));
app.post('/api/pagos', authMiddleware, proxyServicio('pagos'));
app.get('/api/pagos/:id', authMiddleware, proxyServicio('pagos'));
app.put('/api/pagos/:id/procesar', authMiddleware, proxyServicio('pagos'));
app.get('/api/pagos-alumno/:alumno_id', authMiddleware, proxyServicio('pagos'));
app.get('/api/deuda/:alumno_id', authMiddleware, proxyServicio('pagos'));

// NOTIFICACIONES
app.get('/api/notificaciones', authMiddleware, proxyServicio('notificaciones'));
app.post('/api/notificaciones', authMiddleware, proxyServicio('notificaciones'));

// ASISTENCIA
app.get('/api/asistencia', authMiddleware, proxyServicio('asistencia'));
app.post('/api/asistencia', authMiddleware, requireRole(['docente']), proxyServicio('asistencia'));
app.get('/api/asistencia/:id', authMiddleware, proxyServicio('asistencia'));
app.put('/api/asistencia/:id', authMiddleware, proxyServicio('asistencia'));
app.get('/api/asistencia-alumno/:alumno_id', authMiddleware, proxyServicio('asistencia'));
app.get('/api/asistencia-curso/:curso_id', authMiddleware, proxyServicio('asistencia'));
app.get('/api/reporte-inasistencias/:fecha', authMiddleware, proxyServicio('asistencia'));

// CALIFICACIONES
app.get('/api/calificaciones', authMiddleware, proxyServicio('calificaciones'));
app.post('/api/calificaciones', authMiddleware, requireRole(['docente']), proxyServicio('calificaciones'));
app.get('/api/calificaciones/:id', authMiddleware, proxyServicio('calificaciones'));
app.put('/api/calificaciones/:id', authMiddleware, requireRole(['docente']), proxyServicio('calificaciones'));
app.get('/api/calificaciones-alumno/:alumno_id', authMiddleware, proxyServicio('calificaciones'));
app.get('/api/calificaciones-curso/:curso_id', authMiddleware, proxyServicio('calificaciones'));
app.get('/api/promedio-alumno/:alumno_id', authMiddleware, proxyServicio('calificaciones'));
*/

// ============================================
// RUTAS PROTEGIDAS - Datos directo de BD
// ============================================

// ALUMNOS desde BD
app.get('/api/alumnos', authMiddleware, asyncHandler(async (req, res) => {
  try {
    let alumnos = [];
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;

    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      alumnos = await getAll(`
        SELECT
          a.*,
          TRIM(COALESCE(u.nombre, '') || ' (' || COALESCE(u.email, '') || ')') AS usuario_nombre,
          COALESCE(p.nombre, '') AS padre_nombre
        FROM alumnos a
        LEFT JOIN usuarios u ON u.id = a.usuario_id
        LEFT JOIN usuarios p ON p.id = a.padre_id
        ORDER BY a.primer_nombre, a.apellido_paterno
      `);
    } else if (rol === 'alumno') {
      alumnos = await getAll(`
        SELECT
          a.*,
          TRIM(COALESCE(u.nombre, '') || ' (' || COALESCE(u.email, '') || ')') AS usuario_nombre,
          COALESCE(p.nombre, '') AS padre_nombre
        FROM alumnos a
        LEFT JOIN usuarios u ON u.id = a.usuario_id
        LEFT JOIN usuarios p ON p.id = a.padre_id
        WHERE a.usuario_id = ?
        ORDER BY a.primer_nombre, a.apellido_paterno
      `, [usuarioId]);
    } else if (rol === 'padre') {
      alumnos = await getAll(`
        SELECT
          a.*,
          TRIM(COALESCE(u.nombre, '') || ' (' || COALESCE(u.email, '') || ')') AS usuario_nombre,
          COALESCE(p.nombre, '') AS padre_nombre
        FROM alumnos a
        LEFT JOIN usuarios u ON u.id = a.usuario_id
        LEFT JOIN usuarios p ON p.id = a.padre_id
        WHERE a.padre_id = ?
        ORDER BY a.primer_nombre, a.apellido_paterno
      `, [usuarioId]);
    } else if (rol === 'docente') {
      const profesorId = await getProfesorIdPorUsuario(usuarioId);
      if (profesorId) {
        alumnos = await getAll(`
          SELECT DISTINCT
            a.*,
            TRIM(COALESCE(u.nombre, '') || ' (' || COALESCE(u.email, '') || ')') AS usuario_nombre,
            COALESCE(p.nombre, '') AS padre_nombre
          FROM alumnos a
          INNER JOIN matriculas m ON m.alumno_id = a.id
          INNER JOIN cursos c ON c.id = m.curso_id
          LEFT JOIN usuarios u ON u.id = a.usuario_id
          LEFT JOIN usuarios p ON p.id = a.padre_id
          WHERE c.profesor_id = ?
          ORDER BY a.primer_nombre, a.apellido_paterno
        `, [profesorId]);
      }
    }
    res.json(respuestaExito(alumnos, 'Alumnos obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener alumnos'));
  }
}));

app.get('/api/alumnos/:id', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;
    let alumno = null;

    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      alumno = await getOne('SELECT * FROM alumnos WHERE id = ?', [req.params.id]);
    } else if (rol === 'alumno') {
      alumno = await getOne('SELECT * FROM alumnos WHERE id = ? AND usuario_id = ?', [req.params.id, usuarioId]);
    } else if (rol === 'padre') {
      alumno = await getOne('SELECT * FROM alumnos WHERE id = ? AND padre_id = ?', [req.params.id, usuarioId]);
    } else if (rol === 'docente') {
      const profesorId = await getProfesorIdPorUsuario(usuarioId);
      alumno = profesorId ? await getOne(`
        SELECT a.*
        FROM alumnos a
        INNER JOIN matriculas m ON m.alumno_id = a.id
        INNER JOIN cursos c ON c.id = m.curso_id
        WHERE a.id = ? AND c.profesor_id = ?
        LIMIT 1
      `, [req.params.id, profesorId]) : null;
    }

    if (!alumno) return res.status(404).json(respuestaError('Alumno no encontrado'));
    res.json(respuestaExito(alumno));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener alumno'));
  }
}));

// CURSOS desde BD
app.get('/api/cursos', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;
    let cursos = [];

    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      cursos = await getAll(`
        SELECT
          c.*,
          TRIM(COALESCE(p.primer_nombre, '') || ' ' || COALESCE(p.apellido_paterno, '')) AS profesor_nombre,
          p.numero_empleado AS profesor_numero_empleado,
          p.especialidad AS profesor_especialidad
        FROM cursos c
        LEFT JOIN profesores p ON p.id = c.profesor_id
        ORDER BY c.nombre
      `);
    } else if (rol === 'docente') {
      const profesorId = await getProfesorIdPorUsuario(usuarioId);
      if (profesorId) {
        cursos = await getAll(`
          SELECT
            c.*,
            TRIM(COALESCE(p.primer_nombre, '') || ' ' || COALESCE(p.apellido_paterno, '')) AS profesor_nombre,
            p.numero_empleado AS profesor_numero_empleado,
            p.especialidad AS profesor_especialidad
          FROM cursos c
          LEFT JOIN profesores p ON p.id = c.profesor_id
          WHERE c.profesor_id = ?
          ORDER BY c.nombre
        `, [profesorId]);
      }
    } else if (rol === 'alumno') {
      cursos = await getAll(`
        SELECT DISTINCT
          c.*,
          TRIM(COALESCE(p.primer_nombre, '') || ' ' || COALESCE(p.apellido_paterno, '')) AS profesor_nombre,
          p.numero_empleado AS profesor_numero_empleado,
          p.especialidad AS profesor_especialidad
        FROM cursos c
        INNER JOIN matriculas m ON m.curso_id = c.id
        INNER JOIN alumnos a ON a.id = m.alumno_id
        LEFT JOIN profesores p ON p.id = c.profesor_id
        WHERE a.usuario_id = ?
        ORDER BY c.nombre
      `, [usuarioId]);
    } else if (rol === 'padre') {
      cursos = await getAll(`
        SELECT DISTINCT
          c.*,
          TRIM(COALESCE(p.primer_nombre, '') || ' ' || COALESCE(p.apellido_paterno, '')) AS profesor_nombre,
          p.numero_empleado AS profesor_numero_empleado,
          p.especialidad AS profesor_especialidad
        FROM cursos c
        INNER JOIN matriculas m ON m.curso_id = c.id
        INNER JOIN alumnos a ON a.id = m.alumno_id
        LEFT JOIN profesores p ON p.id = c.profesor_id
        WHERE a.padre_id = ?
        ORDER BY c.nombre
      `, [usuarioId]);
    }
    res.json(respuestaExito(cursos, 'Cursos obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener cursos'));
  }
}));

app.get('/api/cursos/:id', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;
    let curso = null;

    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      curso = await getOne('SELECT * FROM cursos WHERE id = ?', [req.params.id]);
    } else if (rol === 'docente') {
      const profesorId = await getProfesorIdPorUsuario(usuarioId);
      curso = profesorId ? await getOne('SELECT * FROM cursos WHERE id = ? AND profesor_id = ?', [req.params.id, profesorId]) : null;
    } else if (rol === 'alumno') {
      curso = await getOne(`
        SELECT c.*
        FROM cursos c
        INNER JOIN matriculas m ON m.curso_id = c.id
        INNER JOIN alumnos a ON a.id = m.alumno_id
        WHERE c.id = ? AND a.usuario_id = ?
        LIMIT 1
      `, [req.params.id, usuarioId]);
    } else if (rol === 'padre') {
      curso = await getOne(`
        SELECT c.*
        FROM cursos c
        INNER JOIN matriculas m ON m.curso_id = c.id
        INNER JOIN alumnos a ON a.id = m.alumno_id
        WHERE c.id = ? AND a.padre_id = ?
        LIMIT 1
      `, [req.params.id, usuarioId]);
    }

    if (!curso) return res.status(404).json(respuestaError('Curso no encontrado'));
    res.json(respuestaExito(curso));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener curso'));
  }
}));

// ESTUDIANTES POR CURSO
app.get('/api/cursos/:id/estudiantes', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const cursoId = req.params.id;
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;

    // Verificar acceso al curso
    let tieneAcceso = false;
    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      tieneAcceso = true;
    } else if (rol === 'docente') {
      const profesorId = await getProfesorIdPorUsuario(usuarioId);
      const curso = profesorId ? await getOne('SELECT id FROM cursos WHERE id = ? AND profesor_id = ?', [cursoId, profesorId]) : null;
      tieneAcceso = !!curso;
    } else if (rol === 'alumno') {
      const curso = await getOne(`
        SELECT c.id FROM cursos c
        INNER JOIN matriculas m ON m.curso_id = c.id
        INNER JOIN alumnos a ON a.id = m.alumno_id
        WHERE c.id = ? AND a.usuario_id = ? LIMIT 1
      `, [cursoId, usuarioId]);
      tieneAcceso = !!curso;
    } else if (rol === 'padre') {
      const curso = await getOne(`
        SELECT c.id FROM cursos c
        INNER JOIN matriculas m ON m.curso_id = c.id
        INNER JOIN alumnos a ON a.id = m.alumno_id
        WHERE c.id = ? AND a.padre_id = ? LIMIT 1
      `, [cursoId, usuarioId]);
      tieneAcceso = !!curso;
    }

    if (!tieneAcceso) {
      return res.status(403).json(respuestaError('No tienes acceso a este curso'));
    }

    const estudiantes = await getAll(`
      SELECT
        al.id,
        al.primer_nombre,
        al.apellido_paterno,
        al.numero_matricula,
        al.numero_documento,
        TRIM(COALESCE(al.primer_nombre, '') || ' ' || COALESCE(al.apellido_paterno, '')) AS nombre_completo
      FROM alumnos al
      INNER JOIN matriculas m ON m.alumno_id = al.id
      WHERE m.curso_id = ? AND m.estado = 'activa'
      ORDER BY al.apellido_paterno, al.primer_nombre
    `, [cursoId]);

    res.json(respuestaExito(estudiantes, 'Estudiantes del curso obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener estudiantes del curso'));
  }
}));

// PROFESORES desde BD
app.get('/api/profesores', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;
    let profesores = [];

    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      profesores = await getAll(`
        SELECT
          p.*,
          u.nombre AS usuario_nombre,
          u.email AS usuario_email
        FROM profesores p
        LEFT JOIN usuarios u ON u.id = p.usuario_id
        ORDER BY p.primer_nombre, p.apellido_paterno
      `);
    } else if (rol === 'docente') {
      profesores = await getAll(`
        SELECT
          p.*,
          u.nombre AS usuario_nombre,
          u.email AS usuario_email
        FROM profesores p
        LEFT JOIN usuarios u ON u.id = p.usuario_id
        WHERE p.usuario_id = ?
        ORDER BY p.primer_nombre, p.apellido_paterno
      `, [usuarioId]);
    } else if (rol === 'alumno') {
      profesores = await getAll(`
        SELECT DISTINCT
          p.*,
          u.nombre AS usuario_nombre,
          u.email AS usuario_email
        FROM profesores p
        LEFT JOIN usuarios u ON u.id = p.usuario_id
        INNER JOIN cursos c ON c.profesor_id = p.id
        INNER JOIN matriculas m ON m.curso_id = c.id
        INNER JOIN alumnos a ON a.id = m.alumno_id
        WHERE a.usuario_id = ?
        ORDER BY p.primer_nombre, p.apellido_paterno
      `, [usuarioId]);
    } else if (rol === 'padre') {
      profesores = await getAll(`
        SELECT DISTINCT
          p.*,
          u.nombre AS usuario_nombre,
          u.email AS usuario_email
        FROM profesores p
        LEFT JOIN usuarios u ON u.id = p.usuario_id
        INNER JOIN cursos c ON c.profesor_id = p.id
        INNER JOIN matriculas m ON m.curso_id = c.id
        INNER JOIN alumnos a ON a.id = m.alumno_id
        WHERE a.padre_id = ?
        ORDER BY p.primer_nombre, p.apellido_paterno
      `, [usuarioId]);
    }
    res.json(respuestaExito(profesores, 'Profesores obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener profesores'));
  }
}));

app.get('/api/profesores/:id', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;
    let profesor = null;

    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      profesor = await getOne('SELECT * FROM profesores WHERE id = ?', [req.params.id]);
    } else if (rol === 'docente') {
      profesor = await getOne('SELECT * FROM profesores WHERE id = ? AND usuario_id = ?', [req.params.id, usuarioId]);
    } else if (rol === 'alumno') {
      profesor = await getOne(`
        SELECT p.*
        FROM profesores p
        INNER JOIN cursos c ON c.profesor_id = p.id
        INNER JOIN matriculas m ON m.curso_id = c.id
        INNER JOIN alumnos a ON a.id = m.alumno_id
        WHERE p.id = ? AND a.usuario_id = ?
        LIMIT 1
      `, [req.params.id, usuarioId]);
    } else if (rol === 'padre') {
      profesor = await getOne(`
        SELECT p.*
        FROM profesores p
        INNER JOIN cursos c ON c.profesor_id = p.id
        INNER JOIN matriculas m ON m.curso_id = c.id
        INNER JOIN alumnos a ON a.id = m.alumno_id
        WHERE p.id = ? AND a.padre_id = ?
        LIMIT 1
      `, [req.params.id, usuarioId]);
    }

    if (!profesor) return res.status(404).json(respuestaError('Profesor no encontrado'));
    res.json(respuestaExito(profesor));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener profesor'));
  }
}));

// MATRÍCULAS desde BD
app.get('/api/matriculas', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;
    let matriculas = [];

    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      matriculas = await getAll(`
        SELECT
          m.*,
          TRIM(COALESCE(a.primer_nombre, '') || ' ' || COALESCE(a.apellido_paterno, '')) AS alumno_nombre,
          a.numero_matricula AS alumno_numero_matricula,
          c.nombre AS curso_nombre,
          c.codigo AS curso_codigo,
          c.grado AS curso_grado,
          c.seccion AS curso_seccion,
          TRIM(COALESCE(p.primer_nombre, '') || ' ' || COALESCE(p.apellido_paterno, '')) AS profesor_nombre
        FROM matriculas m
        LEFT JOIN alumnos a ON a.id = m.alumno_id
        LEFT JOIN cursos c ON c.id = m.curso_id
        LEFT JOIN profesores p ON p.id = c.profesor_id
        ORDER BY m.fecha_matricula DESC
      `);
    } else if (rol === 'alumno') {
      matriculas = await getAll(`
        SELECT
          m.*,
          TRIM(COALESCE(a.primer_nombre, '') || ' ' || COALESCE(a.apellido_paterno, '')) AS alumno_nombre,
          a.numero_matricula AS alumno_numero_matricula,
          c.nombre AS curso_nombre,
          c.codigo AS curso_codigo,
          c.grado AS curso_grado,
          c.seccion AS curso_seccion,
          TRIM(COALESCE(p.primer_nombre, '') || ' ' || COALESCE(p.apellido_paterno, '')) AS profesor_nombre
        FROM matriculas m
        LEFT JOIN alumnos a ON a.id = m.alumno_id
        LEFT JOIN cursos c ON c.id = m.curso_id
        LEFT JOIN profesores p ON p.id = c.profesor_id
        WHERE a.usuario_id = ?
        ORDER BY m.fecha_matricula DESC
      `, [usuarioId]);
    } else if (rol === 'padre') {
      matriculas = await getAll(`
        SELECT
          m.*,
          TRIM(COALESCE(a.primer_nombre, '') || ' ' || COALESCE(a.apellido_paterno, '')) AS alumno_nombre,
          a.numero_matricula AS alumno_numero_matricula,
          c.nombre AS curso_nombre,
          c.codigo AS curso_codigo,
          c.grado AS curso_grado,
          c.seccion AS curso_seccion,
          TRIM(COALESCE(p.primer_nombre, '') || ' ' || COALESCE(p.apellido_paterno, '')) AS profesor_nombre
        FROM matriculas m
        LEFT JOIN alumnos a ON a.id = m.alumno_id
        LEFT JOIN cursos c ON c.id = m.curso_id
        LEFT JOIN profesores p ON p.id = c.profesor_id
        WHERE a.padre_id = ?
        ORDER BY m.fecha_matricula DESC
      `, [usuarioId]);
    } else if (rol === 'docente') {
      const profesorId = await getProfesorIdPorUsuario(usuarioId);
      if (profesorId) {
        matriculas = await getAll(`
          SELECT DISTINCT
            m.*,
            TRIM(COALESCE(a.primer_nombre, '') || ' ' || COALESCE(a.apellido_paterno, '')) AS alumno_nombre,
            a.numero_matricula AS alumno_numero_matricula,
            c.nombre AS curso_nombre,
            c.codigo AS curso_codigo,
            c.grado AS curso_grado,
            c.seccion AS curso_seccion,
            TRIM(COALESCE(p.primer_nombre, '') || ' ' || COALESCE(p.apellido_paterno, '')) AS profesor_nombre
          FROM matriculas m
          LEFT JOIN alumnos a ON a.id = m.alumno_id
          LEFT JOIN cursos c ON c.id = m.curso_id
          LEFT JOIN profesores p ON p.id = c.profesor_id
          WHERE c.profesor_id = ?
          ORDER BY m.fecha_matricula DESC
        `, [profesorId]);
      }
    }
    res.json(respuestaExito(matriculas, 'Matrículas obtenidas'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener matrículas'));
  }
}));

// PAGOS desde BD
app.get('/api/pagos', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;
    let pagos = [];

    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      pagos = await getAll(`
        SELECT
          p.*,
          TRIM(COALESCE(a.primer_nombre, '') || ' ' || COALESCE(a.apellido_paterno, '')) AS alumno_nombre,
          a.numero_matricula AS alumno_numero_matricula
        FROM pagos p
        LEFT JOIN alumnos a ON a.id = p.alumno_id
        ORDER BY p.fecha_creacion DESC
      `);
    } else if (rol === 'alumno') {
      pagos = await getAll(`
        SELECT
          p.*,
          TRIM(COALESCE(a.primer_nombre, '') || ' ' || COALESCE(a.apellido_paterno, '')) AS alumno_nombre,
          a.numero_matricula AS alumno_numero_matricula
        FROM pagos p
        LEFT JOIN alumnos a ON a.id = p.alumno_id
        WHERE a.usuario_id = ?
        ORDER BY p.fecha_creacion DESC
      `, [usuarioId]);
    } else if (rol === 'padre') {
      pagos = await getAll(`
        SELECT
          p.*,
          TRIM(COALESCE(a.primer_nombre, '') || ' ' || COALESCE(a.apellido_paterno, '')) AS alumno_nombre,
          a.numero_matricula AS alumno_numero_matricula
        FROM pagos p
        LEFT JOIN alumnos a ON a.id = p.alumno_id
        WHERE a.padre_id = ?
        ORDER BY p.fecha_creacion DESC
      `, [usuarioId]);
    } else if (rol === 'docente') {
      const profesorId = await getProfesorIdPorUsuario(usuarioId);
      if (profesorId) {
        pagos = await getAll(`
          SELECT DISTINCT
            p.*,
            TRIM(COALESCE(a.primer_nombre, '') || ' ' || COALESCE(a.apellido_paterno, '')) AS alumno_nombre,
            a.numero_matricula AS alumno_numero_matricula
          FROM pagos p
          LEFT JOIN alumnos a ON a.id = p.alumno_id
          INNER JOIN matriculas m ON m.alumno_id = a.id
          INNER JOIN cursos c ON c.id = m.curso_id
          WHERE c.profesor_id = ?
          ORDER BY p.fecha_creacion DESC
        `, [profesorId]);
      }
    }
    res.json(respuestaExito(pagos, 'Pagos obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener pagos'));
  }
}));

// ASISTENCIA desde BD
app.get('/api/asistencia', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;
    let asistencia = [];

    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      asistencia = await getAll(`
        SELECT
          a.*,
          TRIM(COALESCE(al.primer_nombre, '') || ' ' || COALESCE(al.apellido_paterno, '')) AS alumno_nombre,
          al.numero_matricula AS alumno_numero_matricula,
          c.nombre AS curso_nombre,
          c.codigo AS curso_codigo
        FROM asistencias a
        LEFT JOIN alumnos al ON al.id = a.alumno_id
        LEFT JOIN cursos c ON c.id = a.curso_id
        ORDER BY a.fecha DESC
      `);
    } else if (rol === 'alumno') {
      asistencia = await getAll(`
        SELECT
          a.*,
          TRIM(COALESCE(al.primer_nombre, '') || ' ' || COALESCE(al.apellido_paterno, '')) AS alumno_nombre,
          al.numero_matricula AS alumno_numero_matricula,
          c.nombre AS curso_nombre,
          c.codigo AS curso_codigo
        FROM asistencias a
        LEFT JOIN alumnos al ON al.id = a.alumno_id
        LEFT JOIN cursos c ON c.id = a.curso_id
        WHERE al.usuario_id = ?
        ORDER BY a.fecha DESC
      `, [usuarioId]);
    } else if (rol === 'padre') {
      asistencia = await getAll(`
        SELECT
          a.*,
          TRIM(COALESCE(al.primer_nombre, '') || ' ' || COALESCE(al.apellido_paterno, '')) AS alumno_nombre,
          al.numero_matricula AS alumno_numero_matricula,
          c.nombre AS curso_nombre,
          c.codigo AS curso_codigo
        FROM asistencias a
        LEFT JOIN alumnos al ON al.id = a.alumno_id
        LEFT JOIN cursos c ON c.id = a.curso_id
        WHERE al.padre_id = ?
        ORDER BY a.fecha DESC
      `, [usuarioId]);
    } else if (rol === 'docente') {
      const profesorId = await getProfesorIdPorUsuario(usuarioId);
      if (profesorId) {
        asistencia = await getAll(`
          SELECT DISTINCT
            a.*,
            TRIM(COALESCE(al.primer_nombre, '') || ' ' || COALESCE(al.apellido_paterno, '')) AS alumno_nombre,
            al.numero_matricula AS alumno_numero_matricula,
            c.nombre AS curso_nombre,
            c.codigo AS curso_codigo
          FROM asistencias a
          LEFT JOIN alumnos al ON al.id = a.alumno_id
          LEFT JOIN cursos c ON c.id = a.curso_id
          INNER JOIN matriculas m ON m.alumno_id = al.id
          WHERE c.profesor_id = ?
          ORDER BY a.fecha DESC
        `, [profesorId]);
      }
    }
    res.json(respuestaExito(asistencia, 'Registros de asistencia obtenidos'));
  } catch (error) {
    console.error('Error al obtener asistencia:', error);
    res.status(500).json(respuestaError('Error al obtener asistencia'));
  }
}));

// CALIFICACIONES desde BD
app.get('/api/calificaciones', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;
    const cursoIdFilter = req.query.curso_id;
    let calificaciones = [];
    let sql;
    let params;

    const BASE_SELECT = `
      SELECT
        c.*,
        TRIM(COALESCE(al.primer_nombre, '') || ' ' || COALESCE(al.apellido_paterno, '')) AS alumno_nombre,
        al.numero_matricula AS alumno_numero_matricula,
        cur.nombre AS curso_nombre,
        cur.codigo AS curso_codigo
      FROM calificaciones c
      LEFT JOIN alumnos al ON al.id = c.alumno_id
      LEFT JOIN cursos cur ON cur.id = c.curso_id
    `;

    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      sql = BASE_SELECT;
      params = [];
    } else if (rol === 'alumno') {
      sql = `${BASE_SELECT} WHERE al.usuario_id = ?`;
      params = [usuarioId];
    } else if (rol === 'padre') {
      sql = `${BASE_SELECT} WHERE al.padre_id = ?`;
      params = [usuarioId];
    } else if (rol === 'docente') {
      const profesorId = await getProfesorIdPorUsuario(usuarioId);
      if (profesorId) {
        sql = `${BASE_SELECT} INNER JOIN matriculas m ON m.alumno_id = al.id AND m.curso_id = c.curso_id WHERE cur.profesor_id = ?`;
        params = [profesorId];
      }
    }

    if (sql && cursoIdFilter) {
      sql += params.length === 0 ? ' WHERE' : ' AND';
      sql += ' c.curso_id = ?';
      params.push(cursoIdFilter);
    }

    if (sql) {
      calificaciones = await getAll(sql, params);
    }

    res.json(respuestaExito(calificaciones, 'Calificaciones obtenidas'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener calificaciones'));
  }
}));

// NOTIFICACIONES desde BD
app.get('/api/notificaciones', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.tipo_usuario;
    const notificaciones = ROLES_CON_ACCESO_TOTAL.has(rol)
      ? await getAll(`
          SELECT
            n.*,
            u.nombre AS destinatario_nombre,
            u.email AS destinatario_email,
            u.tipo_usuario AS destinatario_tipo
          FROM notificaciones n
          LEFT JOIN usuarios u ON u.id = n.destinatario_id
          ORDER BY n.fecha_creacion DESC
        `)
      : await getAll(`
          SELECT
            n.*,
            u.nombre AS destinatario_nombre,
            u.email AS destinatario_email,
            u.tipo_usuario AS destinatario_tipo
          FROM notificaciones n
          LEFT JOIN usuarios u ON u.id = n.destinatario_id
          WHERE n.destinatario_id = ?
          ORDER BY n.fecha_creacion DESC
        `, [usuarioId]);
    res.json(respuestaExito(notificaciones, 'Notificaciones obtenidas'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener notificaciones'));
  }
}));

// ============================================
// CREAR/ACTUALIZAR/ELIMINAR - POST, PUT, DELETE
// ============================================

// POST ALUMNOS
app.post('/api/alumnos', authMiddleware, requireRole(['administrativo', 'director']), asyncHandler(async (req, res) => {
  const { usuario_id, numero_matricula, apellido_paterno, apellido_materno, primer_nombre, segundo_nombre, email_contacto, telefono, estado, numero_documento, genero, fecha_nacimiento, direccion, padre_id, datos_completos, deuda_pendiente, periodo_academico } = req.body;
  const id = generarId();
  
  if (!numero_matricula || !apellido_paterno || !primer_nombre) {
    return res.status(400).json(respuestaError('Faltan campos requeridos: numero_matricula, apellido_paterno, primer_nombre'));
  }
  if (!validadores.esNombreValido(apellido_paterno)) {
    return res.status(400).json(respuestaError('Apellido paterno no debe contener números'));
  }
  if (!validadores.esNombreValido(primer_nombre)) {
    return res.status(400).json(respuestaError('Primer nombre no debe contener números'));
  }
  if (numero_documento && !validadores.esDocumentoValido(numero_documento)) {
    return res.status(400).json(respuestaError('Número de documento debe tener 8 dígitos'));
  }
  if (telefono && !validadores.esTelefonoValido(telefono)) {
    return res.status(400).json(respuestaError('Teléfono debe tener 9 dígitos y empezar con 9'));
  }
  
  try {
    let resolvedUsuarioId = usuario_id;
    if (!resolvedUsuarioId) {
      const emailGenerado = email_contacto || `${primer_nombre}.${apellido_paterno}.${numero_matricula}@colegio.local`.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
      const usuarioExistente = await getOne('SELECT id FROM usuarios WHERE email = ?', [emailGenerado]);
      if (usuarioExistente) {
        resolvedUsuarioId = usuarioExistente.id;
      } else {
        resolvedUsuarioId = generarId();
        const passwordTemporal = await bcryptjs.hash('password123', 10);
        await runQuery(
          `INSERT INTO usuarios (id, nombre, email, password, tipo_usuario, estado)
           VALUES (?, ?, ?, ?, ?, ?)` ,
          [resolvedUsuarioId, `${primer_nombre} ${apellido_paterno}`.trim(), emailGenerado, passwordTemporal, 'alumno', 'activo']
        );
      }
    }

    await runQuery(
      `INSERT INTO alumnos (
        id, usuario_id, numero_matricula, apellido_paterno, apellido_materno, primer_nombre, segundo_nombre,
        numero_documento, genero, fecha_nacimiento, direccion, telefono, email_contacto, padre_id,
        datos_completos, deuda_pendiente, periodo_academico, estado, fecha_creacion, fecha_actualizacion
       )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        id,
        resolvedUsuarioId,
        numero_matricula,
        apellido_paterno,
        apellido_materno || null,
        primer_nombre,
        segundo_nombre || null,
        numero_documento || null,
        genero || null,
        fecha_nacimiento || null,
        direccion || null,
        telefono || null,
        email_contacto || null,
        padre_id || null,
        datos_completos ? 1 : 0,
        deuda_pendiente ? 1 : 0,
        periodo_academico || PERIODO_ACADEMICO_DEFECTO,
        estado || 'activo'
      ]
    );
    res.status(201).json(respuestaExito({ id }, 'Alumno creado exitosamente'));
    auditar(getDatabase(), req, 'CREAR', 'alumnos', id, null, req.body);
  } catch (error) {
    console.error('Error creating alumno:', error);
    res.status(500).json(respuestaError('Error al crear alumno: ' + error.message));
  }
}));

// PUT ALUMNOS
app.put('/api/alumnos/:id', authMiddleware, requireRole(['administrativo', 'director']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const antes = await getOne('SELECT * FROM alumnos WHERE id = ?', [id]);
  if (!antes) return res.status(404).json(respuestaError('Alumno no encontrado'));
  const { apellido_paterno, primer_nombre, email_contacto, telefono, estado } = req.body;
  try {
    await runQuery(
      `UPDATE alumnos SET apellido_paterno = ?, primer_nombre = ?, email_contacto = ?, telefono = ?, estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [apellido_paterno, primer_nombre, email_contacto, telefono, estado, id]
    );
    res.json(respuestaExito({}, 'Alumno actualizado exitosamente'));
    auditar(getDatabase(), req, 'ACTUALIZAR', 'alumnos', id, antes, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar alumno'));
  }
}));

// DELETE ALUMNOS (eliminación real en cascada)
app.delete('/api/alumnos/:id', authMiddleware, requireRole(['administrativo', 'director']), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const alumno = await getOne('SELECT * FROM alumnos WHERE id = ?', [id]);
    if (!alumno) {
      return res.status(404).json(respuestaError('Alumno no encontrado'));
    }

    // Eliminar en cascada
    const matriculas = await getAll('SELECT id FROM matriculas WHERE alumno_id = ?', [id]);
    for (const matricula of matriculas) {
      await runQuery('DELETE FROM asistencias WHERE alumno_id = ? AND curso_id IN (SELECT curso_id FROM matriculas WHERE id = ?)', [id, matricula.id]);
      await runQuery('DELETE FROM calificaciones WHERE alumno_id = ? AND curso_id IN (SELECT curso_id FROM matriculas WHERE id = ?)', [id, matricula.id]);
    }
    await runQuery('DELETE FROM matriculas WHERE alumno_id = ?', [id]);
    await runQuery('DELETE FROM pagos WHERE alumno_id = ?', [id]);
    await runQuery('DELETE FROM notificaciones WHERE destinatario_id = ?', [alumno.usuario_id]);
    await runQuery('DELETE FROM alumnos WHERE id = ?', [id]);
    if (alumno.usuario_id) {
      await runQuery('DELETE FROM usuarios WHERE id = ?', [alumno.usuario_id]);
    }

    res.json(respuestaExito({}, 'Alumno eliminado completamente (con datos relacionados)'));
    auditar(getDatabase(), req, 'ELIMINAR', 'alumnos', id, alumno, null);
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar alumno: ' + error.message));
  }
}));

// POST CURSOS
app.post('/api/cursos', authMiddleware, requireRole(['director', 'administrativo']), asyncHandler(async (req, res) => {
  const { nombre, codigo, grado, seccion, profesor_id, salon, capacidad, horario_inicio, horario_fin, estado } = req.body;
  const id = generarId();
  if (!nombre || !codigo || !grado || !profesor_id) {
    return res.status(400).json(respuestaError('Faltan campos requeridos: nombre, codigo, grado, profesor_id'));
  }
  try {
    const nombreCurso = await getNombreCursoDesdeProfesor(profesor_id, nombre);
    await runQuery(
      `INSERT INTO cursos (id, nombre, codigo, grado, seccion, profesor_id, salon, capacidad, horario_inicio, horario_fin, estado, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, nombreCurso, codigo, grado, seccion || 'A', profesor_id, salon || null, capacidad || 40, horario_inicio || null, horario_fin || null, estado || 'activo']
    );
    res.status(201).json(respuestaExito({ id }, 'Curso creado exitosamente'));
    auditar(getDatabase(), req, 'CREAR', 'cursos', id, null, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al crear curso'));
  }
}));

// PUT CURSOS
app.put('/api/cursos/:id', authMiddleware, requireRole(['director', 'administrativo']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const antes = await getOne('SELECT * FROM cursos WHERE id = ?', [id]);
  if (!antes) return res.status(404).json(respuestaError('Curso no encontrado'));
  const { nombre, codigo, grado, capacidad, profesor_id, seccion, salon, horario_inicio, horario_fin, estado } = req.body;
  try {
    const nombreCurso = profesor_id ? await getNombreCursoDesdeProfesor(profesor_id, nombre) : nombre;
    await runQuery(
      `UPDATE cursos SET nombre = ?, codigo = ?, grado = ?, seccion = ?, profesor_id = ?, salon = ?, capacidad = ?, horario_inicio = ?, horario_fin = ?, estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
      [nombreCurso, codigo, grado, seccion || 'A', profesor_id, salon || null, capacidad, horario_inicio || null, horario_fin || null, estado || 'activo', id]
    );
    res.json(respuestaExito({}, 'Curso actualizado exitosamente'));
    auditar(getDatabase(), req, 'ACTUALIZAR', 'cursos', id, antes, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar curso'));
  }
}));

// POST PROFESORES
app.post('/api/profesores', authMiddleware, requireRole(['director', 'administrativo']), asyncHandler(async (req, res) => {
  const { usuario_id, numero_empleado, apellido_paterno, primer_nombre, especialidad, email_contacto, telefono, numero_documento, estado } = req.body;
  const id = generarId();
  if (!apellido_paterno || !primer_nombre) {
    return res.status(400).json(respuestaError('Apellido paterno y primer nombre son requeridos'));
  }
  if (!validadores.esNombreValido(apellido_paterno)) {
    return res.status(400).json(respuestaError('Apellido paterno no debe contener números'));
  }
  if (!validadores.esNombreValido(primer_nombre)) {
    return res.status(400).json(respuestaError('Primer nombre no debe contener números'));
  }
  if (numero_documento && !validadores.esDocumentoValido(numero_documento)) {
    return res.status(400).json(respuestaError('Número de documento debe tener 8 dígitos'));
  }
  if (telefono && !validadores.esTelefonoValido(telefono)) {
    return res.status(400).json(respuestaError('Teléfono debe tener 9 dígitos y empezar con 9'));
  }
  try {
    await runQuery('BEGIN TRANSACTION');

    let resolvedUsuarioId = usuario_id;
    const emailProfesor = email_contacto || `${primer_nombre}.${apellido_paterno}.${numero_empleado || id}@colegio.local`.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
    if (!resolvedUsuarioId) {
      const usuarioExistente = await getOne('SELECT id FROM usuarios WHERE email = ?', [emailProfesor]);
      if (usuarioExistente) {
        resolvedUsuarioId = usuarioExistente.id;
      } else {
        resolvedUsuarioId = generarId();
        const passwordTemporal = await bcryptjs.hash('password123', 10);
        await runQuery(
          `INSERT INTO usuarios (id, nombre, email, password, tipo_usuario, estado)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [resolvedUsuarioId, `${primer_nombre} ${apellido_paterno}`.trim(), emailProfesor, passwordTemporal, 'docente', 'activo']
        );
      }
    }

    await runQuery(
      `INSERT INTO profesores (id, usuario_id, numero_empleado, nombre, apellido_paterno, primer_nombre, especialidad, email, telefono, numero_documento, estado, email_contacto, fecha_contratacion, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, resolvedUsuarioId, numero_empleado || null, `${primer_nombre} ${apellido_paterno}`.trim(), apellido_paterno, primer_nombre, especialidad || null, emailProfesor, telefono || null, numero_documento || null, estado || 'activo', emailProfesor]
    );

    await runQuery('COMMIT');
    res.status(201).json(respuestaExito({ id }, 'Profesor creado exitosamente'));
    auditar(getDatabase(), req, 'CREAR', 'profesores', id, null, req.body);
  } catch (error) {
    await runQuery('ROLLBACK').catch(() => {});
    res.status(500).json(respuestaError('Error al crear profesor'));
  }
}));

// PUT PROFESORES
app.put('/api/profesores/:id', authMiddleware, requireRole(['director', 'administrativo']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const antes = await getOne('SELECT * FROM profesores WHERE id = ?', [id]);
  if (!antes) return res.status(404).json(respuestaError('Profesor no encontrado'));
  const { apellido_paterno, primer_nombre, especialidad, email_contacto, telefono, numero_empleado, numero_documento, estado } = req.body;
  try {
    await runQuery(
      `UPDATE profesores SET nombre = ?, apellido_paterno = ?, primer_nombre = ?, numero_empleado = ?, especialidad = ?, email = ?, email_contacto = ?, telefono = ?, numero_documento = ?, estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        `${primer_nombre || ''} ${apellido_paterno || ''}`.trim(),
        apellido_paterno,
        primer_nombre,
        numero_empleado || null,
        especialidad || null,
        email_contacto || null,
        email_contacto || null,
        telefono || null,
        numero_documento || null,
        estado || 'activo',
        id
      ]
    );
    res.json(respuestaExito({}, 'Profesor actualizado exitosamente'));
    auditar(getDatabase(), req, 'ACTUALIZAR', 'profesores', id, antes, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar profesor'));
  }
}));

// POST PAGOS
app.post('/api/pagos', authMiddleware, asyncHandler(async (req, res) => {
  const { alumno_id, monto, concepto, estado_pago, estado, fecha_pago, metodo_pago, observaciones, numero_comprobante } = req.body;
  const id = generarId();
  if (!alumno_id || !monto || !concepto) {
    return res.status(400).json(respuestaError('Faltan campos requeridos: alumno_id, monto, concepto'));
  }
  const estadoFinal = estado || estado_pago || 'pendiente';
  try {
    await runQuery(
      `INSERT INTO pagos (id, alumno_id, monto, concepto, estado_pago, estado, fecha_pago, metodo_pago, numero_comprobante, observaciones, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        id,
        alumno_id,
        monto,
        concepto,
        estadoFinal,
        estadoFinal,
        fecha_pago || null,
        metodo_pago || null,
        numero_comprobante || null,
        observaciones || null,
      ]
    );
    res.status(201).json(respuestaExito({ id }, 'Pago registrado exitosamente'));
    auditar(getDatabase(), req, 'CREAR', 'pagos', id, null, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al registrar pago: ' + error.message));
  }
}));

// PUT PAGOS
app.put('/api/pagos/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const antes = await getOne('SELECT * FROM pagos WHERE id = ?', [id]);
  if (!antes) return res.status(404).json(respuestaError('Pago no encontrado'));
  const { alumno_id, monto, concepto, estado_pago, estado, fecha_pago, metodo_pago, observaciones, numero_comprobante } = req.body;
  const estadoFinal = estado || estado_pago;
  const campos = [];
  const valores = [];
  if (alumno_id !== undefined)       { campos.push('alumno_id = ?');        valores.push(alumno_id); }
  if (monto !== undefined)           { campos.push('monto = ?');            valores.push(monto); }
  if (concepto !== undefined)        { campos.push('concepto = ?');         valores.push(concepto); }
  if (estadoFinal !== undefined)     { campos.push('estado = ?');           valores.push(estadoFinal); campos.push('estado_pago = ?'); valores.push(estadoFinal); }
  if (fecha_pago !== undefined)      { campos.push('fecha_pago = ?');       valores.push(fecha_pago); }
  if (metodo_pago !== undefined)     { campos.push('metodo_pago = ?');      valores.push(metodo_pago); }
  if (observaciones !== undefined)   { campos.push('observaciones = ?');    valores.push(observaciones); }
  if (numero_comprobante !== undefined) { campos.push('numero_comprobante = ?'); valores.push(numero_comprobante); }
  if (campos.length === 0) return res.status(400).json(respuestaError('No hay campos para actualizar'));
  valores.push(id);
  try {
    await runQuery(`UPDATE pagos SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`, valores);
    res.json(respuestaExito({ id }, 'Pago actualizado exitosamente'));
    auditar(getDatabase(), req, 'ACTUALIZAR', 'pagos', id, antes, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar pago: ' + error.message));
  }
}));

// DELETE PAGOS
app.delete('/api/pagos/:id', authMiddleware, requireRole(['administrativo', 'director']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pago = await getOne('SELECT * FROM pagos WHERE id = ?', [id]);
  if (!pago) return res.status(404).json(respuestaError('Pago no encontrado'));
  try {
    await runQuery('DELETE FROM pagos WHERE id = ?', [id]);
    res.json(respuestaExito({}, 'Pago eliminado correctamente'));
    auditar(getDatabase(), req, 'ELIMINAR', 'pagos', id, pago, null);
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar pago: ' + error.message));
  }
}));

// POST MATRÍCULAS
app.post('/api/matriculas', authMiddleware, requireRole(['administrativo', 'director']), asyncHandler(async (req, res) => {
  const { alumno_id, curso_id, fecha_matricula, estado, observaciones, periodo_academico } = req.body;
  const id = generarId();

  if (!alumno_id || !curso_id) {
    return res.status(400).json(respuestaError('Faltan campos requeridos: alumno_id, curso_id'));
  }

  try {
    await runQuery(
      `INSERT INTO matriculas (id, alumno_id, curso_id, periodo_academico, fecha_matricula, estado, observaciones, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, alumno_id, curso_id, periodo_academico || PERIODO_ACADEMICO_DEFECTO, fecha_matricula || new Date().toISOString().split('T')[0], estado || 'activa', observaciones || null]
    );
    res.status(201).json(respuestaExito({ id }, 'Matrícula creada exitosamente'));
    auditar(getDatabase(), req, 'CREAR', 'matriculas', id, null, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al crear matrícula: ' + error.message));
  }
}));

// POST ASISTENCIAS
app.post('/api/asistencia', authMiddleware, requireRole(['docente', 'director', 'administrativo']), asyncHandler(async (req, res) => {
  const { alumno_id, curso_id, fecha, estado, registrada, motivo_falta } = req.body;
  const id = generarId();

  if (!alumno_id || !curso_id || !fecha) {
    return res.status(400).json(respuestaError('Faltan campos requeridos: alumno_id, curso_id, fecha'));
  }

  try {
    await runQuery(
      `INSERT INTO asistencias (id, alumno_id, curso_id, fecha, estado, registrada, motivo_falta, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, alumno_id, curso_id, fecha, estado || 'PRESENTE', registrada ? 1 : 0, motivo_falta || null]
    );
    res.status(201).json(respuestaExito({ id }, 'Asistencia registrada exitosamente'));
    auditar(getDatabase(), req, 'CREAR', 'asistencias', id, null, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al registrar asistencia: ' + error.message));
  }
}));

// POST CALIFICACIONES
app.post('/api/calificaciones', authMiddleware, requireRole(['docente', 'director', 'administrativo']), asyncHandler(async (req, res) => {
  const { alumno_id, curso_id, puntuacion, nota, periodo, observaciones } = req.body;
  const id = generarId();
  const puntuacionFinal = puntuacion ?? nota;

  if (!alumno_id || !curso_id || puntuacionFinal === undefined || puntuacionFinal === null) {
    return res.status(400).json(respuestaError('Faltan campos requeridos: alumno_id, curso_id, puntuacion'));
  }

  try {
    await runQuery(
      `INSERT INTO calificaciones (id, alumno_id, curso_id, puntuacion, periodo_academico, tipo_evaluacion, observaciones, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, alumno_id, curso_id, puntuacionFinal, periodo || '1', 'parcial', observaciones || null]
    );
    res.status(201).json(respuestaExito({ id }, 'Calificación registrada exitosamente'));
    auditar(getDatabase(), req, 'CREAR', 'calificaciones', id, null, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al registrar calificación: ' + error.message));
  }
}));

// POST NOTIFICACIONES
app.post('/api/notificaciones', authMiddleware, requireRole(['administrativo', 'director', 'docente']), asyncHandler(async (req, res) => {
  const { destinatario_id, tipo, mensaje, leida, fecha_lectura } = req.body;
  const id = generarId();

  if (!destinatario_id || !mensaje) {
    return res.status(400).json(respuestaError('Faltan campos requeridos: destinatario_id, mensaje'));
  }

  try {
    await runQuery(
      `INSERT INTO notificaciones (id, destinatario_id, tipo, mensaje, leida, fecha_lectura, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, destinatario_id, tipo || 'informacion', mensaje, leida ? 1 : 0, fecha_lectura || null]
    );
    res.status(201).json(respuestaExito({ id }, 'Notificación creada exitosamente'));
    auditar(getDatabase(), req, 'CREAR', 'notificaciones', id, null, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al crear notificación: ' + error.message));
  }
}));

// PUT ASISTENCIAS
app.put('/api/asistencia/:id', authMiddleware, requireRole(['docente', 'director', 'administrativo']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const antes = await getOne('SELECT * FROM asistencias WHERE id = ?', [id]);
  if (!antes) return res.status(404).json(respuestaError('Asistencia no encontrada'));
  const { alumno_id, curso_id, fecha, estado, registrada, motivo_falta } = req.body;
  try {
    await runQuery(
      `UPDATE asistencias
       SET alumno_id = ?, curso_id = ?, fecha = ?, estado = ?, registrada = ?, motivo_falta = ?, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [alumno_id, curso_id, fecha, estado || 'PRESENTE', registrada ? 1 : 0, motivo_falta || null, id]
    );
    res.json(respuestaExito({}, 'Asistencia actualizada exitosamente'));
    auditar(getDatabase(), req, 'ACTUALIZAR', 'asistencias', id, antes, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar asistencia: ' + error.message));
  }
}));

// DELETE ASISTENCIAS
app.delete('/api/asistencia/:id', authMiddleware, requireRole(['docente', 'director', 'administrativo']), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const antes = await getOne('SELECT * FROM asistencias WHERE id = ?', [id]);
    if (!antes) return res.status(404).json(respuestaError('Asistencia no encontrada'));
    await runQuery('DELETE FROM asistencias WHERE id = ?', [id]);
    res.json(respuestaExito({}, 'Asistencia eliminada exitosamente'));
    auditar(getDatabase(), req, 'ELIMINAR', 'asistencias', id, antes, null);
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar asistencia: ' + error.message));
  }
}));

// PUT CALIFICACIONES
app.put('/api/calificaciones/:id', authMiddleware, requireRole(['docente', 'director', 'administrativo']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const antes = await getOne('SELECT * FROM calificaciones WHERE id = ?', [id]);
  if (!antes) return res.status(404).json(respuestaError('Calificación no encontrada'));
  const { alumno_id, curso_id, puntuacion, nota, periodo, tipo_evaluacion, observaciones } = req.body;
  const puntuacionFinal = puntuacion ?? nota;
  try {
    await runQuery(
      `UPDATE calificaciones
       SET alumno_id = ?, curso_id = ?, puntuacion = ?, periodo_academico = ?, tipo_evaluacion = COALESCE(?, tipo_evaluacion), observaciones = ?, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [alumno_id, curso_id, puntuacionFinal, periodo || '1', tipo_evaluacion || null, observaciones || null, id]
    );
    res.json(respuestaExito({}, 'Calificación actualizada exitosamente'));
    auditar(getDatabase(), req, 'ACTUALIZAR', 'calificaciones', id, antes, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar calificación: ' + error.message));
  }
}));

// DELETE CALIFICACIONES
app.delete('/api/calificaciones/:id', authMiddleware, requireRole(['docente', 'director', 'administrativo']), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const antes = await getOne('SELECT * FROM calificaciones WHERE id = ?', [id]);
    if (!antes) return res.status(404).json(respuestaError('Calificación no encontrada'));
    await runQuery('DELETE FROM calificaciones WHERE id = ?', [id]);
    res.json(respuestaExito({}, 'Calificación eliminada exitosamente'));
    auditar(getDatabase(), req, 'ELIMINAR', 'calificaciones', id, antes, null);
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar calificación: ' + error.message));
  }
}));

// PUT NOTIFICACIONES
app.put('/api/notificaciones/:id', authMiddleware, requireRole(['administrativo', 'director', 'docente', 'padre', 'alumno']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const antes = await getOne('SELECT * FROM notificaciones WHERE id = ?', [id]);
  if (!antes) return res.status(404).json(respuestaError('Notificación no encontrada'));
  const { destinatario_id, tipo, mensaje, leida, fecha_lectura } = req.body;
  try {
    await runQuery(
      `UPDATE notificaciones
       SET destinatario_id = ?, tipo = ?, mensaje = ?, leida = ?,
           fecha_lectura = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE ? END
       WHERE id = ?`,
      [destinatario_id, tipo || 'informacion', mensaje, leida ? 1 : 0, leida ? 1 : 0, fecha_lectura || null, id]
    );
    res.json(respuestaExito({}, 'Notificación actualizada exitosamente'));
    auditar(getDatabase(), req, 'ACTUALIZAR', 'notificaciones', id, antes, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar notificación: ' + error.message));
  }
}));

// DELETE NOTIFICACIONES
app.delete('/api/notificaciones/:id', authMiddleware, requireRole(['administrativo', 'director', 'docente']), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const antes = await getOne('SELECT * FROM notificaciones WHERE id = ?', [id]);
    if (!antes) return res.status(404).json(respuestaError('Notificación no encontrada'));
    await runQuery('DELETE FROM notificaciones WHERE id = ?', [id]);
    res.json(respuestaExito({}, 'Notificación eliminada exitosamente'));
    auditar(getDatabase(), req, 'ELIMINAR', 'notificaciones', id, antes, null);
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar notificación: ' + error.message));
  }
}));

// DELETE PROFESORES
app.delete('/api/profesores/:id', authMiddleware, requireRole(['director', 'administrativo']), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const profesor = await getOne('SELECT * FROM profesores WHERE id = ?', [id]);
    if (!profesor) {
      return res.status(404).json(respuestaError('Profesor no encontrado'));
    }

    // Eliminar en cascada
    const cursos = await getAll('SELECT id FROM cursos WHERE profesor_id = ?', [id]);
    for (const curso of cursos) {
      await runQuery('DELETE FROM asistencias WHERE curso_id = ?', [curso.id]);
      await runQuery('DELETE FROM calificaciones WHERE curso_id = ?', [curso.id]);
      await runQuery('DELETE FROM matriculas WHERE curso_id = ?', [curso.id]);
    }
    await runQuery('DELETE FROM cursos WHERE profesor_id = ?', [id]);
    await runQuery('DELETE FROM notificaciones WHERE destinatario_id = ?', [profesor.usuario_id]);
    await runQuery('DELETE FROM profesores WHERE id = ?', [id]);
    if (profesor.usuario_id) {
      await runQuery('DELETE FROM usuarios WHERE id = ?', [profesor.usuario_id]);
    }

    res.json(respuestaExito({}, 'Profesor eliminado completamente (con datos relacionados)'));
    auditar(getDatabase(), req, 'ELIMINAR', 'profesores', id, profesor, null);
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar profesor: ' + error.message));
  }
}));

// DELETE CURSOS
app.delete('/api/cursos/:id', authMiddleware, requireRole(['administrativo', 'director']), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await getOne('SELECT * FROM cursos WHERE id = ?', [id]);
    if (!curso) {
      return res.status(404).json(respuestaError('Curso no encontrado'));
    }

    // Eliminar en cascada
    await runQuery('DELETE FROM asistencias WHERE curso_id = ?', [id]);
    await runQuery('DELETE FROM calificaciones WHERE curso_id = ?', [id]);
    await runQuery('DELETE FROM matriculas WHERE curso_id = ?', [id]);
    await runQuery('DELETE FROM cursos WHERE id = ?', [id]);

    res.json(respuestaExito({}, 'Curso eliminado completamente (con datos relacionados)'));
    auditar(getDatabase(), req, 'ELIMINAR', 'cursos', id, curso, null);
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar curso: ' + error.message));
  }
}));

// DELETE MATRÍCULAS
app.delete('/api/matriculas/:id', authMiddleware, requireRole(['administrativo', 'director']), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const matricula = await getOne('SELECT * FROM matriculas WHERE id = ?', [id]);
    if (!matricula) {
      return res.status(404).json(respuestaError('Matrícula no encontrada'));
    }

    // Eliminar en cascada
    await runQuery('DELETE FROM asistencias WHERE alumno_id = ? AND curso_id = ?', [matricula.alumno_id, matricula.curso_id]);
    await runQuery('DELETE FROM calificaciones WHERE alumno_id = ? AND curso_id = ?', [matricula.alumno_id, matricula.curso_id]);
    await runQuery('DELETE FROM matriculas WHERE id = ?', [id]);

    res.json(respuestaExito({}, 'Matrícula eliminada (incluyendo asistencias y calificaciones relacionadas)'));
    auditar(getDatabase(), req, 'ELIMINAR', 'matriculas', id, matricula, null);
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar matrícula: ' + error.message));
  }
}));

// ============================================
// RUTAS DE UTILIDAD
// ============================================

// Health Check
app.get('/api/health', asyncHandler(async (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    servicios: SERVICIOS
  });
}));

// Obtener información del usuario autenticado
app.get('/api/me', authMiddleware, asyncHandler(async (req, res) => {
  res.json(respuestaExito(req.usuario, 'Información del usuario'));
}));

app.get('/api/usuarios', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const rol = req.usuario.tipo_usuario;
    const usuarioId = req.usuario.id;

    const usuarios = ROLES_CON_ACCESO_TOTAL.has(rol)
      ? await getAll(`
          SELECT id, nombre, email, tipo_usuario, estado
          FROM usuarios
          ORDER BY nombre
          LIMIT 200
        `)
      : await getAll(`
          SELECT id, nombre, email, tipo_usuario, estado
          FROM usuarios
          WHERE id = ?
          LIMIT 1
        `, [usuarioId]);

    res.json(respuestaExito(usuarios, 'Usuarios obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener usuarios'));
  }
}));

// Servir frontend React para ruta raíz
app.get('/', (req, res) => {
  const publicIndexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(publicIndexPath)) {
    return res.sendFile(publicIndexPath);
  }

  const buildIndexPath = path.join(__dirname, '../frontend/build', 'index.html');
  if (fs.existsSync(buildIndexPath)) {
    return res.sendFile(buildIndexPath);
  }

  res.json({
    status: 'OK',
    message: 'API Gateway en ejecución'
  });
});

// ============================================
// LOGS DE AUDITORÍA
// ============================================

// GET /api/logs — listado con filtros y paginación
app.get('/api/logs', authMiddleware, requireRole(['director', 'administrativo']), asyncHandler(async (req, res) => {
  const { tabla, accion, usuario_id, desde, hasta, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = [];

  if (tabla)      { conditions.push('l.tabla_afectada = ?'); params.push(tabla); }
  if (accion)     { conditions.push('l.accion LIKE ?');      params.push(`%${accion}%`); }
  if (usuario_id) { conditions.push('l.usuario_id = ?');     params.push(usuario_id); }
  if (desde)      { conditions.push("l.fecha_accion >= ?");  params.push(desde); }
  if (hasta)      { conditions.push("l.fecha_accion <= ?");  params.push(hasta + ' 23:59:59'); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [logs, totalRow] = await Promise.all([
    getAll(
      `SELECT l.*, u.nombre AS usuario_nombre, u.tipo_usuario AS usuario_rol
       FROM logs_auditoria l
       LEFT JOIN usuarios u ON u.id = l.usuario_id
       ${where}
       ORDER BY l.fecha_accion DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    ),
    getOne(
      `SELECT COUNT(*) AS total FROM logs_auditoria l ${where}`,
      params
    ),
  ]);

  res.json(respuestaExito({
    logs,
    total: totalRow?.total || 0,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil((totalRow?.total || 0) / parseInt(limit)),
  }, 'Logs obtenidos'));
}));

// GET /api/logs/stats — resumen para dashboard de auditoría
app.get('/api/logs/stats', authMiddleware, requireRole(['director', 'administrativo']), asyncHandler(async (req, res) => {
  const [porAccion, porTabla, recientes, usuariosActivos] = await Promise.all([
    getAll(`SELECT accion, COUNT(*) AS total FROM logs_auditoria GROUP BY accion ORDER BY total DESC`, []),
    getAll(`SELECT tabla_afectada, COUNT(*) AS total FROM logs_auditoria GROUP BY tabla_afectada ORDER BY total DESC`, []),
    getAll(
      `SELECT l.*, u.nombre AS usuario_nombre, u.tipo_usuario AS usuario_rol
       FROM logs_auditoria l LEFT JOIN usuarios u ON u.id = l.usuario_id
       ORDER BY l.fecha_accion DESC LIMIT 10`, []
    ),
    getAll(
      `SELECT u.nombre, u.tipo_usuario, COUNT(*) AS acciones, MAX(l.fecha_accion) AS ultima_accion
       FROM logs_auditoria l LEFT JOIN usuarios u ON u.id = l.usuario_id
       WHERE u.id IS NOT NULL
       GROUP BY l.usuario_id ORDER BY acciones DESC LIMIT 8`, []
    ),
  ]);
  res.json(respuestaExito({ porAccion, porTabla, recientes, usuariosActivos }, 'Estadísticas obtenidas'));
}));

// ============================================
// REPORTES GENERADOS
// ============================================

// GET /api/reportes — listar reportes del usuario o todos (admin)
app.get('/api/reportes', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const rol = req.usuario.tipo_usuario;
    const usuarioId = req.usuario.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '';
    const params = [];

    if (['director', 'administrativo'].includes(rol)) {
      // admins ven todos
    } else {
      where = 'WHERE r.generado_por = ?';
      params.push(usuarioId);
    }

    const [reportes, totalRow] = await Promise.all([
      getAll(
        `SELECT r.*, u.nombre AS creador_nombre
         FROM reportes_generados r
         LEFT JOIN usuarios u ON u.id = r.generado_por
         ${where}
         ORDER BY r.fecha_generacion DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      ),
      getOne(`SELECT COUNT(*) AS total FROM reportes_generados r ${where}`, params),
    ]);

    res.json(respuestaExito({
      reportes,
      total: totalRow?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil((totalRow?.total || 0) / parseInt(limit)),
    }, 'Reportes obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al listar reportes: ' + error.message));
  }
}));

// GET /api/reportes/:id — obtener un reporte específico
app.get('/api/reportes/:id', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const reporte = await getOne(
      `SELECT r.*, u.nombre AS creador_nombre
       FROM reportes_generados r
       LEFT JOIN usuarios u ON u.id = r.generado_por
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (!reporte) {
      return res.status(404).json(respuestaError('Reporte no encontrado', 'NOT_FOUND'));
    }

    // Verificar permiso: admin o propietario
    const esAdmin = ['director', 'administrativo'].includes(req.usuario.tipo_usuario);
    if (!esAdmin && reporte.generado_por !== req.usuario.id) {
      return res.status(403).json(respuestaError('No tienes permiso para ver este reporte', 'FORBIDDEN'));
    }

    res.json(respuestaExito({ reporte }, 'Reporte obtenido'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener reporte: ' + error.message));
  }
}));

// POST /api/reportes — guardar un reporte generado
app.post('/api/reportes', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { tipo_reporte, alumno_id, periodo_academico, datos_reporte, formato } = req.body;

    if (!tipo_reporte || !alumno_id) {
      return res.status(400).json(respuestaError('Faltan campos requeridos: tipo_reporte, alumno_id', 'VALIDATION_ERROR'));
    }

    const id = generarId();
    await runQuery(
      `INSERT INTO reportes_generados (id, tipo_reporte, generado_por, alumno_id, periodo_academico, datos_reporte, formato, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'generado')`,
      [id, tipo_reporte, req.usuario.id, alumno_id, periodo_academico || null,
       datos_reporte ? JSON.stringify(datos_reporte) : null, formato || 'pdf']
    );

    res.status(201).json(respuestaExito({ id }, 'Reporte registrado correctamente'));
    auditar(getDatabase(), req, 'CREAR', 'reportes_generados', id, null, req.body);
  } catch (error) {
    res.status(500).json(respuestaError('Error al registrar reporte: ' + error.message));
  }
}));

// PATCH /api/reportes/:id/estado — actualizar estado (descargado, enviado)
app.patch('/api/reportes/:id/estado', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['generado', 'enviado', 'descargado'].includes(estado)) {
      return res.status(400).json(respuestaError('Estado inválido', 'VALIDATION_ERROR'));
    }

    const antes = await getOne('SELECT * FROM reportes_generados WHERE id = ?', [req.params.id]);
    if (!antes) return res.status(404).json(respuestaError('Reporte no encontrado', 'NOT_FOUND'));

    await runQuery(
      `UPDATE reportes_generados SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
      [estado, req.params.id]
    );

    res.json(respuestaExito({}, 'Estado de reporte actualizado'));
    auditar(getDatabase(), req, 'ACTUALIZAR', 'reportes_generados', req.params.id, antes, { estado });
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar reporte: ' + error.message));
  }
}));

// ============================================
// MANEJO DE ERRORES
// ============================================

// Servir frontend React para rutas que no comiencen con /api
app.get(/^\/(?!api).*/, (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/build', 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(404).json(respuestaError('Ruta no encontrada', 'NOT_FOUND'));
    }
  });
});

app.use((req, res) => {
  res.status(404).json(respuestaError('Ruta no encontrada', 'NOT_FOUND'));
});

app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================

const ensureReportesColumn = async () => {
  try {
    const rows = await getAll("PRAGMA table_info(reportes_generados)", []);
    const hasAlumnoId = rows.some(r => r.name === 'alumno_id');
    if (!hasAlumnoId) {
      await runQuery("ALTER TABLE reportes_generados ADD COLUMN alumno_id TEXT REFERENCES alumnos(id)");
      console.log('  ✓ Columna alumno_id añadida a reportes_generados');
    }
  } catch (err) {
    console.error('  ⚠ No se pudo verificar columna alumno_id:', err.message);
  }
};

const iniciarGateway = async () => {
  try {
    await initDatabase();
    await ensureReportesColumn();
    console.log('✓ Base de datos inicializada');

    app.listen(GATEWAY_PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║  🚀 API GATEWAY - SISTEMA SOA COLEGIO FUTURO DIGITAL  🚀 ║
╠══════════════════════════════════════════════════════════╣
║  Servidor corriendo en: http://localhost:${GATEWAY_PORT}             ║
║  Ambiente: ${process.env.NODE_ENV || 'development'}                        ║
║                                                          ║
║  Servicios disponibles:                                 ║
║  • Alumnos: ${SERVICIOS.alumnos}              ║
║  • Matrículas: ${SERVICIOS.matricula}          ║
║  • Profesores: ${SERVICIOS.profesores}         ║
║  • Cursos: ${SERVICIOS.cursos}                 ║
║  • Pagos: ${SERVICIOS.pagos}                  ║
║  • Notificaciones: ${SERVICIOS.notificaciones}    ║
║  • Asistencia: ${SERVICIOS.asistencia}         ║
║  • Calificaciones: ${SERVICIOS.calificaciones}  ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Error al iniciar el gateway:', error);
    process.exit(1);
  }
};

// Iniciar si se ejecuta directamente
if (require.main === module) {
  iniciarGateway();
}

module.exports = app;
