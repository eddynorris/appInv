import { useCallback } from 'react';
import { useListWithFilters } from '@/hooks/core/useListWithFilters';
import { ventaApi } from '@/services/entities/ventaService';
import { Venta } from '@/models';
import { useAuth } from '@/context/AuthContext';

// Filtros para ventas
interface VentaFilters {
  cliente_id: string;
  almacen_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado_pago: string;
  search: string;
}

const DEFAULT_FILTERS: VentaFilters = {
  cliente_id: '',
  almacen_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  estado_pago: '',
  search: ''
};

export function useVentasList() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  // Función de fetch adaptada para useListWithFilters
  const fetchVentasWithFilters = useCallback(async (
    page: number,
    perPage: number,
    filters: VentaFilters,
    sort?: { column: string; order: 'asc' | 'desc' }
  ) => {
    const queryFilters: Record<string, any> = {};
    
    // Agregar filtros solo si tienen valor
    if (filters.search) queryFilters.search = filters.search;
    if (filters.cliente_id) queryFilters.cliente_id = filters.cliente_id;
    if (filters.almacen_id) queryFilters.almacen_id = filters.almacen_id;
    if (filters.fecha_inicio) queryFilters.fecha_inicio = filters.fecha_inicio;
    if (filters.fecha_fin) queryFilters.fecha_fin = filters.fecha_fin;
    if (filters.estado_pago) queryFilters.estado_pago = filters.estado_pago;
    
    // Agregar ordenamiento
    if (sort) {
      queryFilters.sort_by = sort.column;
      queryFilters.sort_order = sort.order;
    }
    
    // Filtro por vendedor si no es admin
    if (!isAdmin && user?.id) {
      queryFilters.vendedor_id = user.id.toString();
    }
    
    return await ventaApi.getVentas(page, perPage, queryFilters);
  }, [isAdmin, user?.id]);

  // Usar el hook genérico
  const listHook = useListWithFilters<Venta, VentaFilters>({
    fetchFn: fetchVentasWithFilters,
    defaultFilters: DEFAULT_FILTERS,
    defaultSort: { column: 'fecha', order: 'desc' },
    initialItemsPerPage: 10
  });

  // Función para eliminar venta
  const deleteVenta = async (id: number): Promise<boolean> => {
    try {
      await ventaApi.deleteVenta(id);
      listHook.refresh();
      return true;
    } catch (error: any) {
      console.error("Error al eliminar venta:", error.message);
      return false;
    }
  };

  return {
    // Datos y estado principal
    ventas: listHook.data,
    isLoading: listHook.isLoading,
    error: listHook.error,

    // Paginación y ordenamiento
    pagination: {
      currentPage: listHook.pagination.currentPage,
      totalPages: listHook.pagination.totalPages,
      itemsPerPage: listHook.pagination.itemsPerPage,
      totalItems: listHook.pagination.totalItems,
      sortColumn: listHook.sorting.sortColumn,
      sortOrder: listHook.sorting.sortOrder,
      onPageChange: listHook.pagination.onPageChange,
      onItemsPerPageChange: listHook.pagination.onItemsPerPageChange,
      onSort: listHook.sorting.onSort,
    },

    // Filtros
    filters: listHook.filters,
    handleFilterChange: listHook.handleFilterChange,
    applyFilters: listHook.applyFilters,
    clearFilters: listHook.clearFilters,

    // Acciones
    refresh: listHook.refresh,
    deleteVenta,
    isAdmin,
  };
}