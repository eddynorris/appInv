// app/lotes/index.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { Divider } from '@/components/layout/Divider';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLotes } from '@/hooks/crud/useLotes';
import { Lote } from '@/models';

export default function LotesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    lotes,
    isLoading,
    error,
    pagination,
    loadLotes,
    handlePageChange,
    handlePerPageChange,
    deleteLote,
    confirmDelete,
    calcularRendimiento,
    sortBy,
    sortOrder,
    handleSort
  } = useLotes();
  
  // Cargar lotes al montar el componente
  useEffect(() => {
    loadLotes();
  }, [loadLotes]);
  
  // Manejar la acción de refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLotes();
    setRefreshing(false);
  }, [loadLotes]);
  
  // Calcular estadísticas
  const totalPesoHumedo = lotes.reduce((sum, lote) => sum + parseFloat(lote.peso_humedo_kg.toString()), 0);
  const totalPesoSeco = lotes.reduce((sum, lote) => {
    if (lote.peso_seco_kg) {
      return sum + parseFloat(lote.peso_seco_kg.toString());
    }
    return sum;
    
  }, 0);
  const totalPesoDisponible = lotes.reduce((sum, lote) => {
    if (lote.cantidad_disponible_kg) {
      return sum + parseFloat(lote.cantidad_disponible_kg.toString());
    }
    return sum;
  }, 0);
  // Definimos columnas para la tabla con renderers y usamos useMemo para optimizar
  const tableColumns = useMemo(() => [
    {
      id: 'producto',
      label: 'Producto',
      width: 1.5,
      sortable: true,
      render: (item: Lote) => <ThemedText>{item.producto?.nombre || '-'}</ThemedText>,
    },
    {
      id: 'peso_humedo_kg',
      label: 'P. Húmedo',
      width: 1,
      sortable: true,
      render: (item: Lote) => <ThemedText>{parseFloat(item.peso_humedo_kg).toFixed(2)}</ThemedText>,
    },
    {
      id: 'peso_seco_kg',
      label: 'P. Seco (kg)',
      width: 1,
      sortable: true,
      render: (item: Lote) => <ThemedText>{item.peso_seco_kg ? parseFloat(item.peso_seco_kg).toFixed(2) : '-'}</ThemedText>,
    },
    {
      id: 'rendimiento',
      label: '%R',
      width: 1,
      sortable: true,
      render: (item: Lote) => (
        <ThemedText>
          {calcularRendimiento(
            parseFloat(item.peso_humedo_kg), 
            item.peso_seco_kg ? parseFloat(item.peso_seco_kg) : null
          )}
        </ThemedText>
      ),
    },
    {
      id: 'fecha_ingreso',
      label: 'F. Ingreso',
      width: 1,
      sortable: true,
      render: (item: Lote) => <ThemedText>{new Date(item.fecha_ingreso).toLocaleDateString()}</ThemedText>,
    },
  ], [calcularRendimiento]);
  
  // Función para manejar la eliminación desde la tabla
  const handleDelete = useCallback(async (id: string | number) => {
    const success = await deleteLote(Number(id), false);
    if (success) {
      loadLotes();
    }
    return success;
  }, [deleteLote, loadLotes]);
  
  return (
    <ScreenContainer 
      title="Lotes" 
      isLoading={isLoading && !refreshing}
      error={error}
      loadingMessage="Cargando lotes..."
      scrollable={false}
    >
      <ThemedView style={{ flex: 1, paddingHorizontal: 16 }}>
        {/* Resumen */}
        <ThemedView style={{ padding: 16, borderRadius: 8, marginBottom: 16, backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
          <ThemedText type="subtitle">Resumen</ThemedText>
          <Divider style={{ marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <ThemedText style={{ fontWeight: 'bold' }}>{totalPesoHumedo.toFixed(2)} kg</ThemedText>
              <ThemedText style={{ fontSize: 12 }}>Peso Húmedo Total</ThemedText>
            </View>
            <View>
              <ThemedText style={{ fontWeight: 'bold' }}>{totalPesoSeco.toFixed(2)} kg</ThemedText>
              <ThemedText style={{ fontSize: 12 }}>Peso Seco Total</ThemedText>
            </View>
            <View>
              <ThemedText style={{ fontWeight: 'bold' }}>{totalPesoDisponible.toFixed(2)} kg</ThemedText>
              <ThemedText style={{ fontSize: 12 }}>Total Disponible</ThemedText>
            </View>
          </View>
        </ThemedView>
        
        {/* Usar el componente EnhancedDataTable estándar */}
        <EnhancedDataTable
          data={lotes}
          columns={tableColumns}
          isLoading={isLoading}
          error={error}
          baseRoute="/lotes"
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.lastPage,
            itemsPerPage: pagination.perPage,
            totalItems: pagination.total,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handlePerPageChange
          }}
          sorting={{
            sortColumn: sortBy,
            sortOrder: sortOrder,
            onSort: handleSort
          }}
          actions={{
            onView: true,
            onEdit: true,
            onDelete: true
          }}
          deleteOptions={{
            title: 'Eliminar Lote',
            message: '¿Está seguro que desea eliminar este lote? Esta acción podría afectar al inventario.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: handleDelete
          }}
          emptyMessage="No hay lotes disponibles"
          onRefresh={loadLotes}
        />
      </ThemedView>
      
      {/* Botón flotante para agregar */}
      <FloatingActionButton 
        icon="plus.circle.fill" 
        onPress={() => router.push('/lotes/create')} 
      />
    </ScreenContainer>
  );
}