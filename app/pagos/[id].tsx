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
import { usePagoItem } from '@/hooks/crud/usePagoItem';
import { API_CONFIG } from '@/services/api';

export default function PagoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pago, setPago] = useState<any | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Usar el hook refactorizado para operaciones CRUD de un pago
  const { 
    getPago, 
    deletePago, 
    isLoading, 
    error 
  } = usePagoItem();

  // Cargar datos del pago
  useEffect(() => {
    const fetchPago = async () => {
      if (!id) return;
      
      const data = await getPago(parseInt(id));
      if (data) {
        setPago(data);
      }
    };

    fetchPago();
  }, [id, getPago]);

  // Navegación a pantalla de edición
  const handleEdit = useCallback(() => {
    router.push(`/pagos/edit/${id}`);
  }, [id]);

  // Eliminar pago
  const handleDelete = useCallback(async () => {
    if (!id) return;
    
    const success = await deletePago(parseInt(id));
    setShowDeleteDialog(false); // Siempre cerrar el diálogo
    
    if (success) {
      router.replace('/pagos');
    }
  }, [id, deletePago]);

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
      isLoading={isLoading && !pago}
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
            {/* Mostrar el usuario que registró el pago si está disponible */}
            {pago.usuario_id && (
              <DetailRow label="Registrado por" value={`${pago.usuario?.username}`} />
              
            )}
          </DetailSection>
          
          {/* Sección de información de la venta y cliente */}
          {pago.venta && (
            <DetailSection title="Información de Venta">
              {pago.venta.cliente && (
                <DetailRow 
                  label="Cliente" 
                  value={
                    <TouchableOpacity onPress={() => router.push(`/clientes/${pago.venta.cliente.id}`)}>
                      <ThemedText style={styles.linkText}>{pago.venta.cliente.nombre}</ThemedText>
                    </TouchableOpacity>
                  }
                />
              )}
              <DetailRow 
                label="Total Venta" 
                value={`${parseFloat(pago.venta.total || '0').toFixed(2)}`} 
              />
              <DetailRow 
                label="Estado de Pago" 
                value={
                  <ThemedText style={{
                    color: pago.venta.estado_pago === 'pagado' ? '#4CAF50' : 
                           pago.venta.estado_pago === 'parcial' ? '#FF9800' : '#F44336'
                  }}>
                    {pago.venta.estado_pago === 'pagado' ? 'Pagado' :
                     pago.venta.estado_pago === 'parcial' ? 'Pago Parcial' : 'Pendiente'}
                  </ThemedText>
                } 
              />
              {pago.venta.saldo_pendiente && (
                <DetailRow 
                  label="Saldo Pendiente" 
                  value={`${parseFloat(pago.venta.saldo_pendiente).toFixed(2)}`} 
                />
              )}
            </DetailSection>
          )}

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