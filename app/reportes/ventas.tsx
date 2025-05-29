// reportes/ventas.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ActivityIndicator, TouchableOpacity, View, Button } from 'react-native'; // Agregado View y Button
import { Stack, router } from 'expo-router';
import { DateRangeSelectorV2 } from '@/components/dashboard/DateRangeSelectorV2';

import { ThemedView } from '@/components/ThemedView';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable } from '@/components/data/DataTable';
import { useVentasList } from '@/hooks/crud/useVentasList';
import { Venta } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors'; // Para colores de botones
import { useColorScheme } from '@/hooks/useColorScheme'; // Para colores de botones

// Función auxiliar para obtener YYYY-MM-DD local
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para mostrar la fecha o un placeholder
const formatDateDisplay = (dateString: string | undefined | null) => {
    if (!dateString) return 'No establecida';
    try {
        // Asumiendo que dateString es YYYY-MM-DD
        const [year, month, day] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateString; // o 'Fecha inválida'
    }
};


export default function VentasScreen() {
  const {
    ventas,
    isLoading,
    error,
    pagination,
    refresh,
    deleteVenta,
    columns,
    filters, // Necesitamos leer los filtros actuales del hook
    handleFilterChange,
    applyFilters,
    clearFilters, // Asumiendo que tu hook tiene o puede tener clearFilters
  } = useVentasList();

  const colorScheme = useColorScheme() ?? 'light';

  // Handle date range changes from the new DateRangeSelectorV2
  const handleDateRangeChange = (start: Date, end: Date) => {
    handleFilterChange('fecha_inicio', getLocalDateString(start));
    handleFilterChange('fecha_fin', getLocalDateString(end));
  };

  // Parse date strings to Date objects for the DateRangeSelectorV2
  const startDate = filters.fecha_inicio ? new Date(filters.fecha_inicio) : new Date();
  const endDate = filters.fecha_fin ? new Date(filters.fecha_fin) : new Date();

  const handleApplyFilters = () => {
    applyFilters();
  };

  const handleClearDateFilters = () => {
    handleFilterChange('fecha_inicio', '');
    handleFilterChange('fecha_fin', '');
    if (typeof clearFilters === 'function') {
      clearFilters();
    } else {
      applyFilters();
    }
  };

  const handleAddVenta = () => {
    router.push('/ventas/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/ventas/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Eliminar Venta',
      '¿Está seguro que desea eliminar esta venta?',
      // ... (código de confirmación)
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Ventas', headerShown: true }} />
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

        {isLoading && <ActivityIndicator style={{ marginVertical: 10 }}/>}

        <DataTable<Venta>
          data={ventas}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/ventas"
          isLoading={isLoading} // isLoading general de la tabla
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
          emptyMessage="No hay ventas disponibles"
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletePrompt={{
            title: 'Eliminar Venta',
            message: '¿Está seguro que desea eliminar esta venta?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
          }}
        />
        <FloatingActionButton icon="plus.circle.fill" onPress={handleAddVenta} />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  dateDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
});