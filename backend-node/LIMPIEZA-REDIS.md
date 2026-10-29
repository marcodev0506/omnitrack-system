# 🧹 Limpieza Automática de Redis al Iniciar Node.js

## ✅ Configuración Actual

**Estado:** ACTIVO - Redis se limpia automáticamente cada vez que inicia Node.js

**Ubicación:** `backend-node/index.js` (líneas 50-57)

**Comportamiento:**
- Al ejecutar `node index.js`, se borran TODOS los datos de posiciones en Redis
- Solo se borran las llaves `last_pos:*` (posiciones de conductores)
- NO se borra el historial en PostgreSQL
- Se muestra cuántos registros fueron borrados

---

## 📋 Qué Verás al Iniciar Node.js

### Si hay datos en Redis:
```
🚀 Redis conectado en puerto 6380
🧹 Limpiados 2 registros antiguos de Redis al iniciar
```

### Si Redis está limpio:
```
🚀 Redis conectado en puerto 6380
✅ Redis está limpio, no hay datos de posiciones
```

---

## 🔧 Cómo Desactivar la Limpieza Automática

Si en el futuro NO quieres que se limpie automáticamente:

1. Abre `backend-node/index.js`
2. Busca las líneas 50-57
3. Comenta el código agregando `/*` al inicio y `*/` al final:

```javascript
// Limpiar datos antiguos de Redis al iniciar
/*
const keys = await redisClient.keys('last_pos:*');
if (keys.length > 0) {
    await redisClient.del(keys);
    console.log(`🧹 Limpiados ${keys.length} registros antiguos de Redis al iniciar`);
} else {
    console.log('✅ Redis está limpio, no hay datos de posiciones');
}
*/
```

4. Guarda el archivo
5. Reinicia Node.js

---

## 🎯 Cuándo Usar Limpieza Automática

### ✅ Recomendado para:
- **Desarrollo/testing:** Empezar siempre con estado limpio
- **Demos:** Garantizar que no hay datos de pruebas anteriores
- **Debugging:** Evitar confusiones con datos antiguos

### ❌ NO recomendado para:
- **Producción:** Podrías borrar datos reales de conductores activos
- **Ambientes multi-usuario:** Si múltiples usuarios usan el sistema simultáneamente

---

## 🔄 Alternativa: Limpieza Manual

Si prefieres controlar cuándo limpiar Redis:

1. Desactiva la limpieza automática (ver arriba)
2. Usa el script manual cuando quieras:
   ```bash
   cd backend-node
   node clean-redis.js
   ```
3. O usa el .bat (Windows):
   ```bash
   cd backend-node
   clean-redis.bat
   ```

---

## 📊 Impacto de la Limpieza

### Lo que se borra:
- ✅ Última posición de cada conductor en Redis (`last_pos:*`)
- ✅ Caché de posiciones volátiles

### Lo que NO se borra:
- ✅ Historial completo en PostgreSQL
- ✅ Datos de usuarios
- ✅ Configuración del sistema

### Consecuencias:
- 📱 Los conductores deben enviar nueva posición para reaparecer en Redis
- 🖥️ El frontend web no mostrará posición hasta que el conductor envíe GPS nuevamente
- ⚡ El script de sincronización dirá "0 conductores" hasta que alguien envíe datos

---

## 🧪 Prueba de la Configuración

### Paso 1: Ver limpieza activa
```bash
cd backend-node
node index.js
```

Deberías ver:
```
🧹 Limpiados X registros antiguos de Redis al iniciar
```

### Paso 2: Simular datos
```bash
node test-socket.js
```

### Paso 3: Detener y reiniciar Node.js
Presiona `Ctrl+C` en Node.js, luego:
```bash
node index.js
```

Deberías ver limpieza de nuevo:
```
🧹 Limpiados 1 registros antiguos de Redis al iniciar
```

---

## 💡 Resumen

**Actual:** Limpieza automática ACTIVA ✅
- Redis se limpia cada vez que inicias Node.js
- Ideal para desarrollo y demos
- Fácil de desactivar si necesitas persistencia

**Para producción:** Desactivar y usar limpieza manual cuando sea necesario

**Para testing:** Mantener activa - simplifica mucho el flujo de pruebas
