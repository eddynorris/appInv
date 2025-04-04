// app/clientes/index.tsx
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable, Column } from '@/components/data/EnhancedDataTable';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { clienteApi } from '@/services/api';
import { useApiResource } from '@/hooks/useApiResource';
import { Cliente } from '@/models';

export default function ClientesScreen() {
  // Use our custom hook for API interaction
  const { 
    data: clientes, 
    isLoading, 
    error, 
    pagination, 
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deleteItem
  } = useApiResource<Cliente>({
    initialParams: { page: 1, perPage: 10 },
    fetchFn: clienteApi.getClientes,
    deleteFn: clienteApi.deleteCliente
  });
  
  // Define table columns - memoized to prevent recreating on each render
  const columns: Column<Cliente>[] = useMemo(() => [
    {
      id: 'id',
      label: 'ID',
      width: 0.5,
      sortable: true,
    },
    {
      id: 'nombre',
      label: 'Nombre',
      width: 2,
      sortable: true,
    },
    {
      id: 'telefono',
      label: 'Teléfono',
      width: 1,
      sortable: true,
    },
    {
      id: 'direccion',
      label: 'Dirección',
      width: 1.5,
      render: (item: Cliente) => <ThemedText>{item.direccion || '-'}</ThemedText>,
    },
    {
      id: 'saldo_pendiente',
      label: 'Saldo',
      width: 1,
      render: (item: Cliente) => (
        <ThemedText>${parseFloat(item.saldo_pendiente || '0').toFixed(2)}</ThemedText>
      ),
    },
  ], []);

  // Calcular estadísticas de clientes
  const saldoTotal = useMemo(() => {
    return clientes.reduce((total, cliente) => 
      total + parseFloat(cliente.saldo_pendiente || '0'), 0);
  }, [clientes]);

  const handleAddCliente = () => {
    router.push('/clientes/create');
  };

  return (
    <ScreenContainer 
      title="Clientes"
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Clientes:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : pagination.totalItems}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Saldo Total:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              ${isLoading ? '0.00' : saldoTotal.toFixed(2)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <EnhancedDataTable
          data={clientes}
          columns={columns}
          isLoading={isLoading}
          error={error}
          baseRoute="/clientes"
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            itemsPerPage: pagination.itemsPerPage,
            totalItems: pagination.totalItems,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handleItemsPerPageChange
          }}
          sorting={{
            sortColumn: 'id',
            sortOrder: 'asc',
            onSort: () => {} // Implementar cuando se necesite ordenación en el servidor
          }}
          actions={{
            onView: true,
            onEdit: true,
            onDelete: true
          }}
          deleteOptions={{
            title: 'Eliminar Cliente',
            message: '¿Está seguro que desea eliminar este cliente?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteItem(Number(id))
          }}
          emptyMessage="No hay clientes disponibles"
          onRefresh={fetchData}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddCliente} 
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