const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = (req, res) => {
    const { nombre, email, password, rol, especialidad, numero_colegiatura, dni, fecha_nacimiento, telefono, direccion } = req.body;

    if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const sqlUsuario = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)';
    db.query(sqlUsuario, [nombre, email, hashedPassword, rol], (err, result) => {
        if (err) {
            console.error('Error al registrar usuario:', err);
            return res.status(500).json({ message: 'Error al registrar usuario' });
        }

        const usuarioId = result.insertId;

        if (rol === 'medico') {
            const sqlMedico = `
                INSERT INTO medicos (usuario_id, especialidad, numero_colegiatura)
                VALUES (?, ?, ?)
            `;
            db.query(sqlMedico, [usuarioId, especialidad || '', numero_colegiatura || ''], (err2) => {
                if (err2) {
                    console.error('Error al registrar médico:', err2);
                    return res.status(500).json({ message: 'Error al registrar médico' });
                }
                return res.status(201).json({ message: 'Médico registrado correctamente' });
            });
        } else if (rol === 'paciente') {
            const sqlPaciente = `
                INSERT INTO pacientes (usuario_id, dni, fecha_nacimiento, telefono, direccion)
                VALUES (?, ?, ?, ?, ?)
            `;
            db.query(sqlPaciente, [usuarioId, dni || '', fecha_nacimiento || null, telefono || '', direccion || ''], (err3) => {
                if (err3) {
                    console.error('Error al registrar paciente:', err3);
                    return res.status(500).json({ message: 'Error al registrar paciente' });
                }
                return res.status(201).json({ message: 'Paciente registrado correctamente' });
            });
        } else {
            return res.status(201).json({ message: 'Usuario registrado correctamente' });
        }
    });
};

const login = (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error en el servidor' });
        if (results.length === 0) return res.status(401).json({ message: 'Email no registrado' });

        const user = results[0];

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user.id, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            usuario: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });
    });
};

module.exports = { register, login };
