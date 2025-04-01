// app/ventas/index.tsx - Versión refactorizada
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { useVentas } from '@/hooks/crud/useVentas';

export default function VentasScreen() {
  // Usar el hook especializado para ventas
  const { 
    ventas, 
    isLoading, 
    error, 
    pagination, 
    columns,
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deleteVenta,
    getEstadisticas
  } = useVentas();
  
  // Cargar datos al iniciar
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navegar a la pantalla de creación de venta
  const handleAddVenta = () => {
    router.push('/ventas/create');
  };
  
  // Calcular estadísticas 
  const ventasResumen = getEstadisticas();

  return (
    <ScreenContainer 
      title="Ventas"
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total de Ventas:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : pagination.totalItems}
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Monto Total:</ThemedText>
            <ThemedText style={styles.summaryValue}>${ventasResumen.total}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.summaryBadges}>
            <ThemedView style={[styles.badge, styles.badgePagado]}>
              <ThemedText style={styles.badgeText}>{ventasResumen.pagadas} Pagadas</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.badge, styles.badgePendiente]}>
              <ThemedText style={styles.badgeText}>{ventasResumen.pendientes} Pendientes</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.badge, styles.badgeParcial]}>
              <ThemedText style={styles.badgeText}>{ventasResumen.parciales} Parciales</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        
        <EnhancedDataTable
          data={ventas}
          columns={columns}
          isLoading={isLoading}
          error={error}
          baseRoute="/ventas"
          pagination={pagination}
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
            title: 'Eliminar Venta',
            message: '¿Está seguro que desea eliminar esta venta?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteVenta(Number(id))
          }}
          emptyMessage="No hay ventas registradas"
          onRefresh={fetchData}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddVenta} 
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
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    gap: 12,
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
  summaryBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    flex: 1,
    borderRadius: 4,
    padding: 6,
    alignItems: 'center',
  },
  badgePagado: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  badgePendiente: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  badgeParcial: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});