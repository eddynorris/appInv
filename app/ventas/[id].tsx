// app/ventas/[id].tsx - Versión refactorizada
import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ProductDetailsList from '@/components/ProductDetailsList';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { useVentas } from '@/hooks/crud/useVentas';
import { Colors } from '@/constants/Colors';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function VentaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Estado para diálogo de confirmación
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Usar el hook de ventas
  const {
    loadVenta,
    deleteVenta,
    getEstadoPagoInfo
  } = useVentas();
  
  // Estado local
  const [venta, setVenta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cargar los datos de la venta
  useEffect(() => {
    const fetchVentaData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const ventaData = await loadVenta(parseInt(id));
        
        if (ventaData) {
          setVenta(ventaData);
        } else {
          setError('Error al cargar los datos de la venta');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos de la venta');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVentaData();
  }, [id, loadVenta]);

  // Navegar a la página de edición
  const handleEdit = () => {
    if (!id) return;
    router.push(`/ventas/edit/${id}`);
  };

  // Manejar eliminación
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };
  
  // Confirmar eliminación
  const confirmDelete = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const success = await deleteVenta(parseInt(id));
      
      if (success) {
        router.replace('/ventas');
      } else {
        throw new Error('No se pudo eliminar la venta');
      }
    } catch (error) {
      setError('Error al eliminar la venta');
      setIsLoading(false);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  // Si tenemos datos, obtener información del estado de pago
  const estadoPago = venta ? getEstadoPagoInfo(venta.estado_pago) : { color: '#757575', text: '-' };

  return (
    <ScreenContainer
      title={venta ? `Venta #${venta.id}` : 'Detalles de Venta'}
      isLoading={isLoading}
      error={error}
      loadingMessage="Cargando datos de la venta..."
    >
      {venta && (
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
            
            {venta.saldo_pendiente && parseFloat(venta.saldo_pendiente) > 0 && (
              <ThemedView style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Saldo Pendiente:</ThemedText>
                <ThemedText style={{ color: '#FF5722', fontWeight: 'bold' }}>
                  ${parseFloat(venta.saldo_pendiente).toFixed(2)}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          {/* Mostrar productos */}
          <ThemedView style={styles.section}>
            {venta.detalles && venta.detalles.length > 0 ? (
              <ProductDetailsList
                details={venta.detalles}
                title="Detalles de la Venta"
                isPedido={false}
              />
            ) : (
              <ThemedView style={styles.noDetalles}>
                <IconSymbol name="exclamationmark.circle" size={30} color="#FFC107" />
                <ThemedText style={styles.noDetallesText}>
                  No hay detalles disponibles para esta venta
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
          
          {/* Botones de acción */}
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
      )}
      
      {/* Diálogo de confirmación para eliminar */}
      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Eliminar Venta"
        message="¿Está seguro que desea eliminar esta venta? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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