import React, { useEffect, useState } from 'react';
import { apiNode } from './api';
import { io } from 'socket.io-client';
import { Truck, Users, MapPin, BrainCircuit, Activity, Database } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup,Polyline } from 'react-leaflet';
import L from 'leaflet';

// --- CONFIGURACIÓN DE ICONOS DE LEAFLET ---
// (Soluciona el problema de que no se cargan los marcadores en React)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- CONEXIÓN SOCKET.IO ---
const socket = io('http://localhost:3001');

function App() {
  // Estados para los datos de los 3 Backends
  const [users, setUsers] = useState([]); // Viene de Laravel (vía Node)
  const [position, setPosition] = useState([10.4806, -66.9036]); // Tiempo real de Node
  const [analytics, setAnalytics] = useState(null); // Viene de Django
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [routeHistory, setRouteHistory] = useState([]);
useEffect(() => {
    // --- NUEVO: Traer la lista de usuarios para el contador ---
    apiNode.get('/test-db')
        .then(res => {
            // Guardamos los usuarios que vienen de PostgreSQL
            if (res.data.success) {
                setUsers(res.data.tablas_encontradas);
            }
        })
        .catch(err => console.error("Error cargando usuarios:", err));

    // --- Historial inicial (Lo que ya tenías) ---
    apiNode.get('/history/1').then(res => {
        const coords = res.data.map(loc => [parseFloat(loc.lat), parseFloat(loc.lng)]);
        setRouteHistory(coords);
    });

    // --- Socket en tiempo real (Lo que ya tenías) ---
    socket.on('driver_position', (data) => {
        const newPos = [data.lat, data.lng];
        setPosition(newPos);
        setRouteHistory(prev => [...prev, newPos]); 
    });

    return () => socket.off('driver_position');
}, []);

  // 3. Función para consultar a Django (Analítica Pesada)
  const fetchDjangoAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const response = await fetch('http://localhost:8001/api/analytics/');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error consultando Django:", error);
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
          <div style={styles.statusItem}><BrainCircuit size={16} /> Django Ready</div>
        </div>
      </header>

      <main style={styles.mainGrid}>
        
        {/* COLUMNA IZQUIERDA: EL MAPA EN TIEMPO REAL */}
        <section style={styles.mapSection}>
          <div style={styles.cardHeader}>
            <MapPin size={20} color="#ef4444" />
            <h2 style={styles.cardTitle}>Rastreo de Unidades (Caracas)</h2>
          </div>
          <div style={styles.mapWrapper}>
            <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <Polyline positions={routeHistory} color="blue" weight={3} opacity={0.6} />
              <Marker position={position}>
                <Popup>
                  <strong>Unidad Activa</strong><br />
                  Chofer: {users[0]?.name || 'Registrando...'}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </section>

        {/* COLUMNA DERECHA: ESTADÍSTICAS Y ACCIONES */}
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
                  {u.name} <span style={styles.userEmail}>{u.email}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card Django Analytics */}
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
              {loadingAnalytics ? 'Analizando...' : 'Ejecutar Reporte Django'}
            </button>

            {analytics && (
              <div style={styles.analyticsBox}>
                <p><strong>Estado:</strong> {analytics.status}</p>
                <p><strong>Eficiencia:</strong> {analytics.optimizacion_ruta}</p>
                <p style={{ color: '#d97706', marginTop: '5px' }}>
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
  container: { padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  title: { fontSize: '24px', color: '#1e293b', margin: 0 },
  badge: { fontSize: '12px', backgroundColor: '#dbeafe', color: '#2563eb', padding: '4px 8px', borderRadius: '6px', verticalAlign: 'middle' },
  statusGroup: { display: 'flex', gap: '15px' },
  statusItem: { fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' },
  mapSection: { backgroundColor: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  mapWrapper: { height: '550px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  cardTitle: { fontSize: '16px', color: '#475569', margin: 0 },
  statsNumber: { fontSize: '32px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 10px 0' },
  userList: { padding: 0, margin: 0, listStyle: 'none' },
  userItem: { fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' },
  userEmail: { fontSize: '11px', color: '#94a3b8' },
  button: { width: '100%', padding: '10px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' },
  analyticsBox: { marginTop: '15px', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', fontSize: '13px' }
};

export default App;