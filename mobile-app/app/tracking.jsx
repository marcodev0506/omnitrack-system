import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';

// RECUERDA: Cambia la IP por la de tu PC (ipconfig)
const socket = io("http://192.168.0.105:3001"); 

export default function Tracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    let subscription;

    const startLocationUpdates = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Error", "Necesitamos permiso de GPS para rastrear el camión");
        setIsTracking(false);
        return;
      }

    // Dentro de watchPositionAsync en app/tracking.jsx
    subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (loc) => {
        // 1. Verificamos qué ID estamos mandando
        console.log("Enviando posición del usuario:", global.userId);

        const coords = { 
          lat: loc.coords.latitude, 
          lng: loc.coords.longitude,
          driver_id: global.userId 
        };

        if (coords.driver_id) {
            socket.emit('driver_movement', coords); 
        } else {
            console.error(" ERROR: No hay ID de usuario definido");
        }
      }
    );
    };

    if (isTracking) {
      startLocationUpdates();
    } else {
      subscription && subscription.remove();
    }

    return () => subscription && subscription.remove();
  }, [isTracking]);

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.driverName}>Chofer: Marco</Text>
        <Text style={styles.statusText}>{isTracking ? "🛰️ EN LÍNEA" : "💤 FUERA DE SERVICIO"}</Text>
        
        <Switch 
          value={isTracking} 
          onValueChange={setIsTracking}
          trackColor={{ false: "#cbd5e1", true: "#22c55e" }}
        />
      </View>

      {location && (
        <View style={styles.coordsContainer}>
          <Text style={styles.coordsLabel}>Ubicación Actual Transmitida:</Text>
          <Text style={styles.coordsValue}>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  infoCard: { backgroundColor: '#fff', padding: 40, borderRadius: 25, alignItems: 'center', width: '85%', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  driverName: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },
  statusText: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 20 },
  coordsContainer: { marginTop: 30, alignItems: 'center' },
  coordsLabel: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' },
  coordsValue: { fontSize: 16, color: '#1e293b', fontWeight: '500' }
});