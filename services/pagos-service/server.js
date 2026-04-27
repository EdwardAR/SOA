require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { errorHandler, asyncHandler } = require('../../api-gateway/middleware/errorHandler');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');
const { validarPago, validadores } = require('../../shared/validators');

const app = express();
const PORT = process.env.PAGOS_SERVICE_PORT || 3005;

app.use(cors());
app.use(express.json());

// ============================================
// ENDPOINTS: PAGOS
// ============================================

// GET todos los pagos (con paginación)
app.get('/pagos', asyncHandler(async (req, res) => {
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const pagos = await getAll(
    `SELECT p.*, a.primer_nombre, a.apellido_paterno FROM pagos p
     JOIN alumnos a ON p.alumno_id = a.id
     ORDER BY p.fecha_creacion DESC
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
  }, 'Pagos obtenidos'));
}));

// GET pago por ID
app.get('/pagos/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const pago = await getOne(
    `SELECT p.*, a.primer_nombre, a.apellido_paterno FROM pagos p
     JOIN alumnos a ON p.alumno_id = a.id
     WHERE p.id = ?`,
    [id]
  );

  if (!pago) {
    return res.status(404).json(respuestaError('Pago no encontrado', 'NOT_FOUND'));
  }

  res.json(respuestaExito(pago, 'Pago obtenido'));
}));

// POST crear pago
app.post('/pagos', asyncHandler(async (req, res) => {
  const validacion = validarPago(req.body);
  if (!validacion.valido) {
    return res.status(400).json(respuestaError('Datos inválidos', 'VALIDATION_ERROR', validacion.errores));
  }

  // Verificar que el alumno existe
  const alumno = await getOne('SELECT id FROM alumnos WHERE id = ?', [req.body.alumno_id]);
  if (!alumno) {
    return res.status(404).json(respuestaError('Alumno no encontrado', 'ALUMNO_NOT_FOUND'));
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
    'Pago creado exitosamente',
    'PAGO_CREATED'
  ));
}));

// PUT actualizar pago
app.put('/pagos/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const pago = await getOne('SELECT * FROM pagos WHERE id = ?', [id]);
  if (!pago) {
    return res.status(404).json(respuestaError('Pago no encontrado', 'NOT_FOUND'));
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
  const query = `UPDATE pagos SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`;

  await runQuery(query, valores);

  const pagoActualizado = await getOne('SELECT * FROM pagos WHERE id = ?', [id]);

  res.json(respuestaExito(pagoActualizado, 'Pago actualizado', 'PAGO_UPDATED'));
}));

// PUT procesar pago (RN-004: Actualizar deuda del alumno)
app.put('/pagos/:id/procesar', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { estado, metodo_pago, referencia_pago } = req.body;

  if (!validadores.esUUIDValido(id)) {
    return res.status(400).json(respuestaError('ID inválido', 'INVALID_ID'));
  }

  const pago = await getOne('SELECT * FROM pagos WHERE id = ?', [id]);

  if (!pago) {
    return res.status(404).json(respuestaError('Pago no encontrado', 'NOT_FOUND'));
  }

  // Actualizar pago
  await runQuery(
    `UPDATE pagos SET estado = ?, metodo_pago = ?, referencia_pago = ?,
     fecha_pago = CURRENT_TIMESTAMP, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`,
    [estado || pago.estado, metodo_pago || pago.metodo_pago, referencia_pago || null, id]
  );

  // Si el pago está marcado como pagado, actualizar deuda del alumno
  if ((estado || pago.estado) === 'pagado') {
    const pagosPendientes = await getOne(
      'SELECT COUNT(*) as count FROM pagos WHERE alumno_id = ? AND estado = ?',
      [pago.alumno_id, 'pendiente']
    );

    const tieneDeuda = pagosPendientes.count > 0;

    await runQuery(
      'UPDATE alumnos SET deuda_pendiente = ?, monto_deuda = (SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE alumno_id = ? AND estado = ?), fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
      [tieneDeuda, pago.alumno_id, 'pendiente', pago.alumno_id]
    );
  }

  res.json(respuestaExito(
    { id, estado: estado || pago.estado, fecha_pago: new Date().toISOString() },
    'Pago procesado',
    'PAGO_PROCESSED'
  ));
}));

// GET pagos por alumno (RN-004)
app.get('/pagos-alumno/:alumno_id', asyncHandler(async (req, res) => {
  const { alumno_id } = req.params;
  const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

  const pagos = await getAll(
    `SELECT id, monto, concepto, estado, fecha_vencimiento, fecha_pago, periodo_academico
     FROM pagos
     WHERE alumno_id = ?
     ORDER BY fecha_creacion DESC
     LIMIT ? OFFSET ?`,
    [alumno_id, limite, offset]
  );

  const totalResult = await getOne('SELECT COUNT(*) as total FROM pagos WHERE alumno_id = ?', [alumno_id]);

  // Calcular resumen
  const pendiente = pagos.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + p.monto, 0);
  const pagado = pagos.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + p.monto, 0);

  res.json(respuestaExito({
    pagos,
    resumen: {
      total_pendiente: pendiente,
      total_pagado: pagado,
      total_pagos: totalResult.total
    },
    paginacion: {
      pagina,
      limite,
      total: totalResult.total,
      total_paginas: Math.ceil(totalResult.total / limite)
    }
  }, 'Pagos del alumno obtenidos'));
}));

// GET estado de deuda del alumno (RN-004)
app.get('/deuda/:alumno_id', asyncHandler(async (req, res) => {
  const { alumno_id } = req.params;

  const alumno = await getOne(
    'SELECT id, deuda_pendiente, monto_deuda FROM alumnos WHERE id = ?',
    [alumno_id]
  );

  if (!alumno) {
    return res.status(404).json(respuestaError('Alumno no encontrado', 'ALUMNO_NOT_FOUND'));
  }

  const pagosPendientes = await getAll(
    'SELECT id, monto, concepto, fecha_vencimiento FROM pagos WHERE alumno_id = ? AND estado = ?',
    [alumno_id, 'pendiente']
  );

  const montoTotal = pagosPendientes.reduce((sum, p) => sum + p.monto, 0);

  res.json(respuestaExito({
    alumno_id,
    tiene_deuda: alumno.deuda_pendiente,
    monto_total: montoTotal,
    pagos_pendientes: pagosPendientes
  }, 'Deuda del alumno obtenida'));
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'pagos-service', port: PORT });
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
║  💰 SERVICIO DE PAGOS                   💰 ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/pagos   ║
║  Validaciones: RN-004, RN-007              ║
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
