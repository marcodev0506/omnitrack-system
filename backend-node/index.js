// 1. IMPORTACIONES
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
const redis = require('redis');

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

// 4. CONEXIONES A BASES DE DATOS

// PostgreSQL (Historial a largo plazo)
const pool = new Pool({
    user: 'omnitrack_admin',
    host: '127.0.0.1',
    database: 'omnitrack',
    password: 'superpassword123',
    port: 5433, 
});

// Redis (Caché ultra rápida - Puerto 6380 según tu Docker)
const redisClient = redis.createClient({
    url: 'redis://127.0.0.1:6380' 
});

redisClient.on('error', err => console.log('❌ Error en Redis:', err));

async function connectServices() {
    try {
        await redisClient.connect();
        console.log("🚀 Redis conectado en puerto 6380");
    } catch (err) {
        console.error("No se pudo conectar a Redis", err);
    }
}
connectServices();

// 5. LÓGICA DE WEBSOCKETS (El "Cerebro" del Tiempo Real)
io.on('connection', (socket) => {
    console.log('📱 Dispositivo conectado al sistema');

    socket.on('driver_movement', async (data) => {
        const { lat, lng, driver_id } = data;
        const userId = driver_id || 1; 

        try {
            // A. ACTUALIZAR REDIS (Estado actual volátil)
            // Esto permite que Django o React sepan dónde está el chofer sin tocar Postgres
            await redisClient.set(`last_pos:${userId}`, JSON.stringify({
                lat, 
                lng, 
                updated_at: new Date()
            }));

            // B. GUARDAR EN POSTGRESQL (Historial para Reportes)
            await pool.query(
                'INSERT INTO locations (user_id, lat, lng, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
                [userId, lat, lng]
            );

            // C. RETRANSMITIR AL DASHBOARD (React)
            io.emit('driver_position', { lat, lng, userId });

            console.log(`📍 Posición procesada (Redis+DB) para usuario ${userId}: ${lat}, ${lng}`);
        } catch (err) {
            console.error("❌ Error en el procesamiento de movimiento:", err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Dispositivo desconectado');
    });
});

// 6. RUTAS DE LA API

app.get('/', (req, res) => {
    res.send('OmniTrack Node Server - Redis & Postgres Active 🚀');
});

// Obtener última posición desde REDIS (Mucho más rápido que ir a Postgres)
app.get('/last-location/:userId', async (req, res) => {
    const { userId } = req.params;
    const data = await redisClient.get(`last_pos:${userId}`);
    res.json(data ? JSON.parse(data) : { message: "No hay datos recientes" });
});

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email FROM users');
        res.json({ success: true, tablas_encontradas: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
setInterval(async () => {
    console.log("🔄 Iniciando volcado masivo de Redis a PostgreSQL...");
    
    try {
        // 1. Buscamos todas las llaves de posiciones en Redis
        const keys = await redisClient.keys('last_pos:*');
        
        if (keys.length === 0) return;

        for (const key of keys) {
            const data = JSON.parse(await redisClient.get(key));
            const userId = key.split(':')[1];

            // 2. Guardamos solo si es necesario o en lote
            // Aquí podrías implementar una lógica que solo guarde si la distancia cambió
            await pool.query(
                'INSERT INTO locations (user_id, lat, lng, created_at) VALUES ($1, $2, $3, NOW())',
                [userId, data.lat, data.lng]
            );
        }
        console.log(`✅ Sincronizados ${keys.length} conductores.`);
    } catch (err) {
        console.error(" Error en el volcado masivo:", err);
    }
}, 30000); // 30 segundos

// 7. ARRANQUE DEL SERVIDOR
server.listen(port, () => {
    console.log('===========================================');
    console.log(`🚀 SERVIDOR NODE.JS OPERATIVO`);
    console.log(`📡 Escuchando en: http://localhost:${port}`);
    console.log(`🧠 Caché en Redis (6380) | 📊 Historial en Postgres (5433)`);
    console.log('===========================================');
});