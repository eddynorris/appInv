// app/presentaciones/index.tsx - Versión refactorizada
import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { usePresentacionesList } from '@/hooks/crud/usePresentacionesList';

export default function PresentacionesScreen() {
  // Usar el nuevo hook para la lista
  const {
    presentaciones,
    isLoading,
    error,
    columns,
    pagination,
    refresh,
    deletePresentacion,
  } = usePresentacionesList();

  const handleAddPresentacion = () => {
    router.push('/presentaciones/create');
  };

  return (
    <ScreenContainer 
      title="Presentaciones"
      scrollable={false}
    >
      <Stack.Screen options={{ 
        title: 'Presentaciones',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        {/* Panel de resumen/estadísticas */}
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Presentaciones:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : presentaciones.length}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Presentaciones Activas:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {presentaciones.length}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        {/* Tabla de datos mejorada */}
        <EnhancedDataTable
          data={presentaciones}
          columns={columns}
          isLoading={isLoading}
          error={error}
          baseRoute="/presentaciones"
          pagination={pagination}
          sorting={{
            sortColumn: pagination.sortColumn,
            sortOrder: pagination.sortOrder,
            onSort: pagination.onSort,
          }}
          actions={{
            onView: true,
            onEdit: true,
            onDelete: true,
          }}
          deleteOptions={{
            title: 'Eliminar Presentación',
            message: '¿Está seguro que desea eliminar esta presentación? Los productos asociados podrían verse afectados.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deletePresentacion(Number(id)),
          }}
          emptyMessage="No hay presentaciones disponibles"
          onRefresh={refresh}
        />
        
        {/* Botón para agregar nueva presentación */}
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddPresentacion} 
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
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
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