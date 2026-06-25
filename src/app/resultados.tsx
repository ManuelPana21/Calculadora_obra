import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

  // Estados para estructura de Loseta
  const [inputTeePrincipal, setInputTeePrincipal] = useState<string>('0');
  const [inputCrucero, setInputCrucero] = useState<string>('0');
  const [inputAngulo, setInputAngulo] = useState<string>('0');

  // Estados para estructura de Tablaroca
  const [inputCanalCarga, setInputCanalCarga] = useState<string>('0');
  const [inputCanalListon, setInputCanalListon] = useState<string>('0');
  const [inputEsquinero, setInputEsquinero] = useState<string>('0');
  const [inputAnguloCoronacion, setInputAnguloCoronacion] = useState<string>('0');

  useEffect(() => {
    if (planoOriginal) {
      setNombreProyecto(planoOriginal.nombre);
    }
  }, [planoOriginal]);

  const AREA_PLANCHA_YESO = 2.9768; 
  const AREA_LOSETA_GALAXY = 0.7442; 
  const UNIDADES_POR_CAJA_LOSETA = 8; 

  // Factores Loseta
  const FACTOR_CRUCERO_PRINCIPAL = 0.23;
  const FACTOR_CRUCERO_SECUNDARIO = 1.38;
  const FACTOR_ANGULO_PERIMETRAL = 0.5;

  // Factores Tablaroca derivados de norma USG
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

  // Sugerencias iniciales al detectar cambios de area
  useEffect(() => {
    setInputTeePrincipal(Math.ceil(areaEnMetrosParaEstructura * FACTOR_CRUCERO_PRINCIPAL).toString());
    setInputCrucero(Math.ceil(areaEnMetrosParaEstructura * FACTOR_CRUCERO_SECUNDARIO).toString());
    setInputAngulo(Math.ceil(areaEnMetrosParaEstructura * FACTOR_ANGULO_PERIMETRAL).toString());
    
    setInputCanalListon(Math.ceil(areaEnMetrosParaEstructura * FACTOR_CANAL_LISTON).toString());
    setInputCanalCarga(Math.ceil(areaEnMetrosParaEstructura * FACTOR_CANAL_CARGA).toString());
    setInputAnguloCoronacion(Math.ceil(areaEnMetrosParaEstructura * FACTOR_ANGULO_CORONACION).toString());
    setInputEsquinero(Math.ceil(areaEnMetrosParaEstructura * FACTOR_ESQUINERO).toString());
  }, [areaEnMetrosParaEstructura]);

  const guardarProyecto = async () => {
    if (nombreProyecto.trim() === '') {
      Alert.alert("Aviso", "Por favor ingresa un nombre para el proyecto.");
      return;
    }

    try {
      const datosGuardados = await AsyncStorage.getItem('mis_planos');
      let planosExistentes = datosGuardados ? JSON.parse(datosGuardados) : [];

      if (planoOriginal) {
        planosExistentes = planosExistentes.map((p: any) => {
          if (p.id === planoOriginal.id) {
            return { ...p, nombre: nombreProyecto, fecha: new Date().toLocaleDateString(), bloques: bloques };
          }
          return p;
        });
      } else {
        const nuevoPlano = {
          id: Date.now().toString(),
          nombre: nombreProyecto,
          fecha: new Date().toLocaleDateString(),
          bloques: bloques
        };
        planosExistentes.push(nuevoPlano);
      }

      await AsyncStorage.setItem('mis_planos', JSON.stringify(planosExistentes));
      Alert.alert("Exito", planoOriginal ? "Proyecto actualizado correctamente." : "Proyecto guardado correctamente.");
      router.replace('/');
      
    } catch (error) {
      console.error("Error al guardar", error);
    }
  };

  const modificarMedidas = () => {
    const planoParaEditar = planoOriginal || {
      id: Date.now().toString(),
      nombre: nombreProyecto,
      fecha: new Date().toLocaleDateString(),
      bloques: bloques
    };

    router.push({
      pathname: '/editor',
      params: { planoEditando: JSON.stringify(planoParaEditar) }
    });
  };

  // Preparacion del texto respetando los inputs manuales
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
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir el documento.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      
      <View style={styles.topActionsRow}>
        <TouchableOpacity style={styles.btnModificar} onPress={modificarMedidas}>
          <Text style={styles.btnModificarText}>Editar Bloques</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnCompartir} onPress={compartirResumen}>
          <Text style={styles.btnCompartirText}>Compartir Texto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Configuracion</Text>
        
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Resumen de Area</Text>
        <Text style={styles.resultText}>Area Neta: {areaTotal.toFixed(2)} {unidad}</Text>
        <Text style={styles.resultTextHighlight}>Total a cubrir: {areaConDesperdicio.toFixed(2)} {unidad}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estimacion de Cubierta</Text>
        {material === 'Tablaroca' ? (
          <Text style={styles.resultText}>Planchas de Yeso (4x8ft): {planchasTablaroca} unidades</Text>
        ) : (
          <Text style={styles.resultText}>Cajas de Losetas (2x4ft): {cajasLoseta} cajas</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estructura (Editable)</Text>
        
        <View style={styles.alertaContenedor}>
          <Text style={styles.alertaTexto}>Aviso: Valores aproximados. Ajuste las cantidades segun los remates y el perimetro real del proyecto.</Text>
        </View>

        {material === 'Tablaroca' ? (
          <View>
            <View style={styles.inputRowEstructura}>
              <Text style={styles.inputLabelEstructura}>Canal Liston (3.66m):</Text>
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
              <Text style={styles.inputLabelEstructura}>Angulo (3.05m):</Text>
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
              <Text style={styles.inputLabelEstructura}>Angulo (3.05m):</Text>
              <TextInput style={styles.inputEstructura} keyboardType="numeric" value={inputAngulo} onChangeText={setInputAngulo} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.saveCard}>
        <Text style={styles.sectionTitle}>{planoOriginal ? "Actualizar Proyecto" : "Guardar Proyecto"}</Text>
        <TextInput style={styles.textInputFull} placeholder="Ej: Local Comercial 3" value={nombreProyecto} onChangeText={setNombreProyecto} />
        <TouchableOpacity style={styles.btnGuardar} onPress={guardarProyecto}>
          <Text style={styles.btnGuardarText}>{planoOriginal ? "Actualizar Cambios" : "Guardar en Mis Planos"}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  topActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 10 },
  btnModificar: { flex: 1, backgroundColor: '#f0ad4e', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnModificarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  btnCompartir: { flex: 1, backgroundColor: '#4caf50', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnCompartirText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: '#ffffff', padding: 16, marginBottom: 16, borderRadius: 8, elevation: 2 },
  saveCard: { backgroundColor: '#e3f2fd', padding: 16, marginTop: 8, borderRadius: 8, elevation: 2 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#444' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' },
  label: { fontSize: 16, color: '#555', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16, width: 80, textAlign: 'center', backgroundColor: '#fff' },
  textInputFull: { borderWidth: 1, borderColor: '#90caf9', backgroundColor: '#ffffff', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 16 },
  buttonGroup: { flexDirection: 'row', gap: 8 },
  unitBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, backgroundColor: '#e0e0e0' },
  unitBtnActive: { backgroundColor: '#007bff' },
  unitBtnText: { color: '#333', fontSize: 14, fontWeight: 'bold' },
  unitBtnTextActive: { color: '#ffffff' },
  resultText: { fontSize: 16, color: '#555', marginBottom: 8 },
  resultTextHighlight: { fontSize: 18, color: '#d9534f', fontWeight: 'bold', marginTop: 4 },
  btnGuardar: { backgroundColor: '#0288d1', paddingVertical: 14, borderRadius: 6, alignItems: 'center' },
  btnGuardarText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  
  alertaContenedor: { backgroundColor: '#fff3cd', padding: 10, borderRadius: 6, marginBottom: 16, borderWidth: 1, borderColor: '#ffeeba' },
  alertaTexto: { color: '#856404', fontSize: 13, textAlign: 'center' },
  
  inputRowEstructura: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' },
  inputLabelEstructura: { flex: 1, fontSize: 14, color: '#555' },
  inputEstructura: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16, width: 70, textAlign: 'center', backgroundColor: '#fff', marginLeft: 10 }
});