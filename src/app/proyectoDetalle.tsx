import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, ListRenderItemInfo, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Interfaz para definir como se ve cada calculo guardado dentro de la carpeta
interface CalculoGuardado {
  id: string;
  nombre: string;
  fecha: string;
  tipo: 'muro' | 'cielo';
  datos: any; 
}

export default function ProyectoDetalleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Extraemos el id y nombre de la carpeta que nos envio la pantalla anterior
  const proyectoId = params.id as string;
  const proyectoNombre = params.nombre as string;

  const [calculos, setCalculos] = useState<CalculoGuardado[]>([]);
  const [menuNuevoVisible, setMenuNuevoVisible] = useState(false);

  // Buscamos el proyecto especifico y extraemos su arreglo de calculos
  const cargarCalculosDelProyecto = useCallback(async () => {
    try {
      const datosGuardados = await AsyncStorage.getItem('mis_proyectos');
      if (datosGuardados !== null) {
        const proyectos = JSON.parse(datosGuardados);
        const proyectoActual = proyectos.find((p: any) => p.id === proyectoId);
        if (proyectoActual && proyectoActual.calculos) {
          setCalculos(proyectoActual.calculos);
        }
      }
    } catch (error) {
      console.error("Error al cargar calculos", error);
    }
  }, [proyectoId]);

  // Recargamos los datos cada vez que entramos a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarCalculosDelProyecto();
    }, [cargarCalculosDelProyecto])
  );

  // Funciones para crear nuevos calculos enviando el ID de la carpeta actual
  const crearNuevoCielo = () => {
    setMenuNuevoVisible(false);
    router.push({
      pathname: '/editor',
      params: { proyectoId: proyectoId }
    });
  };

  const crearNuevoMuro = () => {
    setMenuNuevoVisible(false);
    router.push({
      pathname: '/muros' as any,
      params: { proyectoId: proyectoId }
    });
  };

  // Funcion para abrir un calculo ya existente segun su tipo
  const abrirCalculo = (calculo: CalculoGuardado) => {
    if (calculo.tipo === 'muro') {
      router.push({
        pathname: '/resultadosMuros',
        params: { ...calculo.datos, proyectoId: proyectoId, calculoId: calculo.id, nombreMuro: calculo.nombre }
      });
    } else {
      router.push({
        pathname: '/resultados',
        params: { ...calculo.datos, proyectoId: proyectoId, calculoId: calculo.id, nombreProyecto: calculo.nombre }
      });
    }
  };

  // Funcion para eliminar un calculo especifico dentro de la carpeta
  const confirmarEliminacion = (id: string, nombre: string) => {
    Alert.alert(
      "Eliminar Cálculo",
      `¿Borrar el cálculo "${nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => ejecutarEliminacion(id) }
      ]
    );
  };

  const ejecutarEliminacion = async (calculoId: string) => {
    try {
      const datosGuardados = await AsyncStorage.getItem('mis_proyectos');
      if (datosGuardados !== null) {
        let proyectos = JSON.parse(datosGuardados);
        const indexProyecto = proyectos.findIndex((p: any) => p.id === proyectoId);
        
        if (indexProyecto !== -1) {
          // Filtramos el calculo que queremos borrar
          const calculosActualizados = proyectos[indexProyecto].calculos.filter((c: any) => c.id !== calculoId);
          proyectos[indexProyecto].calculos = calculosActualizados;
          
          await AsyncStorage.setItem('mis_proyectos', JSON.stringify(proyectos));
          setCalculos(calculosActualizados);
        }
      }
    } catch {
      Alert.alert("Error", "No se pudo eliminar el cálculo.");
    }
  };

  // Diseno de la tarjeta para cada calculo guardado
  const renderCalculoCard = ({ item }: ListRenderItemInfo<CalculoGuardado>) => (
    <TouchableOpacity style={styles.card} onPress={() => abrirCalculo(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>
          {item.nombre}
        </Text>
        <Text style={styles.cardSubtitle}>Tipo: {item.tipo === 'muro' ? 'Muro de bloque/ladrillo' : 'Cielo falso'}</Text>
        <Text style={styles.cardDate}>Fecha: {item.fecha}</Text>
      </View>
      
      <TouchableOpacity style={styles.btnEliminar} onPress={() => confirmarEliminacion(item.id, item.nombre)}>
        <Text style={styles.btnEliminarText}>Borrar</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Carpeta vacía.</Text>
      <Text style={styles.emptyText}>Presiona el botón + para agregar un cálculo.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Colocamos el nombre de la carpeta en la cabecera */}
      <Stack.Screen options={{ title: proyectoNombre || "Detalle del Proyecto" }} />

      <FlatList
        data={calculos}
        keyExtractor={(item) => item.id}
        renderItem={renderCalculoCard}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setMenuNuevoVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Modal para elegir que tipo de calculo crear */}
      <Modal visible={menuNuevoVisible} transparent={true} animationType="fade" onRequestClose={() => setMenuNuevoVisible(false)}>
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>¿Qué deseas agregar?</Text>
            
            <TouchableOpacity style={styles.btnOpcion} onPress={crearNuevoCielo}>
              <Text style={styles.btnOpcionTexto}>Techo / Cielo Falso</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnOpcion} onPress={crearNuevoMuro}>
              <Text style={styles.btnOpcionTexto}>Muro de Bloque/Ladrillo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCerrar} onPress={() => setMenuNuevoVisible(false)}>
              <Text style={styles.btnCerrarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContenido: { backgroundColor: '#ffffff', padding: 24, borderRadius: 12, width: '100%', alignItems: 'center', elevation: 10 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  btnOpcion: { backgroundColor: '#f3f4f6', width: '100%', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  btnOpcionTexto: { color: '#1f2937', fontWeight: 'bold', fontSize: 15 },
  btnCerrar: { marginTop: 8, paddingVertical: 10, width: '100%', alignItems: 'center' },
  btnCerrarTexto: { color: '#9ca3af', fontWeight: 'bold', fontSize: 15 }
});