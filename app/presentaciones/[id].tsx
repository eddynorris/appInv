// app/presentaciones/[id].tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { presentacionApi, productoApi } from '@/services/api';
import { Presentacion, Producto } from '@/models';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function PresentacionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [presentacion, setPresentacion] = useState<Presentacion | null>(null);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const presentacionData = await presentacionApi.getPresentacion(parseInt(id));
        
        if (presentacionData) {
          setPresentacion(presentacionData);
          
          // Cargar datos del producto relacionado
          if (presentacionData.producto_id) {
            const productoData = await productoApi.getProducto(presentacionData.producto_id);
            setProducto(productoData);
          }
        } else {
          setError('Error al cargar los datos de la presentación');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleEdit = () => {
    router.push(`/presentaciones/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      await presentacionApi.deletePresentacion(parseInt(id));
      router.replace('/presentaciones');
    } catch (error) {
      setError('Error al eliminar la presentación');
      setIsLoading(false);
    }
  };

  // Obtener un color asociado al tipo de presentación
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'bruto':
        return '#2196F3'; // Azul
      case 'procesado':
        return '#4CAF50'; // Verde
      case 'merma':
        return '#FFC107'; // Amarillo
      case 'briqueta':
        return '#9C27B0'; // Púrpura
      case 'detalle':
        return '#FF5722'; // Naranja
      default:
        return '#757575'; // Gris
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Detalles de Presentación',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText style={styles.loadingText}>Cargando datos...</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (error || !presentacion) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Error',
          headerShown: true 
        }} />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="paperplane.fill" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>
            {error || 'Presentación no encontrada'}
          </ThemedText>
        </ThemedView>
      </>
    );
  }

  const tipoColor = getTipoColor(presentacion.tipo);

  return (
    <>
      <Stack.Screen options={{ 
        title: presentacion.nombre,
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.card}>
            <ThemedText type="title">{presentacion.nombre}</ThemedText>
            
            <ThemedView 
              style={[
                styles.tipoBadge, 
                { backgroundColor: `${tipoColor}20` }
              ]}
            >
              <ThemedText style={[styles.tipoText, { color: tipoColor }]}>
                {presentacion.tipo.toUpperCase()}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Información General</ThemedText>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Producto:</ThemedText>
                <ThemedText>{producto?.nombre || 'No especificado'}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Capacidad:</ThemedText>
                <ThemedText>{parseFloat(presentacion.capacidad_kg).toFixed(2)} KG</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Precio de Venta:</ThemedText>
                <ThemedText>${parseFloat(presentacion.precio_venta).toFixed(2)}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Estado:</ThemedText>
                <ThemedText style={{ color: presentacion.activo ? '#4CAF50' : '#F44336' }}>
                  {presentacion.activo ? 'Activo' : 'Inactivo'}
                </ThemedText>
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
  tipoBadge: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 16,
  },
  tipoText: {
    fontWeight: '600',
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