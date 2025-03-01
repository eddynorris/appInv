import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { almacenApi } from '@/services/api';
import { Almacen } from '@/models';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function AlmacenDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [almacen, setAlmacen] = useState<Almacen | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    const fetchAlmacen = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await almacenApi.getAlmacen(parseInt(id));
        
        if (response) {
          setAlmacen(response);
        } else {
          setError('Error al cargar los datos del almacén');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del almacén');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlmacen();
  }, [id]);

  const handleEdit = () => {
    // Navegar a la pantalla de edición
    router.push(`/almacenes/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      await almacenApi.deleteAlmacen(parseInt(id));
      router.replace('/almacenes');
    } catch (error) {
      setError('Error al eliminar el almacén');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Detalles del Almacén',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText style={styles.loadingText}>Cargando datos del almacén...</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (error || !almacen) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Error',
          headerShown: true 
        }} />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="paperplane.fill" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>
            {error || 'Almacén no encontrado'}
          </ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: almacen.nombre,
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.card}>
            <ThemedText type="title">{almacen.nombre}</ThemedText>
            
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Ubicación</ThemedText>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Ciudad:</ThemedText>
                <ThemedText>{almacen.ciudad || 'No especificada'}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Dirección:</ThemedText>
                <ThemedText>{almacen.direccion || 'No especificada'}</ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Inventario</ThemedText>
              <ThemedText>Este almacén gestiona productos de inventario activos.</ThemedText>
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