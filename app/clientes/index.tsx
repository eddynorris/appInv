import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable, Column } from '@/components/DataTable';
import { clienteApi } from '@/services/api';
import { Cliente } from '@/models';

export default function ClientesScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
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
      id: 'saldo_pendiente',
      label: 'Saldo',
      width: 1,
      render: (item: Cliente) => <ThemedText>${parseFloat(item.saldo_pendiente || '0').toFixed(2)}</ThemedText>,
    },
  ];

  const loadClientes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await clienteApi.getClientes();
      
      if (response && response.data) {
        setClientes(response.data);
        setTotalPages(response.total_paginas || 1);
        setCurrentPage(response.pagina || 1);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('Error al cargar los clientes');
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los clientes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadClientes();
  }, [loadClientes]);

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
  
  const handleAddClient = () => {
    router.push('/clientes/create');
  };

  // Calcular el total de clientes y suma de saldos pendientes
  const saldoTotal = clientes.reduce((acc, cliente) => acc + parseFloat(cliente.saldo_pendiente || '0'), 0);

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Clientes',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Clientes:</ThemedText>
            <ThemedText style={styles.summaryValue}>{clientes.length}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Saldo Pendiente Total:</ThemedText>
            <ThemedText style={styles.summaryValue}>${saldoTotal.toFixed(2)}</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <DataTable<Cliente>
          data={clientes}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/clientes"
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          currentPage={currentPage}
          totalPages={totalPages}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No hay clientes registrados"
        />
        
        <FloatingActionButton 
          icon="person.fill" 
          onPress={handleAddClient} 
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
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
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