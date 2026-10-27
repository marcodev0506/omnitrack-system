# Guía de Pruebas - OmniTrack System

Esta guía explica qué hace cada servicio y cómo probarlo paso a paso.

## 🏗️ Arquitectura del Sistema

### Infraestructura
- **PostgreSQL** (puerto 5433): Base de datos principal - almacena usuarios, ubicaciones históricas
- **Redis** (puerto 6380): Caché ultra rápida - almacena posiciones en tiempo real

### Servicios Backend
- **Backend Node.js** (puerto 3001): Servidor WebSockets - cerebro del tiempo real
- **Backend Django** (puerto 8000): API REST Python - motor de IA y analytics
- **Backend Laravel** (puerto 8000): API REST PHP - autenticación y gestión de usuarios

### Frontends
- **Frontend React** (puerto 5173): Dashboard web para monitoreo
- **Mobile App** (Expo): App móvil para choferes

---

## 📋 Prerequisitos

1. **Iniciar infraestructura Docker:**
   ```bash
   docker-compose up -d
   ```
   Verificar que estén corriendo:
   ```bash
   docker ps
   ```

2. **Actualizar IP si cambió:**
   ```bash
   powershell -ExecutionPolicy Bypass -File .\update-ip.ps1
   ```

---

## 🧪 Cómo Probar Cada Servicio

### 1️⃣ Backend Node.js (WebSockets)

**¿Qué hace?**
- Recibe ubicaciones GPS en tiempo real vía WebSockets
- Guarda en Redis (caché rápido) y PostgreSQL (historial)
- Emite posiciones en tiempo real al frontend
- Exibe API REST para consultas

**¿Cómo probarlo?**

**Paso 1: Iniciar el servidor**
```bash
cd backend-node
npm install
node index.js
```

Deberías ver:
```
===========================================
🚀 SERVIDOR NODE.JS OPERATIVO
📡 Escuchando en: http://localhost:3001
🧠 Caché en Redis (6380) | 📊 Historial en Postgres (5433)
===========================================
```

**Paso 2: Probar conexión a la base de datos**
```bash
curl http://localhost:3001/test-db
```

Si funciona, retorna datos de usuarios de PostgreSQL.

**Paso 3: Probar WebSocket (simular chofer móvil)**

Crea un archivo `test-socket.js`:
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Conectado al servidor WebSocket');

  // Simular movimiento del chofer
  setInterval(() => {
    const lat = 10.4806 + (Math.random() - 0.5) * 0.01;
    const lng = -66.9036 + (Math.random() - 0.5) * 0.01;

    socket.emit('driver_movement', {
      lat: lat,
      lng: lng,
      driver_id: 2  // ID del chofer
    });

    console.log(`📍 Enviando: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  }, 2000); // Cada 2 segundos
});

socket.on('driver_position', (data) => {
  console.log('📡 Recibido en tiempo real:', data);
});
```

Ejecutar:
```bash
node test-socket.js
```

**Paso 4: Probar API REST**

Obtener última posición (desde Redis):
```bash
curl http://localhost:3001/last-location/2
```

Obtener historial de ubicaciones (desde PostgreSQL):
```bash
curl http://localhost:3001/history/2
```

---

### 2️⃣ Backend Django (Motor de IA & Analytics)

**¿Qué hace?**
- Calcula velocidad promedio del chofer
- Predice tiempos de llegada con Machine Learning
- Genera alertas de velocidad
- Provee analytics avanzados

**¿Cómo probarlo?**

**Paso 1: Iniciar servidor**
```bash
cd backend-django
venv\Scripts\activate  # Windows
python manage.py migrate
python manage.py runserver
```

**Paso 2: Probar panel de administración**
Abre en navegador: `http://localhost:8000/admin/`

Si es la primera vez, crea un superusuario:
```bash
python manage.py createsuperuser
```

**Paso 3: Probar API de Analytics**

Prueba el endpoint de análisis de velocidad:
```bash
curl http://localhost:8000/api/analytics/speed/2/
```

Respuesta esperada:
```json
{
  "driver_id": 2,
  "speed_kph": 45.5,
  "status": "En movimiento",
  "total_choferes_analizados": 5,
  "ia_prediction": {
    "tiempo_estimado_tramo": "120 seg",
    "confianza": "Alta"
  },
  "geo_alert": "✅ En zona",
  "recomendacion": "Ruta fluida"
}
```

**Paso 4: Verificar datos en PostgreSQL**
Dentro de Django admin, verifica la tabla `locations` para ver las ubicaciones guardadas.

---

### 3️⃣ Backend Laravel (Autenticación)

**¿Qué hace?**
- Maneja login de choferes
- Genera tokens de autenticación (Sanctum)
- Gestiona usuarios

**¿Cómo probarlo?**

**Paso 1: Configurar**
```bash
cd backend-laravel
cp .env.example .env
```

Editar `.env` y configurar PostgreSQL:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5433
DB_DATABASE=omnitrack
DB_USERNAME=omnitrack_admin
DB_PASSWORD=superpassword123
```

**Paso 2: Instalar y migrar**
```bash
composer install
php artisan key:generate
php artisan migrate
```

**Paso 3: Iniciar servidor**
```bash
php artisan serve
```

**Paso 4: Probar login de chofer**

Primero necesitas crear un usuario en la base de datos. Puedes hacerlo vía tinker:
```bash
php artisan tinker
```

```php
use App\Models\User;
User::create([
    'name' => 'Marco Developer',
    'email' => 'marco@omnitrack.com',
    'password' => bcrypt('password123')
]);
```

Luego prueba el endpoint de login:
```bash
curl -X POST http://localhost:8000/api/login-mobile \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marco@omnitrack.com",
    "password": "password123",
    "device_name": "Samsung de Marco"
  }'
```

Respuesta esperada:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "Marco Developer",
    "email": "marco@omnitrack.com"
  }
}
```

---

### 4️⃣ Frontend React (Dashboard Web)

**¿Qué hace?**
- Muestra mapa en tiempo real con ubicación de choferes
- Gráfica de telemetría de velocidad
- Lista de personal registrado
- Panel de inteligencia logística (conecta a Django IA)

**¿Cómo probarlo?**

**Paso 1: Iniciar servidor**
```bash
cd frontend-app
npm install
npm run dev
```

**Paso 2: Abrir en navegador**
Abre: `http://localhost:5173`

**Paso 3: Verificar funcionalidades**

✅ **Mapa en tiempo real:**
- El mapa debería mostrar un marcador en Caracas
- Si el backend Node.js está recibiendo datos, el marcador se moverá

✅ **Lista de usuarios:**
- Debería mostrar usuarios de la base de datos
- Conecta a Node.js endpoint `/test-db`

✅ **Gráfica de velocidad:**
- Muestra telemetría en tiempo real
- Se actualiza cuando llega data vía WebSocket

✅ **Inteligencia Logística:**
- Click en "Ejecutar Reporte IA"
- Conecta a Django endpoint `/api/analytics/speed/2/`
- Muestra predicción de tráfico y velocidad

**Paso 4: Simular datos para el dashboard**

Con el archivo `test-socket.js` corriendo (del paso 1), el dashboard debería:
- Ver el marcador moverse en el mapa
- Ver la línea de ruta actualizarse
- Ver la gráfica de velocidad actualizarse

---

### 5️⃣ Mobile App (Expo React Native)

**¿Qué hace?**
- App para choferes
- Login con Laravel
- Envía ubicación GPS en tiempo real a Node.js
- Switch para activar/desactivar rastreo

**¿Cómo probarlo?**

**Paso 1: Iniciar servidor**
```bash
cd mobile-app
npm install
npx expo start
```

**Nota:** Si tienes errores de versión, ejecuta:
```bash
npx expo install --fix
```

**Paso 2: Abrir en dispositivo móvil**

Opción A - **Expo Go (más fácil):**
1. Instala Expo Go en tu celular desde App Store/Play Store
2. Escanea el QR que aparece en la terminal
3. Deberías usar la versión compatible con SDK 54

Opción B - **Web:**
Presiona `w` en la terminal para abrir en navegador

Opción C - **Emulador:**
- Presiona `a` para Android
- Presiona `i` para iOS (solo Mac)

**Paso 3: Probar Login**

En la app móvil:
1. Ingresa email: `marco@omnitrack.com`
2. Ingresa password: `password123`
3. Click en "Iniciar Jornada"

Si Laravel está corriendo, debería navegar a la pantalla de tracking.

**Paso 4: Probar Rastreo GPS**

En la pantalla de tracking:
1. Activa el switch "EN LÍNEA"
2. Otorga permisos de ubicación
3. La app empezará a enviar ubicación a Node.js

**Paso 5: Verificar transmisión**

En el terminal de Node.js deberías ver:
```
📱 Dispositivo conectado al sistema
📍 Posición procesada (Redis+DB) para usuario 2: 10.4806, -66.9036
```

En el frontend React, el marcador debería moverse en tiempo real.

---

## 🔄 Flujo Completo de Prueba

### Escenario: Chofer en ruta, Dashboard monitoreando

**Prerequisitos:**
- Docker corriendo (PostgreSQL + Redis)
- Backend Node.js corriendo (puerto 3001)
- Backend Django corriendo (puerto 8000)
- Backend Laravel corriendo (puerto 8000)
- Frontend React corriendo (puerto 5173)
- Mobile App corriendo

**Paso 1: Crear usuario en Laravel**
```bash
cd backend-laravel
php artisan tinker
```
```php
User::create(['name' => 'Marco', 'email' => 'marco@test.com', 'password' => bcrypt('123456')])
```

**Paso 2: Login en Mobile App**
- Abre la app móvil
- Ingresa credenciales
- Navega a pantalla de tracking

**Paso 3: Activar rastreo**
- Activa el switch en la app móvil
- Concede permisos de GPS

**Paso 4: Verificar en Dashboard Web**
- Abre `http://localhost:5173`
- Verás el marcador moverse en el mapa
- La gráfica de velocidad se actualiza

**Paso 5: Ejecutar reporte IA**
- Click en "Ejecutar Reporte IA"
- Verás análisis de velocidad y predicción de tráfico

**Paso 6: Verificar datos en base de datos**
- Visita `http://localhost:8000/admin`
- Revisa tabla `locations` - verás todas las ubicaciones guardadas

---

## 🐛 Troubleshooting

### Problema: Docker no inicia
```bash
docker-compose down
docker-compose up -d
```

### Problema: IP cambió y no conecta
```bash
powershell -ExecutionPolicy Bypass -File .\update-ip.ps1
```

### Problema: Node.js no conecta a PostgreSQL
Verifica que Docker esté corriendo:
```bash
docker ps
```

### Problema: Django no encuentra base de datos
Revisa `backend-django/core/settings.py` y verifica:
- HOST: `127.0.0.1`
- PORT: `5433`

### Problema: Mobile App error de versión Expo
```bash
cd mobile-app
npx expo install --fix
```

### Problema: No se veen datos en el mapa
1. Verifica que Node.js esté corriendo
2. Verifica que el test-socket.js esté enviando datos
3. Abre la consola del navegador (F12) y busca errores

---

## 📊 Endpoints Resumen

### Node.js (puerto 3001)
- `GET /` - Health check
- `GET /test-db` - Test conexión PostgreSQL
- `GET /last-location/:userId` - Última posición desde Redis
- `GET /history/:userId` - Historial desde PostgreSQL
- WebSocket `driver_movement` - Recibe ubicación GPS
- WebSocket `driver_position` - Emite ubicación en tiempo real

### Django (puerto 8000)
- `GET /admin/` - Panel de administración
- `GET /api/analytics/speed/:userId/` - Analytics con IA

### Laravel (puerto 8000)
- `POST /api/login-mobile` - Login de chofer
- `GET /api/user` - Usuario autenticado (requiere token)

---

## ✅ Checklist de Pruebas

- [ ] Docker iniciado (PostgreSQL + Redis)
- [ ] Node.js corriendo y conectado a DB
- [ ] Django corriendo y migraciones aplicadas
- [ ] Laravel corriendo y usuario creado
- [ ] Frontend React cargando en navegador
- [ ] Mobile App corriendo en dispositivo/emulador
- [ ] Login en app móvil funciona
- [ ] Rastreo GPS envía datos a Node.js
- [ ] Dashboard muestra mapa en tiempo real
- [ ] Analytics de Django funcionan
- [ ] Gráfica de velocidad se actualiza
- [ ] Datos guardados en PostgreSQL


 // Nuevo user o chofer con tiker laravel 
php artisan tinker --execute="use App\Models\User; User::create(['name' => 'Chofer Test', 'email' => 'chofer@test.com', 'password' => bcrypt('123456')]); echo 'Usuario creado: chofer@test.com / 123456';"