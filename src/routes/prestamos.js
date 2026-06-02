// src/routes/prestamos.js
const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/prestamosController');
const autenticar = require('../middlewares/autenticar');
const soloAdmin  = require('../middlewares/soloAdmin');

// Rutas públicas
router.get('/',    ctrl.listar);
router.get('/:id', ctrl.obtenerUno);

// Rutas para estudiantes autenticados
router.post('/', autenticar, ctrl.crear);

// Rutas solo para admin
router.put('/:id/devolver', autenticar, soloAdmin, ctrl.marcarDevuelto);
router.delete('/:id',       autenticar, soloAdmin, ctrl.eliminar);

module.exports = router;