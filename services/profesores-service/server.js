require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { errorHandler, asyncHandler } = require('../../api-gateway/middleware/errorHandler');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validarProfesor, validadores } = require('../../shared/validators');

const app = express();
const PORT = process.env.PROFESORES_SERVICE_PORT || 3003;

// Middlewares
app.use(cors());
app.use(express.json());

// ============================================
// ENDPOINTS: PROFESORES
// ============================================

// GET todos los profesores (con paginación)
app.get('/profesores', asyncHandler(async (req, res) => {
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const profesores = await getAll(
    `SELECT p.*, u.nombre, u.email FROM profesores p
     JOIN usuarios u ON p.usuario_id = u.id
     LIMIT ? OFFSET ?`,
    [limite, offset]
  );

  const totalResult = await getOne('SELECT COUNT(*) as total FROM profesores');
  const total = totalResult.total;

  res.json(respuestaExito({
    profesores,
    paginacion: {
      pagina,
      limite,
      total,
      total_paginas: Math.ceil(total / limite)
    }
  }, 'Profesores obtenidos'));
}));

// GET profesor por ID
app.get('/profesores/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const profesor = await getOne(
    `SELECT p.*, u.nombre, u.email FROM profesores p
     JOIN usuarios u ON p.usuario_id = u.id
     WHERE p.id = ?`,
    [id]
  );

  if (!profesor) {
    return res.status(404).json(respuestaError('Profesor no encontrado', 'NOT_FOUND'));
  }

  // Obtener cursos asignados
  const cursos = await getAll(
    'SELECT id, codigo, nombre FROM cursos WHERE profesor_id = ?',
    [id]
  );

  res.json(respuestaExito({ ...profesor, cursos }, 'Profesor obtenido'));
}));

// POST crear nuevo profesor
app.post('/profesores', asyncHandler(async (req, res) => {
  const profesorData = req.body;

  // RN-007: Validar datos obligatorios
  const validacion = validarProfesor(profesorData);
  if (!validacion.valido) {
    return res.status(400).json(respuestaError('Datos inválidos', 'VALIDATION_ERROR', validacion.errores));
  }

  // Verificar si el profesor ya existe por documento
  if (profesorData.numero_documento) {
    const existente = await getOne(
      'SELECT id FROM profesores WHERE numero_documento = ?',
      [profesorData.numero_documento]
    );

    if (existente) {
      return res.status(409).json(respuestaError('Ya existe un profesor con este número de documento', 'DUPLICATE_DOCUMENT'));
    }
  }

  const profesorId = generarId();
  const usuarioId = profesorData.usuario_id || generarId();

  try {
    await runQuery(
      `INSERT INTO profesores (id, usuario_id, apellido_paterno, apellido_materno,
       primer_nombre, segundo_nombre, numero_documento, especialidad, telefono, fecha_contratacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [profesorId, usuarioId, profesorData.apellido_paterno,
       profesorData.apellido_materno || null, profesorData.primer_nombre,
       profesorData.segundo_nombre || null, profesorData.numero_documento,
       profesorData.especialidad || null, profesorData.telefono || null,
       profesorData.fecha_contratacion || null]
    );

    res.status(201).json(respuestaExito(
      { id: profesorId, ...profesorData },
      'Profesor creado exitosamente',
      'PROFESOR_CREATED'
    ));
  } catch (error) {
    res.status(400).json(respuestaError('Error al crear profesor', 'CREATE_ERROR', error.message));
  }
}));

// PUT actualizar profesor
app.put('/profesores/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const actualizaciones = req.body;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const profesor = await getOne('SELECT id FROM profesores WHERE id = ?', [id]);

  if (!profesor) {
    return res.status(404).json(respuestaError('Profesor no encontrado', 'NOT_FOUND'));
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
    return res.status(400).json(respuestaError('No hay campos para actualizar', 'NO_FIELDS'));
  }

  valores.push(id);

  const query = `UPDATE profesores SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`;

  await runQuery(query, valores);

  const profesorActualizado = await getOne('SELECT * FROM profesores WHERE id = ?', [id]);

  res.json(respuestaExito(profesorActualizado, 'Profesor actualizado', 'PROFESOR_UPDATED'));
}));

// DELETE profesor (cambiar estado a inactivo)
app.delete('/profesores/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const profesor = await getOne('SELECT id FROM profesores WHERE id = ?', [id]);

  if (!profesor) {
    return res.status(404).json(respuestaError('Profesor no encontrado', 'NOT_FOUND'));
  }

  await runQuery('UPDATE profesores SET estado = ? WHERE id = ?', ['inactivo', id]);

  res.json(respuestaExito(null, 'Profesor eliminado', 'PROFESOR_DELETED'));
}));

// GET profesores activos
app.get('/profesores-activos/lista/todos', asyncHandler(async (req, res) => {
  const profesores = await getAll(
    `SELECT p.id, p.primer_nombre, p.apellido_paterno, p.especialidad, u.email 
     FROM profesores p
     JOIN usuarios u ON p.usuario_id = u.id
     WHERE p.estado = 'activo'
     ORDER BY p.apellido_paterno ASC`
  );

  res.json(respuestaExito(profesores, 'Profesores activos obtenidos'));
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'profesores-service', port: PORT });
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
║  👨‍🏫 SERVICIO DE PROFESORES                👨‍🏫 ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/profesores ║
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
