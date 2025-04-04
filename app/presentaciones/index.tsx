// app/presentaciones/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable, Column } from '@/components/data/DataTable';
import { presentacionApi, productoApi } from '@/services/api';
import { Presentacion, Producto } from '@/models';
import { Colors } from '@/constants/Colors';

export default function PresentacionesScreen() {
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
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
  const columns: Column[] = [
    {
      id: 'nombre',
      label: 'Nombre',
      width: 2,
      render: (item: Presentacion) => <ThemedText>{item.nombre}</ThemedText>,
    },
    {
      id: 'producto',
      label: 'Producto',
      width: 2,
      render: (item: Presentacion) => <ThemedText>{item.producto?.nombre || '-'}</ThemedText>,
    },
    {
      id: 'capacidad_kg',
      label: 'KG',
      width: 1,
      render: (item: Presentacion) => <ThemedText>{parseFloat(item.capacidad_kg).toFixed(2)}</ThemedText>,
    },
    {
      id: 'precio_venta',
      label: 'Precio',
      width: 1.5,
      render: (item: Presentacion) => <ThemedText>${parseFloat(item.precio_venta).toFixed(2)}</ThemedText>,
    },
    {
      id: 'activo',
      label: 'Estado',
      width: 1,
      render: (item: Presentacion) => (
        <ThemedText style={{ color: item.activo ? '#4CAF50' : '#F44336' }}>
          {item.activo ? '✓' : '✗'}
        </ThemedText>
      ),
    },
  ];

  // Cargar presentaciones y productos (para relaciones)
  const loadData = useCallback(async (page = currentPage, perPage = itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [presentacionesRes, productosRes] = await Promise.all([
        presentacionApi.getPresentaciones(page, perPage),
        productoApi.getProductos(1, 100)  // Cargar más productos para relacionar
      ]);
      
      if (presentacionesRes && presentacionesRes.data) {
        // Enriquecer las presentaciones con datos de productos
        const presentacionesConProductos = presentacionesRes.data.map(presentacion => {
          const producto = productosRes.data.find(p => p.id === presentacion.producto_id);
          return {
            ...presentacion,
            producto: producto ? { id: producto.id, nombre: producto.nombre } : undefined
          };
        });
        
        setPresentaciones(presentacionesConProductos);
        setProductos(productosRes.data);
        setTotalPages(presentacionesRes.pagination.pages);
        setCurrentPage(presentacionesRes.pagination.page);
        setTotalItems(presentacionesRes.pagination.total);
        setItemsPerPage(presentacionesRes.pagination.per_page);
      } else {
        console.error('Formato de respuesta inesperado:', presentacionesRes);
        setError('Error al cargar las presentaciones');
      }
    } catch (err) {
      console.error('Error al cargar presentaciones:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las presentaciones');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadData(1, itemsPerPage); // Reset to first page on refresh
  }, [loadData, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    loadData(page, itemsPerPage);
  }, [loadData, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    loadData(1, perPage); // Reset to first page when changing items per page
  }, [loadData]);

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
  
  const handleAddPresentacion = () => {
    router.push('/presentaciones/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/presentaciones/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await presentacionApi.deletePresentacion(parseInt(id));
      
      // Recargar los datos después de eliminar
      loadData(
        // Si es el último item de la página y hay más de una página, ir a la página anterior
        presentaciones.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
        itemsPerPage
      );
      
      Alert.alert('Éxito', 'Presentación eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar presentación:', error);
      Alert.alert('Error', 'No se pudo eliminar la presentación');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Presentaciones',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Presentaciones:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : totalItems}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Presentaciones Activas:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {presentaciones.filter(p => p.activo).length} de {presentaciones.length}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <DataTable<Presentacion>
          data={presentaciones}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/presentaciones"
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
          emptyMessage="No hay presentaciones disponibles"
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletePrompt={{
            title: 'Eliminar Presentación',
            message: '¿Está seguro que desea eliminar esta presentación?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
          }}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddPresentacion} 
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