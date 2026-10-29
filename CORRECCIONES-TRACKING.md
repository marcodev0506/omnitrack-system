# 🔧 Correcciones Aplicadas - Sistema de Tracking

## ✅ Problemas Corregidos

### 1. Botón de Cerrar Sesión
**Problema:** No había forma de cerrar sesión en la pantalla de tracking.

**Solución:** Agregué botón "Cerrar Sesión" que:
- Detiene el tracking GPS
- Desconecta el socket
- Limpia el ID de usuario global
- Navega de vuelta al login

### 2. Switch No Detenía Tracking Correctamente
**Problema:** Cuando se desactivaba el switch, el tracking seguía enviando datos.

**Causa:** El useEffect tenía un bug en la lógica de cleanup. La variable `subscription` era local y no se mantenía entre renders.

**Solución:**
- Separé las funciones `startTracking()` y `stopTracking()`
- Guardo la subscription en estado (`useState`)
- Llamo a `stopTracking()` explícitamente cuando el switch se desactiva
- Agregué cleanup en useEffect para detener tracking al desmontar el componente

### 3. Socket Seguía Conectado
**Problema:** El socket seguía conectado aunque el tracking estuviera desactivado.

**Solución:**
- En el logout, desconecto explícitamente el socket: `socket.disconnect()`
- Al iniciar tracking, reconecto automáticamente (socket.io maneja esto)

---

## 🧹 Limpieza de Redis Cache

### ¿Por qué limpiar Redis?

Redis almacena la última posición de cada conductor en caché (`last_pos:*`). Si:
- Un conductor cierra la app sin desconectar
- Hay datos de pruebas antiguos
- Hay datos de más de 24 horas

El script de sincronización seguirá procesando estos datos.

### Script de Limpieza Manual

**Archivo:** `backend-node/clean-redis.js`

**Uso:**
```bash
cd backend-node
node clean-redis.js
```

**O usar el script .bat (Windows):**
```bash
cd backend-node
clean-redis.bat
```

**Lo que hace:**
- Busca todas las llaves `last_pos:*` en Redis
- Las borra
- NO borra el historial en PostgreSQL (solo cache)
- Muestra cuántos registros fueron borrados

### Limpieza Automática al Iniciar Node.js

En `backend-node/index.js`, agregué código comentado para limpiar Redis automáticamente al iniciar:

```javascript
// Limpiar datos antiguos de Redis al iniciar (opcional)
// Comentado por defecto, descomentar si quieres limpiar siempre
/*
const keys = await redisClient.keys('last_pos:*');
if (keys.length > 0) {
    await redisClient.del(keys);
    console.log(`🧹 Limpiados ${keys.length} registros antiguos de Redis al iniciar`);
}
*/
```

**Para activar limpieza automática:**
1. Abre `backend-node/index.js`
2. Busca las líneas 50-56
3. Quita los comentarios `/*` y `*/`
4. Reinicia Node.js

### Recomendación de Uso

**Para desarrollo/pruebas:**
- Limpia Redis manualmente antes de cada demo: `node clean-redis.js`
- O activa la limpieza automática en `index.js`

**Para producción:**
- NO activar limpieza automática (borraría datos reales)
- Usar el script manual solo cuando sea necesario
- El script de sincronización ya ignora datos de más de 24 horas

---

## 🔄 Flujo Corregido de Tracking

### Flujo Normal:

1. **Chofer inicia sesión**
   - Login → ID guardado en `global.userId`
   - Navega a pantalla de tracking

2. **Chofer activa tracking**
   - Click en switch → `startTracking()`
   - Solicita permisos de GPS
   - Inicia `watchPositionAsync`
   - Comienza a enviar ubicaciones vía WebSocket

3. **Chofer desactiva tracking**
   - Click en switch → `stopTracking()`
   - Detiene `watchPositionAsync`
   - Deja de enviar ubicaciones
   - Socket sigue conectado (para reanudar rápido)

4. **Chofer cierra sesión**
   - Click en "Cerrar Sesión"
   - Llama a `stopTracking()`
   - Desconecta socket: `socket.disconnect()`
   - Limpia `global.userId`
   - Navega al login

### Si el chofer cierra la app abruptamente:

- El socket se desconecta automáticamente
- Los datos en Redis permanecen (última posición)
- Al reabrir la app, debe hacer login de nuevo
- Al activar tracking, se actualiza la posición en Redis

---

## 🐛 Solución al Bug de "Sigue enviando datos"

**Causa del bug original:**
```javascript
// CÓDIGO ANTIGUO (con bug)
useEffect(() => {
    let subscription;

    const startLocationUpdates = async () => {
        subscription = await Location.watchPositionAsync(...);
    };

    if (isTracking) {
        startLocationUpdates();
    } else {
        subscription && subscription.remove(); // ❌ subscription es undefined aquí
    }

    return () => subscription && subscription.remove();
}, [isTracking]);
```

**Problema:** `subscription` era una variable local dentro de `useEffect`. Cuando `isTracking` cambiaba, el efecto se re-ejecuaba y `subscription` se perdía.

**Solución aplicada:**
```javascript
// CÓDIGO NUEVO (corregido)
const [subscription, setSubscription] = useState(null);

const startTracking = async () => {
    const sub = await Location.watchPositionAsync(...);
    setSubscription(sub); // ✅ Guardar en estado
    setIsTracking(true);
};

const stopTracking = () => {
    if (subscription) {
        subscription.remove(); // ✅ Usar subscription del estado
        setSubscription(null);
    }
    setIsTracking(false);
};
```

**Beneficios:**
- Subscription persiste entre renders
- Funciones explícitas `start/stop` son más claras
- El switch ahora funciona correctamente
- Cleanup garantizado al desmontar componente

---

## 📋 Resumen de Cambios

### Archivos Modificados:

1. **`mobile-app/app/tracking.jsx`**
   - ✅ Agregado botón "Cerrar Sesión"
   - ✅ Separadas funciones `startTracking()` y `stopTracking()`
   - ✅ Subscription guardada en estado
   - ✅ Socket desconectado en logout
   - ✅ Cleanup al desmontar componente

2. **`backend-node/index.js`**
   - ✅ Agregado código de limpieza automática (comentado)
   - ✅ Mejorados logs de sincronización

### Archivos Nuevos:

3. **`backend-node/clean-redis.js`**
   - Script para limpiar cache de Redis manualmente

4. **`backend-node/clean-redis.bat`**
   - Script .bat para Windows (clic y ejecutar)

---

## 🎯 Pruebas Recomendadas

### Test 1: Activar/Desactivar Tracking
1. Abre la app móvil
2. Login
3. Activa el switch
4. Ver logs de Node.js → debe ver posiciones
5. Desactiva el switch
6. Ver logs de Node.js → debe dejar de ver posiciones ✅

### Test 2: Cerrar Sesión
1. Con tracking activo
2. Click en "Cerrar Sesión"
3. Ver logs de Node.js → debe ver "❌ Dispositivo desconectado"
4. Debe navegar al login ✅

### Test 3: Limpiar Redis
1. Con datos en Redis
2. Ejecutar: `cd backend-node && node clean-redis.js`
3. Ver logs → "✅ Borradas X llaves de Redis"
4. Verificar: `curl http://localhost:3001/last-location/3` → debe decir "No hay datos recientes" ✅

---

## 💡 Tips Adicionales

### Para debug en desarrollo:
- Ver logs en Expo: "Enviando posición del usuario: X"
- Ver logs en Node.js: "📍 Posición procesada para usuario X"
- Ver logs en Node.js: "❌ Dispositivo desconectado"

### Para saber si Redis está limpio:
```bash
cd backend-node
node clean-redis.js
# Si dice "No había datos para limpiar", está limpio
```

### Para limpiar solo datos de un usuario específico:
Actualmente el script borra todos. Si necesitas limpieza selectiva, puedo crear un script que filtre por user_id.

---

## ❓ Preguntas Frecuentes

**¿Debo limpiar Redis todos los días?**
- No es necesario si el script de sincronización ignora datos de más de 24 horas (ya implementado)
- Solo limpiar manualmente antes de demos importantes
- O activar limpieza automática si prefieres empezar siempre limpio

**¿Por qué no limpiar automáticamente siempre?**
- En producción, podrías borrar datos reales de conductores que están activos
- Mejor dejar que el filtro de 24 horas maneje datos antiguos
- Limpieza manual para casos específicos

**¿El logout desconecta el socket de todos?**
- Solo desconecta el socket del usuario que hace logout
- Otros usuarios conectados no se afectan

**¿Qué pasa si cierro la app sin logout?**
- El socket se desconecta automáticamente al cerrar la app
- La última posición permanece en Redis
- Al reabrir, debes hacer login de nuevo
