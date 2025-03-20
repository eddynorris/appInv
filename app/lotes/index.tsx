// app/lotes/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable, Column } from '@/components/DataTable';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Lote } from '@/models';
import { loteApi } from '@/services/api';

export default function LotesScreen() {
  const [lotes, setLotes] = useState<Lote[]>([]);
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
      id: 'producto',
      label: 'Producto',
      width: 1.5,
      render: (item: Lote) => <ThemedText>{item.producto?.nombre || '-'}</ThemedText>,
    },
    {
      id: 'proveedor',
      label: 'Proveedor',
      width: 1.5,
      render: (item: Lote) => <ThemedText>{item.proveedor?.nombre || '-'}</ThemedText>,
    },
    {
      id: 'peso_humedo_kg',
      label: 'Peso Húmedo (kg)',
      width: 1,
      render: (item: Lote) => <ThemedText>{parseFloat(item.peso_humedo_kg).toFixed(2)}</ThemedText>,
    },
    {
      id: 'peso_seco_kg',
      label: 'Peso Seco (kg)',
      width: 1,
      render: (item: Lote) => <ThemedText>{item.peso_seco_kg ? parseFloat(item.peso_seco_kg).toFixed(2) : '-'}</ThemedText>,
    },
    {
      id: 'fecha_ingreso',
      label: 'Fecha Ingreso',
      width: 1,
      render: (item: Lote) => <ThemedText>{new Date(item.fecha_ingreso).toLocaleDateString()}</ThemedText>,
    },
  ];

  const loadLotes = useCallback(async (page = currentPage, perPage = itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await loteApi.getLotes(page, perPage);
      
      if (response && response.data) {
        setLotes(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
        setItemsPerPage(response.pagination.per_page);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('Error al cargar los lotes');
      }
    } catch (err) {
      console.error('Error al cargar lotes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los lotes');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Initial load
  useEffect(() => {
    loadLotes();
  }, [loadLotes]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadLotes(1, itemsPerPage); // Reset to first page on refresh
  }, [loadLotes, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    loadLotes(page, itemsPerPage);
  }, [loadLotes, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    loadLotes(1, perPage); // Reset to first page when changing items per page
  }, [loadLotes]);

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
  
  const handleAddLote = () => {
    router.push('/lotes/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/lotes/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await loteApi.deleteLote(parseInt(id));
      
      // Recargar los datos después de eliminar
      loadLotes(
        // Si es el último item de la página y hay más de una página, ir a la página anterior
        lotes.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
        itemsPerPage
      );
      
      Alert.alert('Éxito', 'Lote eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar lote:', error);
      Alert.alert('Error', 'No se pudo eliminar el lote');
      setIsLoading(false);
    }
  };

  // Calcular peso total de todos los lotes
  const calcularPesoTotal = () => {
    return lotes.reduce((acc, lote) => acc + parseFloat(lote.peso_humedo_kg || '0'), 0).toFixed(2);
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Lotes',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Lotes:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : totalItems}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Peso Total (kg):</ThemedText>
            <ThemedText style={styles.summaryValue}>{calcularPesoTotal()}</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <DataTable<Lote>
          data={lotes}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/lotes"
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
          emptyMessage="No hay lotes registrados"
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletePrompt={{
            title: 'Eliminar Lote',
            message: '¿Está seguro que desea eliminar este lote? Esta acción podría afectar al inventario.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
          }}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddLote} 
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
    backgroundColor: 'rgba(76, 175, 80, 0.1)', // Verde claro para lotes (material agrícola)
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