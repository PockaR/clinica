const express = require('express');
const router = express.Router();
const { listarUsuarios } = require('../controllers/usuarios.controller');
const verifyToken = require('../middlewares/auth.middleware');

router.get('/', verifyToken, listarUsuarios);

module.exports = router;
