require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validadores } = require('../../shared/validators');

const app = express();
const PORT = process.env.MATRICULA_SERVICE_PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// ============================================
// ENDPOINTS: MATRÍCULAS
// ============================================

// GET todas las matrículas
app.get('/matriculas', async (req, res) => {
  try {
    const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

    const matriculas = await getAll(
      `SELECT m.*, a.primer_nombre, a.apellido_paterno, c.nombre as curso_nombre
       FROM matriculas m
       JOIN alumnos a ON m.alumno_id = a.id
       JOIN cursos c ON m.curso_id = c.id
       LIMIT ? OFFSET ?`,
      [limite, offset]
    );

    const totalResult = await getOne('SELECT COUNT(*) as total FROM matriculas');
    const total = totalResult.total;

    res.json(respuestaExito({
      matriculas,
      paginacion: {
        pagina,
        limite,
        total,
        total_paginas: Math.ceil(total / limite)
      }
    }, 'Matrículas obtenidas'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener matrículas', 'FETCH_ERROR', error.message));
  }
});

// GET matrícula por ID
app.get('/matriculas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!validadores.esUUIDValido(id)) {
      return res.status(400).json(respuestaError('ID inválido'));
    }

    const matricula = await getOne(
      `SELECT m.*, a.primer_nombre, a.apellido_paterno, c.nombre as curso_nombre
       FROM matriculas m
       JOIN alumnos a ON m.alumno_id = a.id
       JOIN cursos c ON m.curso_id = c.id
       WHERE m.id = ?`,
      [id]
    );

    if (!matricula) {
      return res.status(404).json(respuestaError('Matrícula no encontrada', 'NOT_FOUND'));
    }

    res.json(respuestaExito(matricula, 'Matrícula obtenida'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener matrícula', 'FETCH_ERROR', error.message));
  }
});

// POST crear nueva matrícula (con validaciones de reglas de negocio)
app.post('/matriculas', async (req, res) => {
  try {
    const { alumno_id, curso_id, aula_asignada, periodo_academico } = req.body;

    // Validar que los datos requeridos estén presentes
    if (!alumno_id || !curso_id || !periodo_academico) {
      return res.status(400).json(respuestaError('Datos incompletos requeridos', 'MISSING_DATA'));
    }

    // RN-004: Verificar que el alumno no tenga deudas pendientes
    const alumno = await getOne('SELECT * FROM alumnos WHERE id = ?', [alumno_id]);

    if (!alumno) {
      return res.status(404).json(respuestaError('Alumno no encontrado', 'ALUMNO_NOT_FOUND'));
    }

    if (alumno.deuda_pendiente) {
      return res.status(409).json(respuestaError(
        'No se puede matricular con deudas pendientes',
        'STUDENT_HAS_DEBT',
        { monto_deuda: alumno.monto_deuda }
      ));
    }

    // RN-001: Verificar asignación única de aula por periodo
    const alumnoEnAula = await getOne(
      `SELECT m.id FROM matriculas m
       WHERE m.alumno_id = ? AND m.periodo_academico = ?`,
      [alumno_id, periodo_academico]
    );

    if (alumnoEnAula) {
      return res.status(409).json(respuestaError(
        'El alumno ya está matriculado en este periodo académico',
        'ALREADY_ENROLLED',
        { matricula_existente: alumnoEnAula.id }
      ));
    }

    // Verificar que el curso existe y está disponible
    const curso = await getOne(
      'SELECT * FROM cursos WHERE id = ? AND periodo_academico = ?',
      [curso_id, periodo_academico]
    );

    if (!curso) {
      return res.status(404).json(respuestaError('Curso no encontrado o no disponible', 'COURSE_NOT_FOUND'));
    }

    if (curso.capacidad_actual >= curso.capacidad_maxima) {
      return res.status(409).json(respuestaError(
        'El curso ha alcanzado su capacidad máxima',
        'COURSE_FULL',
        { capacidad_actual: curso.capacidad_actual, capacidad_maxima: curso.capacidad_maxima }
      ));
    }

    // Crear la matrícula
    const matriculaId = generarId();

    await runQuery(
      `INSERT INTO matriculas (id, alumno_id, curso_id, aula_asignada, periodo_academico)
       VALUES (?, ?, ?, ?, ?)`,
      [matriculaId, alumno_id, curso_id, aula_asignada || curso.aula_asignada, periodo_academico]
    );

    // Actualizar capacidad del curso
    await runQuery(
      'UPDATE cursos SET capacidad_actual = capacidad_actual + 1 WHERE id = ?',
      [curso_id]
    );

    // Marcar alumno como asignado a aula
    await runQuery(
      'UPDATE alumnos SET aula_asignada = TRUE, aula_id = ? WHERE id = ?',
      [aula_asignada || curso.aula_asignada, alumno_id]
    );

    res.status(201).json(respuestaExito(
      { id: matriculaId, alumno_id, curso_id, aula_asignada, periodo_academico },
      'Matrícula creada exitosamente',
      'MATRICULA_CREATED'
    ));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json(respuestaError('Error al crear matrícula', 'CREATE_ERROR', error.message));
  }
});

// PUT actualizar matrícula
app.put('/matriculas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!validadores.esUUIDValido(id)) {
      return res.status(400).json(respuestaError('ID inválido'));
    }

    const matricula = await getOne('SELECT * FROM matriculas WHERE id = ?', [id]);

    if (!matricula) {
      return res.status(404).json(respuestaError('Matrícula no encontrada', 'NOT_FOUND'));
    }

    // Si se cancela, restar de la capacidad del curso
    if (estado === 'cancelada' && matricula.estado !== 'cancelada') {
      await runQuery(
        'UPDATE cursos SET capacidad_actual = capacidad_actual - 1 WHERE id = ?',
        [matricula.curso_id]
      );
    }

    await runQuery(
      'UPDATE matriculas SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
      [estado, id]
    );

    res.json(respuestaExito({ id, estado }, 'Matrícula actualizada', 'MATRICULA_UPDATED'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar matrícula', 'UPDATE_ERROR', error.message));
  }
});

// GET matrículas por alumno
app.get('/matriculas-alumno/:alumno_id', async (req, res) => {
  try {
    const { alumno_id } = req.params;

    const matriculas = await getAll(
      `SELECT m.*, c.nombre as curso_nombre, c.codigo
       FROM matriculas m
       JOIN cursos c ON m.curso_id = c.id
       WHERE m.alumno_id = ?`,
      [alumno_id]
    );

    res.json(respuestaExito(matriculas, 'Matrículas del alumno obtenidas'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener matrículas', 'FETCH_ERROR', error.message));
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'matricula-service', port: PORT });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use((req, res) => {
  res.status(404).json(respuestaError('Ruta no encontrada', 'NOT_FOUND'));
});

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
║  📝 SERVICIO DE MATRÍCULAS              📝 ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/matriculas ║
║  Validaciones: RN-001, RN-004             ║
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
