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
  asistencia: process.env.ASISTENCIA_SERVICE_URL || 'http://localhost:3007'
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
// RUTAS PROTEGIDAS - Proxy a Servicios
// ============================================

// Proxy genérico para servicios
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
