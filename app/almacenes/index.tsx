// app/almacenes/index.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useAlmacenes } from '@/hooks/crud/useAlmacenes';

export default function AlmacenesScreen() {
  // Usar el hook refactorizado para la LISTA
  const {
    almacenes,
    isLoading,
    error,
    columns,
    pagination,
    refresh,       // Para el botón/gesto de refresco
    deleteAlmacen  // Para la acción de borrado en la tabla
  } = useAlmacenes(); // No necesita opciones

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
            onPageChange: pagination.onPageChange,
            onItemsPerPageChange: pagination.onItemsPerPageChange
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
            onDelete: async (id) => await deleteAlmacen(Number(id))
          }}
          emptyMessage="No hay almacenes disponibles"
          onRefresh={refresh}
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