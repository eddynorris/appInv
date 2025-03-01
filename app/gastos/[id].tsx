import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { gastoApi } from '@/services/api';
import { Gasto } from '@/models';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function GastoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [gasto, setGasto] = useState<Gasto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    const fetchGasto = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await gastoApi.getGasto(parseInt(id));
        
        if (response) {
          setGasto(response);
        } else {
          setError('Error al cargar los datos del gasto');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del gasto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGasto();
  }, [id]);

  const handleEdit = () => {
    // Navegar a la pantalla de edición
    router.push(`/gastos/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      await gastoApi.deleteGasto(parseInt(id));
      router.replace('/gastos');
    } catch (error) {
      setError('Error al eliminar el gasto');
      setIsLoading(false);
    }
  };

  // Obtener color para la categoría
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'servicios':
        return '#2196F3'; // Azul
      case 'personal':
        return '#4CAF50'; // Verde
      case 'alquiler':
        return '#FFC107'; // Amarillo
      case 'marketing':
        return '#9C27B0'; // Púrpura
      case 'logistica':
        return '#FF5722'; // Naranja
      default:
        return '#757575'; // Gris
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Detalles del Gasto',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText style={styles.loadingText}>Cargando datos del gasto...</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (error || !gasto) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Error',
          headerShown: true 
        }} />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="paperplane.fill" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>
            {error || 'Gasto no encontrado'}
          </ThemedText>
        </ThemedView>
      </>
    );
  }

  const categoryColor = getCategoryColor(gasto.categoria);

  return (
    <>
      <Stack.Screen options={{ 
        title: `Gasto #${gasto.id}`,
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.card}>
            <ThemedText type="title" style={styles.montoText}>
              ${parseFloat(gasto.monto).toFixed(2)}
            </ThemedText>
            
            <ThemedView 
              style={[
                styles.categoryBadge, 
                { backgroundColor: `${categoryColor}20` }
              ]}
            >
              <ThemedText style={[styles.categoryText, { color: categoryColor }]}>
                {gasto.categoria}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Descripción</ThemedText>
              <ThemedText style={styles.descripcionText}>{gasto.descripcion}</ThemedText>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Detalles</ThemedText>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Fecha:</ThemedText>
                <ThemedText>{new Date(gasto.fecha).toLocaleDateString()}</ThemedText>
              </ThemedView>
            </ThemedView>

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
  montoText: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  categoryText: {
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    gap: 8,
  },
  descripcionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
    justifyContent: 'space-between',
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