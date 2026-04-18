const { v4: uuidv4 } = require('uuid');

// Generador de IDs únicos
const generarId = () => uuidv4();

// Obtener fecha actual en formato ISO
const fechaActual = () => new Date().toISOString();

// Formatear fecha para mostrar
const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Calcular edad a partir de fecha de nacimiento
const calcularEdad = (fechaNacimiento) => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNacimiento = nacimiento.getMonth();

  if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
};

// Calcular promedio ponderado de calificaciones
const calcularPromedio = (calificaciones) => {
  if (calificaciones.length === 0) return 0;

  const sumaPromedio = calificaciones.reduce((acc, cal) => {
    return acc + (cal.puntuacion * (cal.peso || 1));
  }, 0);

  const sumaPesos = calificaciones.reduce((acc, cal) => {
    return acc + (cal.peso || 1);
  }, 0);

  return (sumaPromedio / sumaPesos).toFixed(2);
};

// Verificar si el alumno tiene deudas
const tieneDeuda = async (alumnoId, db) => {
  const pagoPendiente = await new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM pagos WHERE alumno_id = ? AND estado = ?',
      [alumnoId, 'pendiente'],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count > 0);
      }
    );
  });

  return pagoPendiente;
};

// Enviar notificación (simulado)
const enviarNotificacion = async (usuarioId, tipo, asunto, mensaje) => {
  // En producción, esto conectaría con un servicio de notificaciones
  console.log(`
    📧 Notificación: ${tipo.toUpperCase()}
    De: Sistema
    Para: Usuario ${usuarioId}
    Asunto: ${asunto}
    Mensaje: ${mensaje}
  `);

  return {
    id: generarId(),
    usuario_id: usuarioId,
    tipo,
    asunto,
    mensaje,
    estado: 'enviado',
    fecha_envio: fechaActual()
  };
};

// Crear respuesta estándar de éxito
const respuestaExito = (datos = null, mensaje = 'Operación exitosa', codigo = 'SUCCESS') => {
  return {
    exito: true,
    codigo,
    mensaje,
    datos
  };
};

// Crear respuesta estándar de error
const respuestaError = (mensaje = 'Error en la operación', codigo = 'ERROR', detalles = null) => {
  return {
    exito: false,
    codigo,
    mensaje,
    detalles
  };
};

// Sanitizar entrada de usuario
const sanitizar = (entrada) => {
  if (typeof entrada !== 'string') return entrada;
  return entrada.trim().replace(/[<>]/g, '');
};

// Paginación
const obtenerParametrosPaginacion = (req) => {
  const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite) || 10));
  const offset = (pagina - 1) * limite;

  return { pagina, limite, offset };
};

// Registrar auditoría
const registrarAuditoria = async (db, usuarioId, accion, tablaAfectada, registroId, datosBefore = null, datosAfter = null) => {
  return new Promise((resolve, reject) => {
    const id = generarId();
    db.run(
      `INSERT INTO logs_auditoria (id, usuario_id, accion, tabla_afectada, registro_id, datos_antes, datos_despues)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, usuarioId, accion, tablaAfectada, registroId, JSON.stringify(datosBefore), JSON.stringify(datosAfter)],
      (err) => {
        if (err) reject(err);
        else resolve(id);
      }
    );
  });
};

module.exports = {
  generarId,
  fechaActual,
  formatearFecha,
  calcularEdad,
  calcularPromedio,
  tieneDeuda,
  enviarNotificacion,
  respuestaExito,
  respuestaError,
  sanitizar,
  obtenerParametrosPaginacion,
  registrarAuditoria
};
