import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useApiResource } from '../useApiResource';
import { ventaApi } from '@/services/venta';
import { Venta, ClienteSimple, AlmacenSimple } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';

// Parámetros iniciales
const DEFAULT_PARAMS = { page: 1, perPage: 10, sort: 'fecha', order: 'desc' };
const DEFAULT_FILTERS = {
  cliente_id: '',
  almacen_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  estado_pago: '',
  search: ''
};

export function useVentasList() {
  const isInitialLoadDone = useRef(false);
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  // Estados para filtros, ordenamiento y búsqueda
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortColumn, setSortColumn] = useState(DEFAULT_PARAMS.sort);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(DEFAULT_PARAMS.order as 'asc' | 'desc');

  // Función de fetch REFACTORIZADA para pasar filtros correctamente
  const fetchVentasWithFilters = useCallback(async (page = DEFAULT_PARAMS.page, perPage = DEFAULT_PARAMS.perPage) => {
    const queryFilters: Record<string, any> = {
        sort_by: sortColumn,
        sort_order: sortOrder
    };
    if (filters.search) queryFilters.search = filters.search;
    if (filters.cliente_id) queryFilters.cliente_id = filters.cliente_id;
    if (filters.almacen_id) queryFilters.almacen_id = filters.almacen_id;
    if (filters.fecha_inicio) queryFilters.fecha_inicio = filters.fecha_inicio;
    if (filters.fecha_fin) queryFilters.fecha_fin = filters.fecha_fin;
    if (filters.estado_pago) queryFilters.estado_pago = filters.estado_pago;
    if (!isAdmin && user?.id) {
      queryFilters.vendedor_id = user.id.toString();
    }
    
    // CORREGIDO: Pasar el objeto queryFilters como tercer argumento
    return await ventaApi.getVentas(page, perPage, queryFilters); 

  }, [user, isAdmin, sortColumn, sortOrder, filters]);

  const {
    data: ventas,
    isLoading,
    error,
    pagination,
    fetchData: originalFetchData,
    handlePageChange: originalHandlePageChange,
    handleItemsPerPageChange: originalHandleItemsPerPageChange,
    deleteItem: deleteVentaDirectly,
  } = useApiResource<Venta>({
    initialParams: { page: DEFAULT_PARAMS.page, perPage: DEFAULT_PARAMS.perPage },
    fetchFn: fetchVentasWithFilters,
    deleteFn: ventaApi.deleteVenta,
  });

  // Cargar datos iniciales REFACTORIZADO (sin cargar opciones)
  const loadInitialData = useCallback(async () => {
    if (!isInitialLoadDone.current) {
      isInitialLoadDone.current = true;
      try {
        // Solo cargar la primera página de ventas
        await originalFetchData(DEFAULT_PARAMS.page, DEFAULT_PARAMS.perPage);
      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
        // El error ya debería ser manejado por useApiResource
      }
    }
  }, [originalFetchData]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // --- Handlers para Paginación, Ordenamiento, Búsqueda y Filtros ---
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

  // Manejador genérico para cambios en filtros
  const handleFilterChange = useCallback((filterKey: keyof typeof DEFAULT_FILTERS, value: string) => {
      setFilters(prev => ({ ...prev, [filterKey]: value }));
  }, []);

  // Aplicar filtros (refresca la data desde la página 1)
  const applyFilters = useCallback(() => {
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [originalFetchData, pagination.itemsPerPage]);

  // Limpiar filtros (resetea filtros y refresca)
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [originalFetchData, pagination.itemsPerPage]);

  // --- Definición de Columnas --- (Similar a la versión original)
  const columns = useMemo(() => [
      {
        id: 'fecha',
        label: 'Fecha',
        width: 1.5,
        sortable: true,
        render: (item: Venta) => {
          try {
            // Asegurar manejo de UTC si la fecha no incluye timezone
            const fechaStr = item.fecha.includes('T') ? item.fecha : item.fecha + 'T00:00:00Z';
            const fecha = new Date(fechaStr);
            return <ThemedText>{fecha.toLocaleDateString('es-MX')}</ThemedText>;
          } catch (e) {
            return <ThemedText>Inválida</ThemedText>;
          }
        },
      },
      {
        id: 'cliente',
        label: 'Cliente',
        width: 2,
        sortable: true, 
        render: (item: Venta) => <ThemedText>{item.cliente?.nombre || 'N/A'}</ThemedText>,
      },
      {
        id: 'vendedor',
        label: 'Vendedor',
        width: 1.5,
        sortable: true,
        render: (item: Venta) => <ThemedText>{item.vendedor?.username || 'N/A'}</ThemedText>,
      },
      {
        id: 'tipo_pago',
        label: 'Tipo',
        width: 1,
        sortable: true,
        render: (item: Venta) => (
          <ThemedText style={{ 
            color: item.tipo_pago === 'contado' ? '#4CAF50' : '#2196F3',
            fontWeight: '500'
          }}>
            {item.tipo_pago === 'contado' ? 'Contado' : 'Crédito'}
          </ThemedText>
        ),
      },
      {
        id: 'estado_pago',
        label: 'Estado Pago',
        width: 1.2,
        sortable: true,
        render: (item: Venta) => {
          let color = '#757575';
          switch (item.estado_pago) {
            case 'pagado': color = '#4CAF50'; break;
            case 'parcial': color = '#FFC107'; break;
            case 'pendiente': color = '#F44336'; break;
          }
          return (
            <ThemedText style={{ color, fontWeight: '500' }}>
              {item.estado_pago.charAt(0).toUpperCase() + item.estado_pago.slice(1)}
            </ThemedText>
          );
        },
      },
      {
        id: 'total',
        label: 'Total',
        width: 1.2,
        sortable: true,
        render: (item: Venta) => (
          <ThemedText style={{ fontWeight: '500' }}>
            ${parseFloat(item.total || '0').toFixed(2)} 
          </ThemedText>
        ),
      },
    ], []);

  // --- Otras Funciones --- 
  const refresh = useCallback(() => {
    originalFetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [originalFetchData, pagination.currentPage, pagination.itemsPerPage]);

  const deleteVenta = useCallback(async (id: number): Promise<boolean> => {
    try {
      const success = await deleteVentaDirectly(id);
      return success;
    } catch (error: any) {
      console.error("Error al eliminar venta:", error.message);
      return false;
    }
  }, [deleteVentaDirectly]);

  return {
    // Datos y estado principal
    ventas,
    isLoading,
    error,
    columns,

    // Paginación, Ordenamiento, Búsqueda, Filtros
    pagination: {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        itemsPerPage: pagination.itemsPerPage,
        totalItems: pagination.totalItems,
        sortColumn: sortColumn,
        sortOrder: sortOrder,
        onPageChange: handlePageChange,
        onItemsPerPageChange: handleItemsPerPageChange,
        onSort: handleSort,
    },
    filters,
    handleFilterChange,
    applyFilters,
    clearFilters,

    // Acciones
    refresh,
    deleteVenta,
    isAdmin,
  };
} 