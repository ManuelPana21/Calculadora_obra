import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Ya no importamos la navegacion de stack ni el App.tsx

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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
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
                />
              </View>
            ))}

            {bloque.medidas.length < 4 && (
              <TouchableOpacity 
                style={styles.btnAddMedida} 
                onPress={() => agregarMedidaABloque(bloque.id)}
              >
                <Text style={styles.btnAddMedidaText}>+ Agregar medida (Cara extra)</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.btnAddBloque} onPress={agregarBloque}>
          <Text style={styles.btnAddBloqueText}>+ Añadir otro bloque</Text>
        </TouchableOpacity>
        
      </ScrollView>

      <TouchableOpacity style={styles.fabConfirmar}>
        <Text style={styles.fabIcon}>✓</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  bloqueCard: { backgroundColor: '#ffffff', padding: 16, marginBottom: 16, borderRadius: 8, elevation: 2 },
  bloqueTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { flex: 1, fontSize: 16, color: '#333' },
  input: { flex: 2, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16 },
  btnAddMedida: { marginTop: 10, padding: 8, backgroundColor: '#e0f7fa', borderRadius: 4, alignItems: 'center' },
  btnAddMedidaText: { color: '#00796b', fontWeight: 'bold' },
  btnAddBloque: { backgroundColor: '#e0e0e0', padding: 16, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
  btnAddBloqueText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  fabConfirmar: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#28a745', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabIcon: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
});