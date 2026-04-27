require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { errorHandler, asyncHandler } = require('../../api-gateway/middleware/errorHandler');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validadores } = require('../../shared/validators');

const app = express();
const PORT = process.env.NOTIFICACIONES_SERVICE_PORT || 3006;

app.use(cors());
app.use(express.json());

// ============================================
// ENDPOINTS: NOTIFICACIONES
// ============================================

// GET todas las notificaciones (con paginación)
app.get('/notificaciones', asyncHandler(async (req, res) => {
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const notificaciones = await getAll(
    `SELECT * FROM notificaciones
     ORDER BY fecha_creacion DESC
     LIMIT ? OFFSET ?`,
    [limite, offset]
  );

  const totalResult = await getOne('SELECT COUNT(*) as total FROM notificaciones');

  res.json(respuestaExito({
    notificaciones,
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Notificaciones obtenidas'));
}));

// GET notificación por ID
app.get('/notificaciones/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const notificacion = await getOne('SELECT * FROM notificaciones WHERE id = ?', [id]);

  if (!notificacion) {
    return res.status(404).json(respuestaError('Notificación no encontrada', 'NOT_FOUND'));
  }

  res.json(respuestaExito(notificacion, 'Notificación obtenida'));
}));

// POST crear notificación
app.post('/notificaciones', asyncHandler(async (req, res) => {
  const { usuario_id, tipo, asunto, mensaje, destinatario, evento_generador } = req.body;

  if (!usuario_id || !tipo || !asunto || !mensaje) {
    return res.status(400).json(respuestaError('Datos incompletos requeridos', 'MISSING_DATA'));
  }

  if (!['email', 'sms', 'app'].includes(tipo)) {
    return res.status(400).json(respuestaError('Tipo de notificación inválido', 'INVALID_TYPE'));
  }

  const notificacionId = generarId();

  await runQuery(
    `INSERT INTO notificaciones (id, usuario_id, tipo, asunto, mensaje, estado, destinatario, evento_generador)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [notificacionId, usuario_id, tipo, asunto, mensaje, 'pendiente', destinatario || null, evento_generador || null]
  );

  res.status(201).json(respuestaExito(
    {
      id: notificacionId,
      usuario_id,
      tipo,
      asunto,
      estado: 'pendiente'
    },
    'Notificación creada exitosamente',
    'NOTIFICACION_CREATED'
  ));
}));

// PUT actualizar notificación
app.put('/notificaciones/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const notificacion = await getOne('SELECT * FROM notificaciones WHERE id = ?', [id]);

  if (!notificacion) {
    return res.status(404).json(respuestaError('Notificación no encontrada', 'NOT_FOUND'));
  }

  const campos = [];
  const valores = [];

  for (const [clave, valor] of Object.entries(req.body)) {
    if (valor !== undefined && clave !== 'id') {
      campos.push(`${clave} = ?`);
      valores.push(valor);
    }
  }

  if (campos.length === 0) {
    return res.status(400).json(respuestaError('No hay campos para actualizar'));
  }

  // Si se actualiza el estado a leido, registrar fecha
  if (req.body.estado === 'leido') {
    campos.push('fecha_actualizacion = CURRENT_TIMESTAMP');
  }

  valores.push(id);
  const query = `UPDATE notificaciones SET ${campos.join(', ')} WHERE id = ?`;

  await runQuery(query, valores);

  const notificacionActualizada = await getOne('SELECT * FROM notificaciones WHERE id = ?', [id]);

  res.json(respuestaExito(notificacionActualizada, 'Notificación actualizada', 'NOTIFICACION_UPDATED'));
}));

// GET notificaciones por usuario
app.get('/notificaciones-usuario/:usuario_id', asyncHandler(async (req, res) => {
  const { usuario_id } = req.params;
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const notificaciones = await getAll(
    `SELECT * FROM notificaciones
     WHERE usuario_id = ?
     ORDER BY fecha_creacion DESC
     LIMIT ? OFFSET ?`,
    [usuario_id, limite, offset]
  );

  const totalResult = await getOne(
    'SELECT COUNT(*) as total FROM notificaciones WHERE usuario_id = ?',
    [usuario_id]
  );

  const noLeidas = notificaciones.filter(n => n.estado !== 'leido').length;

  res.json(respuestaExito({
    notificaciones,
    resumen: {
      total: totalResult.total,
      no_leidas: noLeidas
    },
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Notificaciones del usuario obtenidas'));
}));

// POST enviar notificación de inasistencia (RN-006)
app.post('/notificaciones/inasistencia', asyncHandler(async (req, res) => {
  const { alumno_id, padre_id, motivo, fecha } = req.body;

  if (!alumno_id || !padre_id) {
    return res.status(400).json(respuestaError('Datos incompletos requeridos', 'MISSING_DATA'));
  }

  const alumno = await getOne('SELECT primer_nombre, apellido_paterno FROM alumnos WHERE id = ?', [alumno_id]);
  const padre = await getOne('SELECT nombre, email FROM usuarios WHERE id = ?', [padre_id]);

  if (!alumno || !padre) {
    return res.status(404).json(respuestaError('Alumno o padre no encontrado', 'NOT_FOUND'));
  }

  const asunto = `Notificación de inasistencia - ${alumno.primer_nombre} ${alumno.apellido_paterno}`;
  const mensaje = `
    <h2>Notificación de Inasistencia</h2>
    <p>Le informamos que su hijo/a <strong>${alumno.primer_nombre} ${alumno.apellido_paterno}</strong>
    registró una inasistencia el día <strong>${fecha}</strong>.</p>
    <p><strong>Motivo:</strong> ${motivo || 'No especificado'}</p>
    <p>Por favor, contacte con la institución si considera que esto es un error.</p>
  `;

  const notificacionId = generarId();

  await runQuery(
    `INSERT INTO notificaciones (id, usuario_id, tipo, asunto, mensaje, estado, destinatario, evento_generador)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [notificacionId, padre_id, 'email', asunto, mensaje, 'enviado', padre.email, 'inasistencia']
  );

  res.status(201).json(respuestaExito(
    { id: notificacionId, estado: 'enviado', destinatario: padre.email },
    'Notificación de inasistencia enviada',
    'INASISTENCIA_NOTIFICACION_SENT'
  ));
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'notificaciones-service', port: PORT });
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

const iniciarServicio = async () => {
  try {
    await initDatabase();
    console.log('✓ Base de datos inicializada');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║  📧 SERVICIO DE NOTIFICACIONES          📧 ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/notificaciones ║
║  Validaciones: RN-006, RN-007              ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Error al iniciar el servicio:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  iniciarServicio();
}

module.exports = app;
