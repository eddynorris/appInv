import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable, Column } from '@/components/DataTable';
import { proveedorApi } from '@/services/api';
import { Proveedor } from '@/models';

export default function ProveedoresScreen() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
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
      id: 'telefono',
      label: 'Teléfono',
      width: 1,
    },
    {
      id: 'direccion',
      label: 'Dirección',
      width: 1.5,
    },
  ];

  const loadProveedores = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await proveedorApi.getProveedores();
      
      if (response && response.data) {
        setProveedores(response.data);
        setTotalPages(response.total_paginas || 1);
        setCurrentPage(response.pagina || 1);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('Error al cargar los proveedores');
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los proveedores');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadProveedores();
  }, [loadProveedores]);

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
  
  const handleAddProveedor = () => {
    router.push('/proveedores/create');
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Proveedores',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <DataTable<Proveedor>
          data={proveedores}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/proveedores"
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          currentPage={currentPage}
          totalPages={totalPages}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No hay proveedores disponibles"
        />
        
        <FloatingActionButton 
          icon="person.fill" 
          onPress={handleAddProveedor} 
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