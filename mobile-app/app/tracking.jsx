import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import { useRouter } from 'expo-router';

// RECUERDA: Cambia la IP por la de tu PC (ipconfig)
const socket = io("http://192.168.0.103:3001");

export default function Tracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);

  // Función para iniciar tracking
  const startTracking = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Error", "Necesitamos permiso de GPS para rastrear el camión");
        setIsTracking(false);
        return;
      }

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => {
          console.log("Enviando posición del usuario:", global.userId);

          // Actualizar estado de ubicación
          setLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude
          });

          const coords = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            driver_id: global.userId
          };

          if (coords.driver_id) {
            socket.emit('driver_movement', coords);
          } else {
            console.error("ERROR: No hay ID de usuario definido");
          }
        }
      );

      setSubscription(sub);
      setIsTracking(true);
    } catch (error) {
      console.error("Error iniciando tracking:", error);
      Alert.alert("Error", "No se pudo iniciar el rastreo");
      setIsTracking(false);
    }
  };

  // Función para detener tracking
  const stopTracking = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
    setIsTracking(false);
    setLocation(null);
    console.log("✅ Tracking detenido");
  };

  // Manejar cambio del switch
  const handleToggleTracking = (value) => {
    if (value) {
      startTracking();
    } else {
      stopTracking();
    }
  };

  // Función de logout
  const handleLogout = () => {
    stopTracking();
    socket.disconnect();
    global.userId = null;
    router.replace('/');
  };

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.driverName}>Chofer: Marco</Text>
        <Text style={styles.statusText}>{isTracking ? "🛰️ EN LÍNEA" : "💤 FUERA DE SERVICIO"}</Text>

        <Switch
          value={isTracking}
          onValueChange={handleToggleTracking}
          trackColor={{ false: "#cbd5e1", true: "#22c55e" }}
        />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
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
  logoutButton: { marginTop: 20, backgroundColor: '#ef4444', padding: 12, borderRadius: 8, width: '100%' },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  coordsContainer: { marginTop: 30, alignItems: 'center' },
  coordsLabel: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' },
  coordsValue: { fontSize: 16, color: '#1e293b', fontWeight: '500' }
});