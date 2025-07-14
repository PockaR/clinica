const db = require('../models/db');

// Listar todos los usuarios (solo admin)
const listarUsuarios = (req, res) => {
    const { rol } = req.user;

    if (rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Solo el administrador puede ver esta información.' });
    }

    const sql = 'SELECT id, nombre, email, rol FROM usuarios';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ message: 'Error al obtener usuarios' });
        }

        res.json(results);
    });
};

module.exports = { listarUsuarios };
