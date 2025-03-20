import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { API_CONFIG } from '@/services/api';
import { Lote } from '@/models';
import { loteApi } from '@/services/api';

export default function LoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lote, setLote] = useState<Lote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    const fetchLote = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await loteApi.getLote(parseInt(id));
        
        if (response) {
          setLote(response);
        } else {
          setError('Error al cargar los datos del lote');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del lote');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLote();
  }, [id]);

  const handleEdit = () => {
    router.push(`/lotes/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    Alert.alert(
      'Eliminar Lote',
      '¿Está seguro que desea eliminar este lote? Esta acción podría afectar al inventario.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await loteApi.deleteLote(parseInt(id));
              router.replace('/lotes');
            } catch (error) {
              setError('Error al eliminar el lote');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Detalles del Lote',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText style={styles.loadingText}>Cargando datos del lote...</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (error || !lote) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Error',
          headerShown: true 
        }} />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="paperplane.fill" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>
            {error || 'Lote no encontrado'}
          </ThemedText>
        </ThemedView>
      </>
    );
  }

  // Calcular el ratio de rendimiento (peso seco / peso húmedo)
  const calcularRendimiento = () => {
    if (!lote.peso_seco_kg || parseFloat(lote.peso_humedo_kg) === 0) return 'No disponible';
    const rendimiento = (parseFloat(lote.peso_seco_kg) / parseFloat(lote.peso_humedo_kg)) * 100;
    return `${rendimiento.toFixed(2)}%`;
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: `Lote #${lote.id}`,
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.card}>
            <ThemedText type="title">Lote #{lote.id}</ThemedText>
            
            <ThemedView style={styles.productBadge}>
              <ThemedText style={styles.productText}>
                {lote.producto?.nombre || 'Producto no especificado'}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Información General</ThemedText>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Fecha de Ingreso:</ThemedText>
                <ThemedText>{new Date(lote.fecha_ingreso).toLocaleDateString()}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Proveedor:</ThemedText>
                <ThemedText>{lote.proveedor?.nombre || 'No especificado'}</ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Detalles del Peso</ThemedText>
              
              <ThemedView style={styles.weightContainer}>
                <ThemedView style={styles.weightItem}>
                  <ThemedText style={styles.weightLabel}>Peso Húmedo</ThemedText>
                  <ThemedText style={styles.weightValue}>{parseFloat(lote.peso_humedo_kg).toFixed(2)} kg</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.weightItem}>
                  <ThemedText style={styles.weightLabel}>Peso Seco</ThemedText>
                  <ThemedText style={styles.weightValue}>
                    {lote.peso_seco_kg ? parseFloat(lote.peso_seco_kg).toFixed(2) + ' kg' : 'No registrado'}
                  </ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.weightItem}>
                  <ThemedText style={styles.weightLabel}>Rendimiento</ThemedText>
                  <ThemedText style={styles.weightValue}>{calcularRendimiento()}</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
            
            {lote.cantidad_disponible_kg && (
              <ThemedView style={styles.stockSection}>
                <ThemedText type="subtitle">Disponibilidad</ThemedText>
                <ThemedView style={styles.infoRow}>
                  <ThemedText type="defaultSemiBold">Cantidad disponible:</ThemedText>
                  <ThemedText style={
                    parseFloat(lote.cantidad_disponible_kg) > 0 
                      ? styles.available 
                      : styles.unavailable
                  }>
                    {parseFloat(lote.cantidad_disponible_kg).toFixed(2)} kg
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            )}

            <ThemedView style={styles.actions}>
              <TouchableOpacity 
                style={[styles.button, styles.editButton]} 
                onPress={handleEdit}
              >
                <ThemedText style={styles.buttonText}>Editar</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.deleteButton]} 
                onPress={handleDelete}
              >
                <ThemedText style={styles.buttonText}>Eliminar</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#E53935',
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)', // Verde claro
  },
  productText: {
    fontWeight: '600',
    color: '#4CAF50', // Verde
  },
  section: {
    marginTop: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
    justifyContent: 'space-between',
  },
  weightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  weightItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    margin: 4,
  },
  weightLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stockSection: {
    marginTop: 16,
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 235, 59, 0.1)', // Amarillo claro para inventario
    borderRadius: 8,
  },
  available: {
    color: '#4CAF50', // Verde
    fontWeight: 'bold',
  },
  unavailable: {
    color: '#E53935', // Rojo
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});