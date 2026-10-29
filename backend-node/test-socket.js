// Script para simular datos de ubicación directamente en Redis
// Útil para pruebas sin necesidad de la app móvil

const redis = require('redis');
const { Pool } = require('pg');

// Configuración
const DRIVER_ID = 3;
const INTERVAL_MS = 3000; // Enviar cada 3 segundos

// Coordenadas iniciales (Caracas, Venezuela)
const INITIAL_LAT = 10.4806;
const INITIAL_LNG = -66.9036;

let currentLat = INITIAL_LAT;
let currentLng = INITIAL_LNG;

// Conexión a Redis
const redisClient = redis.createClient({
    url: 'redis://127.0.0.1:6380'
});

// Conexión a PostgreSQL
const pool = new Pool({
    user: 'omnitrack_admin',
    host: '127.0.0.1',
    database: 'omnitrack',
    password: 'superpassword123',
    port: 5433,
});

async function simulateDriver() {
    try {
        await redisClient.connect();
        console.log('� Iniciando simulación de chofer...');
        console.log(`👤 ID de chofer: ${DRIVER_ID}`);
        console.log(`⏱️  Intervalo: ${INTERVAL_MS}ms\n`);

        const interval = setInterval(async () => {
            // Simular movimiento aleatorio
            currentLat += (Math.random() - 0.5) * 0.001;
            currentLng += (Math.random() - 0.5) * 0.001;

            // Guardar en Redis
            await redisClient.set(`last_pos:${DRIVER_ID}`, JSON.stringify({
                lat: currentLat,
                lng: currentLng,
                updated_at: new Date()
            }));

            // Guardar en PostgreSQL
            await pool.query(
                'INSERT INTO locations (user_id, lat, lng, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
                [DRIVER_ID, currentLat, currentLng]
            );

            console.log(`📍 Usuario ${DRIVER_ID}: (${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}) guardado en Redis+DB`);
        }, INTERVAL_MS);

        // Permitir detener con Ctrl+C
        process.on('SIGINT', async () => {
            console.log('\n⏹️  Deteniendo simulación...');
            clearInterval(interval);
            await redisClient.quit();
            await pool.end();
            process.exit(0);
        });

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

simulateDriver();

