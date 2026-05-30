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
const { respuestaExito, respuestaError, generarId } = require('../shared/utils');
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

const getProfesorIdPorUsuario = async (usuarioId) => {
  const profesor = await getOne('SELECT id FROM profesores WHERE usuario_id = ?', [usuarioId]);
  return profesor?.id || null;
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
        LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
          LIMIT 100
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
        LIMIT 100
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
          LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
          LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
          LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
        LIMIT 100
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
          LIMIT 100
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
    let calificaciones = [];

    if (ROLES_CON_ACCESO_TOTAL.has(rol)) {
      calificaciones = await getAll(`
        SELECT
          c.*,
          TRIM(COALESCE(al.primer_nombre, '') || ' ' || COALESCE(al.apellido_paterno, '')) AS alumno_nombre,
          al.numero_matricula AS alumno_numero_matricula,
          cur.nombre AS curso_nombre,
          cur.codigo AS curso_codigo
        FROM calificaciones c
        LEFT JOIN alumnos al ON al.id = c.alumno_id
        LEFT JOIN cursos cur ON cur.id = c.curso_id
        LIMIT 100
      `);
    } else if (rol === 'alumno') {
      calificaciones = await getAll(`
        SELECT
          c.*,
          TRIM(COALESCE(al.primer_nombre, '') || ' ' || COALESCE(al.apellido_paterno, '')) AS alumno_nombre,
          al.numero_matricula AS alumno_numero_matricula,
          cur.nombre AS curso_nombre,
          cur.codigo AS curso_codigo
        FROM calificaciones c
        LEFT JOIN alumnos al ON al.id = c.alumno_id
        LEFT JOIN cursos cur ON cur.id = c.curso_id
        WHERE al.usuario_id = ?
        LIMIT 100
      `, [usuarioId]);
    } else if (rol === 'padre') {
      calificaciones = await getAll(`
        SELECT
          c.*,
          TRIM(COALESCE(al.primer_nombre, '') || ' ' || COALESCE(al.apellido_paterno, '')) AS alumno_nombre,
          al.numero_matricula AS alumno_numero_matricula,
          cur.nombre AS curso_nombre,
          cur.codigo AS curso_codigo
        FROM calificaciones c
        LEFT JOIN alumnos al ON al.id = c.alumno_id
        LEFT JOIN cursos cur ON cur.id = c.curso_id
        WHERE al.padre_id = ?
        LIMIT 100
      `, [usuarioId]);
    } else if (rol === 'docente') {
      const profesorId = await getProfesorIdPorUsuario(usuarioId);
      if (profesorId) {
        calificaciones = await getAll(`
          SELECT DISTINCT
            c.*,
            TRIM(COALESCE(al.primer_nombre, '') || ' ' || COALESCE(al.apellido_paterno, '')) AS alumno_nombre,
            al.numero_matricula AS alumno_numero_matricula,
            cur.nombre AS curso_nombre,
            cur.codigo AS curso_codigo
          FROM calificaciones c
          LEFT JOIN alumnos al ON al.id = c.alumno_id
          LEFT JOIN cursos cur ON cur.id = c.curso_id
          INNER JOIN matriculas m ON m.alumno_id = al.id
          WHERE cur.profesor_id = ?
          LIMIT 100
        `, [profesorId]);
      }
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
          LIMIT 100
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
          LIMIT 100
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
  } catch (error) {
    console.error('Error creating alumno:', error);
    res.status(500).json(respuestaError('Error al crear alumno: ' + error.message));
  }
}));

// PUT ALUMNOS
app.put('/api/alumnos/:id', authMiddleware, requireRole(['administrativo', 'director']), asyncHandler(async (req, res) => {
  const { apellido_paterno, primer_nombre, email_contacto, telefono, estado } = req.body;
  try {
    await runQuery(
      `UPDATE alumnos SET apellido_paterno = ?, primer_nombre = ?, email_contacto = ?, telefono = ?, estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [apellido_paterno, primer_nombre, email_contacto, telefono, estado, req.params.id]
    );
    res.json(respuestaExito({}, 'Alumno actualizado exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar alumno'));
  }
}));

// DELETE ALUMNOS (marcar como inactivo)
app.delete('/api/alumnos/:id', authMiddleware, requireRole(['administrativo', 'director']), asyncHandler(async (req, res) => {
  try {
    await runQuery('UPDATE alumnos SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?', ['inactivo', req.params.id]);
    res.json(respuestaExito({}, 'Alumno desactivado'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar alumno'));
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
    await runQuery(
      `INSERT INTO cursos (id, nombre, codigo, grado, seccion, profesor_id, salon, capacidad, horario_inicio, horario_fin, estado, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, nombre, codigo, grado, seccion || 'A', profesor_id, salon || null, capacidad || 40, horario_inicio || null, horario_fin || null, estado || 'activo']
    );
    res.status(201).json(respuestaExito({ id }, 'Curso creado exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al crear curso'));
  }
}));

// PUT CURSOS
app.put('/api/cursos/:id', authMiddleware, requireRole(['director', 'administrativo']), asyncHandler(async (req, res) => {
  const { nombre, codigo, grado, capacidad } = req.body;
  try {
    await runQuery(
      `UPDATE cursos SET nombre = ?, codigo = ?, grado = ?, capacidad = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
      [nombre, codigo, grado, capacidad, req.params.id]
    );
    res.json(respuestaExito({}, 'Curso actualizado exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar curso'));
  }
}));

// POST PROFESORES
app.post('/api/profesores', authMiddleware, requireRole(['director']), asyncHandler(async (req, res) => {
  const { usuario_id, numero_empleado, apellido_paterno, primer_nombre, especialidad, email_contacto, telefono, numero_documento, estado } = req.body;
  const id = generarId();
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
  } catch (error) {
    await runQuery('ROLLBACK').catch(() => {});
    res.status(500).json(respuestaError('Error al crear profesor'));
  }
}));

// PUT PROFESORES
app.put('/api/profesores/:id', authMiddleware, requireRole(['director']), asyncHandler(async (req, res) => {
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
        req.params.id
      ]
    );
    res.json(respuestaExito({}, 'Profesor actualizado exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar profesor'));
  }
}));

// POST PAGOS
app.post('/api/pagos', authMiddleware, asyncHandler(async (req, res) => {
  const { alumno_id, monto, concepto, estado_pago, estado, fecha_pago, metodo_pago, observaciones, periodo_academico, fecha_vencimiento, referencia_pago, numero_comprobante } = req.body;
  const id = generarId();
  try {
    await runQuery(
      `INSERT INTO pagos (id, alumno_id, monto, concepto, periodo_academico, estado_pago, estado, fecha_vencimiento, fecha_pago, metodo_pago, referencia_pago, numero_comprobante, deuda_pendiente, observaciones, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        id,
        alumno_id,
        monto,
        concepto,
        periodo_academico || PERIODO_ACADEMICO_DEFECTO,
        estado_pago || estado || 'pendiente',
        estado || estado_pago || 'pendiente',
        fecha_vencimiento || null,
        fecha_pago || null,
        metodo_pago || null,
        referencia_pago || null,
        numero_comprobante || null,
        (estado_pago || estado || 'pendiente') !== 'pagado' ? 1 : 0,
        observaciones || null
      ]
    );
    res.status(201).json(respuestaExito({ id }, 'Pago registrado exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al registrar pago'));
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
  } catch (error) {
    res.status(500).json(respuestaError('Error al registrar asistencia: ' + error.message));
  }
}));

// POST CALIFICACIONES
app.post('/api/calificaciones', authMiddleware, requireRole(['docente', 'director', 'administrativo']), asyncHandler(async (req, res) => {
  const { alumno_id, curso_id, nota, periodo, observaciones } = req.body;
  const id = generarId();

  if (!alumno_id || !curso_id || nota === undefined || nota === null) {
    return res.status(400).json(respuestaError('Faltan campos requeridos: alumno_id, curso_id, nota'));
  }

  try {
    await runQuery(
      `INSERT INTO calificaciones (id, alumno_id, curso_id, nota, periodo, observaciones, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, alumno_id, curso_id, nota, periodo || '1', observaciones || null]
    );
    res.status(201).json(respuestaExito({ id }, 'Calificación registrada exitosamente'));
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
  } catch (error) {
    res.status(500).json(respuestaError('Error al crear notificación: ' + error.message));
  }
}));

// PUT ASISTENCIAS
app.put('/api/asistencia/:id', authMiddleware, requireRole(['docente', 'director', 'administrativo']), asyncHandler(async (req, res) => {
  const { alumno_id, curso_id, fecha, estado, registrada, motivo_falta } = req.body;
  try {
    await runQuery(
      `UPDATE asistencias
       SET alumno_id = ?, curso_id = ?, fecha = ?, estado = ?, registrada = ?, motivo_falta = ?, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [alumno_id, curso_id, fecha, estado || 'PRESENTE', registrada ? 1 : 0, motivo_falta || null, req.params.id]
    );
    res.json(respuestaExito({}, 'Asistencia actualizada exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar asistencia: ' + error.message));
  }
}));

// DELETE ASISTENCIAS
app.delete('/api/asistencia/:id', authMiddleware, requireRole(['docente', 'director', 'administrativo']), asyncHandler(async (req, res) => {
  try {
    await runQuery('DELETE FROM asistencias WHERE id = ?', [req.params.id]);
    res.json(respuestaExito({}, 'Asistencia eliminada exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar asistencia: ' + error.message));
  }
}));

// PUT CALIFICACIONES
app.put('/api/calificaciones/:id', authMiddleware, requireRole(['docente', 'director', 'administrativo']), asyncHandler(async (req, res) => {
  const { alumno_id, curso_id, nota, periodo, observaciones } = req.body;
  try {
    await runQuery(
      `UPDATE calificaciones
       SET alumno_id = ?, curso_id = ?, nota = ?, periodo = ?, observaciones = ?, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [alumno_id, curso_id, nota, periodo || '1', observaciones || null, req.params.id]
    );
    res.json(respuestaExito({}, 'Calificación actualizada exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar calificación: ' + error.message));
  }
}));

// DELETE CALIFICACIONES
app.delete('/api/calificaciones/:id', authMiddleware, requireRole(['docente', 'director', 'administrativo']), asyncHandler(async (req, res) => {
  try {
    await runQuery('DELETE FROM calificaciones WHERE id = ?', [req.params.id]);
    res.json(respuestaExito({}, 'Calificación eliminada exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar calificación: ' + error.message));
  }
}));

// PUT NOTIFICACIONES
app.put('/api/notificaciones/:id', authMiddleware, requireRole(['administrativo', 'director', 'docente']), asyncHandler(async (req, res) => {
  const { destinatario_id, tipo, mensaje, leida, fecha_lectura } = req.body;
  try {
    await runQuery(
      `UPDATE notificaciones
       SET destinatario_id = ?, tipo = ?, mensaje = ?, leida = ?, fecha_lectura = ?
       WHERE id = ?`,
      [destinatario_id, tipo || 'informacion', mensaje, leida ? 1 : 0, fecha_lectura || null, req.params.id]
    );
    res.json(respuestaExito({}, 'Notificación actualizada exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar notificación: ' + error.message));
  }
}));

// DELETE NOTIFICACIONES
app.delete('/api/notificaciones/:id', authMiddleware, requireRole(['administrativo', 'director', 'docente']), asyncHandler(async (req, res) => {
  try {
    await runQuery('DELETE FROM notificaciones WHERE id = ?', [req.params.id]);
    res.json(respuestaExito({}, 'Notificación eliminada exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al eliminar notificación: ' + error.message));
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

// Servir archivo HTML de inicio
app.get('/', (req, res) => {
  const publicIndexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(publicIndexPath)) {
    return res.sendFile(publicIndexPath);
  }

  res.json({
    status: 'OK',
    message: 'API Gateway en ejecución'
  });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use((req, res) => {
  res.status(404).json(respuestaError('Ruta no encontrada', 'NOT_FOUND'));
});

app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================

const iniciarGateway = async () => {
  try {
    await initDatabase();
    console.log('✓ Base de datos inicializada');

    app.listen(GATEWAY_PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║  🚀 API GATEWAY - SISTEMA SOA FUTURO DIGITAL  🚀 ║
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
