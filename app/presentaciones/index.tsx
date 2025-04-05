// app/presentaciones/index.tsx - Versión refactorizada
import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { usePresentaciones } from '@/hooks/crud/usePresentaciones';

export default function PresentacionesScreen() {
  // Usar nuestro custom hook para la gestión completa de presentaciones
  const { 
    presentaciones, 
    isLoading, 
    error, 
    pagination, 
    columns,
    refresh,
    handlePageChange,
    handleItemsPerPageChange,
    confirmDelete,
    getEstadisticas
  } = usePresentaciones();
  
  // Memoizar las estadísticas para evitar cálculos innecesarios
  const estadisticas = useMemo(() => getEstadisticas(), [getEstadisticas]);

  // Cargar datos al montar el componente
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Navegar a la pantalla de creación
  const handleAddPresentacion = () => {
    router.push('/presentaciones/create');
  };

  return (
    <ScreenContainer 
      title="Presentaciones"
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        {/* Panel de resumen/estadísticas */}
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Presentaciones:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : estadisticas.totalPresentaciones}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Presentaciones Activas:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {estadisticas.presentacionesActivas} de {presentaciones.length}
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
            sortColumn: 'nombre',
            sortOrder: 'asc',
            onSort: () => {} // Implementar si se necesita ordenación en servidor
          }}
          actions={{
            onView: true,
            onEdit: true,
            onDelete: true
          }}
          deleteOptions={{
            title: 'Eliminar Presentación',
            message: '¿Está seguro que desea eliminar esta presentación?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: confirmDelete
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