import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, ListRenderItemInfo, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Definimos la nueva estructura de Proyectos (Carpetas)
interface ProyectoCarpeta {
  id: string;
  nombre: string;
  fecha: string;
  calculos: any[]; // Aqui guardaremos tanto muros como cielos falsos mas adelante
}

export default function DashboardScreen() {
  const [proyectos, setProyectos] = useState<ProyectoCarpeta[]>([]);
  const [soporteVisible, setSoporteVisible] = useState(false);
  
  // Estados para la creacion de una nueva carpeta
  const [modalNuevoProyecto, setModalNuevoProyecto] = useState(false);
  const [nombreNuevoProyecto, setNombreNuevoProyecto] = useState('');
  
  const router = useRouter(); 

  useFocusEffect(
    useCallback(() => {
      cargarProyectos();
    }, [])
  );

  // Cargamos la nueva base de datos 'mis_proyectos'
  const cargarProyectos = async () => {
    try {
      const datosGuardados = await AsyncStorage.getItem('mis_proyectos');
      if (datosGuardados !== null) {
        setProyectos(JSON.parse(datosGuardados));
      }
    } catch (error) {
      console.error("Error al cargar proyectos", error);
    }
  };

  // Funcion para inicializar un proyecto nuevo vacio
  const crearNuevoProyecto = async () => {
    if (nombreNuevoProyecto.trim() === '') {
      Alert.alert('Error', 'Ingresa un nombre para el proyecto.');
      return;
    }

    try {
      const nuevoProyecto: ProyectoCarpeta = {
        id: Date.now().toString(),
        nombre: nombreNuevoProyecto,
        fecha: new Date().toLocaleDateString(),
        calculos: []
      };

      const nuevaLista = [...proyectos, nuevoProyecto];
      setProyectos(nuevaLista);
      await AsyncStorage.setItem('mis_proyectos', JSON.stringify(nuevaLista));
      
      setModalNuevoProyecto(false);
      setNombreNuevoProyecto('');
      
      // Abrimos inmediatamente la carpeta recien creada
      abrirProyecto(nuevoProyecto);

    } catch {
      Alert.alert('Error', 'No se pudo crear el proyecto.');
    }
  };

  // Navega al interior de la carpeta
  const abrirProyecto = (proyecto: ProyectoCarpeta) => {
    // router.push ignorara el error de TypeScript temporalmente hasta crear la pantalla
    router.push({
      pathname: '/proyectoDetalle' as any,
      params: { id: proyecto.id, nombre: proyecto.nombre }
    });
  };

  const confirmarEliminacion = (id: string, nombre: string) => {
    Alert.alert(
      "Eliminar Proyecto",
      `¿Borrar la carpeta "${nombre}" y todo su contenido?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => ejecutarEliminacion(id) }
      ]
    );
  };

  const ejecutarEliminacion = async (id: string) => {
    try {
      const nuevaLista = proyectos.filter(p => p.id !== id);
      setProyectos(nuevaLista);
      await AsyncStorage.setItem('mis_proyectos', JSON.stringify(nuevaLista));
    } catch {
      Alert.alert("Error", "No se pudo eliminar el proyecto.");
    }
  };

  const abrirWhatsApp = () => {
    const mensajeWhatsApp = encodeURIComponent('Consulta sobre Aplicación de cálculo? 🐢');
    Linking.openURL(`https://wa.me/${process.env.EXPO_PUBLIC_WHATSAPP_NUMBER}?text=${mensajeWhatsApp}`);
  };

  const abrirFormulario = () => {
    Linking.openURL(process.env.EXPO_PUBLIC_FORM_URL || '');
  };

  // Renderiza cada carpeta en la lista
  const renderProyectoCard = ({ item }: ListRenderItemInfo<ProyectoCarpeta>) => (
    <TouchableOpacity style={styles.card} onPress={() => abrirProyecto(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>📁 {item.nombre}</Text>
        <Text style={styles.cardSubtitle}>Cálculos guardados: {item.calculos?.length || 0}</Text>
        <Text style={styles.cardDate}>Modificado: {item.fecha}</Text>
      </View>
      
      <TouchableOpacity style={styles.btnEliminar} onPress={() => confirmarEliminacion(item.id, item.nombre)}>
        <Text style={styles.btnEliminarText}>Borrar</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No tienes proyectos.</Text>
      <Text style={styles.emptyText}>Presiona el botón + para crear una nueva carpeta.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Mis Proyectos",
          headerRight: () => (
            <TouchableOpacity style={styles.btnHeader} onPress={() => setSoporteVisible(true)}>
              <Text style={styles.btnHeaderTexto}>!</Text>
            </TouchableOpacity>
          )
        }}
      />

      <FlatList
        data={proyectos}
        keyExtractor={(item) => item.id}
        renderItem={renderProyectoCard}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
      />

      {/* Modal informativo original */}
      <Modal animationType="fade" transparent={true} visible={soporteVisible} onRequestClose={() => setSoporteVisible(false)}>
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>Información</Text>
            <Text style={styles.modalCreditos}>Aplicación desarrollada por Manuel Panameño</Text>
            <TouchableOpacity style={styles.btnSoporteOpcion} onPress={abrirWhatsApp}>
              <Text style={styles.btnSoporteOpcionTexto}>Chatear por WhatsApp 🐢</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSoporteOpcion} onPress={abrirFormulario}>
              <Text style={styles.btnSoporteOpcionTexto}>Enviar Sugerencias</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCerrar} onPress={() => setSoporteVisible(false)}>
              <Text style={styles.btnCerrarTexto}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Nuevo Modal para crear carpeta */}
      <Modal visible={modalNuevoProyecto} transparent={true} animationType="fade" onRequestClose={() => setModalNuevoProyecto(false)}>
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>Nuevo Proyecto</Text>
            <Text style={styles.modalCreditos}>Asigna un nombre a la carpeta</Text>
            
            <TextInput 
              style={styles.inputNombre} 
              placeholder="Ej: Residencial Las Luces" 
              value={nombreNuevoProyecto} 
              onChangeText={setNombreNuevoProyecto}
              autoFocus
            />

            <TouchableOpacity style={styles.btnCrear} onPress={crearNuevoProyecto}>
              <Text style={styles.btnCrearTexto}>Crear Carpeta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCerrar} onPress={() => setModalNuevoProyecto(false)}>
              <Text style={styles.btnCerrarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => setModalNuevoProyecto(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContent: { padding: 16, flexGrow: 1 },
  card: { backgroundColor: '#ffffff', padding: 16, marginBottom: 12, borderRadius: 8, elevation: 2, flexDirection: 'row', alignItems: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardSubtitle: { fontSize: 14, color: '#666666', marginTop: 4 },
  cardDate: { fontSize: 12, color: '#999', marginTop: 6 },
  btnEliminar: { backgroundColor: '#ffebee', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  btnEliminarText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#888888', textAlign: 'center', marginTop: 8 },
  fab: { position: 'absolute', right: 20, bottom: 40, backgroundColor: '#007bff', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabIcon: { color: '#ffffff', fontSize: 30, fontWeight: 'bold' },
  btnHeader: { backgroundColor: '#1976d2', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  btnHeaderTexto: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContenido: { backgroundColor: '#ffffff', padding: 24, borderRadius: 12, width: '100%', alignItems: 'center', elevation: 10 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  modalCreditos: { fontSize: 15, color: '#4b5563', textAlign: 'center', marginBottom: 24, fontWeight: '600' },
  
  inputNombre: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, width: '100%', fontSize: 16, marginBottom: 20 },
  btnCrear: { backgroundColor: '#0288d1', width: '100%', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  btnCrearTexto: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  
  btnSoporteOpcion: { backgroundColor: '#f3f4f6', width: '100%', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  btnSoporteOpcionTexto: { color: '#1f2937', fontWeight: 'bold', fontSize: 15 },
  btnCerrar: { marginTop: 8, paddingVertical: 10, width: '100%', alignItems: 'center' },
  btnCerrarTexto: { color: '#9ca3af', fontWeight: 'bold', fontSize: 15 }
});