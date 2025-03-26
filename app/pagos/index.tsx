// app/pagos/index.tsx
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable, Column } from '@/components/data/EnhancedDataTable';
import { pagoApi } from '@/services/api';
import { useApiResource } from '@/hooks/useApiResource';
import { Pago } from '@/models';

export default function PagosScreen() {
  // Use our custom hook for API interaction
  const { 
    data: pagos, 
    isLoading, 
    error, 
    pagination, 
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deleteItem
  } = useApiResource<Pago>({
    initialParams: { page: 1, perPage: 10 },
    fetchFn: pagoApi.getPagos,
    deleteFn: pagoApi.deletePago
  });
  
  // Define table columns - memoized to prevent recreating on each render
  const columns: Column<Pago>[] = useMemo(() => [
    {
      id: 'venta_id',
      label: 'Venta ID',
      width: 0.8,
      sortable: true,
    },
    {
      id: 'monto',
      label: 'Monto',
      width: 1,
      sortable: true,
      render: (item: Pago) => <ThemedText>${parseFloat(item.monto).toFixed(2)}</ThemedText>,
    },
    {
      id: 'fecha',
      label: 'Fecha',
      width: 1,
      sortable: true,
      render: (item: Pago) => <ThemedText>{new Date(item.fecha).toLocaleDateString()}</ThemedText>,
    },
    {
      id: 'metodo_pago',
      label: 'Método',
      width: 1,
      sortable: true,
      render: (item: Pago) => {
        // Color según método de pago
        let color = '#757575'; // Gris por defecto
        let label = item.metodo_pago;
        
        switch (item.metodo_pago) {
          case 'efectivo':
            color = '#4CAF50'; // Verde
            label = 'Efectivo';
            break;
          case 'transferencia':
            color = '#2196F3'; // Azul
            label = 'Transferencia';
            break;
          case 'tarjeta':
            color = '#9C27B0'; // Púrpura
            label = 'Tarjeta';
            break;
        }
        
        return (
          <ThemedText style={{ color, fontWeight: '500' }}>
            {label}
          </ThemedText>
        );
      },
    },
  ], []);

  // Calcular el total de pagos
  const totalPagos = useMemo(() => {
    return pagos.reduce((acc, pago) => acc + parseFloat(pago.monto), 0).toFixed(2);
  }, [pagos]);

  const handleAddPago = () => {
    router.push('/pagos/create');
  };

  return (
    <ScreenContainer 
      title="Pagos"
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Registros:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : pagination.totalItems}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Monto Total:</ThemedText>
            <ThemedText style={styles.summaryValue}>${totalPagos}</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <EnhancedDataTable
          data={pagos}
          columns={columns}
          isLoading={isLoading}
          error={error}
          baseRoute="/pagos"
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            itemsPerPage: pagination.itemsPerPage,
            totalItems: pagination.totalItems,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handleItemsPerPageChange
          }}
          sorting={{
            sortColumn: 'fecha',
            sortOrder: 'desc',
            onSort: () => {} // Implementar cuando se necesite ordenación en el servidor
          }}
          actions={{
            onView: true,
            onEdit: true,
            onDelete: true
          }}
          deleteOptions={{
            title: 'Eliminar Pago',
            message: '¿Está seguro que desea eliminar este pago?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteItem(Number(id))
          }}
          emptyMessage="No hay pagos registrados"
          onRefresh={fetchData}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddPago} 
        />
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summary: {
    padding: 16,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});