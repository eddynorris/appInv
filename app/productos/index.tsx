import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable, Column } from '@/components/DataTable';
import { productoApi } from '@/services/api';
import { Producto } from '@/models';

export default function ProductosScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const loadProductos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await productoApi.getProductos();
      
      if (response && response.data) {
        setProductos(response.data);
        setTotalPages(response.total_paginas || 1);
        setCurrentPage(response.pagina || 1);
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
  }, []);

  // Initial load
  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadProductos();
  }, [loadProductos]);

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
  
  const handleAddProduct = () => {
    router.push('/productos/create');
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Productos',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <DataTable<Producto>
          data={productos}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/productos"
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          currentPage={currentPage}
          totalPages={totalPages}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No hay productos disponibles"
        />
        
        <FloatingActionButton 
          icon="person.fill" 
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