const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

const citasRoutes = require('./routes/citas.routes');
app.use('/api/citas', citasRoutes); // protegerá rutas como /api/citas

const usuariosRoutes = require('./routes/usuarios.routes');
app.use('/api/usuarios', usuariosRoutes);

const disponibilidadRoutes = require('./routes/disponibilidad.routes');
app.use('/api/disponibilidad', disponibilidadRoutes);
