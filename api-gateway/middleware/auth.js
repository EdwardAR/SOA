const jwt = require('jsonwebtoken');
const { getOne } = require('../../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_cambiar_en_produccion';

// Middleware de autenticación JWT
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Token no proporcionado',
        codigo: 'TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await getOne('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);

    if (!usuario) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        codigo: 'USER_NOT_FOUND'
      });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({
        error: 'Usuario inactivo o bloqueado',
        codigo: 'USER_BLOCKED'
      });
    }

    req.usuario = usuario;
    req.userId = decoded.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        codigo: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      error: 'Token inválido',
      codigo: 'INVALID_TOKEN'
    });
  }
};

// Middleware para validar roles
const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        error: 'No autenticado',
        codigo: 'NOT_AUTHENTICATED'
      });
    }

    if (!rolesPermitidos.includes(req.usuario.tipo_usuario)) {
      return res.status(403).json({
        error: 'Acceso denegado. Rol insuficiente.',
        codigo: 'INSUFFICIENT_ROLE',
        rol_requerido: rolesPermitidos,
        rol_actual: req.usuario.tipo_usuario
      });
    }

    next();
  };
};

// Generar token JWT
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = {
  authMiddleware,
  requireRole,
  generarToken
};
