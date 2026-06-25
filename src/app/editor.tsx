import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Medida {
  id: string;
  valor: string;
}

interface Bloque {
  id: string;
  nombre: string;
  medidas: Medida[];
}

export default function EditorPlanosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [bloques, setBloques] = useState<Bloque[]>([
    {
      id: '1',
      nombre: 'Bloque 1',
      medidas: [
        { id: 'm1', valor: '' },
        { id: 'm2', valor: '' }
      ]
    }
  ]);

  const [ayudaVisible, setAyudaVisible] = useState(false);

  useEffect(() => {
    if (params.planoEditando) {
      const planoCargado = JSON.parse(params.planoEditando as string);
      setBloques(planoCargado.bloques);
    }
  }, [params.planoEditando]);

  const agregarBloque = () => {
    const nuevoId = (bloques.length + 1).toString();
    const nuevoBloque: Bloque = {
      id: nuevoId,
      nombre: `Bloque ${nuevoId}`,
      medidas: [
        { id: `m1-${nuevoId}`, valor: '' },
        { id: `m2-${nuevoId}`, valor: '' }
      ]
    };
    setBloques([...bloques, nuevoBloque]);
  };

  const agregarMedidaABloque = (bloqueId: string) => {
    setBloques(bloques.map(bloque => {
      if (bloque.id === bloqueId) {
        if (bloque.medidas.length < 4) {
          const nuevaMedida = { id: `m${bloque.medidas.length + 1}-${bloque.id}`, valor: '' };
          return { ...bloque, medidas: [...bloque.medidas, nuevaMedida] };
        }
      }
      return bloque;
    }));
  };

  const actualizarMedida = (bloqueId: string, medidaId: string, nuevoValor: string) => {
    setBloques(bloques.map(bloque => {
      if (bloque.id === bloqueId) {
        const medidasActualizadas = bloque.medidas.map(medida => 
          medida.id === medidaId ? { ...medida, valor: nuevoValor } : medida
        );
        return { ...bloque, medidas: medidasActualizadas };
      }
      return bloque;
    }));
  };

  const procesarCalculo = () => {
    let tieneError = false;
    let mensajeError = "";

    for (const bloque of bloques) {
      for (const medida of bloque.medidas) {
        const valorNumerico = parseFloat(medida.valor);
        
        if (medida.valor.trim() === '') {
          tieneError = true;
          mensajeError = `El ${bloque.nombre} tiene medidas en blanco.`;
          break;
        }
        
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
          tieneError = true;
          mensajeError = `Las medidas en el ${bloque.nombre} deben ser mayores a 0.`;
          break;
        }
      }
      if (tieneError) break;
    }

    if (tieneError) {
      Alert.alert("Datos incompletos", mensajeError);
      return;
    }

    const bloquesString = JSON.stringify(bloques);
    
    router.push({
      pathname: '/resultados',
      params: { 
        bloques: bloquesString,
        planoOriginal: params.planoEditando || null 
      }
    });
  };

  // Renderizado de la interfaz del editor junto con el modal de ayuda optimizado
  // El texto del bloque 2 ahora se ubica fuera de las figuras para garantizar lectura
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.headerAyuda}>
          <Text style={styles.textoInstruccion}>Ingresa las medidas por cada area</Text>
          <TouchableOpacity style={styles.btnAyuda} onPress={() => setAyudaVisible(true)}>
            <Text style={styles.btnAyudaTexto}>!</Text>
          </TouchableOpacity>
        </View>

        {bloques.map((bloque) => (
          <View key={bloque.id} style={styles.bloqueCard}>
            <Text style={styles.bloqueTitle}>{bloque.nombre}</Text>
            
            {bloque.medidas.map((medida, index) => (
              <View key={medida.id} style={styles.inputRow}>
                <Text style={styles.inputLabel}>Lado {index + 1}:</Text>
                
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0.00"
                  value={medida.valor}
                  onChangeText={(texto) => actualizarMedida(bloque.id, medida.id, texto)}
                />
              </View>
            ))}

            {bloque.medidas.length < 4 && (
              <TouchableOpacity 
                style={styles.btnAddMedida} 
                onPress={() => agregarMedidaABloque(bloque.id)}
              >
                <Text style={styles.btnAddMedidaText}>+ Agregar medida</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.btnAddBloque} onPress={agregarBloque}>
          <Text style={styles.btnAddBloqueText}>+ Añadir otro bloque</Text>
        </TouchableOpacity>
        
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={ayudaVisible}
        onRequestClose={() => setAyudaVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>¿Cómo medir espacios irregulares?</Text>
            
            <Text style={styles.modalTexto}>
              Si tu habitacion no es un cuadrado perfecto, dividela en partes de 3 o 4 lados usando el boton de añadir mas bloques.
            </Text>

            <View style={styles.contenedorGrafico}>
              
              <View style={styles.graficoCuadrado}>
                <Text style={styles.textoGrafico}>Bloque 1{'\n'}(4 Lados)</Text>
              </View>

              <View style={styles.graficoTriangulo} />
              
              <Text style={styles.textoGraficoFuera}>Bloque 2{'\n'}(3 Lados)</Text>

            </View>

            <Text style={styles.modalSubtexto}>
              La aplicacion sumara el area de ambos bloques de forma automatica para generar tus materiales correctos.
            </Text>

            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setAyudaVisible(false)}>
              <Text style={styles.btnCerrarModalText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fabConfirmar} onPress={procesarCalculo}>
        <Text style={styles.fabIcon}>✓</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  
  headerAyuda: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#90caf9' },
  textoInstruccion: { flex: 1, fontSize: 14, color: '#1565c0', fontWeight: '500' },
  btnAyuda: { backgroundColor: '#1976d2', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  btnAyudaTexto: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },

  bloqueCard: { backgroundColor: '#ffffff', padding: 16, marginBottom: 16, borderRadius: 8, elevation: 2 },
  bloqueTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { flex: 1, fontSize: 16, color: '#333' },
  input: { flex: 2, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16 },
  btnAddMedida: { marginTop: 10, padding: 8, backgroundColor: '#e0f7fa', borderRadius: 4, alignItems: 'center' },
  btnAddMedidaText: { color: '#00796b', fontWeight: 'bold' },
  btnAddBloque: { backgroundColor: '#e0e0e0', padding: 16, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
  btnAddBloqueText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  fabConfirmar: { position: 'absolute', right: 20, bottom: 40, backgroundColor: '#28a745', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabIcon: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },

  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContenido: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, width: '100%', alignItems: 'center', elevation: 10 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333', textAlign: 'center' },
  modalTexto: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalSubtexto: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 16, marginBottom: 20 },
  btnCerrarModal: { backgroundColor: '#1976d2', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 6, width: '100%', alignItems: 'center' },
  btnCerrarModalText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },

  // Contenedor del grafico configurado con alineacion al centro
  contenedorGrafico: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 120, marginVertical: 10, width: '100%' },
  graficoCuadrado: { width: 110, height: 110, backgroundColor: '#2196f3', justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  textoGrafico: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  
  // Revertido al triangulo inicial con cara izquierda recta acoplable al cuadrado
  graficoTriangulo: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 0, borderRightWidth: 70, borderBottomWidth: 110, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#ff9800' },
  
  // Estilo del texto externo con alto contraste sobre la tarjeta blanca
  textoGraficoFuera: { color: '#333333', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginLeft: 12 }
});