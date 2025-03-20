// app/pagos/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable, Column } from '@/components/DataTable';
import { pagoApi } from '@/services/api';
import { Pago } from '@/models';

export default function PagosScreen() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting state
  const [sortColumn, setSortColumn] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Definimos las columnas de la tabla
  const columns: Column[] = [
    {
      id: 'id',
      label: 'ID',
      width: 0.5,
    },
    {
      id: 'venta_id',
      label: 'Venta ID',
      width: 0.8,
    },
    {
      id: 'monto',
      label: 'Monto',
      width: 1,
      render: (item: Pago) => <ThemedText>${parseFloat(item.monto).toFixed(2)}</ThemedText>,
    },
    {
      id: 'fecha',
      label: 'Fecha',
      width: 1,
      render: (item: Pago) => <ThemedText>{new Date(item.fecha).toLocaleDateString()}</ThemedText>,
    },
    {
      id: 'metodo_pago',
      label: 'Método',
      width: 1,
      render: (item: Pago) => (
        <ThemedText>
          {item.metodo_pago === 'efectivo' 
            ? 'Efectivo' 
            : item.metodo_pago === 'transferencia' 
              ? 'Transferencia' 
              : 'Tarjeta'}
        </ThemedText>
      ),
    },
  ];

  const loadPagos = useCallback(async (page = currentPage, perPage = itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await pagoApi.getPagos(page, perPage);
      
      if (response && response.data) {
        setPagos(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
        setItemsPerPage(response.pagination.per_page);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('Error al cargar los pagos');
      }
    } catch (err) {
      console.error('Error al cargar pagos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los pagos');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Initial load
  useEffect(() => {
    loadPagos();
  }, [loadPagos]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadPagos(1, itemsPerPage); // Reset to first page on refresh
  }, [loadPagos, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    loadPagos(page, itemsPerPage);
  }, [loadPagos, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    loadPagos(1, perPage); // Reset to first page when changing items per page
  }, [loadPagos]);

  // Handle sort
  const handleSort = useCallback((column: string) => {
    setSortOrder(prevOrder => 
      column === sortColumn 
        ? prevOrder === 'asc' ? 'desc' : 'asc' 
        : 'asc'
    );
    setSortColumn(column);
    
    // En un entorno real, aquí llamaríamos a la API con los parámetros de ordenación
    console.log(`Ordenando por ${column} en orden ${sortOrder}`);
  }, [sortColumn, sortOrder]);
  
  const handleAddPago = () => {
    router.push('/pagos/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/pagos/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await pagoApi.deletePago(parseInt(id));
      
      // Recargar los datos después de eliminar
      loadPagos(
        // Si es el último item de la página y hay más de una página, ir a la página anterior
        pagos.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
        itemsPerPage
      );
      
      Alert.alert('Éxito', 'Pago eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      Alert.alert('Error', 'No se pudo eliminar el pago');
      setIsLoading(false);
    }
  };

  // Calcular el total de los pagos
  const totalPagos = pagos.reduce((acc, pago) => acc + parseFloat(pago.monto), 0);

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Pagos',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Registros:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : totalItems}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Monto Total:</ThemedText>
            <ThemedText style={styles.summaryValue}>${totalPagos.toFixed(2)}</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <DataTable<Pago>
          data={pagos}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/pagos"
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalItems={totalItems}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No hay pagos registrados"
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletePrompt={{
            title: 'Eliminar Pago',
            message: '¿Está seguro que desea eliminar este pago?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
          }}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddPago} 
        />
      </ThemedView>
    </>
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