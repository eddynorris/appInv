// app/almacenes/index.tsx
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable, Column } from '@/components/data/EnhancedDataTable';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { almacenApi } from '@/services/api';
import { useApiResource } from '@/hooks/useApiResource';
import { Almacen } from '@/models';

export default function AlmacenesScreen() {
  // Use our custom hook for API interaction
  const { 
    data: almacenes, 
    isLoading, 
    error, 
    pagination, 
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deleteItem
  } = useApiResource<Almacen>({
    initialParams: { page: 1, perPage: 10 },
    fetchFn: almacenApi.getAlmacenes,
    deleteFn: almacenApi.deleteAlmacen
  });
  
  // Define table columns - memoized to prevent recreating on each render
  const columns: Column<Almacen>[] = useMemo(() => [
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
      id: 'ciudad',
      label: 'Ciudad',
      width: 1,
      sortable: true,
      render: (item: Almacen) => <ThemedText>{item.ciudad || '-'}</ThemedText>,
    },
    {
      id: 'direccion',
      label: 'Dirección',
      width: 1.5,
      render: (item: Almacen) => <ThemedText>{item.direccion || '-'}</ThemedText>,
    },
  ], []);

  const handleAddAlmacen = () => {
    router.push('/almacenes/create');
  };

  return (
    <ScreenContainer 
      title="Almacenes"
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Almacenes:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : pagination.totalItems}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <EnhancedDataTable
          data={almacenes}
          columns={columns}
          isLoading={isLoading}
          error={error}
          baseRoute="/almacenes"
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
            title: 'Eliminar Almacén',
            message: '¿Está seguro que desea eliminar este almacén?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteItem(Number(id))
          }}
          emptyMessage="No hay almacenes disponibles"
          onRefresh={fetchData}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddAlmacen} 
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