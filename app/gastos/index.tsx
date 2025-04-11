// app/gastos/index.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useGastosList } from '@/hooks/crud/useGastosList';

export default function GastosScreen() {
  // Usar el hook refactorizado para la lista con control de permisos
  const {
    gastos,
    isLoading,
    error,
    columns,
    pagination,
    refresh,
    deleteGasto,
    getEstadisticas,
    isAdmin,
    canEditOrDelete
  } = useGastosList();
  
  // Calcular estadísticas
  const { totalMonto, totalGastos } = getEstadisticas();

  const handleAddGasto = () => {
    router.push('/gastos/create');
  };

  return (
    <ScreenContainer 
      title="Gastos"
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Registros:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : totalGastos}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Gastos:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              ${isLoading ? '0.00' : totalMonto.toFixed(2)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <EnhancedDataTable
          data={gastos}
          columns={columns}
          isLoading={isLoading}
          error={error}
          baseRoute="/gastos"
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
            onView: true, // Todos pueden ver detalles
            onEdit: isAdmin, // Solo admin puede editar directamente desde la tabla
            onDelete: isAdmin // Solo admin puede eliminar directamente desde la tabla
          }}

          deleteOptions={{
            title: 'Eliminar Gasto',
            message: '¿Está seguro que desea eliminar este gasto?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteGasto(Number(id))
          }}
          emptyMessage="No hay gastos disponibles"
          onRefresh={refresh}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddGasto} 
        />
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summary: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});