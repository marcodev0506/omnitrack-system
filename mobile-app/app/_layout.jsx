import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1e293b', // Color oscuro para combinar con el dashboard
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShown: false, // Ocultamos el header por defecto para el Login
      }}
    >
      {/* Definimos las pantallas */}
      <Stack.Screen name="index" options={{ title: 'Ingreso' }} />
      <Stack.Screen name="tracking" options={{ 
        title: 'Rastreo en Vivo', 
        headerShown: true, // Aquí sí mostramos el título para que se vea pro
        headerLeft: () => null // Evitamos que el chofer regrese al Login por error
      }} />
    </Stack>
  );
}