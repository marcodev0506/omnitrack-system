# OmniTrack System

Sistema de rastreo en tiempo real con múltiples backends, frontend web y aplicación móvil.

📖 **Guía completa de pruebas:** Ver [GUIA_PRUEBAS.md](./GUIA_PRUEBAS.md) para instrucciones detalladas de cómo probar cada servicio.

## Arquitectura del Sistema

### Servicios
- **PostgreSQL**: Base de datos principal (puerto 5433)
- **Redis**: Sistema de caché y mensajería (puerto 6380)
- **Backend Django**: API REST Python para analytics (puerto 8001)
- **Backend Laravel**: API PHP Laravel (puerto 8000)
- **Backend Node.js**: Servidor WebSockets para tiempo real (puerto 3001)
- **Frontend App**: React + Vite - Dashboard web (puerto 5173)
- **Mobile App**: Expo React Native - Aplicación móvil

## Requisitos Previos

- Docker y Docker Compose
- Node.js (v18+)
- Python 3.10+
- PHP 8.2+ con Composer
- (Opcional) Expo Go para probar la app móvil

## Inicio de Servicios

### 1. Iniciar Servicios de Infraestructura (Docker)

Primero, inicia PostgreSQL y Redis:

```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en `localhost:5433`
- Redis en `localhost:6380`

Verificar que estén corriendo:
```bash
docker ps
```

### 2. Backend Django (Analytics API)

Ubicación: `backend-django/`

```bash
cd backend-django

# Activar virtual environment (si ya existe)
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt  # o instalar Django REST Framework, psycopg2-binary, etc.

# Ejecutar migraciones
python manage.py migrate

# Iniciar servidor (IMPORTANTE: usar puerto 8001 para evitar conflicto con Laravel)
python manage.py runserver 0.0.0.0:8001
```

El servidor estará disponible en: `http://0.0.0.0:8001` (accesible desde red)

**⚠️ IMPORTANTE:**
- Django usa el puerto 8001 para evitar conflicto con Laravel (puerto 8000)
- Debe escuchar en todas las interfaces (`0.0.0.0`) para que el frontend pueda conectar

### 3. Backend Laravel

Ubicación: `backend-laravel/`

```bash
cd backend-laravel

# Configurar archivo .env
cp .env.example .env

# Editar .env y configurar la conexión a PostgreSQL:
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5433
# DB_DATABASE=omnitrack
# DB_USERNAME=omnitrack_admin
# DB_PASSWORD=superpassword123

# Instalar dependencias PHP
composer install

# Generar key de la aplicación
php artisan key:generate

# Ejecutar migraciones
php artisan migrate

# Instalar dependencias frontend
npm install

# Iniciar servidor (IMPORTANTE: usar --host=0.0.0.0 para acceso desde móvil)
php artisan serve --host=0.0.0.0 --port=8000
```

El servidor estará disponible en: `http://0.0.0.0:8000` (accesible desde móvil vía IP de red)

**⚠️ IMPORTANTE:** Para que la app móvil pueda conectar, Laravel debe escuchar en todas las interfaces (`--host=0.0.0.0`), no solo en localhost.

### 4. Backend Node.js (WebSockets)

Ubicación: `backend-node/`

```bash
cd backend-node

# Instalar dependencias
npm install

# Iniciar servidor
node index.js
```

El servidor estará disponible en: `http://localhost:3001`

Este servidor maneja:
- WebSockets para rastreo en tiempo real
- API REST para consultas de ubicación
- Conexión a Redis para caché de posiciones
- Conexión a PostgreSQL para historial

### 5. Frontend App (React)

Ubicación: `frontend-app/`

```bash
cd frontend-app

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

### 6. Mobile App (Expo React Native)

Ubicación: `mobile-app/`

```bash
cd mobile-app

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start
```

Luego, para probar:
- **iOS**: Presiona `i` para abrir en iOS Simulator
- **Android**: Presiona `a` para abrir en Android Emulator
- **Web**: Presiona `w` para abrir en navegador
- **Expo Go**: Escanea el QR con la app Expo Go en tu dispositivo móvil

## Prueba del Sistema

### 1. Verificar Conexión a Base de Datos

Prueba que Node.js conecte correctamente a PostgreSQL:

```bash
curl http://localhost:3001/test-db
```

Debería retornar datos de usuarios si existen.

### 2. Probar WebSockets

El backend Node.js acepta eventos de WebSocket en el evento `driver_movement`:

```javascript
// Cliente de prueba
const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.emit('driver_movement', {
  lat: 40.7128,
  lng: -74.0060,
  driver_id: 1
});
```

### 3. Probar API REST de Node.js

Obtener última posición desde Redis:
```bash
curl http://localhost:3001/last-location/1
```

Obtener historial de ubicaciones:
```bash
curl http://localhost:3001/history/1
```

### 4. Probar API Django

Visita:
- `http://localhost:8000/admin/` (Panel de administración Django)
- `http://localhost:8000/api/` (Endpoints de la API - dependiendo de las rutas configuradas)

### 5. Probar Frontend Web

Abre `http://localhost:5173` en tu navegador para ver el dashboard de rastreo.

### 6. Probar App Móvil

Abre la app Expo y:
- Escanea el QR desde tu celular con Expo Go
- O usa el emulador (iOS/Android)

## Configuración de Base de Datos

Credenciales PostgreSQL (desde docker-compose.yml):
- Database: `omnitrack`
- User: `omnitrack_admin`
- Password: `superpassword123`
- Host: `localhost`
- Port: `5433`

Redis:
- Host: `localhost`
- Port: `6380`

## Detener Servicios

### Detener servicios Docker:
```bash
docker-compose down
```

### Detener servidores backend/frontend:
Presiona `Ctrl+C` en cada terminal donde estén corriendo.

## Estructura del Proyecto

```
omnitrack-system/
├── docker-compose.yml          # Configuración de PostgreSQL y Redis
├── backend-django/              # API REST Django (analytics)
│   ├── core/                    # Configuración Django
│   ├── analytics/               # App de analytics
│   └── manage.py
├── backend-laravel/             # API REST Laravel
│   ├── app/                     # Aplicación Laravel
│   ├── database/                # Migraciones
│   └── artisan
├── backend-node/                # Servidor WebSockets Node.js
│   └── index.js                 # Main server
├── frontend-app/                # React + Vite Dashboard
│   ├── src/
│   └── package.json
└── mobile-app/                  # Expo React Native
    ├── app/                     # Screens y rutas
    └── package.json
```

## Flujo de Datos

1. **Dispositivo móvil** envía ubicación vía WebSocket a Node.js
2. **Node.js** guarda en Redis (caché rápido) y PostgreSQL (historial)
3. **Node.js** emite en tiempo real al frontend React
4. **Django** consume datos de PostgreSQL para analytics
5. **Laravel** puede servir endpoints adicionales o integrarse con el sistema

## Automatización de Configuración de IP

### Opción 1: Script PowerShell Automático (Recomendado)

El proyecto incluye un script que detecta automáticamente tu IP y la actualiza en todos los archivos:

```bash
powershell -ExecutionPolicy Bypass -File .\update-ip.ps1
```

Este script:
- Detecta automáticamente tu dirección IPv4 del adaptador Wi-Fi
- Actualiza la IP en todos los archivos de configuración:
  - `frontend-app/src/App.jsx`
  - `frontend-app/src/api.js`
  - `mobile-app/app/tracking.jsx`
  - `mobile-app/app/index.jsx`
  - `mobile-app/App.js`
  - `backend-django/core/settings.py`

### Opción 2: Configuración Manual con archivo central

El archivo `config.json` contiene la configuración centralizada. Modifica la IP allí y luego ejecuta el script para propagar los cambios.

### ¿Cómo saber tu IP actual?

En Windows:
```bash
ipconfig
```

Busca la sección "Adaptador de LAN inalámbrica Wi-Fi" y toma la "Dirección IPv4".

## Troubleshooting

### Puerto 5433 ya en uso
```bash
# Cambiar el puerto en docker-compose.yml si es necesario
# O detener otros servicios PostgreSQL
```

### Error de conexión a PostgreSQL
Asegúrate de que Docker esté corriendo:
```bash
docker ps
```

### Error de migraciones en Django
```bash
python manage.py makemigrations
python manage.py migrate
```

### Error de dependencias Node.js
```bash
rm -rf node_modules package-lock.json
npm install
```

### La IP cambió y la app no conecta
Ejecuta el script de actualización:
```bash
powershell -ExecutionPolicy Bypass -File .\update-ip.ps1
```

## Notas Importantes

- Los backends Django y Laravel ambos usan el puerto 8000 por defecto. Necesitarás cambiar uno de ellos si planeas correr ambos simultáneamente.
- Backend Node.js corre en el puerto 3001.
- Frontend React corre en el puerto 5173.
- Redis está configurado en el puerto 6380 (no el default 6379) para evitar conflictos.
