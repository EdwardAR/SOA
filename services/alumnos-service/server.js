require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { authMiddleware, requireRole } = require('../../api-gateway/middleware/auth');
const { errorHandler, asyncHandler } = require('../../api-gateway/middleware/errorHandler');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validarAlumno, validadores } = require('../../shared/validators');

const app = express();
const PORT = process.env.ALUMNOS_SERVICE_PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// ============================================
// ENDPOINTS: ALUMNOS
// ============================================

// GET todos los alumnos (con paginación)
app.get('/alumnos', asyncHandler(async (req, res) => {
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const alumnos = await getAll(
    `SELECT a.*, u.nombre, u.email FROM alumnos a
     JOIN usuarios u ON a.usuario_id = u.id
     LIMIT ? OFFSET ?`,
    [limite, offset]
  );

  const totalResult = await getOne('SELECT COUNT(*) as total FROM alumnos');
  const total = totalResult.total;

  res.json(respuestaExito({
    alumnos,
    paginacion: {
      pagina,
      limite,
      total,
      total_paginas: Math.ceil(total / limite)
    }
  }, 'Alumnos obtenidos'));
}));

// GET alumno por ID
app.get('/alumnos/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido'));
  }

  const alumno = await getOne(
    `SELECT a.*, u.nombre, u.email FROM alumnos a
     JOIN usuarios u ON a.usuario_id = u.id
     WHERE a.id = ?`,
    [id]
  );

  if (!alumno) {
    return res.status(404).json(respuestaError('Alumno no encontrado', 'NOT_FOUND'));
  }

  res.json(respuestaExito(alumno, 'Alumno obtenido'));
}));

// POST crear nuevo alumno
app.post('/alumnos', asyncHandler(async (req, res) => {
  const alumnoData = req.body;

  // Validar datos
  const validacion = validarAlumno(alumnoData);
  if (!validacion.valido) {
    return res.status(400).json(respuestaError('Datos inválidos', 'VALIDATION_ERROR', validacion.errores));
  }

  // Verificar si el usuario ya existe
  if (alumnoData.numero_documento) {
    const existente = await getOne(
      'SELECT id FROM alumnos WHERE numero_documento = ?',
      [alumnoData.numero_documento]
    );

    if (existente) {
      return res.status(409).json(respuestaError('Ya existe un alumno con este número de documento', 'DUPLICATE_DOCUMENT'));
    }
  }

  const alumnoId = generarId();
  const usuarioId = alumnoData.usuario_id || generarId();

  try {
    await runQuery(
      `INSERT INTO alumnos (id, usuario_id, numero_matricula, apellido_paterno, apellido_materno,
       primer_nombre, segundo_nombre, numero_documento, genero, direccion, telefono, email_contacto,
       padre_id, datos_completos, deuda_pendiente, periodo_academico)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [alumnoId, usuarioId, alumnoData.numero_matricula, alumnoData.apellido_paterno,
       alumnoData.apellido_materno || null, alumnoData.primer_nombre, alumnoData.segundo_nombre || null,
       alumnoData.numero_documento, alumnoData.genero || null, alumnoData.direccion || null,
       alumnoData.telefono || null, alumnoData.email_contacto || null, alumnoData.padre_id || null,
       alumnoData.datos_completos || true, false, alumnoData.periodo_academico || '2024-1']
    );

    res.status(201).json(respuestaExito(
      { id: alumnoId, ...alumnoData },
      'Alumno creado exitosamente',
      'ALUMNO_CREATED'
    ));
  } catch (error) {
    res.status(400).json(respuestaError('Error al crear alumno', 'CREATE_ERROR', error.message));
  }
}));

// PUT actualizar alumno
app.put('/alumnos/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const actualizaciones = req.body;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido'));
  }

  const alumno = await getOne('SELECT id FROM alumnos WHERE id = ?', [id]);

  if (!alumno) {
    return res.status(404).json(respuestaError('Alumno no encontrado', 'NOT_FOUND'));
  }

  // Construir query de actualización dinámicamente
  const campos = [];
  const valores = [];

  for (const [clave, valor] of Object.entries(actualizaciones)) {
    if (valor !== undefined && clave !== 'id') {
      campos.push(`${clave} = ?`);
      valores.push(valor);
    }
  }

  if (campos.length === 0) {
    return res.status(400).json(respuestaError('No hay campos para actualizar'));
  }

  valores.push(id);

  const query = `UPDATE alumnos SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`;

  await runQuery(query, valores);

  const alumnoActualizado = await getOne('SELECT * FROM alumnos WHERE id = ?', [id]);

  res.json(respuestaExito(alumnoActualizado, 'Alumno actualizado', 'ALUMNO_UPDATED'));
}));

// DELETE alumno
app.delete('/alumnos/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido'));
  }

  const alumno = await getOne('SELECT id FROM alumnos WHERE id = ?', [id]);

  if (!alumno) {
    return res.status(404).json(respuestaError('Alumno no encontrado', 'NOT_FOUND'));
  }

  // Cambiar estado a inactivo en lugar de eliminar
  await runQuery('UPDATE alumnos SET estado = ? WHERE id = ?', ['inactivo', id]);

  res.json(respuestaExito(null, 'Alumno eliminado', 'ALUMNO_DELETED'));
}));

// GET alumnos por padre (RN-005: Acceso restringido a padres)
app.get('/alumnos-por-padre/:padre_id', asyncHandler(async (req, res) => {
  const { padre_id } = req.params;

  const alumnos = await getAll(
    'SELECT id, numero_matricula, primer_nombre, apellido_paterno FROM alumnos WHERE padre_id = ?',
    [padre_id]
  );

  res.json(respuestaExito(alumnos, 'Alumnos del padre obtenidos'));
}));

// GET verificar deuda del alumno (RN-004, RN-005)
app.get('/alumnos/:id/deuda', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const alumno = await getOne(
    'SELECT deuda_pendiente, monto_deuda FROM alumnos WHERE id = ?',
    [id]
  );

  if (!alumno) {
    return res.status(404).json(respuestaError('Alumno no encontrado'));
  }

  res.json(respuestaExito({
    tiene_deuda: alumno.deuda_pendiente,
    monto_deuda: alumno.monto_deuda
  }));
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'alumnos-service', port: PORT });
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
║  🎓 SERVICIO DE ALUMNOS                 🎓 ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/alumnos  ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Error al iniciar el servicio:', error);
    process.exit(1);
  }
};

// Iniciar si se ejecuta directamente
if (require.main === module) {
  iniciarServicio();
}

module.exports = app;
