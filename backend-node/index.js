// 1. IMPORTACIÓN DE LIBRERÍAS
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// 2. CONFIGURACIÓN DE LA APP
const app = express();
const port = 3001;

// 3. MIDDLEWARE (IMPORTANTE: Debe ir antes de las rutas)
// Esto permite que tu React (puerto 5173) hable con este servidor (puerto 3001)
app.use(cors());
app.use(express.json()); // Permite recibir datos en formato JSON

// 4. CONFIGURACIÓN DE LA BASE DE DATOS (POSTGRESQL)
const pool = new Pool({
  user: 'omnitrack_admin',
  host: '127.0.0.1',
  database: 'omnitrack',
  password: 'superpassword123',
  port: 5433, // El puerto que configuramos en Docker para evitar choques
});

// 5. RUTAS
// Ruta de prueba para verificar que el servidor está vivo
app.get('/', (req, res) => {
  res.send('Servidor de Node.js para OmniTrack funcionando 🚀');
});

// Ruta para obtener usuarios de la base de datos (la que usa React)
app.get('/test-db', async (req, res) => {
  try {
    // Consultamos la tabla 'users' (la que creó Laravel)
    const result = await pool.query('SELECT id, name, email FROM users');
    
    res.json({
      success: true,
      mensaje: "Conexión exitosa desde Node.js",
      tablas_encontradas: result.rows
    });
  } catch (err) {
    console.error("Error en la consulta:", err.message);
    res.status(500).json({ 
      success: false, 
      error: "Error al conectar con la base de datos",
      details: err.message 
    });
  }
});

// 6. ENCENDIDO DEL SERVIDOR
app.listen(port, () => {
  console.log('-------------------------------------------');
  console.log(` Servidor Node corriendo en: http://localhost:${port}`);
  console.log(`🔌 Conectado a PostgreSQL en el puerto: 5433`);
  console.log('-------------------------------------------');
});