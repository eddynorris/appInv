// app/pedidos/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable, Column } from '@/components/DataTable';
import { pedidoApi } from '@/services/api';
import { Pedido } from '@/models';

export default function PedidosScreen() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting state
  const [sortColumn, setSortColumn] = useState('fecha_entrega');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Definimos las columnas de la tabla
  const columns: Column[] = [
    {
      id: 'id',
      label: 'ID',
      width: 0.5,
    },
    {
      id: 'fecha_entrega',
      label: 'Fecha Entrega',
      width: 1,
      render: (item: Pedido) => <ThemedText>{new Date(item.fecha_entrega).toLocaleDateString()}</ThemedText>,
    },
    {
      id: 'cliente',
      label: 'Cliente',
      width: 1.5,
      render: (item: Pedido) => <ThemedText>{item.cliente?.nombre || '-'}</ThemedText>,
    },
    {
      id: 'total_estimado',
      label: 'Total Est.',
      width: 1,
      render: (item: Pedido) => <ThemedText>${parseFloat(item.total_estimado || '0').toFixed(2)}</ThemedText>,
    },
    {
      id: 'estado',
      label: 'Estado',
      width: 1,
      render: (item: Pedido) => {
        let color = '#757575'; // Gris por defecto
        
        switch (item.estado) {
          case 'programado':
            color = '#FFC107'; // Amarillo
            break;
          case 'confirmado':
            color = '#2196F3'; // Azul
            break;
          case 'entregado':
            color = '#4CAF50'; // Verde
            break;
          case 'cancelado':
            color = '#F44336'; // Rojo
            break;
        }
        
        return (
          <ThemedText style={{ color, fontWeight: '500', textTransform: 'capitalize' }}>
            {item.estado}
          </ThemedText>
        );
      },
    },
  ];

  const loadPedidos = useCallback(async (page = currentPage, perPage = itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await pedidoApi.getPedidos(page, perPage);
      
      if (response && response.data) {
        setPedidos(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
        setItemsPerPage(response.pagination.per_page);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('Error al cargar los pedidos');
      }
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los pedidos');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Initial load
  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadPedidos(1, itemsPerPage); // Reset to first page on refresh
  }, [loadPedidos, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    loadPedidos(page, itemsPerPage);
  }, [loadPedidos, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    loadPedidos(1, perPage); // Reset to first page when changing items per page
  }, [loadPedidos]);

  // Handle sort
  const handleSort = useCallback((column: string) => {
    setSortOrder(prevOrder => 
      column === sortColumn 
        ? prevOrder === 'asc' ? 'desc' : 'asc' 
        : 'asc'
    );
    setSortColumn(column);
    
    console.log(`Ordenando por ${column} en orden ${sortOrder}`);
  }, [sortColumn, sortOrder]);
  
  const handleAddPedido = () => {
    router.push('/pedidos/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/pedidos/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await pedidoApi.deletePedido(parseInt(id));
      
      // Recargar los datos después de eliminar
      loadPedidos(
        // Si es el último item de la página y hay más de una página, ir a la página anterior
        pedidos.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
        itemsPerPage
      );
      
      Alert.alert('Éxito', 'Pedido eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      Alert.alert('Error', 'No se pudo eliminar el pedido');
      setIsLoading(false);
    }
  };

  // Calcular resumen de pedidos
  const pedidosResumen = {
    total: totalItems,
    programados: pedidos.filter(p => p.estado === 'programado').length,
    confirmados: pedidos.filter(p => p.estado === 'confirmado').length,
    entregados: pedidos.filter(p => p.estado === 'entregado').length,
    cancelados: pedidos.filter(p => p.estado === 'cancelado').length,
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Proyecciones',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Proyecciones:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : totalItems}
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.summaryBadges}>
            <ThemedView style={[styles.badge, styles.badgeProgramado]}>
              <ThemedText style={styles.badgeText}>{pedidosResumen.programados} Prog.</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.badge, styles.badgeConfirmado]}>
              <ThemedText style={styles.badgeText}>{pedidosResumen.confirmados} Conf.</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.badge, styles.badgeEntregado]}>
              <ThemedText style={styles.badgeText}>{pedidosResumen.entregados} Entr.</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.badge, styles.badgeCancelado]}>
              <ThemedText style={styles.badgeText}>{pedidosResumen.cancelados} Canc.</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        
        <DataTable<Pedido>
          data={pedidos}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/pedidos"
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
          emptyMessage="No hay proyecciones registradas"
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletePrompt={{
            title: 'Eliminar Proyección',
            message: '¿Está seguro que desea eliminar esta proyección?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
          }}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddPedido} 
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
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    gap: 12,
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
  summaryBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    flex: 1,
    borderRadius: 4,
    padding: 6,
    alignItems: 'center',
  },
  badgeProgramado: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  badgeConfirmado: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
  badgeEntregado: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  badgeCancelado: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});