require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { errorHandler, asyncHandler } = require('../../api-gateway/middleware/errorHandler');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validadores } = require('../../shared/validators');

const app = express();
const PORT = process.env.ASISTENCIA_SERVICE_PORT || 3007;

app.use(cors());
app.use(express.json());

// ============================================
// ENDPOINTS: ASISTENCIA
// ============================================

// GET todas las asistencias (con paginación)
app.get('/asistencia', asyncHandler(async (req, res) => {
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const asistencias = await getAll(
    `SELECT a.*, al.primer_nombre, al.apellido_paterno, c.nombre as curso_nombre
     FROM asistencias a
     JOIN alumnos al ON a.alumno_id = al.id
     JOIN cursos c ON a.curso_id = c.id
     ORDER BY a.fecha DESC
     LIMIT ? OFFSET ?`,
    [limite, offset]
  );

  const totalResult = await getOne('SELECT COUNT(*) as total FROM asistencias');

  res.json(respuestaExito({
    asistencias,
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Asistencias obtenidas'));
}));

// GET asistencia por ID
app.get('/asistencia/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const asistencia = await getOne(
    `SELECT a.*, al.primer_nombre, al.apellido_paterno, c.nombre as curso_nombre
     FROM asistencias a
     JOIN alumnos al ON a.alumno_id = al.id
     JOIN cursos c ON a.curso_id = c.id
     WHERE a.id = ?`,
    [id]
  );

  if (!asistencia) {
    return res.status(404).json(respuestaError('Asistencia no encontrada', 'NOT_FOUND'));
  }

  res.json(respuestaExito(asistencia, 'Asistencia obtenida'));
}));

// POST registrar asistencia (RN-003, RN-006)
app.post('/asistencia', asyncHandler(async (req, res) => {
  const { alumno_id, curso_id, fecha, estado, motivo_falta } = req.body;

  // Validar datos obligatorios (RN-007)
  if (!alumno_id || !curso_id || !fecha || !estado) {
    return res.status(400).json(respuestaError('Datos incompletos requeridos', 'MISSING_DATA'));
  }

  if (!validadores.esEstadoAsistenciaValido(estado)) {
    return res.status(400).json(respuestaError('Estado de asistencia inválido', 'INVALID_STATE'));
  }

  if (!validadores.esFechaValida(fecha)) {
    return res.status(400).json(respuestaError('Fecha inválida', 'INVALID_DATE'));
  }

  // RN-003: Verificar si ya existe registro para ese día
  const existente = await getOne(
    'SELECT id FROM asistencias WHERE alumno_id = ? AND curso_id = ? AND fecha = ?',
    [alumno_id, curso_id, fecha]
  );

  if (existente) {
    return res.status(409).json(respuestaError(
      'Ya existe un registro de asistencia para este día',
      'ATTENDANCE_EXISTS'
    ));
  }

  const asistenciaId = generarId();

  await runQuery(
    `INSERT INTO asistencias (id, alumno_id, curso_id, fecha, estado, registrada, motivo_falta)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [asistenciaId, alumno_id, curso_id, fecha, estado, true, motivo_falta || null]
  );

  // RN-006: Si es FALTA, enviar notificación automática a padre
  if (estado === 'FALTA') {
    try {
      const alumno = await getOne('SELECT padre_id FROM alumnos WHERE id = ?', [alumno_id]);

      if (alumno && alumno.padre_id) {
        const urlNotificaciones = `${process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:3006'}/notificaciones/inasistencia`;

        await axios.post(urlNotificaciones, {
          alumno_id,
          padre_id: alumno.padre_id,
          motivo: motivo_falta || 'Falta sin justificar',
          fecha
        }).catch(err => console.error('Error al enviar notificación:', err.message));
      }
    } catch (error) {
      console.error('Error procesando notificación:', error.message);
    }
  }

  res.status(201).json(respuestaExito(
    { id: asistenciaId, alumno_id, curso_id, fecha, estado, registrada: true },
    'Asistencia registrada exitosamente',
    'ASISTENCIA_REGISTERED'
  ));
}));

// PUT actualizar asistencia
app.put('/asistencia/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const asistencia = await getOne('SELECT * FROM asistencias WHERE id = ?', [id]);

  if (!asistencia) {
    return res.status(404).json(respuestaError('Asistencia no encontrada', 'NOT_FOUND'));
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

  valores.push(id);
  const query = `UPDATE asistencias SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`;

  await runQuery(query, valores);

  const asistenciaActualizada = await getOne('SELECT * FROM asistencias WHERE id = ?', [id]);

  res.json(respuestaExito(asistenciaActualizada, 'Asistencia actualizada', 'ASISTENCIA_UPDATED'));
}));

// GET asistencias por alumno con estadísticas
app.get('/asistencia-alumno/:alumno_id', asyncHandler(async (req, res) => {
  const { alumno_id } = req.params;
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const asistencias = await getAll(
    `SELECT id, fecha, estado, motivo_falta FROM asistencias
     WHERE alumno_id = ?
     ORDER BY fecha DESC
     LIMIT ? OFFSET ?`,
    [alumno_id, limite, offset]
  );

  const allAsistencias = await getAll(
    'SELECT estado FROM asistencias WHERE alumno_id = ?',
    [alumno_id]
  );

  const totalResult = await getOne('SELECT COUNT(*) as total FROM asistencias WHERE alumno_id = ?', [alumno_id]);

  // Calcular estadísticas
  const presente = allAsistencias.filter(a => a.estado === 'PRESENTE').length;
  const falta = allAsistencias.filter(a => a.estado === 'FALTA').length;
  const justificado = allAsistencias.filter(a => a.estado === 'JUSTIFICADO').length;
  const porcentajeAsistencia = allAsistencias.length > 0 ?
    ((presente / allAsistencias.length) * 100).toFixed(2) : 0;

  res.json(respuestaExito({
    asistencias,
    estadisticas: {
      presente,
      falta,
      justificado,
      total: allAsistencias.length,
      porcentaje_asistencia: parseFloat(porcentajeAsistencia)
    },
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Asistencias del alumno obtenidas'));
}));

// GET asistencias por curso y fecha
app.get('/asistencia-curso/:curso_id', asyncHandler(async (req, res) => {
  const { curso_id } = req.params;
  const { fecha, pagina, limite, offset } = { ...req.query, ...obtenerParametrosPaginacion(req) };

  let query = `SELECT a.*, al.primer_nombre, al.apellido_paterno
               FROM asistencias a
               JOIN alumnos al ON a.alumno_id = al.id
               WHERE a.curso_id = ?`;
  const params = [curso_id];

  if (fecha) {
    if (!validadores.esFechaValida(fecha)) {
      return res.status(400).json(respuestaError('Fecha inválida', 'INVALID_DATE'));
    }
    query += ' AND a.fecha = ?';
    params.push(fecha);
  }

  query += ' ORDER BY al.apellido_paterno, al.primer_nombre LIMIT ? OFFSET ?';
  params.push(limite, offset);

  const asistencias = await getAll(query, params);

  let countQuery = 'SELECT COUNT(*) as total FROM asistencias WHERE curso_id = ?';
  const countParams = [curso_id];
  if (fecha) {
    countQuery += ' AND fecha = ?';
    countParams.push(fecha);
  }

  const totalResult = await getOne(countQuery, countParams);

  res.json(respuestaExito({
    asistencias,
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Asistencias del curso obtenidas'));
}));

// GET reporte de inasistencias (para notificaciones)
app.get('/reporte-inasistencias/:fecha', asyncHandler(async (req, res) => {
  const { fecha } = req.params;

  if (!validadores.esFechaValida(fecha)) {
    return res.status(400).json(respuestaError('Fecha inválida', 'INVALID_DATE'));
  }

  const inasistencias = await getAll(
    `SELECT a.*, al.primer_nombre, al.apellido_paterno, al.padre_id
     FROM asistencias a
     JOIN alumnos al ON a.alumno_id = al.id
     WHERE a.fecha = ? AND a.estado = 'FALTA'`,
    [fecha]
  );

  res.json(respuestaExito(inasistencias, `Inasistencias del ${fecha}`));
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'asistencia-service', port: PORT });
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
║  ✅ SERVICIO DE ASISTENCIA              ✅ ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/asistencia ║
║  Validaciones: RN-003, RN-006, RN-007      ║
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
