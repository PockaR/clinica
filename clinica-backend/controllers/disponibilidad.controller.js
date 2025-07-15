const db = require('../models/db');

const registrarDisponibilidad = (req, res) => {
    const usuario_id = req.user.id;
    const { dia_semana, hora_inicio, hora_fin } = req.body;

    // Paso 1: Obtener ID del médico desde usuario_id
    const sqlMedico = 'SELECT id FROM medicos WHERE usuario_id = ?';
    db.query(sqlMedico, [usuario_id], (err, results) => {
        if (err) {
            console.error('Error al buscar médico:', err);
            return res.status(500).json({ message: 'Error al verificar médico' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Médico no encontrado' });
        }

        const medico_id = results[0].id;

        // Paso 2: Registrar disponibilidad usando el ID del médico real
        const sql = `
            INSERT INTO disponibilidad_medica (medico_id, dia_semana, hora_inicio, hora_fin)
            VALUES (?, ?, ?, ?)
        `;
        db.query(sql, [medico_id, dia_semana, hora_inicio, hora_fin], (err, result) => {
            if (err) {
                console.error('Error al registrar disponibilidad:', err);
                return res.status(500).json({ message: 'Error al registrar disponibilidad' });
            }
            res.status(201).json({ message: 'Disponibilidad registrada correctamente' });
        });
    });
};

// Eliminar una disponibilidad por ID
const eliminarDisponibilidad = (req, res) => {
    const disponibilidadId = req.params.id;
    const usuario_id = req.user.id;
    const rol = req.user.rol;

    if (rol === 'medico') {
        // Obtener ID del médico vinculado al usuario
        const sqlMedico = 'SELECT id FROM medicos WHERE usuario_id = ?';
        db.query(sqlMedico, [usuario_id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ message: 'Médico no encontrado' });
            }

            const medico_id = results[0].id;

            // Solo elimina si la disponibilidad le pertenece
            const sqlDelete = `DELETE FROM disponibilidad_medica WHERE id = ? AND medico_id = ?`;
            db.query(sqlDelete, [disponibilidadId, medico_id], (err, result) => {
                if (err) return res.status(500).json({ message: 'Error al eliminar disponibilidad' });
                if (result.affectedRows === 0) {
                    return res.status(403).json({ message: 'No tienes permiso para eliminar esta disponibilidad' });
                }
                res.json({ message: 'Disponibilidad eliminada correctamente' });
            });
        });

    } else if (rol === 'admin') {
        // El admin puede eliminar cualquier disponibilidad
        const sql = `DELETE FROM disponibilidad_medica WHERE id = ?`;
        db.query(sql, [disponibilidadId], (err, result) => {
            if (err) return res.status(500).json({ message: 'Error al eliminar disponibilidad' });
            res.json({ message: 'Disponibilidad eliminada por el administrador' });
        });
    } else {
        return res.status(403).json({ message: 'No autorizado' });
    }
};

const obtenerDisponibilidad = (req, res) => {
    const medico_id = req.params.medico_id;
    const sql = 'SELECT * FROM disponibilidad_medica WHERE medico_id = ?';

    db.query(sql, [medico_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al obtener disponibilidad' });
        res.json(results);
    });
};

module.exports = { registrarDisponibilidad, eliminarDisponibilidad, obtenerDisponibilidad };

