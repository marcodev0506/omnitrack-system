import React, { useEffect, useState } from 'react';
import { apiNode } from './api';
import axios from 'axios';
import { io } from 'socket.io-client';
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

// --- CONEXIÓN SOCKET.IO (Usa la IP de tu PC para que el móvil lo vea) ---
const socket = io('http://192.168.0.101:3001');

function App() {
  const [users, setUsers] = useState([]);
  const [position, setPosition] = useState([10.4806, -66.9036]);
  const [routeHistory, setRouteHistory] = useState([]);
  
  // Estados para Analítica e IA
  const [analytics, setAnalytics] = useState({ status: 'Esperando datos...', speed_kph: 0, geo_alert: 'Sincronizando...' });
  const [speedHistory, setSpeedHistory] = useState([]); // Para la gráfica de Recharts
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    // 1. Cargar Personal Registrado
    apiNode.get('/test-db')
        .then(res => {
            if (res.data.success) setUsers(res.data.tablas_encontradas);
        })
        .catch(err => console.error("Error cargando usuarios:", err));

    // 2. Cargar Historial Inicial (Usuario 2 - Marco Developer)
    apiNode.get('/history/2').then(res => {
        const coords = res.data.map(loc => [parseFloat(loc.lat), parseFloat(loc.lng)]);
        setRouteHistory(coords);
    });

    // 3. Escuchar Sockets en Tiempo Real
    socket.on('driver_position', (data) => {
        const newPos = [data.lat, data.lng];
        setPosition(newPos);
        setRouteHistory(prev => [...prev, newPos]);
        
        // Actualizar datos para la gráfica (Recharts)
        const timeLabel = new Date().toLocaleTimeString().slice(0, 5);
        setSpeedHistory(prev => [...prev.slice(-14), { time: timeLabel, v: data.speed || Math.random() * 60 }]); 
    });

    return () => socket.off('driver_position');
  }, []);

  // 4. Función de Inteligencia Logística (Django)
  const fetchDjangoAnalytics = async () => {
  setLoadingAnalytics(true);
  try {
    // ✅ CORRECCIÓN: Usamos la IP .101 y la ruta completa /speed/2/
    const response = await axios.get('http://192.168.0.101:8001/api/analytics/speed/2/');
    
    // Guardamos la respuesta de la IA en el estado
    setAnalytics(response.data);
    
    console.log("🧠 IA de Django respondió:", response.data);
  } catch (error) {
    console.error("❌ Django no responde en .101:", error);
    alert("Error: No se pudo conectar con el cerebro de Django");
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
          <div style={styles.statusItem}><Database size={16} /> Laravel Online</div>
          <div style={styles.statusItem}><Activity size={16} /> Node.js Live</div>
          <div style={styles.statusItem}><BrainCircuit size={16} /> Django AI Ready</div>
        </div>
      </header>

      <main style={styles.mainGrid}>
        {/* COLUMNA IZQUIERDA: MAPA Y GRÁFICA */}
        <section style={styles.leftColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <MapPin size={20} color="#ef4444" />
              <h2 style={styles.cardTitle}>Rastreo en Tiempo Real (Caracas)</h2>
            </div>
            <div style={styles.mapWrapper}>
              <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polyline positions={routeHistory} color="#2563eb" weight={4} opacity={0.7} />
                <Marker position={position}>
                  <Popup><strong>Unidad 02</strong><br />ID: Marco Developer</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* GRÁFICA DE TELEMETRÍA (RECHARTS) */}
          <div style={{ ...styles.card, marginTop: '20px' }}>
            <div style={styles.cardHeader}>
              <Gauge size={20} color="#3b82f6" />
              <h2 style={styles.cardTitle}>Telemetría de Velocidad</h2>
            </div>
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={speedHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={3} dot={false} animationDuration={300} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA: SIDEBAR */}
        <aside style={styles.sidebar}>
          {/* Card Usuarios */}
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

          {/* Card IA Django Analytics */}
          <div style={{ ...styles.card, borderTop: '4px solid #f59e0b' }}>
            <div style={styles.cardHeader}>
              <BrainCircuit size={20} color="#f59e0b" />
              <h2 style={styles.cardTitle}>Inteligencia Logística</h2>
            </div>
            <button onClick={fetchDjangoAnalytics} style={styles.button} disabled={loadingAnalytics}>
              {loadingAnalytics ? 'Procesando IA...' : 'Ejecutar Reporte IA'}
            </button>

            <div style={styles.analyticsBox}>
              <p style={{ margin: '5px 0' }}><strong>Estado:</strong> {analytics.status}</p>
              <p style={{ margin: '5px 0' }}><strong>Velocidad:</strong> {analytics.speed_kph} km/h</p>
              <div style={{ 
                marginTop: '10px', 
                padding: '8px', 
                borderRadius: '6px', 
                backgroundColor: analytics.geo_alert?.includes('⚠️') ? '#fee2e2' : '#ecfdf5',
                color: analytics.geo_alert?.includes('⚠️') ? '#991b1b' : '#065f46',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {analytics.geo_alert || 'Esperando ubicación...'}
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

// --- ESTILOS ACTUALIZADOS ---
const styles = {
  container: { padding: '20px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  title: { fontSize: '22px', color: '#0f172a', margin: 0, fontWeight: '800' },
  badge: { fontSize: '11px', backgroundColor: '#2563eb', color: '#fff', padding: '3px 7px', borderRadius: '5px', marginLeft: '8px' },
  statusGroup: { display: 'flex', gap: '15px' },
  statusItem: { fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontWeight: '500' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' },
  leftColumn: { display: 'flex', flexDirection: 'column' },
  mapSection: { backgroundColor: '#fff', padding: '15px', borderRadius: '12px' },
  mapWrapper: { height: '400px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  cardTitle: { fontSize: '14px', fontWeight: '700', color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' },
  statsNumber: { fontSize: '36px', fontWeight: '800', color: '#1e293b', margin: '0 0 10px 0' },
  userList: { padding: 0, margin: 0, listStyle: 'none' },
  userItem: { fontSize: '13px', padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' },
  userEmail: { fontSize: '11px', color: '#94a3b8' },
  button: { width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', marginBottom: '15px' },
  analyticsBox: { padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }
};

export default App;