require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validadores } = require('../../shared/validators');

const app = express();
const PORT = process.env.ASISTENCIA_SERVICE_PORT || 3007;

app.use(cors());
app.use(express.json());

// GET asistencias
app.get('/asistencia', async (req, res) => {
  try {
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
    }));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener asistencias', 'FETCH_ERROR', error.message));
  }
});

// GET asistencia por ID
app.get('/asistencia/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const asistencia = await getOne(
      `SELECT a.*, al.primer_nombre, c.nombre as curso_nombre
       FROM asistencias a
       JOIN alumnos al ON a.alumno_id = al.id
       JOIN cursos c ON a.curso_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (!asistencia) {
      return res.status(404).json(respuestaError('Asistencia no encontrada'));
    }

    res.json(respuestaExito(asistencia));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener asistencia', 'FETCH_ERROR', error.message));
  }
});

// POST registrar asistencia (RN-003: Control de asistencia)
app.post('/asistencia', async (req, res) => {
  try {
    const { alumno_id, curso_id, fecha, estado, motivo_falta } = req.body;

    if (!alumno_id || !curso_id || !fecha || !estado) {
      return res.status(400).json(respuestaError('Datos incompletos'));
    }

    if (!validadores.esEstadoAsistenciaValido(estado)) {
      return res.status(400).json(respuestaError('Estado de asistencia inválido'));
    }

    if (!validadores.esFechaValida(fecha)) {
      return res.status(400).json(respuestaError('Fecha inválida'));
    }

    // Verificar si ya existe registro para ese día
    const existente = await getOne(
      'SELECT id FROM asistencias WHERE alumno_id = ? AND curso_id = ? AND fecha = ?',
      [alumno_id, curso_id, fecha]
    );

    if (existente) {
      return res.status(409).json(respuestaError('Ya existe un registro de asistencia para este día'));
    }

    const asistenciaId = generarId();

    await runQuery(
      `INSERT INTO asistencias (id, alumno_id, curso_id, fecha, estado, registrada, motivo_falta)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [asistenciaId, alumno_id, curso_id, fecha, estado, true, motivo_falta || null]
    );

    // RN-006: Si es FALTA, enviar notificación automática
    if (estado === 'FALTA') {
      try {
        const alumno = await getOne('SELECT padre_id FROM alumnos WHERE id = ?', [alumno_id]);

        if (alumno && alumno.padre_id) {
          // Llamar al servicio de notificaciones
          const urlNotificaciones = `${process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:3006'}/notificaciones/inasistencia`;

          await axios.post(urlNotificaciones, {
            alumno_id,
            padre_id: alumno.padre_id,
            motivo: motivo_falta || 'Falta sin justificar',
            fecha
          }).catch(err => console.error('Error al enviar notificación:', err.message));
        }
      } catch (error) {
        console.error('Error al procesando notificación:', error.message);
        // Continuar incluso si falla la notificación
      }
    }

    res.status(201).json(respuestaExito(
      { id: asistenciaId, alumno_id, curso_id, fecha, estado, registrada: true },
      'Asistencia registrada',
      'ASISTENCIA_REGISTERED'
    ));
  } catch (error) {
    res.status(500).json(respuestaError('Error al registrar asistencia', 'CREATE_ERROR', error.message));
  }
});

// PUT actualizar asistencia
app.put('/asistencia/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo_falta } = req.body;

    const asistencia = await getOne('SELECT * FROM asistencias WHERE id = ?', [id]);

    if (!asistencia) {
      return res.status(404).json(respuestaError('Asistencia no encontrada'));
    }

    await runQuery(
      `UPDATE asistencias SET estado = ?, motivo_falta = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
      [estado, motivo_falta || asistencia.motivo_falta, id]
    );

    res.json(respuestaExito({ id, estado }, 'Asistencia actualizada'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar asistencia', 'UPDATE_ERROR', error.message));
  }
});

// GET asistencias por alumno
app.get('/asistencia-alumno/:alumno_id', async (req, res) => {
  try {
    const { alumno_id } = req.params;

    const asistencias = await getAll(
      `SELECT id, fecha, estado, motivo_falta FROM asistencias
       WHERE alumno_id = ?
       ORDER BY fecha DESC`,
      [alumno_id]
    );

    // Calcular estadísticas
    const presente = asistencias.filter(a => a.estado === 'PRESENTE').length;
    const falta = asistencias.filter(a => a.estado === 'FALTA').length;
    const justificado = asistencias.filter(a => a.estado === 'JUSTIFICADO').length;
    const porcentajeAsistencia = asistencias.length > 0 ?
      ((presente / asistencias.length) * 100).toFixed(2) : 0;

    res.json(respuestaExito({
      asistencias,
      estadisticas: {
        presente,
        falta,
        justificado,
        total: asistencias.length,
        porcentaje_asistencia: porcentajeAsistencia
      }
    }));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener asistencias', 'FETCH_ERROR', error.message));
  }
});

// GET asistencias por curso y fecha
app.get('/asistencia-curso/:curso_id', async (req, res) => {
  try {
    const { curso_id } = req.params;
    const { fecha } = req.query;

    let query = `SELECT a.*, al.primer_nombre, al.apellido_paterno
                 FROM asistencias a
                 JOIN alumnos al ON a.alumno_id = al.id
                 WHERE a.curso_id = ?`;
    const params = [curso_id];

    if (fecha) {
      query += ' AND a.fecha = ?';
      params.push(fecha);
    }

    query += ' ORDER BY al.apellido_paterno, al.primer_nombre';

    const asistencias = await getAll(query, params);

    res.json(respuestaExito(asistencias));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener asistencias', 'FETCH_ERROR', error.message));
  }
});

// GET reporte de inasistencias (para notificaciones)
app.get('/reporte-inasistencias/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;

    const inasistencias = await getAll(
      `SELECT a.*, al.primer_nombre, al.apellido_paterno, al.padre_id
       FROM asistencias a
       JOIN alumnos al ON a.alumno_id = al.id
       WHERE a.fecha = ? AND a.estado = 'FALTA'`,
      [fecha]
    );

    res.json(respuestaExito(inasistencias, `Inasistencias del ${fecha}`));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener reporte', 'FETCH_ERROR', error.message));
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'asistencia-service', port: PORT });
});

app.use((req, res) => {
  res.status(404).json(respuestaError('Ruta no encontrada'));
});

const iniciarServicio = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n╔════════════════════════════════════════════╗
║  ✅ SERVICIO DE ASISTENCIA              ✅ ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/asistencia ║
║  Validaciones: RN-003, RN-006             ║
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
