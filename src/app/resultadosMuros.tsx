import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Vano {
  id: string;
  ancho: string;
  alto: string;
}

export default function ResultadosMurosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parseo de los datos recibidos desde la pantalla anterior
  const nombreMuro = params.nombreMuro as string;
  const largo = parseFloat(params.largo as string) || 0;
  const alto = parseFloat(params.alto as string) || 0;
  const material = params.material as string;
  const desperdicio = parseFloat(params.desperdicio as string) || 0;
  const separacionVarilla = parseFloat(params.separacionVarilla as string) || 60;
  const varillaNombre = params.varillaNombre as string;
  const grado = params.grado as string;
  const vanos: Vano[] = params.vanos ? JSON.parse(params.vanos as string) : [];

  // Logica matematica para areas y descuentos
  const areaTotalBruta = largo * alto;
  
  const areaVanos = vanos.reduce((total, vano) => {
    const anchoVano = parseFloat(vano.ancho) || 0;
    const altoVano = parseFloat(vano.alto) || 0;
    return total + (anchoVano * altoVano);
  }, 0);

  const areaNeta = areaTotalBruta - areaVanos;

  let areaBloque = 0.08; 
  if (material.includes('Ladrillo Rojo')) {
    areaBloque = 0.0196;
  }

  const bloquesNetos = areaNeta / areaBloque;
  const bloquesConDesperdicio = Math.ceil(bloquesNetos * (1 + (desperdicio / 100)));

  const hiladas = Math.ceil(alto / 0.20);
  const mediosBloquesEstimados = Math.ceil(hiladas / 2);

  const separacionMetros = separacionVarilla / 100;
  const cantidadVarillas = Math.ceil(largo / separacionMetros) + 1;

  // Funcion nativa para compartir el reporte en texto plano
  const compartirReporte = async () => {
    const reporte = `
Detalle de Obra: ${nombreMuro}
--------------------------------
Medidas: ${largo}m x ${alto}m
Área Total: ${areaTotalBruta.toFixed(2)} m²
Área a descontar (Vanos): ${areaVanos.toFixed(2)} m²
Área Neta a construir: ${areaNeta.toFixed(2)} m²

Materiales Necesarios:
- Tipo: ${material}
- Cantidad total (con ${desperdicio}% desperdicio): ${bloquesConDesperdicio} unidades
- Medios bloques estimados para remates: ${mediosBloquesEstimados} unidades

Varilla de acero de Refuerzo Vertical:
- Separación: cada ${separacionVarilla} cm
- Varilla: ${varillaNombre} (${grado})
- Cantidad estimada: ${cantidadVarillas} varillas

    `;

    try {
      await Share.share({
        message: reporte.trim(),
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Funcion para guardar el calculo del muro en la memoria del dispositivo
  const guardarMuro = async () => {
    try {
      const datosGuardados = await AsyncStorage.getItem('mis_proyectos');
      if (datosGuardados !== null) {
        let proyectos = JSON.parse(datosGuardados);
        const indexProyecto = proyectos.findIndex((p: any) => p.id === params.proyectoId);
        
        if (indexProyecto !== -1) {
          const nuevoCalculo = {
            id: params.calculoId || Date.now().toString(),
            nombre: nombreMuro, 
            fecha: new Date().toLocaleDateString(),
            tipo: 'muro',
            datos: { ...params, nombreMuro: nombreMuro }
          };

          if (params.calculoId) {
            const indexCalculo = proyectos[indexProyecto].calculos.findIndex((c: any) => c.id === params.calculoId);
            if (indexCalculo !== -1) proyectos[indexProyecto].calculos[indexCalculo] = nuevoCalculo;
          } else {
            proyectos[indexProyecto].calculos.push(nuevoCalculo);
          }

          await AsyncStorage.setItem('mis_proyectos', JSON.stringify(proyectos));
          
          Alert.alert("Guardado exitoso", "El cálculo de tu muro ha sido guardado.", [
            // Regresamos a la raíz del Stack limpiando todo el historial
            { text: "Ir al Inicio", onPress: () => router.dismissAll() }
          ]);
        }
      }
    } catch {
      Alert.alert("Error", "No se pudo guardar el proyecto.");
    }
  };

  const modificarMuro = () => {
    router.push({
      pathname: '/muros',
      params: { ...params, nombreMuro: nombreMuro } 
    });
  };

  return (
    <View style={styles.container}>
      {/* Esto cambia el nombre de la cabecera en tiempo de ejecucion */}
      <Stack.Screen options={{ title: 'Resultados' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.headerCard}>
          <Text style={styles.title}>Resultados: {nombreMuro}</Text>
          <Text style={styles.subtitle}>Superficie neta: {areaNeta.toFixed(2)} m²</Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Mampostería</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Material:</Text>
            <Text style={styles.dataValue}>{material}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Bloques totales ({desperdicio}% desp.):</Text>
            <Text style={styles.dataValueHighlight}>{bloquesConDesperdicio} unds</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Medios bloques (estimado):</Text>
            <Text style={styles.dataValue}>{mediosBloquesEstimados} unds</Text>
          </View>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Refuerzo Vertical</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Tipo de varilla:</Text>
            <Text style={styles.dataValue}>{varillaNombre}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Grado:</Text>
            <Text style={styles.dataValue}>{grado}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Cantidad requerida:</Text>
            <Text style={styles.dataValueHighlight}>{cantidadVarillas} unds</Text>
          </View>
        </View>

      </ScrollView>

      {/* Footer actualizado con padding inferior para separarlo del borde del telefono */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnVolver} onPress={modificarMuro}>
          <Text style={styles.btnVolverText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnGuardar} onPress={guardarMuro}>
          <Text style={styles.btnGuardarText}>Guardar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnCompartir} onPress={compartirReporte}>
          <Text style={styles.btnCompartirText}>Compartir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  headerCard: { backgroundColor: '#1976d2', padding: 20, borderRadius: 8, marginBottom: 16, elevation: 3 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: '#e3f2fd', fontSize: 16, marginTop: 4 },
  resultCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 8, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  dataLabel: { fontSize: 15, color: '#555' },
  dataValue: { fontSize: 15, fontWeight: '600', color: '#333' },
  dataValueHighlight: { fontSize: 16, fontWeight: 'bold', color: '#00796b' },
  
  // Footer reconfigurado para 3 botones y alejado del borde
  footer: { 
    flexDirection: 'row', 
    padding: 16, 
    paddingBottom: 36, 
    backgroundColor: '#ffffff', 
    borderTopWidth: 1, 
    borderTopColor: '#e0e0e0', 
    justifyContent: 'space-between' 
  },
  btnVolver: { flex: 1, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 6, borderWidth: 1, borderColor: '#ccc' },
  btnVolverText: { color: '#333', fontWeight: 'bold', fontSize: 14 },
  
  btnGuardar: { flex: 1, backgroundColor: '#ff9800', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 6 },
  btnGuardarText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

  btnCompartir: { flex: 1, backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnCompartirText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});