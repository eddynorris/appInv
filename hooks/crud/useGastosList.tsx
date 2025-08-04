// hooks/crud/useGastosList.tsx
import { useMemo, useCallback } from 'react';
import { useListWithFilters } from '@/hooks/core/useListWithFilters';
import { gastoService } from '@/services';
import { Gasto } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';

// Filtros para gastos
interface GastoFilters {
  usuario_id: string;
  categoria: string;
  fecha_inicio: string;
  fecha_fin: string;
  almacen_id: string;
  search: string;
}

const DEFAULT_FILTERS: GastoFilters = {
  usuario_id: '',
  categoria: '',
  fecha_inicio: '',
  fecha_fin: '',
  almacen_id: '',
  search: ''
};

export function useGastosList() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  // Función de fetch adaptada para useListWithFilters
  const fetchGastosWithFilters = useCallback(async (
    page: number,
    perPage: number,
    filters: GastoFilters,
    sort?: { column: string; order: 'asc' | 'desc' }
  ) => {
    const queryFilters: Record<string, any> = {};
    
    // Agregar filtros solo si tienen valor
    if (filters.search) queryFilters.search = filters.search;
    if (filters.categoria) queryFilters.categoria = filters.categoria;
    if (filters.fecha_inicio) queryFilters.fecha_inicio = filters.fecha_inicio;
    if (filters.fecha_fin) queryFilters.fecha_fin = filters.fecha_fin;
    if (filters.almacen_id) queryFilters.almacen_id = filters.almacen_id;
    
    // Agregar ordenamiento
    if (sort) {
      queryFilters.sort_by = sort.column;
      queryFilters.sort_order = sort.order;
    }
    
    // Filtro por usuario si no es admin
    if (!isAdmin && user?.id) {
      queryFilters.usuario_id = user.id.toString();
    }
    
    return await gastoService.getGastos(page, perPage, queryFilters);
  }, [isAdmin, user?.id]);

  // Usar el hook genérico
  const listHook = useListWithFilters<Gasto, GastoFilters>({
    fetchFn: fetchGastosWithFilters,
    defaultFilters: DEFAULT_FILTERS,
    defaultSort: { column: 'fecha', order: 'desc' },
    initialItemsPerPage: 10
  });

  // Función para eliminar gasto
  const deleteGasto = useCallback(async (id: number): Promise<boolean> => {
    try {
      await gastoService.deleteGasto(id);
      listHook.refresh();
      return true;
    } catch (error: any) {
      console.error("Error al eliminar gasto:", error.message);
      return false;
    }
  }, [listHook]);

  // Obtener color para la categoría
  const getCategoryColor = useCallback((category: string) => {
    switch (category.toLowerCase()) {
      case 'servicios': return '#2196F3'; // Azul
      case 'personal': return '#4CAF50'; // Verde
      case 'alquiler': return '#FFC107'; // Amarillo
      case 'marketing': return '#9C27B0'; // Púrpura
      case 'logistica': return '#FF5722'; // Naranja
      default: return '#757575'; // Gris
    }
  }, []);

  // Definir columnas para la tabla
  const columns = useMemo(() => [
    {
      id: 'descripcion',
      label: 'Descripción',
      width: 2,
      sortable: true,
    },
    {
      id: 'monto',
      label: 'Monto',
      width: 1,
      sortable: true,
      render: (item: Gasto) => (
        <ThemedText>${parseFloat(item.monto).toFixed(2)}</ThemedText>
      ),
    },
    {
      id: 'categoria',
      label: 'Categoría',
      width: 1,
      sortable: true,
      render: (item: Gasto) => (
        <ThemedText style={{ color: getCategoryColor(item.categoria) }}>
          {item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}
        </ThemedText>
      ),
    },
    {
      id: 'fecha',
      label: 'Fecha',
      width: 1,
      sortable: true,
      render: (item: Gasto) => (
        <ThemedText>{new Date(item.fecha).toLocaleDateString()}</ThemedText>
      ),
    },
  ], [getCategoryColor]);

  // Calcular estadísticas de gastos
  const getEstadisticas = useCallback(() => {
    const totalMonto = listHook.data.reduce(
      (acc, gasto) => acc + parseFloat(gasto.monto || '0'), 
      0
    );
    
    return {
      totalMonto,
      totalGastos: listHook.pagination.totalItems
    };
  }, [listHook.data, listHook.pagination.totalItems]);

  // Verificar si el usuario tiene permiso para editar/eliminar un gasto
  const canEditOrDelete = useCallback((gastoUsuarioId: number | undefined) => {
    if (!user) return false;
    
    // Admins pueden editar/eliminar cualquier gasto
    if (user.rol === 'admin') return true;
    
    // Usuarios normales solo pueden editar/eliminar sus propios gastos
    return gastoUsuarioId === user.id;
  }, [user]);

  return {
    // Datos y estado principal
    gastos: listHook.data,
    isLoading: listHook.isLoading,
    error: listHook.error,
    columns,

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

    // Acciones y información del usuario
    refresh: listHook.refresh,
    deleteGasto,
    getEstadisticas,
    getCategoryColor,
    isAdmin,
    canEditOrDelete,
  };
}