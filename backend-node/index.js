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

        // Limpiar datos antiguos de Redis al iniciar
        const keys = await redisClient.keys('last_pos:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`🧹 Limpiados ${keys.length} registros antiguos de Redis al iniciar`);
        } else {
            console.log('✅ Redis está limpio, no hay datos de posiciones');
        }
        
    } catch (err) {
        console.error("No se pudo conectar a Redis", err);
    }
}
connectServices();

// 5. LÓGICA DE WEBSOCKETS (El "Cerebro" del Tiempo Real)
io.on('connection', (socket) => {
    console.log('📱 Dispositivo conectado al sistema');

    // Variable para guardar última posición y calcular velocidad
    let lastPosition = null;
    let lastTime = null;

    socket.on('driver_movement', async (data) => {
        const { lat, lng, driver_id } = data;
        const userId = driver_id || 1;
        const currentTime = new Date();

        // Calcular velocidad si tenemos posición anterior
        let speed = 0;
        if (lastPosition && lastTime) {
            const timeDiff = (currentTime - lastTime) / 1000; // en segundos
            if (timeDiff > 0) {
                // Calcular distancia entre puntos (en km)
                const distance = calculateDistance(
                    lastPosition.lat, lastPosition.lng,
                    lat, lng
                );
                // Velocidad = distancia / tiempo (km/h)
                speed = (distance / timeDiff) * 3600;
            }
        }

        // Guardar posición actual
        lastPosition = { lat, lng };
        lastTime = currentTime;

        try {
            // A. ACTUALIZAR REDIS (Estado actual volátil)
            await redisClient.set(`last_pos:${userId}`, JSON.stringify({
                lat,
                lng,
                speed,
                updated_at: currentTime.toISOString()
            }));

            // B. GUARDAR EN POSTGRESQL (Historial para Reportes)
            await pool.query(
                'INSERT INTO locations (user_id, lat, lng, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
                [userId, lat, lng]
            );

            // C. RETRANSMITIR AL DASHBOARD (React) con velocidad
            io.emit('driver_position', { lat, lng, userId, speed });

            console.log(`📍 Usuario ${userId}: (${lat.toFixed(6)}, ${lng.toFixed(6)}) | Vel: ${speed.toFixed(1)} km/h`);
        } catch (err) {
            console.error("❌ Error en el procesamiento de movimiento:", err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Dispositivo desconectado');
    });
});

// Función auxiliar para calcular distancia (fórmula Haversine simplificada)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

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
// NOTA: El script de sincronización se eliminó porque:
// - WebSockets ya guardan todas las ubicaciones en tiempo real en PostgreSQL
// - Redis solo mantiene la última posición como caché rápida
// - No es necesario un script de intervalo para volcar datos
// - Este diseño usa WebSockets para true real-time, no polling/volcado

// 7. ARRANQUE DEL SERVIDOR
server.listen(port, () => {
    console.log('===========================================');
    console.log(`🚀 SERVIDOR NODE.JS OPERATIVO`);
    console.log(`📡 Escuchando en: http://localhost:${port}`);
    console.log(`🧠 Caché en Redis (6380) | 📊 Historial en Postgres (5433)`);
    console.log('===========================================');
});