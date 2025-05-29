// reportes/proyecciones.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ActivityIndicator, TouchableOpacity, View, Button } from 'react-native';
import { Stack, router } from 'expo-router';
import { DateRangeSelectorV2 } from '@/components/dashboard/DateRangeSelectorV2';

import { ThemedView } from '@/components/ThemedView';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable } from '@/components/data/DataTable';
import { usePedidosList } from '@/hooks/crud/usePedidosList'; // Ajusta la ruta si es necesario
import { Pedido } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Función auxiliar para obtener YYYY-MM-DD local
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Meses son 0-indexados
  const day = (date.getDate()).toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para mostrar la fecha o un placeholder
const formatDateDisplay = (dateString: string | undefined | null) => {
    if (!dateString) return 'No establecida';
    try {
        const [year, month, day] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
};

export default function ProyeccionesScreen() {
  const {
    pedidos,
    isLoading,
    error,
    pagination,
    refresh,
    deletePedido,
    columns,
    dateFilters, // Necesitamos leer los filtros de fecha actuales del hook
    handleDateFilterChange,
    applyDateFilters,
    clearDateFilters, // Asumiendo que tu hook tiene o puede tener clearDateFilters
  } = usePedidosList();

  const colorScheme = useColorScheme() ?? 'light';

  // Handle date range changes from the new DateRangeSelectorV2
  const handleDateRangeChange = (start: Date, end: Date) => {
    handleDateFilterChange('fechaInicio', getLocalDateString(start));
    handleDateFilterChange('fechaFin', getLocalDateString(end));
  };

  // Parse date strings to Date objects for the DateRangeSelectorV2
  const startDate = dateFilters.fechaInicio ? new Date(dateFilters.fechaInicio) : new Date();
  const endDate = dateFilters.fechaFin ? new Date(dateFilters.fechaFin) : new Date();

  const handleApplyFilters = () => {
    applyDateFilters();
  };

  const handleClearUIDateFilters = () => {
    handleDateFilterChange('fechaInicio', '');
    handleDateFilterChange('fechaFin', '');
    if (typeof clearDateFilters === 'function') {
      clearDateFilters();
    } else {
      applyDateFilters();
    }
  };

  const handleAddPedido = () => {
    router.push('/pedidos/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/pedidos/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Eliminar Pedido',
      '¿Está seguro que desea eliminar este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deletePedido(parseInt(id));
            if (success) {
              Alert.alert('Éxito', 'Pedido eliminado correctamente');
            } else {
              Alert.alert('Error', 'No se pudo eliminar el pedido');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Proyecciones (Pedidos)', headerShown: true }} />
      <ThemedView style={styles.container}>
        {/* Date Range Selector */}
        <DateRangeSelectorV2
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateRangeChange}
        />
        
        <View style={styles.filterActions}>
          <Button 
            title="Aplicar Filtros" 
            onPress={handleApplyFilters} 
            color={Colors.primary} 
            disabled={isLoading}
          />
        </View>

        {/* Indicador de carga mientras se actualizan los filtros de UI antes de aplicar */}
        {isLoading && <ActivityIndicator style={{ marginVertical: 10 }}/>}

        <DataTable<Pedido>
          data={pedidos}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/pedidos"
          isLoading={isLoading}
          error={error}
          onRefresh={refresh}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          itemsPerPage={pagination.itemsPerPage}
          onItemsPerPageChange={pagination.onItemsPerPageChange}
          totalItems={pagination.totalItems}
          sortColumn={pagination.sortColumn}
          sortOrder={pagination.sortOrder}
          onSort={pagination.onSort}
          emptyMessage="No hay pedidos disponibles"
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletePrompt={{
            title: 'Eliminar Pedido',
            message: '¿Está seguro que desea eliminar este pedido?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
          }}
        />
        <FloatingActionButton icon="plus.circle.fill" onPress={handleAddPedido} />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersUIContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border, // Ajustar para tema oscuro si es necesario
    gap: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
});