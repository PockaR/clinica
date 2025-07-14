const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth.middleware');
const { crearCita, obtenerCitas, cancelarCita } = require('../controllers/citas.controller');

router.post('/', verifyToken, crearCita);
router.get('/', verifyToken, obtenerCitas);
router.delete('/:id', verifyToken, cancelarCita);

module.exports = router;
