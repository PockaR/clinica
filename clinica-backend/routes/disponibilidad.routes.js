const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth.middleware');
const disponibilidadController = require('../controllers/disponibilidad.controller');

// POST - Registrar disponibilidad (solo médicos)
router.post('/', verifyToken, disponibilidadController.registrarDisponibilidad);

// GET - Obtener disponibilidad de un médico (público)
router.get('/:medico_id', disponibilidadController.obtenerDisponibilidad);

router.delete('/:id', verifyToken, disponibilidadController.eliminarDisponibilidad);

module.exports = router;
