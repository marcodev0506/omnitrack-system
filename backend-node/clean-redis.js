// Script para limpiar datos de posiciones en Redis
// Uso: node clean-redis.js

const redis = require('redis');

const redisClient = redis.createClient({
    url: 'redis://127.0.0.1:6380'
});

async function cleanRedis() {
    try {
        await redisClient.connect();
        console.log('🧹 Limpiando Redis...\n');

        // Buscar todas las llaves de posiciones
        const keys = await redisClient.keys('last_pos:*');
        console.log(`📊 Encontradas ${keys.length} llaves de posiciones`);

        if (keys.length > 0) {
            // Borrar todas las llaves
            await redisClient.del(keys);
            console.log(`✅ Borradas ${keys.length} llaves de Redis`);
            console.log('💡 Los datos históricos en PostgreSQL se mantienen intactos');
        } else {
            console.log('✅ No había datos para limpiar');
        }

        await redisClient.quit();
        console.log('\n🎉 Limpieza completada');
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

cleanRedis();
