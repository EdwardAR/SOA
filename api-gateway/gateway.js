require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcryptjs = require('bcryptjs');
const { initDatabase, getDatabase, getOne, runQuery } = require('../config/database');
const { authMiddleware, requireRole, generarToken } = require('./middleware/auth');
const { errorHandler, asyncHandler } = require('./middleware/errorHandler');
const { respuestaExito, respuestaError, generarId } = require('../shared/utils');
const { validadores } = require('../shared/validators');

const app = express();
const GATEWAY_PORT = process.env.GATEWAY_PORT || 3000;

// Configuración de CORS
const corsOptions = {
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    const alumnos = await getAll('SELECT * FROM alumnos LIMIT 100');
    res.json(respuestaExito(alumnos, 'Alumnos obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener alumnos'));
  }
}));

app.get('/api/alumnos/:id', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const alumno = await getOne('SELECT * FROM alumnos WHERE id = ?', [req.params.id]);
    if (!alumno) return res.status(404).json(respuestaError('Alumno no encontrado'));
    res.json(respuestaExito(alumno));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener alumno'));
  }
}));

// CURSOS desde BD
app.get('/api/cursos', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const cursos = await getAll('SELECT * FROM cursos LIMIT 100');
    res.json(respuestaExito(cursos, 'Cursos obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener cursos'));
  }
}));

app.get('/api/cursos/:id', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const curso = await getOne('SELECT * FROM cursos WHERE id = ?', [req.params.id]);
    if (!curso) return res.status(404).json(respuestaError('Curso no encontrado'));
    res.json(respuestaExito(curso));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener curso'));
  }
}));

// PROFESORES desde BD
app.get('/api/profesores', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const profesores = await getAll('SELECT * FROM profesores LIMIT 100');
    res.json(respuestaExito(profesores, 'Profesores obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener profesores'));
  }
}));

app.get('/api/profesores/:id', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const profesor = await getOne('SELECT * FROM profesores WHERE id = ?', [req.params.id]);
    if (!profesor) return res.status(404).json(respuestaError('Profesor no encontrado'));
    res.json(respuestaExito(profesor));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener profesor'));
  }
}));

// MATRÍCULAS desde BD
app.get('/api/matriculas', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const matriculas = await getAll('SELECT * FROM matriculas LIMIT 100');
    res.json(respuestaExito(matriculas, 'Matrículas obtenidas'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener matrículas'));
  }
}));

// PAGOS desde BD
app.get('/api/pagos', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const pagos = await getAll('SELECT * FROM pagos LIMIT 100');
    res.json(respuestaExito(pagos, 'Pagos obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener pagos'));
  }
}));

// ASISTENCIA desde BD
app.get('/api/asistencia', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const asistencia = await getAll('SELECT * FROM asistencia LIMIT 100');
    res.json(respuestaExito(asistencia, 'Registros de asistencia obtenidos'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener asistencia'));
  }
}));

// CALIFICACIONES desde BD
app.get('/api/calificaciones', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const calificaciones = await getAll('SELECT * FROM calificaciones LIMIT 100');
    res.json(respuestaExito(calificaciones, 'Calificaciones obtenidas'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener calificaciones'));
  }
}));

// NOTIFICACIONES desde BD
app.get('/api/notificaciones', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const notificaciones = await getAll('SELECT * FROM notificaciones LIMIT 100');
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
  const { usuario_id, numero_matricula, apellido_paterno, primer_nombre, email_contacto, telefono, estado, numero_documento } = req.body;
  const id = generarId();
  
  if (!numero_matricula || !apellido_paterno || !primer_nombre) {
    return res.status(400).json(respuestaError('Faltan campos requeridos: numero_matricula, apellido_paterno, primer_nombre'));
  }
  
  try {
    await runQuery(
      `INSERT INTO alumnos (id, usuario_id, numero_matricula, apellido_paterno, primer_nombre, email_contacto, telefono, numero_documento, estado, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, usuario_id || null, numero_matricula, apellido_paterno, primer_nombre, email_contacto || null, telefono || null, numero_documento || null, estado || 'activo']
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
  const { nombre, codigo, grado, capacidad } = req.body;
  const id = generarId();
  try {
    await runQuery(
      `INSERT INTO cursos (id, nombre, codigo, grado, capacidad, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, nombre, codigo, grado, capacidad || 40]
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
  const { usuario_id, numero_empleado, apellido_paterno, primer_nombre, especialidad, email_contacto, telefono } = req.body;
  const id = generarId();
  try {
    await runQuery(
      `INSERT INTO profesores (id, usuario_id, numero_empleado, apellido_paterno, primer_nombre, especialidad, email_contacto, telefono, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, usuario_id, numero_empleado, apellido_paterno, primer_nombre, especialidad, email_contacto, telefono]
    );
    res.status(201).json(respuestaExito({ id }, 'Profesor creado exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al crear profesor'));
  }
}));

// PUT PROFESORES
app.put('/api/profesores/:id', authMiddleware, requireRole(['director']), asyncHandler(async (req, res) => {
  const { apellido_paterno, primer_nombre, especialidad, email_contacto, telefono } = req.body;
  try {
    await runQuery(
      `UPDATE profesores SET apellido_paterno = ?, primer_nombre = ?, especialidad = ?, email_contacto = ?, telefono = ?, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [apellido_paterno, primer_nombre, especialidad, email_contacto, telefono, req.params.id]
    );
    res.json(respuestaExito({}, 'Profesor actualizado exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar profesor'));
  }
}));

// POST PAGOS
app.post('/api/pagos', authMiddleware, asyncHandler(async (req, res) => {
  const { alumno_id, monto, concepto, estado_pago } = req.body;
  const id = generarId();
  try {
    await runQuery(
      `INSERT INTO pagos (id, alumno_id, monto, concepto, estado_pago, fecha_pago, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, alumno_id, monto, concepto, estado_pago || 'pendiente']
    );
    res.status(201).json(respuestaExito({ id }, 'Pago registrado exitosamente'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al registrar pago'));
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

// Servir archivo HTML de inicio
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
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
