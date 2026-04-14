// 1. IMPORTACIÓN DE LIBRERÍAS
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const http = require('http'); // Necesario para envolver Express con WebSockets
const { Server } = require('socket.io');

// 2. CONFIGURACIÓN INICIAL
const app = express();
const port = 3001;

// Creamos el servidor HTTP usando Express
const server = http.createServer(app);

// Configuramos Socket.io con permisos para el puerto de React
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // URL de tu Frontend
        methods: ["GET", "POST"]
    }
});

// 3. MIDDLEWARES
app.use(cors());
app.use(express.json());

// 4. CONEXIÓN A LA BASE DE DATOS (POSTGRESQL)
const pool = new Pool({
  user: 'omnitrack_admin',
  host: '127.0.0.1',
  database: 'omnitrack',
  password: 'superpassword123',
  port: 5433, // Puerto que definimos en Docker para evitar choques
});

// 5. LÓGICA DE TIEMPO REAL (SIMULACIÓN DE MOVIMIENTO)
// Empezamos en Caracas
let lat = 10.4806;
let lng = -66.9036;

// Cada 1 segundo generamos un pequeño movimiento y lo enviamos a React
setInterval(() => {
    lat += (Math.random() - 0.5) * 0.0015;
    lng += (Math.random() - 0.5) * 0.0015;
    
    // El servidor "empuja" la nueva posición a todos los conectados
    io.emit('driver_position', { lat, lng });
}, 1000);

io.on('connection', (socket) => {
    console.log('📱 App Móvil Conectada');

    // Escuchar el movimiento REAL del celular
    socket.on('driver_movement', (data) => {
        console.log(`📍 GPS Real: ${data.lat}, ${data.lng}`);
        
        // Re-transmitir a React para que el mapa se mueva
        io.emit('driver_position', data);
    });
});
// 6. RUTAS DE LA API (HTTP)

// Ruta base
app.get('/', (req, res) => {
    res.send('Servidor OmniTrack Node.js con WebSockets Activo 🚀');
});

// Ruta para que React obtenga los usuarios de la DB de Laravel
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users');
    res.json({
      success: true,
      tablas_encontradas: result.rows
    });
  } catch (err) {
    console.error("Error consultando DB:", err.message);
    res.status(500).json({ error: "Error de conexión a la base de datos" });
  }
});

// 7. ENCENDIDO DEL SERVIDOR
// IMPORTANTE: Usamos 'server.listen', no 'app.listen' para que Socket.io funcione
server.listen(port, () => {
  console.log('--------------------------------------------------');
  console.log(`🚀 SERVIDOR HÍBRIDO CORRIENDO EN PUERTO ${port}`);
  console.log(`📍 WebSockets activos para tiempo real`);
  console.log(`🐘 Conectado a Postgres en puerto 5433`);
  console.log('--------------------------------------------------');
});