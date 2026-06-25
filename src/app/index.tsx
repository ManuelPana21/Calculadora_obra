import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, ListRenderItemInfo, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Medida {
  id: string;
  valor: string;
}

interface Bloque {
  id: string;
  nombre: string;
  medidas: Medida[];
}

interface Plano {
  id: string;
  nombre: string;
  fecha: string;
  bloques: Bloque[];
}

// Componente de pantalla principal para el control de planos guardados
export default function DashboardScreen() {
  // Estados para controlar la lista de proyectos y la ventana flotante de soporte
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [soporteVisible, setSoporteVisible] = useState(false);
  const router = useRouter(); 

  // Efecto que actualiza la lista de planos guardados al volver a ver la pantalla
  useFocusEffect(
    useCallback(() => {
      cargarPlanos();
    }, [])
  );

  // Carga las estructuras JSON desde el almacenamiento persistente
  const cargarPlanos = async () => {
    try {
      const datosGuardados = await AsyncStorage.getItem('mis_planos');
      if (datosGuardados !== null) {
        setPlanos(JSON.parse(datosGuardados));
      }
    } catch (error) {
      console.error("Error al cargar planos", error);
    }
  };

  // Redirecciona al formulario limpio para iniciar una nueva medicion
  const crearNuevoPlano = () => {
    router.push('/editor'); 
  };

  // Envia el objeto del plano seleccionado directamente a la pantalla de calculos
  const abrirPlano = (plano: Plano) => {
    router.push({
      pathname: '/resultados',
      params: { 
        bloques: JSON.stringify(plano.bloques),
        planoOriginal: JSON.stringify(plano)
      }
    });
  };

  // Dispara el cuadro de dialogo nativo de seguridad antes de borrar
  const confirmarEliminacion = (id: string, nombre: string) => {
    Alert.alert(
      "Eliminar Proyecto",
      `¿Estás seguro de que deseas borrar "${nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => ejecutarEliminacion(id) }
      ]
    );
  };

  // Remueve el plano seleccionado de la lista y actualiza la memoria
  const ejecutarEliminacion = async (id: string) => {
    try {
      const nuevaLista = planos.filter(plano => plano.id !== id);
      setPlanos(nuevaLista);
      await AsyncStorage.setItem('mis_planos', JSON.stringify(nuevaLista));
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar el proyecto.");
    }
  };

  const abrirWhatsApp = () => {
  const mensajeWhatsApp = encodeURIComponent('Consulta sobre Aplicación de cielo falso? 🐢');
  Linking.openURL(`https://wa.me/${process.env.EXPO_PUBLIC_WHATSAPP_NUMBER}?text=${mensajeWhatsApp}`);
};

const abrirFormulario = () => {
  Linking.openURL(process.env.EXPO_PUBLIC_FORM_URL || '');
};

  // Construye las tarjetas de la lista principal
  const renderPlanoCard = ({ item }: ListRenderItemInfo<Plano>) => (
    <TouchableOpacity style={styles.card} onPress={() => abrirPlano(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>
        <Text style={styles.cardSubtitle}>Bloques medidos: {item.bloques.length}</Text>
        <Text style={styles.cardDate}>Modificado: {item.fecha}</Text>
      </View>
      
      <TouchableOpacity style={styles.btnEliminar} onPress={() => confirmarEliminacion(item.id, item.nombre)}>
        <Text style={styles.btnEliminarText}>Borrar</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No hay planos guardados.</Text>
      <Text style={styles.emptyText}>Presiona el boton + para crear uno nuevo.</Text>
    </View>
  );

  // Ensamblado visual de la pantalla cuidando no introducir comentarios en el bloque de retorno
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity style={styles.btnHeader} onPress={() => setSoporteVisible(true)}>
              <Text style={styles.btnHeaderTexto}>!</Text>
            </TouchableOpacity>
          )
        }}
      />

      <FlatList
        data={planos}
        keyExtractor={(item) => item.id}
        renderItem={renderPlanoCard}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={soporteVisible}
        onRequestClose={() => setSoporteVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>Información</Text>
            
            <Text style={styles.modalCreditos}>
              Aplicación desarrollada por Manuel Panameño
            </Text>

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

      <TouchableOpacity style={styles.fab} onPress={crearNuevoPlano}>
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
  
  // Estilos de la accion en la barra superior nativa
  btnHeader: { backgroundColor: '#1976d2', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  btnHeaderTexto: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },

  // Estilos de control de capas y diseño del menu de soporte informativo
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContenido: { backgroundColor: '#ffffff', padding: 24, borderRadius: 12, width: '100%', alignItems: 'center', elevation: 10 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  modalCreditos: { fontSize: 15, color: '#4b5563', textAlign: 'center', marginBottom: 24, fontWeight: '600' },
  btnSoporteOpcion: { backgroundColor: '#f3f4f6', width: '100%', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  btnSoporteOpcionTexto: { color: '#1f2937', fontWeight: 'bold', fontSize: 15 },
  btnCerrar: { marginTop: 8, paddingVertical: 10, width: '100%', alignItems: 'center' },
  btnCerrarTexto: { color: '#9ca3af', fontWeight: 'bold', fontSize: 15 }
});