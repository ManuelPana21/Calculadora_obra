import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Definimos la estructura de datos para nuestros bloques
interface Bloque {
  id: string;
  nombre: string;
  medidas: number[];
  areaCalculada: number;
}

// Definimos la estructura para el plano completo
interface Plano {
  id: string;
  nombre: string;
  fecha: string;
  bloques: Bloque[];
}

// Definimos las rutas disponibles en nuestra navegacion
type RootStackParamList = {
  Dashboard: undefined;
  EditorPlanos: undefined;
};

// Tipamos las propiedades que recibe la pantalla para la navegacion
type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  
  // Estado principal que guardara el arreglo de Planos
  const [planos, setPlanos] = useState<Plano[]>([]);

  // Ejecutamos la carga de datos al momento de abrir la pantalla
  useEffect(() => {
    cargarPlanos();
  }, []);

  // Funcion asincrona para leer la informacion guardada en el dispositivo
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

  // Redirige al usuario a la vista para agregar un plano nuevo
  const crearNuevoPlano = () => {
    navigation.navigate('EditorPlanos');
  };

  // Componente visual para cada elemento de la lista
  const renderPlanoCard = ({ item }: ListRenderItemInfo<Plano>) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.cardTitle}>{item.nombre}</Text>
      <Text style={styles.cardSubtitle}>Bloques: {item.bloques.length}</Text>
    </TouchableOpacity>
  );

  // Componente visual que se muestra si el arreglo de planos esta vacio
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No hay planos guardados.</Text>
      <Text style={styles.emptyText}>Presiona el boton + para crear uno nuevo.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      
      // FlatList optimiza la carga en pantalla de listas grandes
      <FlatList
        data={planos}
        keyExtractor={(item) => item.id}
        renderItem={renderPlanoCard}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
      />

      // Boton flotante de accion principal
      <TouchableOpacity style={styles.fab} onPress={crearNuevoPlano}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// Objeto de estilos visuales separado de la logica
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 'bold',
  },
});