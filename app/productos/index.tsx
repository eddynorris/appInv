// app/productos/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { EnhancedDataTable, Column } from '@/components/data/EnhancedDataTable';
import { productoApi } from '@/services';
import { Producto } from '@/models';
import { SummaryStyles } from '@/styles/Theme';

export default function ProductosScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
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
  const columns: Column<Producto>[] = [
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
      id: 'precio_compra',
      label: 'Precio',
      width: 1,
      render: (item: Producto) => <ThemedText>${parseFloat(item.precio_compra).toFixed(2)}</ThemedText>,
    },
    {
      id: 'activo',
      label: 'Estado',
      width: 1,
      render: (item: Producto) => (
        <ThemedText style={{ color: item.activo ? '#4CAF50' : '#F44336' }}>
          {item.activo ? 'Activo' : 'Inactivo'}
        </ThemedText>
      ),
    },
  ];

  const loadProductos = useCallback(async (page = currentPage, perPage = itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await productoApi.getProductos(page, perPage);
      
      if (response && response.data) {
        setProductos(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
        setItemsPerPage(response.pagination.per_page);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('Error al cargar los productos');
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los productos');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Initial load
  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadProductos(1, itemsPerPage); // Reset to first page on refresh
  }, [loadProductos, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    loadProductos(page, itemsPerPage);
  }, [loadProductos, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    loadProductos(1, perPage); // Reset to first page when changing items per page
  }, [loadProductos]);

  // Handle sort
  const handleSort = useCallback((column: string) => {
    setSortOrder(prevOrder => 
      column === sortColumn 
        ? prevOrder === 'asc' ? 'desc' : 'asc' 
        : 'asc'
    );
    setSortColumn(column);
    
  }, [sortColumn, sortOrder]);
  
  const handleAddProduct = () => {
    router.push('/productos/create');
  };

  // handleEdit and handleDelete are now handled by EnhancedDataTable internally

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Productos',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={[SummaryStyles.container, SummaryStyles.secondary]}>
          <ThemedView style={SummaryStyles.row}>
            <ThemedText style={SummaryStyles.label}>Total Productos:</ThemedText>
            <ThemedText style={SummaryStyles.value}>
              {isLoading ? 'Cargando...' : totalItems}
            </ThemedText>
          </ThemedView>
          <ThemedView style={SummaryStyles.row}>
            <ThemedText style={SummaryStyles.label}>Productos Activos:</ThemedText>
            <ThemedText style={SummaryStyles.value}>
              {productos.filter(p => p.activo).length} de {productos.length}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <EnhancedDataTable<Producto>
          data={productos}
          columns={columns}
          baseRoute="/productos"
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          pagination={{
            currentPage: currentPage,
            totalPages: totalPages,
            itemsPerPage: itemsPerPage,
            totalItems: totalItems,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handleItemsPerPageChange,
          }}
          sorting={{
            sortColumn: sortColumn,
            sortOrder: sortOrder,
            onSort: handleSort,
          }}
          actions={{
            onView: true,
            onEdit: true,
            onDelete: true,
          }}
          deleteOptions={{
            title: 'Eliminar Producto',
            message: '¿Está seguro que desea eliminar este producto?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id: number | string) => {
              try {
                await productoApi.deleteProducto(parseInt(id.toString()));
                // Recargar los datos después de eliminar
                loadProductos(
                  // Si es el último item de la página y hay más de una página, ir a la página anterior
                  productos.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
                  itemsPerPage
                );
                return true;
              } catch (error) {
                console.error('Error al eliminar producto:', error);
                return false;
              }
            },
          }}
          emptyMessage="No hay productos disponibles"
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddProduct} 
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});