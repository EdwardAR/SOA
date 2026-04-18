require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { initDatabase, getOne, getAll, runQuery } = require('../../config/database');
const { respuestaExito, respuestaError, generarId, obtenerParametrosPaginacion } = require('../../shared/utils');

const app = express();
const PORT = process.env.NOTIFICACIONES_SERVICE_PORT || 3006;

app.use(cors());
app.use(express.json());

// Configurar transportador de email (simulado en desarrollo)
let transporter;

if (process.env.NODE_ENV === 'production') {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  // En desarrollo, usar un transporte de prueba
  transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false
  });
}

// Función para simular envío de email
const simularEnvioEmail = async (destinatario, asunto, mensaje) => {
  console.log(`\n📧 EMAIL SIMULADO:
  De: ${process.env.EMAIL_FROM || 'noreply@colegio.com'}
  Para: ${destinatario}
  Asunto: ${asunto}
  Mensaje: ${mensaje.substring(0, 100)}...`);
  return true;
};

// GET todas las notificaciones
app.get('/notificaciones', async (req, res) => {
  try {
    const { pagina, limite, offset } = obtenerParametrosPaginacion(req);

    const notificaciones = await getAll(
      `SELECT * FROM notificaciones
       ORDER BY fecha_creacion DESC
       LIMIT ? OFFSET ?`,
      [limite, offset]
    );

    const totalResult = await getOne('SELECT COUNT(*) as total FROM notificaciones');

    res.json(respuestaExito({
      notificaciones,
      paginacion: {
        pagina,
        limite,
        total: totalResult.total,
        total_paginas: Math.ceil(totalResult.total / limite)
      }
    }));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener notificaciones', 'FETCH_ERROR', error.message));
  }
});

// GET notificaciones por usuario
app.get('/notificaciones/usuario/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const notificaciones = await getAll(
      `SELECT * FROM notificaciones
       WHERE usuario_id = ?
       ORDER BY fecha_creacion DESC`,
      [usuario_id]
    );

    res.json(respuestaExito(notificaciones));
  } catch (error) {
    res.status(500).json(respuestaError('Error al obtener notificaciones', 'FETCH_ERROR', error.message));
  }
});

// POST enviar notificación
app.post('/notificaciones', async (req, res) => {
  try {
    const { usuario_id, tipo, asunto, mensaje, destinatario, evento_generador } = req.body;

    if (!usuario_id || !tipo || !asunto || !mensaje) {
      return res.status(400).json(respuestaError('Datos incompletos'));
    }

    const notificacionId = generarId();

    // Guardar en base de datos
    await runQuery(
      `INSERT INTO notificaciones (id, usuario_id, tipo, asunto, mensaje, estado, destinatario, evento_generador)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [notificacionId, usuario_id, tipo, asunto, mensaje, 'pendiente', destinatario || null, evento_generador || null]
    );

    // Intentar enviar según el tipo
    let enviado = false;
    let razonFallo = null;

    try {
      if (tipo === 'email') {
        // En desarrollo, simular
        if (process.env.NODE_ENV === 'development') {
          await simularEnvioEmail(destinatario, asunto, mensaje);
        } else {
          // En producción, enviar realmente
          await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: destinatario,
            subject: asunto,
            html: mensaje
          });
        }
        enviado = true;
      } else if (tipo === 'sms') {
        // SMS simulado
        console.log(`\n📱 SMS SIMULADO:
  Para: ${destinatario}
  Mensaje: ${mensaje}`);
        enviado = true;
      }
    } catch (error) {
      razonFallo = error.message;
      console.error('Error al enviar notificación:', error);
    }

    // Actualizar estado
    const estado = enviado ? 'enviado' : 'fallido';
    await runQuery(
      `UPDATE notificaciones SET estado = ?, fecha_envio = CURRENT_TIMESTAMP,
       razon_fallo = ? WHERE id = ?`,
      [estado, razonFallo, notificacionId]
    );

    res.status(201).json(respuestaExito(
      {
        id: notificacionId,
        usuario_id,
        tipo,
        asunto,
        estado,
        enviado
      },
      'Notificación creada',
      'NOTIFICACION_CREATED'
    ));
  } catch (error) {
    res.status(500).json(respuestaError('Error al crear notificación', 'CREATE_ERROR', error.message));
  }
});

// POST enviar notificación de inasistencia (RN-006)
app.post('/notificaciones/inasistencia', async (req, res) => {
  try {
    const { alumno_id, padre_id, motivo, fecha } = req.body;

    if (!alumno_id || !padre_id) {
      return res.status(400).json(respuestaError('Datos incompletos'));
    }

    const alumno = await getOne('SELECT * FROM alumnos WHERE id = ?', [alumno_id]);
    const padre = await getOne('SELECT nombre, email FROM usuarios WHERE id = ?', [padre_id]);

    if (!alumno || !padre) {
      return res.status(404).json(respuestaError('Alumno o padre no encontrado'));
    }

    const asunto = `Notificación de inasistencia - ${alumno.primer_nombre} ${alumno.apellido_paterno}`;
    const mensaje = `
      <h2>Notificación de Inasistencia</h2>
      <p>Le informamos que su hijo/a <strong>${alumno.primer_nombre} ${alumno.apellido_paterno}</strong>
      registró una inasistencia el día <strong>${fecha}</strong>.</p>
      <p><strong>Motivo:</strong> ${motivo || 'No especificado'}</p>
      <p>Por favor, contacte con la institución si considera que esto es un error.</p>
    `;

    const notificacionId = generarId();

    await runQuery(
      `INSERT INTO notificaciones (id, usuario_id, tipo, asunto, mensaje, estado, destinatario, evento_generador)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [notificacionId, padre_id, 'email', asunto, mensaje, 'enviado', padre.email, 'inasistencia']
    );

    // Simular envío
    await simularEnvioEmail(padre.email, asunto, mensaje);

    res.status(201).json(respuestaExito(
      { id: notificacionId, estado: 'enviado' },
      'Notificación de inasistencia enviada',
      'INASISTENCIA_NOTIFICACION_SENT'
    ));
  } catch (error) {
    res.status(500).json(respuestaError('Error al enviar notificación', 'SEND_ERROR', error.message));
  }
});

// PUT actualizar estado de notificación
app.put('/notificaciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    await runQuery(
      'UPDATE notificaciones SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
      [estado, id]
    );

    res.json(respuestaExito({ id, estado }, 'Notificación actualizada'));
  } catch (error) {
    res.status(500).json(respuestaError('Error al actualizar notificación', 'UPDATE_ERROR', error.message));
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'notificaciones-service', port: PORT });
});

app.use((req, res) => {
  res.status(404).json(respuestaError('Ruta no encontrada'));
});

const iniciarServicio = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n╔════════════════════════════════════════════╗
║  📧 SERVICIO DE NOTIFICACIONES          📧 ║
╠════════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  Endpoint: http://localhost:${PORT}/notificaciones ║
║  Validaciones: RN-006                     ║
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
