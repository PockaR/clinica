const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth.middleware');
const { crearCita, obtenerCitas, cancelarCita, reprogramarCita} = require('../controllers/citas.controller');

router.post('/', verifyToken, crearCita);
router.get('/', verifyToken, obtenerCitas);
router.delete('/:id', verifyToken, cancelarCita);
router.put('/:id', verifyToken, reprogramarCita);

module.exports = router;
