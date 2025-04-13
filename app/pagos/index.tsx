// app/pagos/index.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { usePagosList } from '@/hooks/crud/usePagosList';

export default function PagosScreen() {
  // Usar el hook refactorizado para la lista con control de permisos
  const { 
    pagos, 
    isLoading, 
    error, 
    columns,
    pagination,
    refresh,
    deletePago,
    getTotalPagos,
    isAdmin,
    canEditOrDelete 
  } = usePagosList();

  // Función para navegar a la pantalla de creación
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
            <ThemedText style={styles.summaryValue}>
              ${isLoading ? '0.00' : getTotalPagos}
            </ThemedText>
          </ThemedView>
          
          {/* Mostrar mensaje de filtrado para usuarios no administradores */}
          {!isAdmin && (
            <ThemedView style={styles.filterInfo}>
              <ThemedText style={styles.filterInfoText}>
                Solo se muestran los pagos registrados por ti
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
        
        <EnhancedDataTable
          data={pagos}
          columns={columns}
          isLoading={isLoading}
          error={error}
          baseRoute="/pagos"
          pagination={pagination}
          sorting={{
            sortColumn: 'fecha',
            sortOrder: 'desc',
            onSort: () => {} // Implementar cuando se necesite ordenación en el servidor
          }}
          actions={{
            onView: true, // Todos pueden ver detalles
            onEdit: isAdmin, // Verificar permiso para editar
            onDelete: isAdmin // Verificar permiso para eliminar
          }}
          deleteOptions={{
            title: 'Eliminar Pago',
            message: '¿Está seguro que desea eliminar este pago?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deletePago(Number(id))
          }}
          emptyMessage="No hay pagos registrados"
          onRefresh={refresh}
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
  filterInfo: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  filterInfoText: {
    fontSize: 12,
    color: '#F57C00',
    textAlign: 'center',
    fontWeight: '500',
  }
});