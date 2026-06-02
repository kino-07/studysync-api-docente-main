// src/middlewares/soloAdmin.js
// Verifica que el usuario autenticado tenga rol ADMIN
// Debe usarse DESPUÉS del middleware autenticar

const soloAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: 'No autenticado.' });
  }

  if (req.usuario.rol !== 'ADMIN') {
    return res.status(403).json({
      error: 'Acceso denegado. Solo el administrador puede realizar esta acción.'
    });
  }

  next();
};

module.exports = soloAdmin;