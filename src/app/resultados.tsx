import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Medida {
  id: string;
  valor: string;
}

interface Bloque {
  id: string;
  nombre: string;
  medidas: Medida[];
}

export default function ResultadosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const bloquesJson = typeof params.bloques === 'string' ? params.bloques : '[]';
  const bloques: Bloque[] = JSON.parse(bloquesJson);
  const planoOriginal = params.planoOriginal ? JSON.parse(params.planoOriginal as string) : null;

  const [unidad, setUnidad] = useState<'m2' | 'ft2' | 'in2'>('m2');
  const [desperdicio, setDesperdicio] = useState<string>('10');
  const [material, setMaterial] = useState<'Tablaroca' | 'Loseta'>('Tablaroca');
  const [nombreProyecto, setNombreProyecto] = useState<string>('');

  const [inputTeePrincipal, setInputTeePrincipal] = useState<string>('0');
  const [inputCrucero, setInputCrucero] = useState<string>('0');
  const [inputAngulo, setInputAngulo] = useState<string>('0');

  const [inputCanalCarga, setInputCanalCarga] = useState<string>('0');
  const [inputCanalListon, setInputCanalListon] = useState<string>('0');
  const [inputEsquinero, setInputEsquinero] = useState<string>('0');
  const [inputAnguloCoronacion, setInputAnguloCoronacion] = useState<string>('0');

  useEffect(() => {
    if (params.nombreProyecto) {
      setNombreProyecto(params.nombreProyecto as string);
    } else if (planoOriginal) {
      setNombreProyecto(planoOriginal.nombre);
    }
  }, [params.nombreProyecto, planoOriginal]);

  const AREA_PLANCHA_YESO = 2.9768; 
  const AREA_LOSETA_GALAXY = 0.7442; 
  const UNIDADES_POR_CAJA_LOSETA = 8; 

  const FACTOR_CRUCERO_PRINCIPAL = 0.23;
  const FACTOR_CRUCERO_SECUNDARIO = 1.38;
  const FACTOR_ANGULO_PERIMETRAL = 0.5;

  const FACTOR_CANAL_LISTON = 0.45;
  const FACTOR_CANAL_CARGA = 0.27;
  const FACTOR_ANGULO_CORONACION = 0.5;
  const FACTOR_ESQUINERO = 0.2;

  const areaTotal = useMemo(() => {
    let total = 0;
    bloques.forEach((bloque) => {
      const valores = bloque.medidas.map(m => parseFloat(m.valor) || 0);
      const numLados = valores.length;
      let areaBloque = 0;

      if (numLados === 2) {
        areaBloque = valores[0] * valores[1];
      } else if (numLados === 3) {
        const [a, b, c] = valores;
        const s = (a + b + c) / 2;
        const radicando = s * (s - a) * (s - b) * (s - c);
        areaBloque = radicando > 0 ? Math.sqrt(radicando) : 0;
      } else if (numLados === 4) {
        const [a, b, c, d] = valores;
        areaBloque = ((a + c) / 2) * ((b + d) / 2);
      }
      total += areaBloque;
    });

    if (unidad === 'ft2') total *= 10.7639;
    if (unidad === 'in2') total *= 1550.0031;

    return total;
  }, [bloques, unidad]);

  const areaConDesperdicio = areaTotal * (1 + (parseFloat(desperdicio) || 0) / 100);
  
  const planchasTablaroca = Math.ceil(areaConDesperdicio / AREA_PLANCHA_YESO);
  const cajasLoseta = Math.ceil(areaConDesperdicio / (AREA_LOSETA_GALAXY * UNIDADES_POR_CAJA_LOSETA));

  const areaEnMetrosParaEstructura = unidad === 'm2' ? areaConDesperdicio : areaConDesperdicio / (unidad === 'ft2' ? 10.7639 : 1550.0031);

  useEffect(() => {
    setInputTeePrincipal(Math.ceil(areaEnMetrosParaEstructura * FACTOR_CRUCERO_PRINCIPAL).toString());
    setInputCrucero(Math.ceil(areaEnMetrosParaEstructura * FACTOR_CRUCERO_SECUNDARIO).toString());
    setInputAngulo(Math.ceil(areaEnMetrosParaEstructura * FACTOR_ANGULO_PERIMETRAL).toString());
    
    setInputCanalListon(Math.ceil(areaEnMetrosParaEstructura * FACTOR_CANAL_LISTON).toString());
    setInputCanalCarga(Math.ceil(areaEnMetrosParaEstructura * FACTOR_CANAL_CARGA).toString());
    setInputAnguloCoronacion(Math.ceil(areaEnMetrosParaEstructura * FACTOR_ANGULO_CORONACION).toString());
    setInputEsquinero(Math.ceil(areaEnMetrosParaEstructura * FACTOR_ESQUINERO).toString());
  }, [areaEnMetrosParaEstructura]);

  // Logica de guardado temporalmente adaptada para la migracion a carpetas
  const guardarProyecto = async () => {
    if (nombreProyecto.trim() === '') {
      Alert.alert("Aviso", "Por favor ingresa un nombre para el cálculo.");
      return;
    }

    try {
      const datosGuardados = await AsyncStorage.getItem('mis_proyectos');
      if (datosGuardados !== null) {
        let proyectos = JSON.parse(datosGuardados);
        // Buscamos la carpeta actual usando el ID que pasamos desde la pantalla anterior
        const indexProyecto = proyectos.findIndex((p: any) => p.id === params.proyectoId);
        
        if (indexProyecto !== -1) {
          const nuevoCalculo = {
            id: params.calculoId || Date.now().toString(),
            nombre: nombreProyecto,
            fecha: new Date().toLocaleDateString(),
            tipo: 'cielo',
            datos: { 
              ...params, 
              nombreProyecto: nombreProyecto, 
              bloques: JSON.stringify(bloques) 
            }
          };

          // Si ya tenia un ID, lo actualizamos. Si no, lo agregamos a la carpeta.
          if (params.calculoId) {
            const indexCalculo = proyectos[indexProyecto].calculos.findIndex((c: any) => c.id === params.calculoId);
            if (indexCalculo !== -1) proyectos[indexProyecto].calculos[indexCalculo] = nuevoCalculo;
          } else {
            proyectos[indexProyecto].calculos.push(nuevoCalculo);
          }

          await AsyncStorage.setItem('mis_proyectos', JSON.stringify(proyectos));
          
          Alert.alert("Éxito", params.calculoId ? "Cálculo actualizado." : "Cálculo guardado.", [
            // Regresamos a la raíz del Stack limpiando todo el historial
            { text: "Ir al Inicio", onPress: () => router.dismissAll() } 
          ]);
        }
      }
    } catch (error) {
      console.error("Error al guardar", error);
      Alert.alert("Error", "No se pudo guardar el cálculo.");
    }
  };

  const modificarMedidas = () => {
    const planoParaEditar = {
      id: params.calculoId || (planoOriginal ? planoOriginal.id : Date.now().toString()),
      nombre: nombreProyecto, 
      fecha: new Date().toLocaleDateString(),
      bloques: bloques
    };

    router.push({
      pathname: '/editor',
      params: { 
        planoEditando: JSON.stringify(planoParaEditar),
        proyectoId: params.proyectoId,
        calculoId: params.calculoId,
        nombreProyecto: nombreProyecto
      }
    });
  };

  const compartirResumen = async () => {
    try {
      let mensajeMateriales = '';
      
      if (material === 'Tablaroca') {
        mensajeMateriales = `- Planchas de Yeso (4x8ft): ${planchasTablaroca} unidades\n- Canal Liston (3.66m): ${inputCanalListon} unidades\n- Canal de Carga (3.05m): ${inputCanalCarga} unidades\n- Angulo Coronacion (3.05m): ${inputAnguloCoronacion} unidades\n- Esquinero (3.05m): ${inputEsquinero} unidades`;
      } else {
        mensajeMateriales = `- Cajas de Losetas Galaxy (2x4ft): ${cajasLoseta} cajas\n- Tee Principal (3.66m): ${inputTeePrincipal} unidades\n- Cruceros (1.22m): ${inputCrucero} unidades\n- Angulos Perimetrales (3.05m): ${inputAngulo} unidades`;
      }

      const avisoLegal = "\n\nNOTA: Las cantidades de estructura son estimaciones base. Valide estos datos en sitio segun perimetros y recortes.";
      const mensaje = `Resumen de Proyecto: ${nombreProyecto || 'Sin nombre'}\n\nArea Neta: ${areaTotal.toFixed(2)} ${unidad}\nTotal a cubrir: ${areaConDesperdicio.toFixed(2)} ${unidad}\n\nMaterial Estimado (${material}):\n${mensajeMateriales}${avisoLegal}`;

      await Share.share({
        message: mensaje,
      });
    } catch {
      Alert.alert("Error", "No se pudo compartir el documento.");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Resultados Cielo Falso' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.headerCard}>
          <Text style={styles.title}>Resultados: {nombreProyecto || 'Cielo Falso'}</Text>
          <Text style={styles.subtitle}>Superficie neta: {areaTotal.toFixed(2)} {unidad}</Text>
        </View>

        <View style={styles.saveCard}>
          <Text style={styles.sectionTitle}>Nombre del Cálculo</Text>
          <TextInput style={styles.textInputFull} placeholder="Ej: Sala Principal" value={nombreProyecto} onChangeText={setNombreProyecto} />
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Unidad:</Text>
            <View style={styles.buttonGroup}>
              {['m2', 'ft2', 'in2'].map((u) => (
                <TouchableOpacity key={u} style={[styles.unitBtn, unidad === u && styles.unitBtnActive]} onPress={() => setUnidad(u as any)}>
                  <Text style={[styles.unitBtnText, unidad === u && styles.unitBtnTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Desperdicio (%):</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={desperdicio} onChangeText={setDesperdicio} />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Material:</Text>
            <View style={styles.buttonGroup}>
              {['Tablaroca', 'Loseta'].map((m) => (
                <TouchableOpacity key={m} style={[styles.unitBtn, material === m && styles.unitBtnActive]} onPress={() => setMaterial(m as any)}>
                  <Text style={[styles.unitBtnText, material === m && styles.unitBtnTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Resumen de Área</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Área Neta:</Text>
            <Text style={styles.dataValue}>{areaTotal.toFixed(2)} {unidad}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Total a cubrir ({desperdicio}% desp.):</Text>
            <Text style={styles.dataValueHighlight}>{areaConDesperdicio.toFixed(2)} {unidad}</Text>
          </View>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Estimación de Cubierta</Text>
          {material === 'Tablaroca' ? (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Planchas de Yeso (4x8ft):</Text>
              <Text style={styles.dataValueHighlight}>{planchasTablaroca} unds</Text>
            </View>
          ) : (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Cajas de Losetas (2x4ft):</Text>
              <Text style={styles.dataValueHighlight}>{cajasLoseta} cajas</Text>
            </View>
          )}
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Estructura (Editable)</Text>
          
          <View style={styles.alertaContenedor}>
            <Text style={styles.alertaTexto}>Aviso: Valores aproximados. Ajuste las cantidades según los remates y el perímetro real del proyecto.</Text>
          </View>

          {material === 'Tablaroca' ? (
            <View>
              <View style={styles.inputRowEstructura}>
                <Text style={styles.inputLabelEstructura}>Canal Listón (3.66m):</Text>
                <TextInput style={styles.inputEstructura} keyboardType="numeric" value={inputCanalListon} onChangeText={setInputCanalListon} />
              </View>
              <View style={styles.inputRowEstructura}>
                <Text style={styles.inputLabelEstructura}>Canal Carga (3.05m):</Text>
                <TextInput style={styles.inputEstructura} keyboardType="numeric" value={inputCanalCarga} onChangeText={setInputCanalCarga} />
              </View>
              <View style={styles.inputRowEstructura}>
                <Text style={styles.inputLabelEstructura}>Esquinero (3.05m):</Text>
                <TextInput style={styles.inputEstructura} keyboardType="numeric" value={inputEsquinero} onChangeText={setInputEsquinero} />
              </View>
              <View style={styles.inputRowEstructura}>
                <Text style={styles.inputLabelEstructura}>Ángulo (3.05m):</Text>
                <TextInput style={styles.inputEstructura} keyboardType="numeric" value={inputAnguloCoronacion} onChangeText={setInputAnguloCoronacion} />
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.inputRowEstructura}>
                <Text style={styles.inputLabelEstructura}>Tee Principal (3.66m):</Text>
                <TextInput style={styles.inputEstructura} keyboardType="numeric" value={inputTeePrincipal} onChangeText={setInputTeePrincipal} />
              </View>
              <View style={styles.inputRowEstructura}>
                <Text style={styles.inputLabelEstructura}>Crucero (1.22m):</Text>
                <TextInput style={styles.inputEstructura} keyboardType="numeric" value={inputCrucero} onChangeText={setInputCrucero} />
              </View>
              <View style={styles.inputRowEstructura}>
                <Text style={styles.inputLabelEstructura}>Ángulo (3.05m):</Text>
                <TextInput style={styles.inputEstructura} keyboardType="numeric" value={inputAngulo} onChangeText={setInputAngulo} />
              </View>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Footer actualizado con el padding de resultadosMuros */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnVolver} onPress={modificarMedidas}>
          <Text style={styles.btnVolverText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnGuardar} onPress={guardarProyecto}>
          <Text style={styles.btnGuardarText}>Guardar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnCompartir} onPress={compartirResumen}>
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
  saveCard: { backgroundColor: '#e3f2fd', padding: 16, marginBottom: 16, borderRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  dataLabel: { fontSize: 15, color: '#555' },
  dataValue: { fontSize: 15, fontWeight: '600', color: '#333' },
  dataValueHighlight: { fontSize: 16, fontWeight: 'bold', color: '#00796b' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' },
  label: { fontSize: 16, color: '#555', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16, width: 80, textAlign: 'center', backgroundColor: '#fff' },
  textInputFull: { borderWidth: 1, borderColor: '#90caf9', backgroundColor: '#ffffff', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  buttonGroup: { flexDirection: 'row', gap: 8 },
  unitBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, backgroundColor: '#e0e0e0' },
  unitBtnActive: { backgroundColor: '#007bff' },
  unitBtnText: { color: '#333', fontSize: 14, fontWeight: 'bold' },
  unitBtnTextActive: { color: '#ffffff' },
  
  alertaContenedor: { backgroundColor: '#fff3cd', padding: 10, borderRadius: 6, marginBottom: 16, borderWidth: 1, borderColor: '#ffeeba' },
  alertaTexto: { color: '#856404', fontSize: 13, textAlign: 'center' },
  
  inputRowEstructura: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' },
  inputLabelEstructura: { flex: 1, fontSize: 14, color: '#555' },
  inputEstructura: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16, width: 70, textAlign: 'center', backgroundColor: '#fff', marginLeft: 10 },

  // Estilos homologados con resultadosMuros.tsx
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