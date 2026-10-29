import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';

// CAMBIA ESTO por la IP de tu PC (Ej: 192.168.1.10)
const SERVER_URL = "http://192.168.0.103:3001/api/login-mobile"; 
const socket = io(SERVER_URL);

export default function App() {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Esperando inicio...');

  useEffect(() => {
    let subscription;

    if (isTracking) {
      startTracking();
    } else {
      setStatusMsg('Rastreo detenido');
    }

    async function startTracking() {
      // 1. Pedir permisos
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatusMsg('Permiso de GPS denegado');
        return;
      }

      setStatusMsg('Transmitiendo ubicación... 🛰️');

      // 2. Escuchar el GPS cada vez que cambie (o cada 5 metros)
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5, // Metros
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setLocation({ latitude, longitude });

          // 3. MANDAR AL BACKEND DE NODE.JS
          socket.emit('driver_movement', {
            lat: latitude,
            lng: longitude,
            driver_id: 1 // Aquí iría el ID de Marco
          });
        }
      );
    }

    return () => subscription && subscription.remove();
  }, [isTracking]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OmniTrack Driver</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Estado del GPS:</Text>
        <Text style={styles.status}>{statusMsg}</Text>
        
        {location && (
          <Text style={styles.coords}>
            Lat: {location.latitude.toFixed(5)} | Lng: {location.longitude.toFixed(5)}
          </Text>
        )}

        <Switch
          value={isTracking}
          onValueChange={setIsTracking}
          trackColor={{ false: "#767577", true: "#2563eb" }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 30 },
  card: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', width: '80%' },
  label: { fontSize: 14, color: '#64748b' },
  status: { fontSize: 18, fontWeight: 'bold', marginVertical: 10, color: '#1e293b' },
  coords: { fontSize: 12, color: '#94a3b8', marginBottom: 20 }
});