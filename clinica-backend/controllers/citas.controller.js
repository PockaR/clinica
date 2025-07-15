const db = require('../models/db');

// 1. Agendar una cita
const crearCita = (req, res) => {
    const { medico_id, fecha, hora, motivo } = req.body;
    const usuario_id = req.user.id;

    // 1. Buscar el ID real del paciente
    const sqlPaciente = 'SELECT id FROM pacientes WHERE usuario_id = ?';
    db.query(sqlPaciente, [usuario_id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado' });
        }

        const paciente_id = results[0].id;

        // 2. Verificar disponibilidad del médico
        const diaSemana = new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', {
            weekday: 'long',
            timeZone: 'America/Lima'
        }).toLowerCase();

        const sqlDisponibilidad = `
            SELECT * FROM disponibilidad_medica 
            WHERE medico_id = ? AND dia_semana = ?
            AND ? BETWEEN hora_inicio AND hora_fin
        `;

        db.query(sqlDisponibilidad, [medico_id, diaSemana, hora], (err, disponibles) => {
            if (err) {
                console.error('Error al verificar disponibilidad:', err);
                return res.status(500).json({ message: 'Error al verificar disponibilidad' });
            }

            if (disponibles.length === 0) {
                return res.status(400).json({ message: 'El médico no tiene disponibilidad para ese día u hora' });
            }

            // 3. Crear la cita
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

// 4. Reprogramar cita
const reprogramarCita = (req, res) => {
    const citaId = req.params.id;
    const usuario_id = req.user.id;
    const rol = req.user.rol;
    const { fecha, hora } = req.body;

    if (!fecha || !hora) {
        return res.status(400).json({ message: 'Fecha y hora requeridas' });
    }

    // Obtener ID del médico de la cita
    const sqlCita = 'SELECT medico_id, paciente_id FROM citas WHERE id = ?';
    db.query(sqlCita, [citaId], (err, citaResult) => {
        if (err || citaResult.length === 0) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        const { medico_id, paciente_id } = citaResult[0];

        // Verificar si la nueva hora está dentro de la disponibilidad
        const diaSemana = new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', {
            weekday: 'long',
            timeZone: 'America/Lima'
        }).toLowerCase();

        const sqlDisponibilidad = `
            SELECT * FROM disponibilidad_medica
            WHERE medico_id = ? AND dia_semana = ? AND hora_inicio <= ? AND hora_fin >= ?
        `;

        db.query(sqlDisponibilidad, [medico_id, diaSemana, hora, hora], (err, disponibilidadResult) => {
            if (err) {
                console.error('Error al verificar disponibilidad:', err);
                return res.status(500).json({ message: 'Error al verificar disponibilidad' });
            }

            if (disponibilidadResult.length === 0) {
                return res.status(400).json({ message: 'La hora no está dentro de la disponibilidad del médico' });
            }

            // Si pasa la validación, se continúa con la reprogramación
            if (rol === 'paciente') {
                const sqlPaciente = 'SELECT id FROM pacientes WHERE usuario_id = ?';
                db.query(sqlPaciente, [usuario_id], (err, results) => {
                    if (err || results.length === 0) {
                        return res.status(404).json({ message: 'Paciente no encontrado' });
                    }

                    const paciente_id = results[0].id;

                    const sql = `UPDATE citas 
                                SET fecha = ?, hora = ?, estado = 'reprogramada' 
                                WHERE id = ? AND paciente_id = ? AND estado = 'pendiente'`;

                    db.query(sql, [fecha, hora, citaId, paciente_id], (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: 'Error al reprogramar' });
                        }

                        if (result.affectedRows === 0) {
                            return res.status(400).json({ message: 'No se pudo reprogramar la cita. Verifica que esté en estado pendiente o que te pertenezca.' });
                        }

                        res.json({ message: 'Cita reprogramada correctamente' });
                    });
                });
            } else if (rol === 'admin') {
                const sql = `UPDATE citas 
                            SET fecha = ?, hora = ?, estado = 'reprogramada'
                            WHERE id = ? AND estado = 'pendiente'`;

                db.query(sql, [fecha, hora, citaId], (err, result) => {
                    if (err) return res.status(500).json({ message: 'Error al reprogramar' });

                    if (result.affectedRows === 0) {
                        return res.status(400).json({ message: 'No se pudo reprogramar la cita. Verifica que esté en estado pendiente.' });
                    }

                    res.json({ message: 'Cita reprogramada por el administrador' });
                });
            }
        });
    });
};


module.exports = { crearCita, obtenerCitas, cancelarCita, reprogramarCita };
