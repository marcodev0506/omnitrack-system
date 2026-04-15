import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck } from 'lucide-react-native'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

const handleLogin = async () => {
  try {
    const response = await fetch("http://192.168.0.102:8000/api/login-mobile", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: password,
        device_name: 'Samsung de Marco', // O cualquier nombre de dispositivo
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Login exitoso. ID de usuario:", data.user.id); // Revisa esto en tu terminal
      global.userId = data.user.id; 
      router.replace('/tracking');
    }
     else {
      Alert.alert("Error", data.message || "No se pudo iniciar sesión");
    }
  } catch (error) {
    Alert.alert("Error de conexión", "Asegúrate de que Laravel esté corriendo");
  }
};

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Truck size={60} color="#2563eb" style={{ marginBottom: 20 }} />
        <Text style={styles.title}>OmniTrack Driver</Text>
        <Text style={styles.subtitle}>Panel de Control del Transportista</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Iniciar Jornada</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center', elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 30 },
  input: { width: '100%', height: 50, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 20, fontSize: 16 },
  button: { width: '100%', height: 55, backgroundColor: '#2563eb', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});