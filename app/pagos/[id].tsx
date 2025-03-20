import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, Alert, Linking } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { pagoApi } from '@/services/api';
import { Pago } from '@/models';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { API_CONFIG } from '@/services/api';


export default function PagoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pago, setPago] = useState<Pago | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    const fetchPago = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await pagoApi.getPago(parseInt(id));
        
        if (response) {
          setPago(response);
        } else {
          setError('Error al cargar los datos del pago');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del pago');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPago();
  }, [id]);

  const handleEdit = () => {
    router.push(`/pagos/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    Alert.alert(
      'Eliminar Pago',
      '¿Está seguro que desea eliminar este pago?',
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
              await pagoApi.deletePago(parseInt(id));
              router.replace('/pagos');
            } catch (error) {
              setError('Error al eliminar el pago');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const viewReceipt = () => {
    if (pago?.url_comprobante) {
      const receiptUrl = `${API_CONFIG.baseUrl}/uploads/${pago.url_comprobante}`;
      Linking.openURL(receiptUrl);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Detalles del Pago',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText style={styles.loadingText}>Cargando datos del pago...</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (error || !pago) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Error',
          headerShown: true 
        }} />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="paperplane.fill" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>
            {error || 'Pago no encontrado'}
          </ThemedText>
        </ThemedView>
      </>
    );
  }

  // Obtener el color para el método de pago
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'efectivo':
        return '#4CAF50'; // Verde
      case 'transferencia':
        return '#2196F3'; // Azul
      case 'tarjeta':
        return '#9C27B0'; // Púrpura
      default:
        return '#757575'; // Gris
    }
  };

  const methodColor = getMethodColor(pago.metodo_pago);

  return (
    <>
      <Stack.Screen options={{ 
        title: `Pago #${pago.id}`,
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.card}>
            <ThemedText type="title" style={styles.montoText}>
              ${parseFloat(pago.monto).toFixed(2)}
            </ThemedText>
            
            <ThemedView 
              style={[
                styles.methodBadge, 
                { backgroundColor: `${methodColor}20` }
              ]}
            >
              <ThemedText style={[styles.methodText, { color: methodColor }]}>
                {pago.metodo_pago === 'efectivo' ? 'Efectivo' : 
                 pago.metodo_pago === 'transferencia' ? 'Transferencia' : 'Tarjeta'}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Detalles del Pago</ThemedText>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Venta ID:</ThemedText>
                <TouchableOpacity onPress={() => router.push(`/ventas/${pago.venta_id}`)}>
                  <ThemedText style={styles.linkText}>#{pago.venta_id}</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Fecha:</ThemedText>
                <ThemedText>{new Date(pago.fecha).toLocaleDateString()}</ThemedText>
              </ThemedView>
              
              {pago.referencia && (
                <ThemedView style={styles.infoRow}>
                  <ThemedText type="defaultSemiBold">Referencia:</ThemedText>
                  <ThemedText>{pago.referencia}</ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {pago.url_comprobante && (
              <ThemedView style={styles.comprobante}>
                <ThemedText type="subtitle">Comprobante</ThemedText>
                <TouchableOpacity 
                  style={styles.comprobanteButton} 
                  onPress={viewReceipt}
                >
                  <IconSymbol name="doc.fill" size={24} color="#0a7ea4" />
                  <ThemedText style={styles.comprobanteText}>Ver comprobante</ThemedText>
                </TouchableOpacity>
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
  montoText: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  methodBadge: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  methodText: {
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
  linkText: {
    color: '#0a7ea4',
    textDecorationLine: 'underline',
  },
  comprobante: {
    marginTop: 24,
    gap: 12,
  },
  comprobanteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 8,
  },
  comprobanteText: {
    color: '#0a7ea4',
    fontWeight: '500',
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