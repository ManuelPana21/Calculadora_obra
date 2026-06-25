import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function RootLayout() {
  
  // Nombramos las pantallas correctamente segun su funcion
  
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Mis Planos' }} />
        <Stack.Screen name="editor" options={{ title: 'Medidas de Bloques' }} />
        <Stack.Screen name="resultados" options={{ title: 'Detalles del Plano' }} />
      </Stack>
    </>
  );
}