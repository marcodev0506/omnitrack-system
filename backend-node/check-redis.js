// Script para verificar y limpiar datos de Redis
const redis = require('redis');

const redisClient = redis.createClient({
    url: 'redis://127.0.0.1:6380'
});

async function checkRedis() {
    try {
        await redisClient.connect();
        console.log('🔍 Conectado a Redis\n');

        // Buscar todas las llaves de posiciones
        const keys = await redisClient.keys('last_pos:*');
        console.log(`📊 Total de llaves 'last_pos:*' encontradas: ${keys.length}\n`);

        if (keys.length > 0) {
            console.log('📍 Datos actuales en Redis:');
            for (const key of keys) {
                const data = await redisClient.get(key);
                const parsed = JSON.parse(data);
                console.log(`   ${key}:`);
                console.log(`     - Lat: ${parsed.lat}`);
                console.log(`     - Lng: ${parsed.lng}`);
                console.log(`     - Actualizado: ${parsed.updated_at}\n`);
            }

            console.log('⚠️  ¿Deseas limpiar estos datos?');
            console.log('   Esto borrará TODAS las posiciones en Redis.');
            console.log('   Los datos en PostgreSQL NO se afectan.\n');
            console.log('   Para limpiar, ejecuta: node clean-redis.js');
        } else {
            console.log('✅ Redis está limpio, no hay datos de posiciones.');
        }

        await redisClient.quit();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

checkRedis();
