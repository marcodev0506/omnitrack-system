const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3001; // Nota que usamos el 3001 para no chocar con Laravel

// Configuración de la conexión a la base de datos (la misma que Laravel)
const pool = new Pool({
  user: 'omnitrack_admin',
  host: '127.0.0.1',
  database: 'omnitrack',
  password: 'superpassword123',
  port: 5433, // El puerto que pusimos en el docker-compose
});

app.get('/test-db', async (req, res) => {
  try {
    // Vamos a consultar la tabla 'users' que Laravel creó por nosotros
    const result = await pool.query('SELECT * FROM users');
    res.json({
      mensaje: "¡Hola desde Node.js!",
      tablas_encontradas: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor de Node corriendo en http://localhost:${port}`);
});