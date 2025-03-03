// app/gastos/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable, Column } from '@/components/DataTable';
import { gastoApi } from '@/services/api';
import { Gasto } from '@/models';

export default function GastosScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
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
      id: 'descripcion',
      label: 'Descripción',
      width: 2,
    },
    {
      id: 'monto',
      label: 'Monto',
      width: 1,
      render: (item: Gasto) => <ThemedText>${parseFloat(item.monto).toFixed(2)}</ThemedText>,
    },
    {
      id: 'categoria',
      label: 'Categoría',
      width: 1,
    },
    {
      id: 'fecha',
      label: 'Fecha',
      width: 1,
      render: (item: Gasto) => <ThemedText>{new Date(item.fecha).toLocaleDateString()}</ThemedText>,
    },
  ];

  const loadGastos = useCallback(async (page = currentPage, perPage = itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await gastoApi.getGastos(page, perPage);
      
      if (response && response.data) {
        setGastos(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
        setItemsPerPage(response.pagination.per_page);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('Error al cargar los gastos');
      }
    } catch (err) {
      console.error('Error al cargar gastos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los gastos');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Initial load
  useEffect(() => {
    loadGastos();
  }, [loadGastos]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadGastos(1, itemsPerPage); // Reset to first page on refresh
  }, [loadGastos, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    loadGastos(page, itemsPerPage);
  }, [loadGastos, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    loadGastos(1, perPage); // Reset to first page when changing items per page
  }, [loadGastos]);

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
  
  const handleAddGasto = () => {
    router.push('/gastos/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/gastos/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await gastoApi.deleteGasto(parseInt(id));
      
      // Recargar los datos después de eliminar
      loadGastos(
        // Si es el último item de la página y hay más de una página, ir a la página anterior
        gastos.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
        itemsPerPage
      );
      
      Alert.alert('Éxito', 'Gasto eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      Alert.alert('Error', 'No se pudo eliminar el gasto');
      setIsLoading(false);
    }
  };

  // Calcular el total de gastos
  const totalGastos = gastos.reduce((acc, gasto) => acc + parseFloat(gasto.monto), 0);

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Gastos',
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
            <ThemedText style={styles.summaryLabel}>Total Gastos:</ThemedText>
            <ThemedText style={styles.summaryValue}>${totalGastos.toFixed(2)}</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <DataTable<Gasto>
          data={gastos}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/gastos"
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
          emptyMessage="No hay gastos registrados"
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletePrompt={{
            title: 'Eliminar Gasto',
            message: '¿Está seguro que desea eliminar este gasto?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
          }}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddGasto} 
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
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
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