
// hooks/crud/useLotesList.tsx
import { useMemo, useEffect, useCallback, useState } from 'react';
import { useApiResource } from '../useApiResource';
import { loteApi } from '@/services/api';
import { Lote } from '@/models';
import { ThemedText } from '@/components/ThemedText';

// Parámetros iniciales por defecto para la paginación de la lista
const DEFAULT_INITIAL_PARAMS = { page: 1, perPage: 10 };

export function useLotesList() {
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const {
    data: lotes,
    isLoading,
    error,
    pagination,
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deleteItem: deleteLoteDirectly,
  } = useApiResource<Lote>({
    initialParams: DEFAULT_INITIAL_PARAMS,
    fetchFn: loteApi.getLotes,
    deleteFn: loteApi.deleteLote,
  });

  // Cargar datos iniciales explícitamente al montar
  useEffect(() => {
    if (lotes.length === 0) {

      fetchData(DEFAULT_INITIAL_PARAMS.page, DEFAULT_INITIAL_PARAMS.perPage);
    }
  }, [lotes.length, fetchData]);

  // Función para calcular rendimiento
  const calcularRendimiento = useCallback((pesoHumedo: number, pesoSeco: number | null): string => {
    if (!pesoSeco || pesoSeco <= 0 || pesoHumedo <= 0) return '-';
    
    const rendimiento = (pesoSeco / pesoHumedo) * 100;
    return `${rendimiento.toFixed(2)}%`;
  }, []);

  // Definir columnas para la tabla
  const columns = useMemo(() => [
    {
      id: 'producto',
      label: 'Producto',
      width: 1.5,
      sortable: true,
      render: (item: Lote) => <ThemedText>{item.producto?.nombre || '-'}</ThemedText>,
    },
    {
      id: 'peso_seco_kg',
      label: 'Total',
      width: 1,
      sortable: true,
      render: (item: Lote) => <ThemedText>{parseFloat(item.peso_seco_kg ? item.peso_seco_kg.toString() : '0').toFixed(2)}</ThemedText>,
    },
    {
      id: 'cantidad_disponible_kg',
      label: 'Disp.',
      width: 1,
      sortable: true,
      render: (item: Lote) => <ThemedText>{item.cantidad_disponible_kg ? parseFloat(item.cantidad_disponible_kg.toString()).toFixed(2) : '-'}</ThemedText>,
    },
    {
      id: 'fecha_ingreso',
      label: 'F. Ingreso',
      width: 1,
      sortable: true,
      render: (item: Lote) => <ThemedText>{new Date(item.fecha_ingreso).toLocaleDateString()}</ThemedText>,
    },
  ], [calcularRendimiento]);

  // Función para refrescar la lista
  const refresh = useCallback(() => {
    console.log("useLotesList: Refrescando datos...");
    fetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [fetchData, pagination.currentPage, pagination.itemsPerPage]);

  // Función para manejar la eliminación
  const deleteLote = useCallback(async (id: number): Promise<boolean> => {
    try {
      const success = await deleteLoteDirectly(id);
      return success;
    } catch (error: any) {
      console.error("Error al eliminar lote:", error.message);
      return false;
    }
  }, [deleteLoteDirectly]);

  // Manejar ordenamiento
  const handleSort = useCallback((column: string) => {
    if (column === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    
    // Aquí podrías implementar la lógica para ordenar los datos en el servidor
    // Por ahora, simplemente recargamos los datos
    refresh();
  }, [sortBy, refresh]);

  // Calcular estadísticas
  const getEstadisticas = useCallback(() => {
    const totalPesoHumedo = lotes.reduce(
      (sum, lote) => sum + parseFloat(lote.peso_humedo_kg.toString()), 
      0
    );
    
    const totalPesoSeco = lotes.reduce(
      (sum, lote) => sum + (lote.peso_seco_kg ? parseFloat(lote.peso_seco_kg.toString()) : 0), 
      0
    );
    
    const totalDisponible = lotes.reduce(
      (sum, lote) => sum + (lote.cantidad_disponible_kg ? parseFloat(lote.cantidad_disponible_kg.toString()) : 0), 
      0
    );
    
    return {
      totalPesoHumedo,
      totalPesoSeco,
      totalDisponible,
      totalLotes: pagination.totalItems
    };
  }, [lotes, pagination.totalItems]);

  return {
    // Datos y estado de la lista
    lotes,
    isLoading,
    error,
    columns,
    
    // Paginación
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      itemsPerPage: pagination.itemsPerPage,
      totalItems: pagination.totalItems,
      onPageChange: handlePageChange,
      onItemsPerPageChange: handleItemsPerPageChange,
    },
    
    // Ordenamiento
    sortBy,
    sortOrder,
    handleSort,
    
    // Funciones
    loadLotes: fetchData,
    refresh,
    deleteLote,
    
    // Utilidades
    calcularRendimiento,
    getEstadisticas,
  };
}