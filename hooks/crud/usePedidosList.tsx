import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useApiResource } from '../useApiResource';
import { pedidoApi } from '@/services/api';
import { Pedido } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';

// Parámetros iniciales por defecto
const DEFAULT_PARAMS = { page: 1, perPage: 10, sort: 'fecha_entrega', order: 'desc', search: '' };
// Filtros por defecto solo para fechas
const DEFAULT_DATE_FILTERS = {
  fechaInicio: '',
  fechaFin: ''
};

export function usePedidosList() {
  const isInitialLoadDone = useRef(false);
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  // Estados para ordenamiento y búsqueda
  const [sortColumn, setSortColumn] = useState(DEFAULT_PARAMS.sort);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(DEFAULT_PARAMS.order as 'asc' | 'desc');
  const [searchTerm, setSearchTerm] = useState(DEFAULT_PARAMS.search);

  // Estados solo para filtros de fecha
  const [dateFilters, setDateFilters] = useState(DEFAULT_DATE_FILTERS);

  // fetchFn que incluye sort/order/search y filtros de fecha
  const fetchPedidosWithFilters = useCallback(async (page = DEFAULT_PARAMS.page, perPage = DEFAULT_PARAMS.perPage) => {
    const filters: Record<string, any> = {
        sort_by: sortColumn,
        sort_order: sortOrder,
        search: searchTerm,
    };

    // Filtro automático por vendedor si NO es admin
    if (!isAdmin && user?.id) {
      filters.vendedor_id = user.id;
    }

    // Añadir filtros de fecha si tienen valor
    if (dateFilters.fechaInicio) filters.fecha_inicio = dateFilters.fechaInicio;
    if (dateFilters.fechaFin) filters.fecha_fin = dateFilters.fechaFin;

    console.log(`Consultando pedidos con filtros: ${JSON.stringify(filters)}, página: ${page}, por página: ${perPage}`);
    return await pedidoApi.getPedidos(page, perPage, filters);
  }, [user, isAdmin, sortColumn, sortOrder, searchTerm, dateFilters]);

  const {
    data: pedidos,
    isLoading,
    error,
    pagination,
    fetchData: originalFetchData,
    handlePageChange: originalHandlePageChange,
    handleItemsPerPageChange: originalHandleItemsPerPageChange,
    deleteItem: deletePedidoDirectly
  } = useApiResource<Pedido>({
    initialParams: { page: DEFAULT_PARAMS.page, perPage: DEFAULT_PARAMS.perPage },
    fetchFn: fetchPedidosWithFilters,
    deleteFn: pedidoApi.deletePedido,
  });

  // Wrapper para fetchData (sin cambios)
  const fetchData = useCallback((page?: number, perPage?: number) => {
      originalFetchData(page, perPage);
  }, [originalFetchData]);

  // Cargar datos iniciales (sin cambios)
  useEffect(() => {
    if (!isInitialLoadDone.current) {
      console.log("usePedidosList: Carga inicial de datos...");
      isInitialLoadDone.current = true;
      originalFetchData(DEFAULT_PARAMS.page, DEFAULT_PARAMS.perPage);
    }
  }, []);

  // --- Manejadores de Paginación, Ordenamiento y Búsqueda (sin cambios) ---
  const handlePageChange = useCallback((page: number) => {
    originalHandlePageChange(page);
  }, [originalHandlePageChange]);

  const handleItemsPerPageChange = useCallback((perPage: number) => {
    originalHandleItemsPerPageChange(perPage);
  }, [originalHandleItemsPerPageChange]);

  const handleSort = useCallback((columnId: string) => {
    const newSortOrder = (columnId === sortColumn && sortOrder === 'asc') ? 'desc' : 'asc';
    setSortColumn(columnId);
    setSortOrder(newSortOrder);
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [sortColumn, sortOrder, originalFetchData, pagination.itemsPerPage]);

  const handleSearch = useCallback((newSearchTerm: string) => {
     setSearchTerm(newSearchTerm);
     originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [originalFetchData, pagination.itemsPerPage]);

  // --- Manejadores de Filtros de Fecha ---
  const handleDateFilterChange = useCallback((filterKey: keyof typeof DEFAULT_DATE_FILTERS, value: string) => {
      setDateFilters(prev => ({ ...prev, [filterKey]: value }));
  }, []);

  const applyDateFilters = useCallback(() => {
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [originalFetchData, pagination.itemsPerPage]);

  const clearDateFilters = useCallback(() => {
    setDateFilters(DEFAULT_DATE_FILTERS);
    // No limpiamos searchTerm aquí, podría ser intencional mantenerlo
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [originalFetchData, pagination.itemsPerPage]);

  // --- Columnas de la Tabla (sin cambios) ---
   const columns = useMemo(() => [
     {
      id: 'cliente',
      label: 'Cliente',
      width: 2,
      sortable: true,
      render: (item: Pedido) => <ThemedText>{item.cliente?.nombre || 'N/A'}</ThemedText>,
    },
     {
      id: 'vendedor',
      label: 'Vendedor',
      width: 1.5,
      sortable: true,
      render: (item: Pedido) => <ThemedText>{item.vendedor?.username || 'N/A'}</ThemedText>,
    },
    {
      id: 'fecha_entrega',
      label: 'F. Entrega',
      width: 1.2,
      sortable: true,
      render: (item: Pedido) => <ThemedText>{item.fecha_entrega ? new Date(item.fecha_entrega).toLocaleDateString() : 'N/A'}</ThemedText>,
    },
    {
        id: 'estado',
        label: 'Estado',
        width: 1,
        sortable: true,
        render: (item: Pedido) => {
            let color = '#757575';
            switch (item.estado) {
                case 'programado': color = '#FF9800'; break;
                case 'confirmado': color = '#2196F3'; break;
                case 'entregado': color = '#4CAF50'; break;
                case 'cancelado': color = '#F44336'; break;
            }
            return (
              <ThemedText style={{ color, fontWeight: '500' }}>
                {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
              </ThemedText>
            );
        },
    },
     {
      id: 'total_estimado',
      label: 'Total Est.',
      width: 1.2,
      sortable: false,
      render: (item: Pedido) => {
        const total = item.detalles?.reduce((sum, d) => sum + (Number(d.cantidad) * Number(d.precio_estimado)), 0) || 0;
        return <ThemedText style={{ fontWeight: 'bold' }}>${total.toFixed(2)}</ThemedText>
      },
    },
   ], []);

  // --- Otras Funciones (refresh, deletePedido, canEditOrDelete sin cambios) ---
  const refresh = useCallback(() => {
    console.log("usePedidosList: Refrescando datos...");
    originalFetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [originalFetchData, pagination.currentPage, pagination.itemsPerPage]);

  const deletePedido = useCallback(async (id: number): Promise<boolean> => {
    try {
      const success = await deletePedidoDirectly(id);
      if (success) {
        console.log(`Pedido ${id} eliminado exitosamente`);
      } else {
        console.error(`Error al eliminar pedido ${id}`);
      }
      return success;
    } catch (error: any) {
      console.error(`Error al eliminar pedido ${id}:`, error.message);
      return false;
    }
  }, [deletePedidoDirectly]);

  const canEditOrDelete = useCallback((pedidoVendedorId: number | undefined) => {
    if (!user) return false;
    if (isAdmin) return true;
    return pedidoVendedorId === user.id;
  }, [user, isAdmin]);

  return {
    // Datos y estado principal
    pedidos,
    isLoading,
    error,
    columns,

    // Paginación, Ordenamiento, Búsqueda
    pagination: {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        itemsPerPage: pagination.itemsPerPage,
        totalItems: pagination.totalItems,
        sortColumn: sortColumn,
        sortOrder: sortOrder,
        searchTerm: searchTerm,
        onPageChange: handlePageChange,
        onItemsPerPageChange: handleItemsPerPageChange,
        onSort: handleSort,
        onSearch: handleSearch,
    },

    // Filtros de fecha
    dateFilters,           // Estado actual de los filtros de fecha
    handleDateFilterChange, // Función para actualizar un filtro de fecha
    applyDateFilters,       // Función para aplicar filtros y refrescar
    clearDateFilters,       // Función para limpiar filtros y refrescar

    // Acciones y permisos
    refresh,
    deletePedido,
    isAdmin,
    canEditOrDelete,
  };
} 