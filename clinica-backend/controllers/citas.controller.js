const db = require('../models/db');

// 1. Agendar una cita
const crearCita = (req, res) => {
    const { medico_id, fecha, hora, motivo } = req.body;
    const usuario_id = req.user.id;

    // 1. Buscar el id real del paciente en la tabla pacientes
    const sqlPaciente = 'SELECT id FROM pacientes WHERE usuario_id = ?';
    db.query(sqlPaciente, [usuario_id], (err, results) => {
        if (err) {
            console.error('Error al buscar paciente:', err);
            return res.status(500).json({ message: 'Error al verificar paciente' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado' });
        }

        const paciente_id = results[0].id;

        // 2. Crear la cita
        const sql = `
        INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo)
        VALUES (?, ?, ?, ?, ?)
        `;
        db.query(sql, [paciente_id, medico_id, fecha, hora, motivo], (err, result) => {
            if (err) {
                console.error('Error al crear cita:', err);
                return res.status(500).json({ message: 'Error al agendar cita' });
            }
            res.status(201).json({ message: 'Cita agendada correctamente' });
        });
    });
};


// 2. Obtener citas del usuario
const obtenerCitas = (req, res) => {
    const usuario_id = req.user.id;
    const rol = req.user.rol;

    let sqlRol;
    let sqlParams;

    if (rol === 'paciente') {
        // Buscar el id del paciente desde usuario_id
        const sqlPaciente = 'SELECT id FROM pacientes WHERE usuario_id = ?';
        db.query(sqlPaciente, [usuario_id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ message: 'Paciente no encontrado' });
            }

            const paciente_id = results[0].id;
            const sql = `SELECT * FROM citas WHERE paciente_id = ?`;
            db.query(sql, [paciente_id], (err, citas) => {
                if (err) {
                    console.error('Error al obtener citas del paciente:', err);
                    return res.status(500).json({ message: 'Error al obtener citas' });
                }
                res.json(citas);
            });
        });
    } else if (rol === 'medico') {
        // Buscar el id del médico desde usuario_id
        const sqlMedico = 'SELECT id FROM medicos WHERE usuario_id = ?';
        db.query(sqlMedico, [usuario_id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ message: 'Médico no encontrado' });
            }

            const medico_id = results[0].id;
            const sql = `SELECT * FROM citas WHERE medico_id = ?`;
            db.query(sql, [medico_id], (err, citas) => {
                if (err) {
                    console.error('Error al obtener citas del médico:', err);
                    return res.status(500).json({ message: 'Error al obtener citas' });
                }
                res.json(citas);
            });
        });
    } else {
        // Admin ve todas las citas
        const sql = `SELECT * FROM citas`;
        db.query(sql, (err, citas) => {
            if (err) {
                console.error('Error al obtener todas las citas:', err);
                return res.status(500).json({ message: 'Error al obtener citas' });
            }
            res.json(citas);
        });
    }
};


// 3. Cancelar cita
const cancelarCita = (req, res) => {
    const citaId = req.params.id;
    const usuario_id = req.user.id;
    const rol = req.user.rol;

    if (rol === 'paciente') {
        const sqlPaciente = 'SELECT id FROM pacientes WHERE usuario_id = ?';
        db.query(sqlPaciente, [usuario_id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ message: 'Paciente no encontrado' });
            }

            const paciente_id = results[0].id;

            const sql = `UPDATE citas SET estado = 'cancelada' WHERE id = ? AND paciente_id = ?`;
            db.query(sql, [citaId, paciente_id], (err, result) => {
                if (err) return res.status(500).json({ message: 'Error al cancelar cita' });
                if (result.affectedRows === 0) return res.status(403).json({ message: 'No tienes permiso para cancelar esta cita' });
                res.json({ message: 'Cita cancelada exitosamente' });
            });
        });
    } else if (rol === 'admin') {
        // Admin puede cancelar cualquier cita
        const sql = `UPDATE citas SET estado = 'cancelada' WHERE id = ?`;
        db.query(sql, [citaId], (err, result) => {
            if (err) return res.status(500).json({ message: 'Error al cancelar cita' });
            res.json({ message: 'Cita cancelada por el administrador' });
        });
    } else {
        return res.status(403).json({ message: 'No tienes permiso para cancelar citas' });
    }
};


module.exports = { crearCita, obtenerCitas, cancelarCita };
