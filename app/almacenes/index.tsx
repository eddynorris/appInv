import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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

  const loadAlmacenes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await almacenApi.getAlmacenes();
      
      if (response && response.data) {
        setAlmacenes(response.data);
        setTotalPages(response.total_paginas || 1);
        setCurrentPage(response.pagina || 1);
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
  }, []);

  // Initial load
  useEffect(() => {
    loadAlmacenes();
  }, [loadAlmacenes]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadAlmacenes();
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

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Almacenes',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
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
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No hay almacenes disponibles"
        />
        
        <FloatingActionButton 
          icon="folder.fill" 
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
});