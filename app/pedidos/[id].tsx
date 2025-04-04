// app/pedidos/[id].tsx (actualizado)
import React, { useEffect, useRef } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PedidoConversion from '@/components/PedidoConversion';
import ProductDetailsList from '@/components/ProductDetailsList';
import { pedidoApi } from '@/services/api';
import { Pedido } from '@/models';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePedidos } from '@/hooks/crud/usePedidos';

export default function PedidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idNumerico = id ? parseInt(id as string) : 0;
  const colorScheme = useColorScheme() ?? 'light';
  
  // Control para evitar múltiples cargas
  const isInitialMount = useRef(true);
  
  // Usar el hook de pedidos
  const {
    pedido,
    isLoading,
    error,
    loadPedido,
    deletePedido
  } = usePedidos();

  // Cargar datos del pedido
  useEffect(() => {
    if (isInitialMount.current && idNumerico) {
      console.log(`Cargando pedido ID ${idNumerico}...`);
      loadPedido(idNumerico);
      isInitialMount.current = false;
    }
  }, [idNumerico, loadPedido]);

  const handleEdit = () => {
    // Navegar a la pantalla de edición
    router.push(`/pedidos/edit/${idNumerico}`);
  };

  const handleDelete = async () => {
    if (idNumerico) {
      await deletePedido(idNumerico, true);
    }
  };

  // Estado del pedido y colores
  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case 'programado':
        return { color: '#FFC107', text: 'Programado' };
      case 'confirmado':
        return { color: '#2196F3', text: 'Confirmado' };
      case 'entregado':
        return { color: '#4CAF50', text: 'Entregado' };
      case 'cancelado':
        return { color: '#F44336', text: 'Cancelado' };
      default:
        return { color: '#757575', text: estado };
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Detalles de Proyección',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText style={styles.loadingText}>Cargando datos del pedido...</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (error || !pedido) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Error',
          headerShown: true 
        }} />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>
            {error || 'Pedido no encontrado'}
          </ThemedText>
        </ThemedView>
      </>
    );
  }

  const estadoInfo = getEstadoInfo(pedido.estado);

  return (
    <>
      <Stack.Screen options={{ 
        title: `Proyección #${pedido.id}`,
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.card}>
            <ThemedText type="title" style={styles.totalText}>
              ${parseFloat(pedido.total_estimado || '0').toFixed(2)}
            </ThemedText>
            
            <ThemedView 
              style={[
                styles.estadoBadge, 
                { backgroundColor: `${estadoInfo.color}20` }
              ]}
            >
              <ThemedText style={[styles.estadoText, { color: estadoInfo.color }]}>
                {estadoInfo.text}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Información General</ThemedText>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Fecha de Creación:</ThemedText>
                <ThemedText>{new Date(pedido.fecha_creacion).toLocaleString()}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Fecha de Entrega:</ThemedText>
                <ThemedText>{new Date(pedido.fecha_entrega).toLocaleString()}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Cliente:</ThemedText>
                <ThemedText>{pedido.cliente?.nombre || 'No especificado'}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Almacén:</ThemedText>
                <ThemedText>{pedido.almacen?.nombre || 'No especificado'}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Vendedor:</ThemedText>
                <ThemedText>{pedido.vendedor?.username || 'No especificado'}</ThemedText>
              </ThemedView>
              
              {pedido.notas && (
                <ThemedView style={styles.notasContainer}>
                  <ThemedText type="defaultSemiBold">Notas:</ThemedText>
                  <ThemedText style={styles.notasText}>{pedido.notas}</ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {/* Usar nuestro componente para mostrar los detalles del pedido */}
            <ThemedView style={styles.section}>
              {pedido.detalles && pedido.detalles.length > 0 ? (
                <ProductDetailsList
                  details={pedido.detalles}
                  title="Productos en la Proyección"
                  isPedido={true}
                />
              ) : (
                <ThemedView style={styles.noDetalles}>
                  <IconSymbol name="exclamationmark.circle" size={30} color="#FFC107" />
                  <ThemedText style={styles.noDetallesText}>
                    No hay productos en esta proyección
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
            
            <ThemedView style={styles.actions}>
              {/* No mostrar botón de convertir si ya está entregado o cancelado */}
              <PedidoConversion 
                pedidoId={idNumerico}
                isDisabled={pedido.estado === 'entregado' || pedido.estado === 'cancelado'}
              />
              
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
  notasContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
  },
  notasText: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  noDetalles: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center', 
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    marginVertical: 10,
  },
  noDetallesText: {
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  convertButton: {
    backgroundColor: '#4CAF50',
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
    fontSize: 13,
  },
});