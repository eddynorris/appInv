// app/clientes/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
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

  const loadClientes = useCallback(async (page = currentPage, perPage = itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await clienteApi.getClientes(page, perPage);
      
      if (response && response.data) {
        setClientes(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
        setItemsPerPage(response.pagination.per_page);
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
  }, [currentPage, itemsPerPage]);

  // Initial load
  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadClientes(1, itemsPerPage); // Reset to first page on refresh
  }, [loadClientes, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    loadClientes(page, itemsPerPage);
  }, [loadClientes, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    loadClientes(1, perPage); // Reset to first page when changing items per page
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

  const handleEdit = (id: string) => {
    router.push(`/clientes/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await clienteApi.deleteCliente(parseInt(id));
      
      // Recargar los datos después de eliminar
      loadClientes(
        // Si es el último item de la página y hay más de una página, ir a la página anterior
        clientes.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
        itemsPerPage
      );
      
      Alert.alert('Éxito', 'Cliente eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      Alert.alert('Error', 'No se pudo eliminar el cliente');
      setIsLoading(false);
    }
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
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : totalItems}
            </ThemedText>
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
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalItems={totalItems}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No hay clientes registrados"
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletePrompt={{
            title: 'Eliminar Cliente',
            message: '¿Está seguro que desea eliminar este cliente?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
          }}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
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