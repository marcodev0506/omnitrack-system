// 1. IMPORTACIONES
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');

// 2. CONFIGURACIÓN DE LA APP Y SERVIDOR
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const port = 3001;

// 3. MIDDLEWARES
app.use(cors());
app.use(express.json());

// 4. CONEXIÓN A POSTGRESQL (La misma que usa Laravel)
const pool = new Pool({
    user: 'omnitrack_admin',
    host: '127.0.0.1',
    database: 'omnitrack',
    password: 'superpassword123',
    port: 5433, 
});

// 5. LÓGICA DE WEBSOCKETS (Tiempo Real + Historial)
io.on('connection', (socket) => {
    console.log('📱 Dispositivo conectado al sistema de rastreo');

    // Escuchar el movimiento que manda la App Móvil
    socket.on('driver_movement', async (data) => {
        const { lat, lng, driver_id } = data;
        const userId = driver_id || 1; // Por ahora usamos ID 1 por defecto

        try {
            // A. GUARDAR EN EL HISTORIAL (Base de Datos)
            // Usamos NOW() para que Postgres asigne la hora exacta de Caracas
            await pool.query(
                'INSERT INTO locations (user_id, lat, lng, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
                [userId, lat, lng]
            );

            // B. RETRANSMITIR AL DASHBOARD (React)
            // Enviamos los datos para que el marcador se mueva y la línea se dibuje
            io.emit('driver_position', { lat, lng, userId });

            console.log(`📍 Posición guardada para usuario ${userId}: ${lat}, ${lng}`);
        } catch (err) {
            console.error("❌ Error al guardar en historial:", err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Dispositivo desconectado');
    });
});

// 6. RUTAS DE LA API (Endpoints)

// Ruta base
app.get('/', (req, res) => {
    res.send('OmniTrack Node Server - Modo Historial Activo 🚀');
});

// Ruta para ver usuarios (Sincronización con Laravel)
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email FROM users');
        res.json({ success: true, tablas_encontradas: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NUEVA RUTA: Obtener todo el rastro de un chofer (Para la Polyline de React)
app.get('/history/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            'SELECT lat, lng FROM locations WHERE user_id = $1 ORDER BY created_at ASC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. ARRANQUE DEL SERVIDOR
server.listen(port, () => {
    console.log('===========================================');
    console.log(`🚀 SERVIDOR NODE.JS OPERATIVO`);
    console.log(`📡 Escuchando en: http://localhost:${port}`);
    console.log(`📊 Historial de rutas activado en PostgreSQL`);
    console.log('===========================================');
});