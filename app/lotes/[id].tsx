import React, { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Divider } from '@/components/layout/Divider';
import { Button } from '@/components/buttons/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLotes } from '@/hooks/crud/useLotes';

export default function LoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  
  const {
    lote,
    isLoading,
    error,
    loadLote,
    confirmDelete,
    calcularRendimiento
  } = useLotes();
  
  // Cargar datos del lote al montar
  useEffect(() => {
    if (id) {
      loadLote(parseInt(id));
    }
  }, [id, loadLote]);
  
  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Calcular rendimiento
  const rendimiento = lote && lote.peso_seco_kg ? 
    calcularRendimiento(
      parseFloat(lote.peso_humedo_kg), 
      parseFloat(lote.peso_seco_kg)
    ) : 
    'No disponible';
  
  return (
    <ScreenContainer 
      title="Detalle de Lote" 
      isLoading={isLoading} 
      error={error}
      loadingMessage="Cargando detalle del lote..."
    >
      <ScrollView>
        {lote && (
          <>
            <View style={styles.header}>
              <ThemedText type="title">Lote #{lote.id}</ThemedText>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => router.push(`/lotes/edit/${lote.id}`)}>
                  <AntDesign 
                    name="edit" 
                    size={24} 
                    color={Colors[colorScheme ?? 'light'].text} 
                    style={{ marginRight: 20 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(lote.id, true)}>
                  <AntDesign 
                    name="delete" 
                    size={24} 
                    color="#E53935" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <ThemedView style={styles.card}>
              <ThemedText type="subtitle">Información General</ThemedText>
              <Divider style={{ marginVertical: 12 }} />
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Producto:</ThemedText>
                <ThemedText style={styles.value}>{lote.producto?.nombre || 'No especificado'}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Proveedor:</ThemedText>
                <ThemedText style={styles.value}>{lote.proveedor?.nombre || 'No especificado'}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Descripcion:</ThemedText>
                <ThemedText style={styles.value}>{lote.descripcion}</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Fecha de Ingreso:</ThemedText>
                <ThemedText style={styles.value}>{formatDate(lote.fecha_ingreso)}</ThemedText>
              </View>

            </ThemedView>
            
            <ThemedView style={styles.card}>
              <ThemedText type="subtitle">Información de Peso</ThemedText>
              <Divider style={{ marginVertical: 12 }} />
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Peso Húmedo:</ThemedText>
                <ThemedText style={styles.value}>{parseFloat(lote.peso_humedo_kg).toFixed(2)} kg</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Peso Seco:</ThemedText>
                <ThemedText style={styles.value}>
                  {lote.peso_seco_kg ? parseFloat(lote.peso_seco_kg).toFixed(2) + ' kg' : 'No registrado'}
                </ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Diponible:</ThemedText>
                <ThemedText style={styles.value}>
                  {lote.cantidad_disponible_kg ? parseFloat(lote.cantidad_disponible_kg).toFixed(2) + ' kg' : 'No registrado'}
                </ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Rendimiento:</ThemedText>
                <ThemedText style={styles.value}>{rendimiento}</ThemedText>
              </View>
            </ThemedView>
            
            <Button 
              text="Volver al Listado" 
              onPress={() => router.back()} 
              type="secondary"
              style={{ marginTop: 20 }}
            />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontWeight: '500',
    width: 140,
  },
  value: {
    flex: 1,
  }
});