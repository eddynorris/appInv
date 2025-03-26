// app/pagos/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { pagoApi, API_CONFIG } from '@/services/api';
import { Pago } from '@/models';
import { Colors } from '@/constants/Colors';

export default function PagoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pago, setPago] = useState<Pago | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Cargar datos del pago
  useEffect(() => {
    const fetchPago = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await pagoApi.getPago(parseInt(id));
        setPago(data);
      } catch (err) {
        console.error('Error fetching pago:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del pago');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPago();
  }, [id]);

  // Navegación a pantalla de edición
  const handleEdit = useCallback(() => {
    router.push(`/pagos/edit/${id}`);
  }, [id]);

  // Eliminar pago
  const handleDelete = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      await pagoApi.deletePago(parseInt(id));
      router.replace('/pagos');
    } catch (error) {
      console.error('Error deleting pago:', error);
      setError('Error al eliminar el pago');
      setIsLoading(false);
    } finally {
      setShowDeleteDialog(false);
    }
  }, [id]);

  // Ver comprobante
  const viewReceipt = useCallback(() => {
    if (pago?.url_comprobante) {
      const receiptUrl = `${API_CONFIG.baseUrl}/uploads/${pago.url_comprobante}`;
      Linking.openURL(receiptUrl).catch(err => {
        console.error('Error al abrir el comprobante:', err);
      });
    }
  }, [pago]);

  // Obtener color según método de pago
  const getMethodColor = useCallback((method: string) => {
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
  }, []);

  return (
    <ScreenContainer
      title={pago ? `Pago #${pago.id}` : 'Detalles del Pago'}
      isLoading={isLoading}
      error={error}
      loadingMessage="Cargando datos del pago..."
    >
      {pago && (
        <DetailCard>
          <ThemedText type="title" style={styles.montoText}>
            ${parseFloat(pago.monto).toFixed(2)}
          </ThemedText>
          
          <ThemedView 
            style={[
              styles.methodBadge, 
              { backgroundColor: `${getMethodColor(pago.metodo_pago)}20` }
            ]}
          >
            <ThemedText style={[styles.methodText, { color: getMethodColor(pago.metodo_pago) }]}>
              {pago.metodo_pago === 'efectivo' ? 'Efectivo' : 
               pago.metodo_pago === 'transferencia' ? 'Transferencia' : 'Tarjeta'}
            </ThemedText>
          </ThemedView>
          
          <DetailSection title="Detalles del Pago">
            <DetailRow 
              label="Venta ID" 
              value={
                <TouchableOpacity onPress={() => router.push(`/ventas/${pago.venta_id}`)}>
                  <ThemedText style={styles.linkText}>#{pago.venta_id}</ThemedText>
                </TouchableOpacity>
              }
            />
            <DetailRow 
              label="Fecha" 
              value={new Date(pago.fecha).toLocaleDateString()} 
            />
            
            {pago.referencia && (
              <DetailRow label="Referencia" value={pago.referencia} />
            )}
          </DetailSection>

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

          <ActionButtons
            onSave={handleEdit}
            saveText="Editar"
            onDelete={() => setShowDeleteDialog(true)}
            showDelete={true}
          />
        </DetailCard>
      )}
      
      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Eliminar Pago"
        message="¿Está seguro que desea eliminar este pago? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
});