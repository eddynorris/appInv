import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
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

  const loadGastos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await gastoApi.getGastos();
      
      if (response && response.data) {
        setGastos(response.data);
        setTotalPages(response.total_paginas || 1);
        setCurrentPage(response.pagina || 1);
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
  }, []);

  // Initial load
  useEffect(() => {
    loadGastos();
  }, [loadGastos]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadGastos();
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
          <ThemedText style={styles.summaryLabel}>Total de Gastos:</ThemedText>
          <ThemedText style={styles.summaryValue}>${totalGastos.toFixed(2)}</ThemedText>
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
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No hay gastos registrados"
        />
        
        <FloatingActionButton 
          icon="creditcard.fill" 
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
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