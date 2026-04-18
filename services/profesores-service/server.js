require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validarProfesor, validadores } = require('../../shared/validators');

const app = express();
const PORT = process.env.PROFESORES_SERVICE_PORT || 3003;

app.use(cors());
app.use(express.json());

// GET todos los profesores
app.get('/profesores', async (req, res) => {
  try {
    const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

    const profesores = await getAll(
      `SELECT p.*, u.nombre, u.email FROM profesores p
       JOIN usuarios u ON p.usuario_id = u.id
       LIMIT ? OFFSET ?`,
      [limite, offset]
    );

    const totalResult = await getOne('SELECT COUNT(*) as total FROM profesores');

    res.json(respuestaExito({
      profesores,
      paginacion: {
        pagina,
        limite,
        total: totalResult.total,
        total_paginas: Math.ceil(totalResult.total / limite)
      }
    }));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener profesores', 'FETCH_ERROR', error.message));
  }
});

// GET profesor por ID
app.get('/profesores/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const profesor = await getOne(
      `SELECT p.*, u.nombre, u.email FROM profesores p
       JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (!profesor) {
      return res.status(404).json(respuestaError('Profesor no encontrado'));
    }

    // Obtener cursos asignados
    const cursos = await getAll(
      'SELECT id, codigo, nombre FROM cursos WHERE profesor_id = ?',
      [id]
    );

    res.json(respuestaExito({ ...profesor, cursos }));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener profesor', 'FETCH_ERROR', error.message));
  }
});

// POST crear profesor
app.post('/profesores', async (req, res) => {
  try {
    const validacion = validarProfesor(req.body);
    if (!validacion.valido) {
      return res.status(400).json(respuestaError('Datos inválidos', 'VALIDATION_ERROR', validacion.errores));
    }

    const profesorId = generarId();
    const usuarioId = req.body.usuario_id || generarId();

    await runQuery(
      `INSERT INTO profesores (id, usuario_id, apellido_paterno, apellido_materno,
       primer_nombre, segundo_nombre, numero_documento, especialidad, telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [profesorId, usuarioId, req.body.apellido_paterno, req.body.apellido_materno || null,
       req.body.primer_nombre, req.body.segundo_nombre || null, req.body.numero_documento,
       req.body.especialidad || null, req.body.telefono || null]
    );

    res.status(201).json(respuestaExito(
      { id: profesorId, ...req.body },
      'Profesor creado',
      'PROFESOR_CREATED'
    ));
  } catch (error) {
    res.status(500).json(respuestaError('Error al crear profesor', 'CREATE_ERROR', error.message));
  }
});

// PUT actualizar profesor
app.put('/profesores/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const profesor = await getOne('SELECT id FROM profesores WHERE id = ?', [id]);
    if (!profesor) {
      return res.status(404).json(respuestaError('Profesor no encontrado'));
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
    const query = `UPDATE profesores SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`;

    await runQuery(query, valores);

    res.json(respuestaExito({ id }, 'Profesor actualizado', 'PROFESOR_UPDATED'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar profesor', 'UPDATE_ERROR', error.message));
  }
});

// GET cursos por profesor
app.get('/profesores/:id/cursos', async (req, res) => {
  try {
    const { id } = req.params;

    const cursos = await getAll(
      'SELECT id, codigo, nombre, grado_nivel FROM cursos WHERE profesor_id = ?',
      [id]
    );

    res.json(respuestaExito(cursos));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener cursos', 'FETCH_ERROR', error.message));
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'profesores-service', port: PORT });
});

app.use((req, res) => {
  res.status(404).json(respuestaError('Ruta no encontrada'));
});

const iniciarServicio = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n╔════════════════════════════════════════════╗
║  👨‍🏫 SERVICIO DE PROFESORES              👨‍🏫 ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/profesores ║
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
