// src/middlewares/autenticar.js
// Verifica que el request trae un JWT válido en el header Authorization
// Si es válido, inyecta los datos del usuario en req.usuario para uso posterior

const jwt = require('jsonwebtoken');

const autenticar = (req, res, next) => {
  // El header debe venir como: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso denegado. Token no proporcionado.',
      hint: 'Incluye el header: Authorization: Bearer <tu_token>'
    });
  }

  const token = authHeader.split(' ')[1]; // Extraer solo el token, sin "Bearer "

  try {
    // jwt.verify lanza excepción si el token es inválido o expirado
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // Disponible en el controlador como req.usuario.id, req.usuario.email
    next();
  } catch (err) {
    const mensaje = err.name === 'TokenExpiredError'
      ? 'Token expirado. Inicia sesión de nuevo.'
      : 'Token inválido.';
    return res.status(401).json({ error: mensaje });
  }
};

module.exports = autenticar;
