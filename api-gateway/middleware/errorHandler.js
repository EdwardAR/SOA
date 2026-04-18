// Middleware para manejo de errores global
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      codigo: 'VALIDATION_ERROR',
      detalles: err.detalles || err.message
    });
  }

  // Error de base de datos
  if (err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      error: 'Registro duplicado',
      codigo: 'DUPLICATE_RECORD',
      detalles: err.message
    });
  }

  // Error de base de datos general
  if (err.code === 'SQLITE_CANTOPEN') {
    return res.status(500).json({
      error: 'Error de conexión con la base de datos',
      codigo: 'DATABASE_ERROR'
    });
  }

  // Error de no encontrado
  if (err.statusCode === 404) {
    return res.status(404).json({
      error: err.message,
      codigo: 'NOT_FOUND'
    });
  }

  // Error genérico
  res.status(err.statusCode || 500).json({
    error: err.message || 'Error interno del servidor',
    codigo: err.codigo || 'INTERNAL_SERVER_ERROR'
  });
};

// Wrapper para capturar errores en rutas async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler
};
