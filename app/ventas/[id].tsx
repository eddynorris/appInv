import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ventaApi } from '@/services/api';
import { Venta, VentaDetalle } from '@/models';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function VentaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venta, setVenta] = useState<Venta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    const fetchVenta = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await ventaApi.getVenta(parseInt(id));
        
        if (response) {
          setVenta(response);
        } else {
          setError('Error al cargar los datos de la venta');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos de la venta');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenta();
  }, [id]);

  const handleEdit = () => {
    // Navegar a la pantalla de edición
    router.push(`/ventas/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      await ventaApi.deleteVenta(parseInt(id));
      router.replace('/ventas');
    } catch (error) {
      setError('Error al eliminar la venta');
      setIsLoading(false);
    }
  };

  // Estado de pago y colores
  const getEstadoPagoInfo = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return { color: '#4CAF50', text: 'Pagado' };
      case 'pendiente':
        return { color: '#FFC107', text: 'Pendiente' };
      case 'parcial':
        return { color: '#FF9800', text: 'Pago Parcial' };
      default:
        return { color: '#757575', text: estado };
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Detalles de Venta',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText style={styles.loadingText}>Cargando datos de la venta...</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (error || !venta) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Error',
          headerShown: true 
        }} />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="paperplane.fill" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>
            {error || 'Venta no encontrada'}
          </ThemedText>
        </ThemedView>
      </>
    );
  }

  const estadoPago = getEstadoPagoInfo(venta.estado_pago);

  return (
    <>
      <Stack.Screen options={{ 
        title: `Venta #${venta.id}`,
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.card}>
            <ThemedText type="title" style={styles.totalText}>
              ${parseFloat(venta.total).toFixed(2)}
            </ThemedText>
            
            <ThemedView 
              style={[
                styles.estadoBadge, 
                { backgroundColor: `${estadoPago.color}20` }
              ]}
            >
              <ThemedText style={[styles.estadoText, { color: estadoPago.color }]}>
                {estadoPago.text}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Información General</ThemedText>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Fecha:</ThemedText>
                <ThemedText>{new Date(venta.fecha).toLocaleString()}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Cliente:</ThemedText>
                <ThemedText>{venta.cliente?.nombre || 'No especificado'}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Almacén:</ThemedText>
                <ThemedText>{venta.almacen?.nombre || 'No especificado'}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Tipo de Pago:</ThemedText>
                <ThemedText style={{ textTransform: 'capitalize' }}>{venta.tipo_pago}</ThemedText>
              </ThemedView>
            </ThemedView>

            {venta.credito && (
              <ThemedView style={styles.section}>
                <ThemedText type="subtitle">Información de Crédito</ThemedText>
                
                <ThemedView style={styles.infoRow}>
                  <ThemedText type="defaultSemiBold">Fecha de Vencimiento:</ThemedText>
                  <ThemedText>{new Date(venta.credito.fecha_vencimiento).toLocaleDateString()}</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.infoRow}>
                  <ThemedText type="defaultSemiBold">Monto Pagado:</ThemedText>
                  <ThemedText>${parseFloat(venta.credito.monto_pagado).toFixed(2)}</ThemedText>
                </ThemedView>
              </ThemedView>
            )}

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Detalles de la Venta</ThemedText>
              
              {venta.detalles && venta.detalles.length > 0 ? (
                <ThemedView style={styles.detallesContainer}>
                  <ThemedView style={styles.detallesHeader}>
                    <ThemedText style={[styles.detalleHeaderText, styles.productoColumn]}>Producto</ThemedText>
                    <ThemedText style={[styles.detalleHeaderText, styles.cantidadColumn]}>Cant.</ThemedText>
                  </ThemedView>
                  
                  {venta.detalles.map((detalle: VentaDetalle) => (
                    <ThemedView key={detalle.id} style={styles.detalleRow}>
                      <ThemedText style={styles.productoColumn}>{detalle.producto?.nombre}</ThemedText>
                      <ThemedText style={styles.cantidadColumn}>{detalle.cantidad}</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              ) : (
                <ThemedText>No hay detalles disponibles para esta venta.</ThemedText>
              )}
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
  totalText: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  estadoBadge: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  estadoText: {
    fontWeight: '600',
    textTransform: 'uppercase',
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
  detallesContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  detallesHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  detalleHeaderText: {
    fontWeight: '600',
  },
  detalleRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
  },
  productoColumn: {
    flex: 3,
  },
  cantidadColumn: {
    flex: 1,
    textAlign: 'center',
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