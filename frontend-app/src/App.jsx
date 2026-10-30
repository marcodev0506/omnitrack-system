import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { apiNode } from './api';

// Iconos y UI
import { Truck, Users, MapPin, BrainCircuit, Activity, Database, Gauge } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// --- CONFIGURACIÓN DE ICONOS DE LEAFLET ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- CONEXIÓN SOCKET.IO (IP ACTUALIZADA .101) ---
const socket = io('http://192.168.0.103:3001');

function App() {
  const [users, setUsers] = useState([]);
  const [position, setPosition] = useState([10.4806, -66.9036]); // Coordenadas iniciales por defecto
  const [routeHistory, setRouteHistory] = useState([]);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [activeDrivers, setActiveDrivers] = useState({}); // Conductores activos por ID
  const [selectedDriverId, setSelectedDriverId] = useState(null); // Conductor seleccionado
  const [currentSpeed, setCurrentSpeed] = useState(0); // Velocidad en tiempo real
  const [driverHistory, setDriverHistory] = useState({}); // Historial por conductor { driverId: { routeHistory, speedHistory } }
  const [driverAnalytics, setDriverAnalytics] = useState({}); // Reporte IA por conductor { driverId: analyticsData }

  useEffect(() => {
    // 1. Cargar usuarios de la base de datos (vía Node/Laravel)
    apiNode.get('/test-db')
        .then(res => {
            if (res.data.success) setUsers(res.data.tablas_encontradas);
        })
        .catch(err => console.error("Error cargando usuarios:", err));

    // 2. Cargar historial de ruta inicial para el primer usuario disponible
    apiNode.get('/history/2').then(res => {
      if (res.data && res.data.length > 0) {
        const coords = res.data.map(loc => [parseFloat(loc.lat), parseFloat(loc.lng)]);
        setRouteHistory(coords);
        // Centrar mapa en la última posición conocida
        const lastPos = coords[coords.length - 1];
        setPosition(lastPos);
        setMapReady(true);
      }
    }).catch(err => {
      console.error("Error cargando historial:", err);
      // Si falla, mantener posición por defecto
      setMapReady(true);
    });

    // 3. Escuchar movimiento en tiempo real
    socket.on('driver_position', (data) => {
        const newPos = [data.lat, data.lng];
        const driverId = data.userId;

        // Actualizar conductores activos
        setActiveDrivers(prev => ({
            ...prev,
            [driverId]: {
                ...prev[driverId],
                position: newPos,
                speed: data.speed || 0,
                lastSeen: new Date(),
                connected: true
            }
        }));

        // Si no hay conductor seleccionado, seleccionar el primero activo
        if (!selectedDriverId) {
            setSelectedDriverId(driverId);
        }

        // Guardar historial por conductor
        setDriverHistory(prev => {
            const driverData = prev[driverId] || { routeHistory: [], speedHistory: [] };
            const timeLabel = new Date().toLocaleTimeString().slice(0, 5);
            const speed = data.speed || 0;

            return {
                ...prev,
                [driverId]: {
                    routeHistory: [...driverData.routeHistory, newPos],
                    speedHistory: [...driverData.speedHistory.slice(-14), { time: timeLabel, v: speed }]
                }
            };
        });

        // Solo actualizar mapa y gráfica si es el conductor seleccionado
        if (selectedDriverId === driverId) {
            setPosition(newPos);
            setRouteHistory(prev => [...prev, newPos]);

            // Actualizar gráfica de telemetría con velocidad calculada
            const timeLabel = new Date().toLocaleTimeString().slice(0, 5);
            const speed = data.speed || 0;
            setSpeedHistory(prev => [
                ...prev.slice(-14),
                { time: timeLabel, v: speed }
            ]);

            // Actualizar velocidad en tiempo real para el reporte IA
            setCurrentSpeed(speed);
        }
    });

    // Escuchar desconexión de conductores
    socket.on('driver_disconnected', (data) => {
        const driverId = data.userId;
        setActiveDrivers(prev => ({
            ...prev,
            [driverId]: {
                ...prev[driverId],
                connected: false,
                lastSeen: new Date()
            }
        }));
        console.log(`❌ Conductor ${driverId} desconectado`);
    });

    return () => {
        socket.off('driver_position');
        socket.off('driver_disconnected');
    };
  }, [selectedDriverId]);

  // Cargar historial y reporte IA del conductor seleccionado
  useEffect(() => {
    if (selectedDriverId && driverHistory[selectedDriverId]) {
      const driverData = driverHistory[selectedDriverId];
      setRouteHistory(driverData.routeHistory);
      setSpeedHistory(driverData.speedHistory);
      setPosition(driverData.routeHistory[driverData.routeHistory.length - 1] || [10.4806, -66.9036]);
      setCurrentSpeed(driverData.speedHistory[driverData.speedHistory.length - 1]?.v || 0);
      
      // Cargar reporte IA del conductor seleccionado (si existe)
      if (driverAnalytics[selectedDriverId]) {
        setAnalytics(driverAnalytics[selectedDriverId]);
      } else {
        setAnalytics(null);
      }
    }
  }, [selectedDriverId, driverHistory, driverAnalytics]);

  // 4. Función de Inteligencia Logística (Consulta a Django AI)
  const fetchDjangoAnalytics = async () => {
    if (!selectedDriverId) {
      alert('Selecciona un conductor activo primero');
      return;
    }

    setLoadingAnalytics(true);
    try {
      // Pasamos la velocidad actual del conductor seleccionado
      const driverSpeed = activeDrivers[selectedDriverId]?.speed || 0;
      const response = await axios.get(
        `http://192.168.0.103:8001/api/analytics/speed/${selectedDriverId}/?current_speed=${driverSpeed}`
      );
      
      // Guardar reporte para este conductor específico
      setDriverAnalytics(prev => ({
        ...prev,
        [selectedDriverId]: response.data
      }));
      
      // Mostrar el reporte actual
      setAnalytics(response.data);
      console.log("IA Django Response:", response.data);
    } catch (error) {
      console.error("Error consultando Django IA:", error);
      alert("No se pudo conectar con el motor de IA en 192.168.0.103:8001");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Truck size={32} color="#2563eb" />
          <h1 style={styles.title}>OmniTrack <span style={styles.badge}>System Pro</span></h1>
        </div>
        <div style={styles.statusGroup}>
          <div style={styles.statusItem}><Database size={14} /> Laravel DB</div>
          <div style={styles.statusItem}><Activity size={14} /> Node.js Realtime</div>
          <div style={styles.statusItem}><BrainCircuit size={14} /> Django AI Engine</div>
        </div>
      </header>

      <main style={styles.mainGrid}>
        
        {/* COLUMNA IZQUIERDA: MAPA Y GRÁFICA */}
        <section style={styles.leftColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <MapPin size={20} color="#ef4444" />
              <h2 style={styles.cardTitle}>Rastreo en Vivo</h2>
            </div>
            <div style={styles.mapWrapper}>
              <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polyline positions={routeHistory} color="#2563eb" weight={4} opacity={0.6} />
                <Marker position={position}>
                  <Popup><strong>ID: 2 - Marco Developer</strong><br />Estado: Activo</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* Gráfica de Telemetría */}
          <div style={{ ...styles.card, marginTop: '20px' }}>
            <div style={styles.cardHeader}>
              <Gauge size={20} color="#3b82f6" />
              <h2 style={styles.cardTitle}>Telemetría de Velocidad (Recharts)</h2>
            </div>
            <div style={{ height: '180px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={speedHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA: SIDEBAR ANALÍTICO */}
        <aside style={styles.sidebar}>

          {/* Card Conductores Activos */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Users size={20} color="#22c55e" />
              <h2 style={styles.cardTitle}>Conductores Activos</h2>
            </div>
            {Object.keys(activeDrivers).length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                Ningún conductor conectado
              </p>
            ) : (
              <ul style={styles.userList}>
                {Object.entries(activeDrivers).map(([id, driver]) => (
                  <li
                    key={id}
                    onClick={() => setSelectedDriverId(parseInt(id))}
                    style={{
                      ...styles.userItem,
                      backgroundColor: selectedDriverId === parseInt(id) ? '#dbeafe' : 'transparent',
                      border: selectedDriverId === parseInt(id) ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Conductor {id}</strong>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: driver.connected ? '#22c55e' : '#ef4444',
                        color: 'white'
                      }}>
                        {driver.connected ? 'En línea' : 'Desconectado'}
                      </span>
                    </div>
                    <span style={styles.userEmail}>
                      Vel: {driver.speed.toFixed(1)} km/h | 
                      {driver.connected ? ' Activo' : ` Último: ${new Date(driver.lastSeen).toLocaleTimeString()}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Card Personal Registrado */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Users size={20} color="#64748b" />
              <h2 style={styles.cardTitle}>Personal Registrado</h2>
            </div>
            <p style={styles.statsNumber}>{users.length}</p>
            <ul style={styles.userList}>
              {users.map(u => (
                <li key={u.id} style={styles.userItem}>
                  <strong>{u.name}</strong>
                  <span style={styles.userEmail}>{u.email} (ID: {u.id})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card Inteligencia Logística (Django IA) */}
          <div style={{ ...styles.card, borderTop: '4px solid #f59e0b' }}>
            <div style={styles.cardHeader}>
              <BrainCircuit size={20} color="#f59e0b" />
              <h2 style={styles.cardTitle}>Inteligencia Logística</h2>
            </div>
            
            <button 
              onClick={fetchDjangoAnalytics} 
              style={styles.button}
              disabled={loadingAnalytics}
            >
              {loadingAnalytics ? 'Consultando Cerebro...' : 'Ejecutar Reporte IA'}
            </button>

            {analytics && (
              <div style={styles.analyticsBox}>
                <p><strong>Estado:</strong> {analytics.status}</p>
                <p><strong>Velocidad:</strong> {analytics.speed_kph} km/h</p>

                {/* 🧠 BLOQUE DE MACHINE LEARNING */}
                {analytics.ia_prediction && (
                  <div style={styles.mlBlock}>
                    <p style={styles.mlLabel}>Predicción de Tráfico IA</p>
                    <p style={styles.mlValue}>{analytics.ia_prediction.tiempo_estimado_tramo}</p>
                    <p style={styles.mlConf}>Patrón: {analytics.ia_prediction.patron_trafico}</p>
                    <p style={styles.mlConf}>Confianza: {analytics.ia_prediction.confianza}</p>
                  </div>
                )}

                <div style={{ 
                  marginTop: '10px', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  backgroundColor: analytics.geo_alert?.includes('⚠️') ? '#fee2e2' : '#ecfdf5',
                  color: analytics.geo_alert?.includes('⚠️') ? '#991b1b' : '#065f46',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {analytics.geo_alert}
                </div>

                <p style={{ color: '#d97706', marginTop: '12px', fontSize: '11px', fontStyle: 'italic' }}>
                   💡 {analytics.recomendacion}
                </p>
              </div>
            )}
          </div>

        </aside>
      </main>
    </div>
  );
}

// --- ESTILOS (CSS-in-JS) ---
const styles = {
  container: { padding: '20px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  title: { fontSize: '22px', color: '#0f172a', margin: 0, fontWeight: '800' },
  badge: { fontSize: '10px', backgroundColor: '#2563eb', color: '#fff', padding: '3px 7px', borderRadius: '5px', verticalAlign: 'middle', marginLeft: '10px' },
  statusGroup: { display: 'flex', gap: '15px' },
  statusItem: { fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontWeight: '500' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' },
  leftColumn: { display: 'flex', flexDirection: 'column' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  cardTitle: { fontSize: '13px', fontWeight: '700', color: '#475569', margin: 0, textTransform: 'uppercase' },
  mapWrapper: { height: '420px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '20px' },
  statsNumber: { fontSize: '36px', fontWeight: '900', color: '#1e293b', margin: '0 0 10px 0' },
  userList: { padding: 0, margin: 0, listStyle: 'none' },
  userItem: { fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' },
  userEmail: { fontSize: '11px', color: '#94a3b8' },
  button: { width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', transition: '0.2s', marginBottom: '15px' },
  analyticsBox: { padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  mlBlock: { marginTop: '12px', padding: '10px', backgroundColor: '#fff', borderRadius: '8px', borderLeft: '4px solid #2563eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  mlLabel: { margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  mlValue: { margin: '4px 0', fontSize: '18px', color: '#1e293b', fontWeight: '800' },
  mlConf: { margin: 0, fontSize: '10px', color: '#16a34a', fontWeight: 'bold' }
};

export default App;