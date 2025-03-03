// app/almacenes/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable, Column } from '@/components/DataTable';
import { almacenApi } from '@/services/api';
import { Almacen } from '@/models';

export default function AlmacenesScreen() {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
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
      id: 'nombre',
      label: 'Nombre',
      width: 2,
    },
    {
      id: 'ciudad',
      label: 'Ciudad',
      width: 1,
      render: (item: Almacen) => <ThemedText>{item.ciudad || '-'}</ThemedText>,
    },
    {
      id: 'direccion',
      label: 'Dirección',
      width: 1.5,
      render: (item: Almacen) => <ThemedText>{item.direccion || '-'}</ThemedText>,
    },
  ];

  const loadAlmacenes = useCallback(async (page = currentPage, perPage = itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await almacenApi.getAlmacenes(page, perPage);
      
      if (response && response.data) {
        setAlmacenes(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
        setItemsPerPage(response.pagination.per_page);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('Error al cargar los almacenes');
      }
    } catch (err) {
      console.error('Error al cargar almacenes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los almacenes');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Initial load
  useEffect(() => {
    loadAlmacenes();
  }, [loadAlmacenes]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadAlmacenes(1, itemsPerPage); // Reset to first page on refresh
  }, [loadAlmacenes, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    loadAlmacenes(page, itemsPerPage);
  }, [loadAlmacenes, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    loadAlmacenes(1, perPage); // Reset to first page when changing items per page
  }, [loadAlmacenes]);

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
  
  const handleAddAlmacen = () => {
    router.push('/almacenes/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/almacenes/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await almacenApi.deleteAlmacen(parseInt(id));
      
      // Recargar los datos después de eliminar
      loadAlmacenes(
        // Si es el último item de la página y hay más de una página, ir a la página anterior
        almacenes.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
        itemsPerPage
      );
      
      Alert.alert('Éxito', 'Almacén eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar almacén:', error);
      Alert.alert('Error', 'No se pudo eliminar el almacén');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Almacenes',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Almacenes:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : totalItems}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <DataTable<Almacen>
          data={almacenes}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/almacenes"
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
          emptyMessage="No hay almacenes disponibles"
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletePrompt={{
            title: 'Eliminar Almacén',
            message: '¿Está seguro que desea eliminar este almacén?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
          }}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddAlmacen} 
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