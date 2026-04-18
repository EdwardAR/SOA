require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validarCurso } = require('../../shared/validators');

const app = express();
const PORT = process.env.CURSOS_SERVICE_PORT || 3004;

app.use(cors());
app.use(express.json());

// GET todos los cursos
app.get('/cursos', async (req, res) => {
  try {
    const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

    const cursos = await getAll(
      `SELECT c.*, p.primer_nombre as profesor_nombre, p.apellido_paterno as profesor_apellido
       FROM cursos c
       LEFT JOIN profesores p ON c.profesor_id = p.id
       LIMIT ? OFFSET ?`,
      [limite, offset]
    );

    const totalResult = await getOne('SELECT COUNT(*) as total FROM cursos');

    res.json(respuestaExito({
      cursos,
      paginacion: {
        pagina,
        limite,
        total: totalResult.total,
        total_paginas: Math.ceil(totalResult.total / limite)
      }
    }));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener cursos', 'FETCH_ERROR', error.message));
  }
});

// GET curso por ID
app.get('/cursos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await getOne(
      `SELECT c.*, p.primer_nombre as profesor_nombre
       FROM cursos c
       LEFT JOIN profesores p ON c.profesor_id = p.id
       WHERE c.id = ?`,
      [id]
    );

    if (!curso) {
      return res.status(404).json(respuestaError('Curso no encontrado'));
    }

    res.json(respuestaExito(curso));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener curso', 'FETCH_ERROR', error.message));
  }
});

// POST crear curso
app.post('/cursos', async (req, res) => {
  try {
    const validacion = validarCurso(req.body);
    if (!validacion.valido) {
      return res.status(400).json(respuestaError('Datos inválidos', 'VALIDATION_ERROR', validacion.errores));
    }

    const cursoId = generarId();

    await runQuery(
      `INSERT INTO cursos (id, codigo, nombre, descripcion, grado_nivel, seccion,
       profesor_id, capacidad_maxima, aula_asignada, periodo_academico)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cursoId, req.body.codigo, req.body.nombre, req.body.descripcion || null,
       req.body.grado_nivel, req.body.seccion || null, req.body.profesor_id,
       req.body.capacidad_maxima || 40, req.body.aula_asignada || null,
       req.body.periodo_academico]
    );

    res.status(201).json(respuestaExito(
      { id: cursoId, ...req.body },
      'Curso creado',
      'CURSO_CREATED'
    ));
  } catch (error) {
    res.status(500).json(respuestaError('Error al crear curso', 'CREATE_ERROR', error.message));
  }
});

// PUT actualizar curso
app.put('/cursos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await getOne('SELECT id FROM cursos WHERE id = ?', [id]);
    if (!curso) {
      return res.status(404).json(respuestaError('Curso no encontrado'));
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

    res.json(respuestaExito({ id }, 'Curso actualizado', 'CURSO_UPDATED'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar curso', 'UPDATE_ERROR', error.message));
  }
});

// GET estudiantes en un curso
app.get('/cursos/:id/estudiantes', async (req, res) => {
  try {
    const { id } = req.params;

    const estudiantes = await getAll(
      `SELECT DISTINCT a.id, a.numero_matricula, a.primer_nombre, a.apellido_paterno
       FROM alumnos a
       JOIN matriculas m ON a.id = m.alumno_id
       WHERE m.curso_id = ?`,
      [id]
    );

    res.json(respuestaExito(estudiantes));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener estudiantes', 'FETCH_ERROR', error.message));
  }
});

// GET cursos por profesor
app.get('/cursos-profesor/:profesor_id', async (req, res) => {
  try {
    const { profesor_id } = req.params;

    const cursos = await getAll(
      'SELECT id, codigo, nombre, grado_nivel FROM cursos WHERE profesor_id = ?',
      [profesor_id]
    );

    res.json(respuestaExito(cursos));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener cursos', 'FETCH_ERROR', error.message));
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'cursos-service', port: PORT });
});

app.use((req, res) => {
  res.status(404).json(respuestaError('Ruta no encontrada'));
});

const iniciarServicio = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n╔════════════════════════════════════════════╗
║  📚 SERVICIO DE CURSOS                  📚 ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/cursos   ║
╚════════════════════════════════════════════╝\n`);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  iniciarServicio();
}

module.exports = app;
