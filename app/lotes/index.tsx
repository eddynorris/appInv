// app/lotes/index.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { Divider } from '@/components/layout/Divider';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useLotesList } from '@/hooks/crud/useLotesList';

export default function LotesScreen() {
  // Usar el hook refactorizado para la lista
  const {
    lotes,
    isLoading,
    error,
    columns,
    pagination,
    refresh,
    deleteLote,
    getEstadisticas,
    sortBy,
    sortOrder,
    handleSort
  } = useLotesList();
  
  // Obtener estadísticas
  const { totalPesoHumedo, totalPesoSeco, totalDisponible } = getEstadisticas();
  
  const handleAddLote = () => {
    router.push('/lotes/create');
  };
  
  return (
    <ScreenContainer 
      title="Lotes" 
      isLoading={isLoading && lotes.length === 0}
      error={error}
      loadingMessage="Cargando lotes..."
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        {/* Resumen */}
        <ThemedView style={styles.summary}>
          <ThemedText type="subtitle">Resumen</ThemedText>
          <Divider style={{ marginVertical: 8 }} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{totalPesoHumedo.toFixed(2)} kg</ThemedText>
              <ThemedText style={styles.summaryLabel}>Peso Húmedo Total</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{totalPesoSeco.toFixed(2)} kg</ThemedText>
              <ThemedText style={styles.summaryLabel}>Peso Seco Total</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{totalDisponible.toFixed(2)} kg</ThemedText>
              <ThemedText style={styles.summaryLabel}>Total Disponible</ThemedText>
            </View>
          </View>
        </ThemedView>
        
        {/* Tabla de lotes */}
        <EnhancedDataTable
          data={lotes}
          columns={columns}
          isLoading={isLoading}
          error={error}
          baseRoute="/lotes"
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            itemsPerPage: pagination.itemsPerPage,
            totalItems: pagination.totalItems,
            onPageChange: pagination.onPageChange,
            onItemsPerPageChange: pagination.onItemsPerPageChange
          }}
          sorting={{
            sortColumn: sortBy,
            sortOrder: sortOrder,
            onSort: handleSort
          }}
          actions={{
            onView: true,
            onEdit: true,
            onDelete: true
          }}
          deleteOptions={{
            title: 'Eliminar Lote',
            message: '¿Está seguro que desea eliminar este lote? Esta acción podría afectar al inventario.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteLote(Number(id))
          }}
          emptyMessage="No hay lotes disponibles"
          onRefresh={refresh}
        />
      </ThemedView>
      
      {/* Botón flotante para agregar */}
      <FloatingActionButton 
        icon="plus.circle.fill" 
        onPress={handleAddLote} 
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summary: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});