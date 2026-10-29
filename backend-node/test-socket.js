// Script para simular un chofer enviando ubicación GPS vía WebSocket
// Simula el comportamiento REAL de la app móvil
// Usa socket.io-client como la app móvil

const io = require('socket.io-client');

// Configuración
const SERVER_URL = 'http://localhost:3001';
const DRIVER_ID = 3; // ID del chofer a simular
const INTERVAL_MS = 3000; // Enviar ubicación cada 3 segundos

// Coordenadas iniciales (Caracas, Venezuela)
const INITIAL_LAT = 10.4806;
const INITIAL_LNG = -66.9036;

let currentLat = INITIAL_LAT;
let currentLng = INITIAL_LNG;

console.log('🚀 Iniciando simulación de chofer (WebSocket)...');
console.log(`📍 Conectando a: ${SERVER_URL}`);
console.log(`👤 ID de chofer: ${DRIVER_ID}`);
console.log(`⏱️  Intervalo: ${INTERVAL_MS}ms\n`);

const socket = io(SERVER_URL);

socket.on('connect', () => {
  console.log('✅ Conectado al servidor WebSocket (como la app móvil)');
  console.log('� Enviando ubicaciones GPS...\n');

  // Simular movimiento del chofer
  const interval = setInterval(() => {
    // Simular movimiento aleatorio (pequeños cambios en lat/lng)
    currentLat += (Math.random() - 0.5) * 0.001;
    currentLng += (Math.random() - 0.5) * 0.001;

    const coords = {
      lat: currentLat,
      lng: currentLng,
      driver_id: DRIVER_ID
    };

    // Emitir evento driver_movement (IGUAL que la app móvil)
    socket.emit('driver_movement', coords);

    console.log(`📍 Enviando al servidor: Lat ${currentLat.toFixed(6)}, Lng ${currentLng.toFixed(6)}`);
  }, INTERVAL_MS);

  // Permitir detener con Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n⏹️  Deteniendo simulación...');
    clearInterval(interval);
    socket.disconnect();
    process.exit(0);
  });
});

socket.on('driver_position', (data) => {
  console.log(`📡 Recibido eco del servidor:`, data);
});

socket.on('connect_error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor');
});
