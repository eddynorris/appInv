// app/pedidos/index.tsx - Actualizado para manejar permisos según rol
import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { usePedidos } from '@/hooks/crud/usePedidos';
import { Pedido } from '@/models';
import { useAuth } from '@/context/AuthContext'; // Importar contexto de autenticación

export default function PedidosScreen() {
  const { user } = useAuth(); // Obtener el usuario actual
  const isAdmin = user?.rol === 'admin'; // Verificar si es administrador
  
  const {
    pedidos,
    isLoading,
    error,
    pagination,
    loadPedidos,
    deletePedido,
    getEstadisticas,
    getStateColor
  } = usePedidos();
  
  // Control para evitar múltiples cargas
  const isInitialMount = useRef(true);
  
  // Cargar datos solo una vez al montar el componente
  useEffect(() => {
    // Solo realizar la carga inicial
    if (isInitialMount.current) {
      console.log('Cargando datos de pedidos (carga inicial)');
      loadPedidos();
      isInitialMount.current = false;
    }
  }, []); // Sin dependencias para evitar recargas
  
  // Obtener las estadísticas
  const estadisticas = getEstadisticas();

  const handleAddPedido = () => {
    router.push('/pedidos/create');
  };

  // Definir columnas para la tabla directamente en el componente
  const columns = useMemo(() => [
    {
      id: 'fecha_entrega',
      label: 'Fecha Entrega',
      width: 1,
      sortable: true,
      render: (item: Pedido) => <ThemedText>{new Date(item.fecha_entrega).toLocaleDateString()}</ThemedText>,
    },
    {
      id: 'cliente',
      label: 'Cliente',
      width: 1.5,
      sortable: true,
      render: (item: Pedido) => <ThemedText>{item.cliente?.nombre || '-'}</ThemedText>,
    },
    {
      id: 'vendedor',
      label: 'Vendedor',
      width: 1,
      sortable: true,
      render: (item: Pedido) => <ThemedText>{item.vendedor?.username || '-'}</ThemedText>,
    },
    {
      id: 'total_estimado',
      label: 'Total Est.',
      width: 1,
      sortable: true,
      render: (item: Pedido) => <ThemedText>${parseFloat(item.total_estimado || '0').toFixed(2)}</ThemedText>,
    },
    {
      id: 'estado',
      label: 'Estado',
      width: 1,
      sortable: true,
      render: (item: Pedido) => {
        const color = getStateColor(item.estado);
        
        return (
          <ThemedText style={{ color, fontWeight: '500', textTransform: 'capitalize' }}>
            {item.estado}
          </ThemedText>
        );
      },
    },
  ], [getStateColor]);

  // Función callback para manejar la eliminación
  const handleDelete = useMemo(() => async (id: string | number) => {
    const success = await deletePedido(Number(id), false);
    if (success) {
      // Recargar la lista después de eliminar
      loadPedidos();
    }
    return success;
  }, [deletePedido, loadPedidos]);

  // Configurar las acciones según el rol del usuario
  const tableActions = {
    onView: true, // Todos pueden ver detalles
    onEdit: isAdmin, // Solo admin puede editar
    onDelete: isAdmin // Solo admin puede eliminar
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
              {isLoading ? 'Cargando...' : estadisticas.total}
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.summaryBadges}>
            <ThemedView style={[styles.badge, styles.badgeProgramado]}>
              <ThemedText style={styles.badgeText}>{estadisticas.programados} Prog.</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.badge, styles.badgeConfirmado]}>
              <ThemedText style={styles.badgeText}>{estadisticas.confirmados} Conf.</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.badge, styles.badgeEntregado]}>
              <ThemedText style={styles.badgeText}>{estadisticas.entregados} Entr.</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.badge, styles.badgeCancelado]}>
              <ThemedText style={styles.badgeText}>{estadisticas.cancelados} Canc.</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        
        <EnhancedDataTable
          data={pedidos}
          columns={columns}
          isLoading={isLoading}
          error={error}
          baseRoute="/pedidos"
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            itemsPerPage: pagination.itemsPerPage,
            totalItems: pagination.totalItems,
            onPageChange: pagination.onPageChange,
            onItemsPerPageChange: pagination.onItemsPerPageChange
          }}
          sorting={{
            sortColumn: 'id',
            sortOrder: 'asc',
            onSort: () => {} // Implementar cuando se necesite ordenación en el servidor
          }}
          actions={tableActions} // Usar acciones configuradas según rol
          deleteOptions={{
            title: 'Eliminar Proyección',
            message: '¿Está seguro que desea eliminar esta proyección?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: handleDelete
          }}
          emptyMessage="No hay proyecciones disponibles"
          onRefresh={loadPedidos}
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
    paddingHorizontal: 16,
  },
  summary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  badge: {
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 70,
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