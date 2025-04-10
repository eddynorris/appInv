// app/clientes/index.tsx
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable, Column } from '@/components/data/EnhancedDataTable';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useClientesList } from '@/hooks/crud/useClientesList'; 
import { Cliente } from '@/models';


export default function ClientesScreen() {
  // Usar el hook refactorizado para la LISTA
  const {
    clientes,
    isLoading,
    error,
    columns, // <-- Columnas vienen del hook
    pagination,
    refresh, // <-- Para refrescar
    deleteCliente // <-- Para borrar desde la tabla
  } = useClientesList();
 
  // Calcular estadísticas de clientes
  const saldoTotal = useMemo(() => {
    // Asegúrate que 'clientes' sea un array antes de reducir
    if (!Array.isArray(clientes)) return 0;
    return clientes.reduce((total, cliente) =>
      total + parseFloat(cliente.saldo_pendiente || '0'), 0);
  }, [clientes]); // Depende de los datos de la lista}
  
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
              S./{(isLoading || !Array.isArray(clientes)) ? '$0.00' : `$${saldoTotal.toFixed(2)}`}
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
            title: 'Eliminar Cliente',
            message: '¿Está seguro que desea eliminar este cliente?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteCliente(Number(id))
          }}
          emptyMessage="No hay clientes disponibles"
          onRefresh={refresh}
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