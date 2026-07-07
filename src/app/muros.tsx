import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const TIPOS_VARILLA = [
  { id: 'v3/8', nombre: '3/8 in (9.53 mm) N° 3', grados: ['Grado 40', 'Grado 60'] },
  { id: 'v1/2', nombre: '1/2 in (12.7 mm) N° 4', grados: ['Grado 40', 'Grado 60'] },
  { id: 'v5/8', nombre: '5/8 in (15.88 mm) N° 5', grados: ['Grado 40', 'Grado 60'] },
  { id: 'v3/4', nombre: '3/4 in (19.05 mm) N° 6', grados: ['Grado 40', 'Grado 60'] },
  { id: 'v1', nombre: '1 in (25.4 mm) N° 8', grados: ['Grado 60'] },
  { id: 'v4.5', nombre: 'Alambrón 4.50 mm', grados: ['Grado 70'] }
];

const MATERIALES_MURO = [
  'Saltex 10 cm',
  'Saltex 15 cm',
  'Saltex 20 cm',
  'Ladrillo Rojo 7x28x14'
];

interface Vano {
  id: string;
  ancho: string;
  alto: string;
}

export default function EditorMurosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  
  // Estados principales del muro
  const [nombreMuro, setNombreMuro] = useState('');
  const [largo, setLargo] = useState('');
  const [alto, setAlto] = useState('');
  const [desperdicio, setDesperdicio] = useState('10');
  
  // Estados de materiales y refuerzos
  const [material, setMaterial] = useState(MATERIALES_MURO[0]);
  const [separacionVarilla, setSeparacionVarilla] = useState('60');
  const [varillaSeleccionada, setVarillaSeleccionada] = useState(TIPOS_VARILLA[0]);
  const [gradoSeleccionado, setGradoSeleccionado] = useState(TIPOS_VARILLA[0].grados[0]);

  // Estado para ventanas y puertas
  const [vanos, setVanos] = useState<Vano[]>([]);

  // Controles de ventanas modales para las listas desplegables
  const [modalMaterialVisible, setModalMaterialVisible] = useState(false);
  const [modalVarillaVisible, setModalVarillaVisible] = useState(false);
  const [modalGradoVisible, setModalGradoVisible] = useState(false);

  const paramsString = JSON.stringify(params);

  // Efecto para recuperar los datos si estamos editando un calculo existente
  useEffect(() => {
    const parsedParams = JSON.parse(paramsString);
    if (parsedParams.nombreMuro) setNombreMuro(parsedParams.nombreMuro as string);
    if (parsedParams.largo) setLargo(parsedParams.largo as string);
    if (parsedParams.alto) setAlto(parsedParams.alto as string);
    if (parsedParams.desperdicio) setDesperdicio(parsedParams.desperdicio as string);
    if (parsedParams.material) setMaterial(parsedParams.material as string);
    if (parsedParams.separacionVarilla) setSeparacionVarilla(parsedParams.separacionVarilla as string);
    
    if (parsedParams.vanos) {
      try { setVanos(JSON.parse(parsedParams.vanos as string)); } catch {}
    }
    
    if (parsedParams.varillaNombre) {
      const varilla = TIPOS_VARILLA.find(v => v.nombre === parsedParams.varillaNombre);
      if (varilla) setVarillaSeleccionada(varilla);
    }
    
    if (parsedParams.grado) setGradoSeleccionado(parsedParams.grado as string);
  }, [paramsString]);

  // Agrega un hueco vacio a la lista de vanos
  const agregarVano = () => {
    const nuevoVano: Vano = {
      id: Date.now().toString(),
      ancho: '',
      alto: ''
    };
    setVanos([...vanos, nuevoVano]);
  };

  // Actualiza los valores de ancho o alto de un vano especifico
  const actualizarVano = (id: string, campo: 'ancho' | 'alto', valor: string) => {
    setVanos(vanos.map(v => v.id === id ? { ...v, [campo]: valor } : v));
  };

  // Elimina un vano de la lista
  const eliminarVano = (id: string) => {
    setVanos(vanos.filter(v => v.id !== id));
  };

  // Maneja el cambio de varilla y resetea el grado al primero disponible
  const cambiarVarilla = (tipo: typeof TIPOS_VARILLA[0]) => {
    setVarillaSeleccionada(tipo);
    setGradoSeleccionado(tipo.grados[0]);
    setModalVarillaVisible(false);
  };

  const procesarCalculoMuro = () => {
    if (!nombreMuro || !largo || !alto) {
      Alert.alert("Datos incompletos", "Por favor ingresa nombre, largo y alto del muro.");
      return;
    }
    
    router.push({
      pathname: '/resultadosMuros',
      params: {
        nombreMuro,
        largo,
        alto,
        material,
        desperdicio,
        separacionVarilla,
        varillaNombre: varillaSeleccionada.nombre,
        grado: gradoSeleccionado,
        vanos: JSON.stringify(vanos),
        proyectoId: params.proyectoId,
        calculoId: params.calculoId 
      }
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos Básicos del Muro</Text>
          
          <Text style={styles.label}>Nombre del Muro (Ej. Sala, Patio):</Text>
          <TextInput style={styles.input} value={nombreMuro} onChangeText={setNombreMuro} placeholder="Muro principal" />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Largo (m):</Text>
              <TextInput style={styles.input} value={largo} onChangeText={setLargo} keyboardType="numeric" placeholder="0.00" />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Alto (m):</Text>
              <TextInput style={styles.input} value={alto} onChangeText={setAlto} keyboardType="numeric" placeholder="0.00" />
            </View>
          </View>
          
          <Text style={styles.label}>Desperdicio (%):</Text>
          <TextInput style={styles.input} value={desperdicio} onChangeText={setDesperdicio} keyboardType="numeric" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Materiales y Refuerzo</Text>
          
          <Text style={styles.label}>Tipo de Bloque:</Text>
          <TouchableOpacity style={styles.selectorBtn} onPress={() => setModalMaterialVisible(true)}>
            <Text style={styles.selectorText}>{material}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Separación Varilla Vertical (cm):</Text>
          <TextInput style={styles.input} value={separacionVarilla} onChangeText={setSeparacionVarilla} keyboardType="numeric" />

          <Text style={styles.label}>Grosor de Varilla:</Text>
          <TouchableOpacity style={styles.selectorBtn} onPress={() => setModalVarillaVisible(true)}>
            <Text style={styles.selectorText}>{varillaSeleccionada.nombre}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Grado de Resistencia:</Text>
          <TouchableOpacity style={styles.selectorBtn} onPress={() => setModalGradoVisible(true)}>
            <Text style={styles.selectorText}>{gradoSeleccionado}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Puertas y Ventanas (Vanos)</Text>
          
          {vanos.map((vano, index) => (
            <View key={vano.id} style={styles.vanoContainer}>
              <Text style={styles.vanoTitle}>Vano {index + 1}</Text>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Ancho (m):</Text>
                  <TextInput style={styles.input} value={vano.ancho} onChangeText={(v) => actualizarVano(vano.id, 'ancho', v)} keyboardType="numeric" placeholder="0.00" />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Alto (m):</Text>
                  <TextInput style={styles.input} value={vano.alto} onChangeText={(v) => actualizarVano(vano.id, 'alto', v)} keyboardType="numeric" placeholder="0.00" />
                </View>
                <TouchableOpacity style={styles.btnBorrarVano} onPress={() => eliminarVano(vano.id)}>
                  <Text style={styles.btnBorrarVanoText}>X</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.btnAddVano} onPress={agregarVano}>
            <Text style={styles.btnAddVanoText}>+ Agregar Puerta o Ventana</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <TouchableOpacity style={styles.fabConfirmar} onPress={procesarCalculoMuro}>
        <Text style={styles.fabIcon}>✓</Text>
      </TouchableOpacity>

      {/* Modal para Tipo de Material */}
      <Modal visible={modalMaterialVisible} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona el Material</Text>
            {MATERIALES_MURO.map(mat => (
              <TouchableOpacity key={mat} style={styles.modalItem} onPress={() => { setMaterial(mat); setModalMaterialVisible(false); }}>
                <Text style={styles.modalItemText}>{mat}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalMaterialVisible(false)}>
              <Text style={styles.btnCerrarModalText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para Grosor de Varilla */}
      <Modal visible={modalVarillaVisible} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Grosor de Varilla</Text>
            {TIPOS_VARILLA.map(tipo => (
              <TouchableOpacity key={tipo.id} style={styles.modalItem} onPress={() => cambiarVarilla(tipo)}>
                <Text style={styles.modalItemText}>{tipo.nombre}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalVarillaVisible(false)}>
              <Text style={styles.btnCerrarModalText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para Grado de Resistencia */}
      <Modal visible={modalGradoVisible} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Grado de Resistencia</Text>
            {varillaSeleccionada.grados.map(grado => (
              <TouchableOpacity key={grado} style={styles.modalItem} onPress={() => { setGradoSeleccionado(grado); setModalGradoVisible(false); }}>
                <Text style={styles.modalItemText}>{grado}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setModalGradoVisible(false)}>
              <Text style={styles.btnCerrarModalText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 16, paddingBottom: 150 },
  card: { backgroundColor: '#ffffff', padding: 16, marginBottom: 16, borderRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  label: { fontSize: 14, color: '#555', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, backgroundColor: '#fafafa' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  col: { flex: 1, marginRight: 8 },
  
  selectorBtn: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 12, backgroundColor: '#f9f9f9', marginTop: 4 },
  selectorText: { fontSize: 16, color: '#333' },

  vanoContainer: { borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 6, marginBottom: 10, backgroundColor: '#fafafa' },
  vanoTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 4 },
  btnBorrarVano: { backgroundColor: '#ffebee', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  btnBorrarVanoText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 16 },
  btnAddVano: { marginTop: 10, padding: 12, backgroundColor: '#e0f7fa', borderRadius: 4, alignItems: 'center' },
  btnAddVanoText: { color: '#00796b', fontWeight: 'bold', fontSize: 15 },

  fabConfirmar: { position: 'absolute', right: 20, bottom: 40, backgroundColor: '#28a745', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabIcon: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 8, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 16, textAlign: 'center', color: '#333' },
  btnCerrarModal: { marginTop: 16, padding: 12, backgroundColor: '#f44336', borderRadius: 6 },
  btnCerrarModalText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }
});