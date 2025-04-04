// app/gastos/index.tsx
import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useGastos } from '@/hooks/crud/useGastos';
import { Gasto } from '@/models';

export default function GastosScreen() {
  const { 
    entities: gastos, 
    isLoading, 
    error, 
    pagination,
    loadEntities,
    deleteEntity,
    getEstadisticas,
    getCategoryColor
  } = useGastos();
  
  // Control para evitar múltiples cargas
  const isInitialMount = useRef(true);
  
  // Cargar datos solo una vez al montar el componente
  useEffect(() => {
    // Solo realizar la carga inicial
    if (isInitialMount.current) {
      console.log('Cargando datos de gastos (carga inicial)');
      loadEntities();
      isInitialMount.current = false;
    }
  }, []); // Sin dependencias para evitar recargas
  
  // Obtener las estadísticas
  const { totalMonto, totalGastos } = getEstadisticas();

  const handleAddGasto = () => {
    router.push('/gastos/create');
  };

  // Definir columnas para la tabla directamente en el componente
  const columns = useMemo(() => [
    {
      id: 'descripcion',
      label: 'Descripción',
      width: 2,
      sortable: true,
    },
    {
      id: 'monto',
      label: 'Monto',
      width: 1,
      sortable: true,
      render: (item: Gasto) => (
        <ThemedText>${parseFloat(item.monto).toFixed(2)}</ThemedText>
      ),
    },
    {
      id: 'categoria',
      label: 'Categoría',
      width: 1,
      sortable: true,
      render: (item: Gasto) => (
        <ThemedText style={{ color: getCategoryColor(item.categoria) }}>
          {item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}
        </ThemedText>
      ),
    },
    {
      id: 'fecha',
      label: 'Fecha',
      width: 1,
      sortable: true,
      render: (item: Gasto) => (
        <ThemedText>{new Date(item.fecha).toLocaleDateString()}</ThemedText>
      ),
    },
  ], [getCategoryColor]);

  // Función callback para manejar la eliminación
  const handleDelete = useMemo(() => async (id: string | number) => {
    const success = await deleteEntity(Number(id));
    if (success) {
      // Recargar la lista después de eliminar
      loadEntities();
    }
    return success;
  }, [deleteEntity, loadEntities]);

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
            onView: true,
            onEdit: true,
            onDelete: true
          }}
          deleteOptions={{
            title: 'Eliminar Gasto',
            message: '¿Está seguro que desea eliminar este gasto?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: handleDelete
          }}
          emptyMessage="No hay gastos disponibles"
          onRefresh={loadEntities}
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