import React, { useEffect, useState } from 'react';
import { apiNode } from './api';
import { Truck, Users, MapPin } from 'lucide-react';

function App() {
  const [users, setUsers] = useState([]);

  // Pedimos los usuarios a Node.js (que los saca de la DB que maneja Laravel)
  useEffect(() => {
    apiNode.get('/test-db')
      .then(res => setUsers(res.data.tablas_encontradas))
      .catch(err => console.error("Error conectando con Node:", err));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
        <Truck size={32} color="#2563eb" />
        <h1 style={{ color: '#1e293b' }}>OmniTrack System</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {/* Card de Usuarios */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
            <Users size={20} />
            <span style={{ fontWeight: 'bold' }}>Usuarios en Sistema</span>
          </div>
          <h2 style={{ fontSize: '2rem', margin: '10px 0' }}>{users.length}</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sincronizado vía Node.js</p>
        </div>

        {/* Card de Mapa (Simulado por ahora) */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
            <MapPin size={20} />
            <span style={{ fontWeight: 'bold' }}>Estado del GPS</span>
          </div>
          <h2 style={{ fontSize: '1.2rem', margin: '10px 0', color: '#22c55e' }}>Online</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Conexión WebSocket lista</p>
        </div>
      </div>

      <div style={{ marginTop: '30px', background: 'white', padding: '20px', borderRadius: '10px' }}>
        <h3>Lista de Personal (Desde DB Compartida)</h3>
        <ul>
          {users.map(user => (
            <li key={user.id}>{user.name} - <small>{user.email}</small></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;