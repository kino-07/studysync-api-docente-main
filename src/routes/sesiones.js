// src/routes/sesiones.js
// Define qué función del controlador se ejecuta para cada verbo + ruta
const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/sesionesController');
const autenticar   = require('../middlewares/autenticar');

// Rutas públicas — cualquiera puede consultar sesiones
router.get   ('/',    ctrl.listar);
router.get   ('/:id', ctrl.obtenerUna);

// Rutas protegidas — requieren JWT válido en el header Authorization
// El middleware `autenticar` verifica el token ANTES de llamar al controlador
router.post  ('/',    autenticar, ctrl.crear);
router.put   ('/:id', autenticar, ctrl.actualizar);
router.delete('/:id', autenticar, ctrl.eliminar);

module.exports = router;
