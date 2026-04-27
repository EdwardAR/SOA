require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { errorHandler, asyncHandler } = require('../../api-gateway/middleware/errorHandler');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validadores } = require('../../shared/validators');

const app = express();
const PORT = process.env.CALIFICACIONES_SERVICE_PORT || 3008;

app.use(cors());
app.use(express.json());

// ============================================
// ENDPOINTS: CALIFICACIONES/NOTAS
// ============================================

// GET todas las calificaciones (con paginación)
app.get('/calificaciones', asyncHandler(async (req, res) => {
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const calificaciones = await getAll(
    `SELECT c.*, a.primer_nombre, a.apellido_paterno, cu.nombre as curso_nombre
     FROM calificaciones c
     JOIN alumnos a ON c.alumno_id = a.id
     JOIN cursos cu ON c.curso_id = cu.id
     ORDER BY c.fecha_registro DESC
     LIMIT ? OFFSET ?`,
    [limite, offset]
  );

  const totalResult = await getOne('SELECT COUNT(*) as total FROM calificaciones');

  res.json(respuestaExito({
    calificaciones,
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Calificaciones obtenidas'));
}));

// GET calificación por ID
app.get('/calificaciones/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const calificacion = await getOne(
    `SELECT c.*, a.primer_nombre, a.apellido_paterno, cu.nombre as curso_nombre
     FROM calificaciones c
     JOIN alumnos a ON c.alumno_id = a.id
     JOIN cursos cu ON c.curso_id = cu.id
     WHERE c.id = ?`,
    [id]
  );

  if (!calificacion) {
    return res.status(404).json(respuestaError('Calificación no encontrada', 'NOT_FOUND'));
  }

  res.json(respuestaExito(calificacion, 'Calificación obtenida'));
}));

// POST crear calificación (RN-002: Validar deadline)
app.post('/calificaciones', asyncHandler(async (req, res) => {
  const { alumno_id, curso_id, tipo_evaluacion, puntuacion, peso, observaciones, periodo_academico, fecha_limite_notas } = req.body;

  // RN-007: Validar datos obligatorios
  if (!alumno_id || !curso_id || !tipo_evaluacion || puntuacion === undefined || puntuacion === null) {
    return res.status(400).json(respuestaError('Datos incompletos requeridos', 'MISSING_DATA'));
  }

  // Validar que alumno existe
  const alumno = await getOne('SELECT id FROM alumnos WHERE id = ?', [alumno_id]);
  if (!alumno) {
    return res.status(404).json(respuestaError('Alumno no encontrado', 'ALUMNO_NOT_FOUND'));
  }

  // Validar que curso existe
  const curso = await getOne('SELECT id FROM cursos WHERE id = ?', [curso_id]);
  if (!curso) {
    return res.status(404).json(respuestaError('Curso no encontrado', 'COURSE_NOT_FOUND'));
  }

  // RN-002: Validar puntuación en rango 0-20
  if (!validadores.esPuntuacionValida(puntuacion)) {
    return res.status(400).json(respuestaError('Puntuación inválida (debe estar entre 0 y 20)', 'INVALID_SCORE'));
  }

  // Validar tipo de evaluación
  if (!['parcial', 'final', 'extra'].includes(tipo_evaluacion)) {
    return res.status(400).json(respuestaError('Tipo de evaluación inválido', 'INVALID_EVAL_TYPE'));
  }

  // RN-002: Verificar si está dentro del deadline
  if (fecha_limite_notas) {
    if (!validadores.esFechaValida(fecha_limite_notas)) {
      return res.status(400).json(respuestaError('Fecha límite inválida', 'INVALID_DEADLINE'));
    }
    
    const ahora = new Date();
    const limite = new Date(fecha_limite_notas);
    if (ahora > limite) {
      return res.status(409).json(respuestaError(
        'El plazo para registrar calificaciones ha vencido',
        'DEADLINE_EXCEEDED',
        { fecha_limite: fecha_limite_notas }
      ));
    }
  }

  const calificacionId = generarId();

  await runQuery(
    `INSERT INTO calificaciones (id, alumno_id, curso_id, tipo_evaluacion, puntuacion, peso,
     observaciones, periodo_academico, fecha_limite_notas, registrada, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [calificacionId, alumno_id, curso_id, tipo_evaluacion, puntuacion, peso || 1.0,
     observaciones || null, periodo_academico || null, fecha_limite_notas || null,
     true, 'registrada']
  );

  res.status(201).json(respuestaExito(
    { id: calificacionId, alumno_id, curso_id, tipo_evaluacion, puntuacion },
    'Calificación creada exitosamente',
    'CALIFICACION_CREATED'
  ));
}));

// PUT actualizar calificación
app.put('/calificaciones/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const calificacion = await getOne('SELECT * FROM calificaciones WHERE id = ?', [id]);
  if (!calificacion) {
    return res.status(404).json(respuestaError('Calificación no encontrada', 'NOT_FOUND'));
  }

  // Validar puntuación si se actualiza
  if (req.body.puntuacion !== undefined && !validadores.esPuntuacionValida(req.body.puntuacion)) {
    return res.status(400).json(respuestaError('Puntuación inválida (debe estar entre 0 y 20)', 'INVALID_SCORE'));
  }

  // RN-002: Verificar deadline si se actualiza
  if (calificacion.fecha_limite_notas) {
    const ahora = new Date();
    const limite = new Date(calificacion.fecha_limite_notas);
    if (ahora > limite) {
      return res.status(409).json(respuestaError(
        'El plazo para actualizar calificaciones ha vencido',
        'DEADLINE_EXCEEDED'
      ));
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
  const query = `UPDATE calificaciones SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`;

  await runQuery(query, valores);

  const calificacionActualizada = await getOne('SELECT * FROM calificaciones WHERE id = ?', [id]);

  res.json(respuestaExito(calificacionActualizada, 'Calificación actualizada', 'CALIFICACION_UPDATED'));
}));

// DELETE calificación (soft delete)
app.delete('/calificaciones/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const calificacion = await getOne('SELECT id FROM calificaciones WHERE id = ?', [id]);
  if (!calificacion) {
    return res.status(404).json(respuestaError('Calificación no encontrada', 'NOT_FOUND'));
  }

  await runQuery('UPDATE calificaciones SET estado = ? WHERE id = ?', ['cancelada', id]);

  res.json(respuestaExito(null, 'Calificación eliminada', 'CALIFICACION_DELETED'));
}));

// GET calificaciones por alumno
app.get('/calificaciones-alumno/:alumno_id', asyncHandler(async (req, res) => {
  const { alumno_id } = req.params;
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const calificaciones = await getAll(
    `SELECT c.*, cu.nombre as curso_nombre, cu.codigo
     FROM calificaciones c
     JOIN cursos cu ON c.curso_id = cu.id
     WHERE c.alumno_id = ? AND c.estado != 'cancelada'
     ORDER BY c.fecha_registro DESC
     LIMIT ? OFFSET ?`,
    [alumno_id, limite, offset]
  );

  const totalResult = await getOne(
    'SELECT COUNT(*) as total FROM calificaciones WHERE alumno_id = ? AND estado != ?',
    [alumno_id, 'cancelada']
  );

  // Calcular promedio ponderado
  let promedio = 0;
  if (calificaciones.length > 0) {
    const sumaPromedio = calificaciones.reduce((acc, cal) => {
      return acc + (cal.puntuacion * (cal.peso || 1.0));
    }, 0);
    const sumaPesos = calificaciones.reduce((acc, cal) => {
      return acc + (cal.peso || 1.0);
    }, 0);
    promedio = (sumaPromedio / sumaPesos).toFixed(2);
  }

  res.json(respuestaExito({
    calificaciones,
    resumen: {
      total_calificaciones: calificaciones.length,
      promedio_ponderado: parseFloat(promedio)
    },
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Calificaciones del alumno obtenidas'));
}));

// GET calificaciones por curso
app.get('/calificaciones-curso/:curso_id', asyncHandler(async (req, res) => {
  const { curso_id } = req.params;
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const calificaciones = await getAll(
    `SELECT c.*, a.primer_nombre, a.apellido_paterno, a.numero_matricula
     FROM calificaciones c
     JOIN alumnos a ON c.alumno_id = a.id
     WHERE c.curso_id = ? AND c.estado != 'cancelada'
     ORDER BY a.apellido_paterno, a.primer_nombre
     LIMIT ? OFFSET ?`,
    [curso_id, limite, offset]
  );

  const totalResult = await getOne(
    'SELECT COUNT(*) as total FROM calificaciones WHERE curso_id = ? AND estado != ?',
    [curso_id, 'cancelada']
  );

  res.json(respuestaExito({
    calificaciones,
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Calificaciones del curso obtenidas'));
}));

// GET reporte de calificaciones (promedio por alumno en un curso)
app.get('/reporte-promedios/:curso_id', asyncHandler(async (req, res) => {
  const { curso_id } = req.params;

  const alumnos = await getAll(
    `SELECT DISTINCT a.id, a.numero_matricula, a.primer_nombre, a.apellido_paterno
     FROM alumnos a
     JOIN calificaciones c ON a.id = c.alumno_id
     WHERE c.curso_id = ?
     ORDER BY a.apellido_paterno, a.primer_nombre`,
    [curso_id]
  );

  const reportes = await Promise.all(alumnos.map(async (alumno) => {
    const calificaciones = await getAll(
      'SELECT puntuacion, peso FROM calificaciones WHERE alumno_id = ? AND curso_id = ? AND estado != ?',
      [alumno.id, curso_id, 'cancelada']
    );

    let promedio = 0;
    if (calificaciones.length > 0) {
      const sumaPromedio = calificaciones.reduce((acc, cal) => {
        return acc + (cal.puntuacion * (cal.peso || 1.0));
      }, 0);
      const sumaPesos = calificaciones.reduce((acc, cal) => {
        return acc + (cal.peso || 1.0);
      }, 0);
      promedio = (sumaPromedio / sumaPesos).toFixed(2);
    }

    return {
      alumno_id: alumno.id,
      numero_matricula: alumno.numero_matricula,
      nombre: `${alumno.primer_nombre} ${alumno.apellido_paterno}`,
      promedio: parseFloat(promedio),
      calificaciones: calificaciones.length
    };
  }));

  res.json(respuestaExito(reportes, 'Reporte de promedios obtenido'));
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'calificaciones-service', port: PORT });
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
║  📊 SERVICIO DE CALIFICACIONES          📊 ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/calificaciones ║
║  Validaciones: RN-002, RN-007              ║
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
