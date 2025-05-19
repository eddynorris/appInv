// app/pedidos/[id].tsx - Actualizado para implementar restricciones basadas en rol
import React, { useEffect, useState } from 'react';
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
import { usePedidoItem } from '@/hooks/crud/usePedidoItem';
import { useAuth } from '@/context/AuthContext'; // Importar contexto de autenticación

export default function PedidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idNumerico = id ? parseInt(id as string) : 0;
  const colorScheme = useColorScheme() ?? 'light';
  const { user } = useAuth(); // Obtener usuario actual
  
  // Determinar permisos según el rol
  const isAdmin = user?.rol === 'admin';

  // Usar el hook de item de pedido
  const {
    pedido,
    isLoading,
    error,
    getPedido,
    deletePedido,
    canEditOrDelete
  } = usePedidoItem();

  // Cargar datos del pedido
  useEffect(() => {
    if (idNumerico) {
      getPedido(idNumerico);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idNumerico]);

  const handleEdit = () => {
    // Verificar permisos usando la función del hook
    if (!canEditOrDelete(pedido)) {
      Alert.alert("Acceso restringido", "No tienes permisos para editar esta proyección.");
      return;
    }
    router.push(`/pedidos/edit/${idNumerico}`);
  };

  // Estado del pedido y colores
  const getEstadoInfo = (estado?: string) => {
    if (!estado) return { color: '#757575', text: 'Desconocido' };
    switch (estado) {
      case 'programado': return { color: Colors.warning, text: 'Programado' };
      case 'confirmado': return { color: Colors.info, text: 'Confirmado' };
      case 'entregado': return { color: Colors.success, text: 'Entregado' };
      case 'cancelado': return { color: Colors.danger, text: 'Cancelado' };
      default: return { color: '#757575', text: estado };
    }
  };

  if (isLoading && !pedido) {
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

  if ((error && !isLoading) || (!pedido && !isLoading)) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Error',
          headerShown: true 
        }} />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>
            {error || 'Proyección no encontrada o no accesible'}
          </ThemedText>
        </ThemedView>
      </>
    );
  }

  const estadoInfo = getEstadoInfo(pedido?.estado);
  const currentUserCanEditOrDelete = canEditOrDelete(pedido);

  return (
    <>
      <Stack.Screen options={{ 
        title: `Proyección #${pedido?.id}`,
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.card}>
            <ThemedText type="title" style={styles.totalText}>
              ${parseFloat(pedido?.total_estimado || '0').toFixed(2)}
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
                <ThemedText type="defaultSemiBold">F. Creación:</ThemedText>
                <ThemedText>{pedido?.fecha_creacion ? new Date(pedido.fecha_creacion).toLocaleDateString() : 'N/A'}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">F. Entrega:</ThemedText>
                <ThemedText>{pedido?.fecha_entrega ? new Date(pedido.fecha_entrega).toLocaleDateString() : 'N/A'}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Cliente:</ThemedText>
                <ThemedText>{pedido?.cliente?.nombre || 'N/A'}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Almacén:</ThemedText>
                <ThemedText>{pedido?.almacen?.nombre || 'N/A'}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Vendedor:</ThemedText>
                <ThemedText>{pedido?.vendedor?.username || 'N/A'}</ThemedText>
              </ThemedView>
              
              {pedido?.notas && (
                <ThemedView style={styles.notasContainer}>
                  <ThemedText type="defaultSemiBold">Notas:</ThemedText>
                  <ThemedText style={styles.notasText}>{pedido.notas}</ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {/* Usar nuestro componente para mostrar los detalles del pedido */}
            <ThemedView style={styles.section}>
              {pedido?.detalles && pedido.detalles.length > 0 ? (
                <ProductDetailsList
                  details={pedido.detalles}
                  title="Productos en la Proyección"
                  isPedido={true}
                />
              ) : (
                <ThemedView style={styles.noDetalles}>
                  <IconSymbol name="exclamationmark.circle" size={30} color={Colors.warning} />
                  <ThemedText style={styles.noDetallesText}>
                    No hay productos en esta proyección
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
            
            <ThemedView style={styles.actions}>
              <PedidoConversion 
                pedidoId={idNumerico}
                isDisabled={pedido?.estado === 'entregado' || pedido?.estado === 'cancelado' || !currentUserCanEditOrDelete}
              />
              
              {/* Mostrar botones solo si tiene permisos */}
              {currentUserCanEditOrDelete && (
                <>
                  <TouchableOpacity 
                    style={[styles.button, styles.editButton]} 
                    onPress={handleEdit}
                  >
                    <IconSymbol name="pencil" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.buttonText}>Editar</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.deleteButton]} 
                    onPress={() => deletePedido(idNumerico)}
                  >
                    <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.buttonText}>Eliminar</ThemedText>
                  </TouchableOpacity>
                </>
              )}
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
    color: Colors.danger,
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
    backgroundColor: Colors.light.card,
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
    textTransform: 'capitalize',
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
    flexWrap: 'wrap',
  },
  button: {
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 120,
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.danger,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});