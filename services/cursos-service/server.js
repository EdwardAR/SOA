require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { errorHandler, asyncHandler } = require('../../api-gateway/middleware/errorHandler');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validarCurso, validadores } = require('../../shared/validators');

const app = express();
const PORT = process.env.CURSOS_SERVICE_PORT || 3004;

app.use(cors());
app.use(express.json());

// ============================================
// ENDPOINTS: CURSOS
// ============================================

// GET todos los cursos (con paginación)
app.get('/cursos', asyncHandler(async (req, res) => {
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const cursos = await getAll(
    `SELECT c.*, p.primer_nombre as profesor_nombre, p.apellido_paterno as profesor_apellido
     FROM cursos c
     LEFT JOIN profesores p ON c.profesor_id = p.id
     WHERE c.estado = 'activo'
     ORDER BY c.fecha_creacion DESC
     LIMIT ? OFFSET ?`,
    [limite, offset]
  );

  const totalResult = await getOne('SELECT COUNT(*) as total FROM cursos WHERE estado = ?', ['activo']);

  res.json(respuestaExito({
    cursos,
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Cursos obtenidos'));
}));

// GET curso por ID
app.get('/cursos/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const curso = await getOne(
    `SELECT c.*, p.primer_nombre as profesor_nombre, p.apellido_paterno as profesor_apellido
     FROM cursos c
     LEFT JOIN profesores p ON c.profesor_id = p.id
     WHERE c.id = ?`,
    [id]
  );

  if (!curso) {
    return res.status(404).json(respuestaError('Curso no encontrado', 'NOT_FOUND'));
  }

  res.json(respuestaExito(curso, 'Curso obtenido'));
}));

// POST crear nuevo curso
app.post('/cursos', asyncHandler(async (req, res) => {
  const validacion = validarCurso(req.body);
  if (!validacion.valido) {
    return res.status(400).json(respuestaError('Datos inválidos', 'VALIDATION_ERROR', validacion.errores));
  }

  // Verificar duplicado de código
  const existente = await getOne('SELECT id FROM cursos WHERE codigo = ?', [req.body.codigo]);
  if (existente) {
    return res.status(409).json(respuestaError('Ya existe un curso con este código', 'DUPLICATE_CODE'));
  }

  const cursoId = generarId();

  await runQuery(
    `INSERT INTO cursos (id, codigo, nombre, descripcion, grado_nivel, seccion,
     profesor_id, capacidad_maxima, aula_asignada, horario_inicio, horario_fin,
     periodo_academico, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cursoId, req.body.codigo, req.body.nombre, req.body.descripcion || null,
     req.body.grado_nivel, req.body.seccion || null, req.body.profesor_id,
     req.body.capacidad_maxima || 40, req.body.aula_asignada || null,
     req.body.horario_inicio || null, req.body.horario_fin || null,
     req.body.periodo_academico, 'activo']
  );

  res.status(201).json(respuestaExito(
    { id: cursoId, ...req.body },
    'Curso creado exitosamente',
    'CURSO_CREATED'
  ));
}));

// PUT actualizar curso
app.put('/cursos/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const curso = await getOne('SELECT id FROM cursos WHERE id = ?', [id]);
  if (!curso) {
    return res.status(404).json(respuestaError('Curso no encontrado', 'NOT_FOUND'));
  }

  // Validar código único si se está actualizando
  if (req.body.codigo) {
    const duplicado = await getOne('SELECT id FROM cursos WHERE codigo = ? AND id != ?', [req.body.codigo, id]);
    if (duplicado) {
      return res.status(409).json(respuestaError('Ya existe un curso con este código', 'DUPLICATE_CODE'));
    }
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
  const query = `UPDATE cursos SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`;

  await runQuery(query, valores);

  const cursoActualizado = await getOne('SELECT * FROM cursos WHERE id = ?', [id]);

  res.json(respuestaExito(cursoActualizado, 'Curso actualizado', 'CURSO_UPDATED'));
}));

// DELETE curso (soft delete)
app.delete('/cursos/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const curso = await getOne('SELECT id FROM cursos WHERE id = ?', [id]);
  if (!curso) {
    return res.status(404).json(respuestaError('Curso no encontrado', 'NOT_FOUND'));
  }

  await runQuery('UPDATE cursos SET estado = ? WHERE id = ?', ['cancelado', id]);

  res.json(respuestaExito(null, 'Curso eliminado', 'CURSO_DELETED'));
}));

// GET estudiantes en un curso
app.get('/cursos/:id/estudiantes', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const estudiantes = await getAll(
    `SELECT DISTINCT a.id, a.numero_matricula, a.primer_nombre, a.apellido_paterno, a.usuario_id
     FROM alumnos a
     JOIN matriculas m ON a.id = m.alumno_id
     WHERE m.curso_id = ? AND m.estado = 'activa'
     ORDER BY a.apellido_paterno, a.primer_nombre
     LIMIT ? OFFSET ?`,
    [id, limite, offset]
  );

  const totalResult = await getOne(
    'SELECT COUNT(*) as total FROM matriculas WHERE curso_id = ? AND estado = ?',
    [id, 'activa']
  );

  res.json(respuestaExito({
    estudiantes,
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Estudiantes obtenidos'));
}));

// GET cursos por profesor
app.get('/cursos-profesor/:profesor_id', asyncHandler(async (req, res) => {
  const { profesor_id } = req.params;
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const cursos = await getAll(
    `SELECT id, codigo, nombre, grado_nivel, periodo_academico, estado
     FROM cursos
     WHERE profesor_id = ? AND estado = 'activo'
     ORDER BY fecha_creacion DESC
     LIMIT ? OFFSET ?`,
    [profesor_id, limite, offset]
  );

  const totalResult = await getOne(
    'SELECT COUNT(*) as total FROM cursos WHERE profesor_id = ? AND estado = ?',
    [profesor_id, 'activo']
  );

  res.json(respuestaExito({
    cursos,
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Cursos obtenidos'));
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'cursos-service', port: PORT });
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
║  📚 SERVICIO DE CURSOS                  📚 ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/cursos   ║
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
