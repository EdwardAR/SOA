require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validarPago, validadores } = require('../../shared/validators');

const app = express();
const PORT = process.env.PAGOS_SERVICE_PORT || 3005;

app.use(cors());
app.use(express.json());

// GET todos los pagos
app.get('/pagos', async (req, res) => {
  try {
    const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

    const pagos = await getAll(
      `SELECT p.*, a.primer_nombre, a.apellido_paterno FROM pagos p
       JOIN alumnos a ON p.alumno_id = a.id
       LIMIT ? OFFSET ?`,
      [limite, offset]
    );

    const totalResult = await getOne('SELECT COUNT(*) as total FROM pagos');

    res.json(respuestaExito({
      pagos,
      paginacion: {
        pagina,
        limite,
        total: totalResult.total,
        total_paginas: Math.ceil(totalResult.total / limite)
      }
    }));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener pagos', 'FETCH_ERROR', error.message));
  }
});

// GET pago por ID
app.get('/pagos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pago = await getOne(
      `SELECT p.*, a.primer_nombre FROM pagos p
       JOIN alumnos a ON p.alumno_id = a.id
       WHERE p.id = ?`,
      [id]
    );

    if (!pago) {
      return res.status(404).json(respuestaError('Pago no encontrado'));
    }

    res.json(respuestaExito(pago));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener pago', 'FETCH_ERROR', error.message));
  }
});

// POST crear pago
app.post('/pagos', async (req, res) => {
  try {
    const validacion = validarPago(req.body);
    if (!validacion.valido) {
      return res.status(400).json(respuestaError('Datos inválidos', 'VALIDATION_ERROR', validacion.errores));
    }

    const pagoId = generarId();

    await runQuery(
      `INSERT INTO pagos (id, alumno_id, monto, concepto, periodo_academico,
       estado, metodo_pago, fecha_vencimiento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pagoId, req.body.alumno_id, req.body.monto, req.body.concepto,
       req.body.periodo_academico || null, req.body.estado || 'pendiente',
       req.body.metodo_pago || null, req.body.fecha_vencimiento || null]
    );

    res.status(201).json(respuestaExito(
      { id: pagoId, ...req.body },
      'Pago creado',
      'PAGO_CREATED'
    ));
  } catch (error) {
    res.status(500).json(respuestaError('Error al crear pago', 'CREATE_ERROR', error.message));
  }
});

// PUT procesar pago (RN-004: Verificar deudas)
app.put('/pagos/:id/procesar', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, metodo_pago, referencia_pago } = req.body;

    const pago = await getOne('SELECT * FROM pagos WHERE id = ?', [id]);

    if (!pago) {
      return res.status(404).json(respuestaError('Pago no encontrado'));
    }

    // Actualizar pago
    await runQuery(
      `UPDATE pagos SET estado = ?, metodo_pago = ?, referencia_pago = ?,
       fecha_pago = CURRENT_TIMESTAMP, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
      [estado, metodo_pago || pago.metodo_pago, referencia_pago || null, id]
    );

    // Si el pago está marcado como pagado, actualizar deuda del alumno
    if (estado === 'pagado') {
      // Verificar si hay más pagos pendientes para este alumno
      const pagosPendientes = await getOne(
        'SELECT COUNT(*) as count FROM pagos WHERE alumno_id = ? AND estado = ?',
        [pago.alumno_id, 'pendiente']
      );

      const tieneDeuda = pagosPendientes.count > 0;

      await runQuery(
        'UPDATE alumnos SET deuda_pendiente = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
        [tieneDeuda, pago.alumno_id]
      );
    }

    res.json(respuestaExito(
      { id, estado, fecha_pago: new Date().toISOString() },
      'Pago procesado',
      'PAGO_PROCESSED'
    ));
  } catch (error) {
    res.status(500).json(respuestaError('Error al procesar pago', 'PROCESS_ERROR', error.message));
  }
});

// GET pagos por alumno
app.get('/pagos-alumno/:alumno_id', async (req, res) => {
  try {
    const { alumno_id } = req.params;

    const pagos = await getAll(
      'SELECT id, monto, concepto, estado, fecha_vencimiento FROM pagos WHERE alumno_id = ? ORDER BY fecha_creacion DESC',
      [alumno_id]
    );

    // Calcular resumen
    const pendiente = pagos.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + p.monto, 0);
    const pagado = pagos.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + p.monto, 0);

    res.json(respuestaExito({
      pagos,
      resumen: {
        total_pendiente: pendiente,
        total_pagado: pagado,
        total_pagos: pagos.length
      }
    }));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener pagos', 'FETCH_ERROR', error.message));
  }
});

// GET estado de deuda del alumno (RN-004)
app.get('/deuda/:alumno_id', async (req, res) => {
  try {
    const { alumno_id } = req.params;

    const alumno = await getOne(
      'SELECT id, deuda_pendiente, monto_deuda FROM alumnos WHERE id = ?',
      [alumno_id]
    );

    if (!alumno) {
      return res.status(404).json(respuestaError('Alumno no encontrado'));
    }

    const pagosPendientes = await getAll(
      'SELECT id, monto, concepto FROM pagos WHERE alumno_id = ? AND estado = ?',
      [alumno_id, 'pendiente']
    );

    const montoTotal = pagosPendientes.reduce((sum, p) => sum + p.monto, 0);

    res.json(respuestaExito({
      alumno_id,
      tiene_deuda: alumno.deuda_pendiente,
      monto_total: montoTotal,
      pagos_pendientes: pagosPendientes
    }));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener deuda', 'FETCH_ERROR', error.message));
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'pagos-service', port: PORT });
});

app.use((req, res) => {
  res.status(404).json(respuestaError('Ruta no encontrada'));
});

const iniciarServicio = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n╔════════════════════════════════════════════╗
║  💰 SERVICIO DE PAGOS                   💰 ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/pagos   ║
║  Validaciones: RN-004                     ║
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
