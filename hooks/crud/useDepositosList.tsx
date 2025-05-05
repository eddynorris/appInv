import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useApiResource } from '../useApiResource';
import { depositoApi } from '@/services/api';
import { DepositoBancario } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Parámetros iniciales
const DEFAULT_PARAMS = { page: 1, perPage: 10, sort: 'fecha_deposito', order: 'desc' };
const DEFAULT_FILTERS = {
  almacen_id: '',
  usuario_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  search: '' // Para referencia o notas
};

export function useDepositosList() {
  const isInitialLoadDone = useRef(false);
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  // Estados para filtros, ordenamiento y búsqueda
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortColumn, setSortColumn] = useState(DEFAULT_PARAMS.sort);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(DEFAULT_PARAMS.order as 'asc' | 'desc');

  // Función de fetch adaptada
  const fetchDepositosWithFilters = useCallback(async (page = DEFAULT_PARAMS.page, perPage = DEFAULT_PARAMS.perPage) => {
    const queryFilters: Record<string, any> = {
        sort_by: sortColumn,
        sort_order: sortOrder
    };
    if (filters.search) queryFilters.search = filters.search; // Asumiendo que el backend busca en referencia/notas
    if (filters.almacen_id) queryFilters.almacen_id = filters.almacen_id;
    if (filters.usuario_id) queryFilters.usuario_id = filters.usuario_id;
    if (filters.fecha_inicio) queryFilters.fecha_inicio = filters.fecha_inicio;
    if (filters.fecha_fin) queryFilters.fecha_fin = filters.fecha_fin;
    // Si no es admin, podría filtrar por su propio usuario_id si es relevante
    // if (!isAdmin && user?.id) {
    //   queryFilters.usuario_id = user.id.toString();
    // }

    console.log(`Consultando depositos (p${page}, pp${perPage}) con filtros:`, queryFilters);
    return await depositoApi.getDepositos(page, perPage, queryFilters);

  }, [user, isAdmin, sortColumn, sortOrder, filters]);

  const {
    data: depositos,
    isLoading,
    error,
    pagination,
    fetchData: originalFetchData,
    handlePageChange: originalHandlePageChange,
    handleItemsPerPageChange: originalHandleItemsPerPageChange,
    deleteItem: deleteDepositoDirectly,
  } = useApiResource<DepositoBancario>({
    initialParams: { page: DEFAULT_PARAMS.page, perPage: DEFAULT_PARAMS.perPage },
    fetchFn: fetchDepositosWithFilters,
    deleteFn: depositoApi.deleteDeposito,
  });

  // Carga inicial
  useEffect(() => {
    if (!isInitialLoadDone.current) {
      console.log("useDepositosList: Carga inicial...");
      isInitialLoadDone.current = true;
      originalFetchData(DEFAULT_PARAMS.page, DEFAULT_PARAMS.perPage);
    }
  }, [originalFetchData]);

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

  const handleFilterChange = useCallback((filterKey: keyof typeof DEFAULT_FILTERS, value: string) => {
      setFilters(prev => ({ ...prev, [filterKey]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [originalFetchData, pagination.itemsPerPage]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [originalFetchData, pagination.itemsPerPage]);

  // --- Definición de Columnas ---
  const columns = useMemo(() => [
      {
        id: 'fecha_deposito',
        label: 'Fecha',
        width: 1.5,
        sortable: true,
        render: (item: DepositoBancario) => <ThemedText>{formatDate(item.fecha_deposito)}</ThemedText>,
      },
      {
        id: 'monto_depositado',
        label: 'Monto',
        width: 1.2,
        sortable: true,
        render: (item: DepositoBancario) => <ThemedText style={{ fontWeight: '500' }}>{formatCurrency(item.monto_depositado)}</ThemedText>,
      },
      {
        id: 'almacen',
        label: 'Almacén',
        width: 1.5,
        sortable: true, // Asumiendo que se puede ordenar por almacen_id
        render: (item: DepositoBancario) => <ThemedText>{item.almacen?.nombre || 'N/A'}</ThemedText>,
      },
      {
        id: 'usuario',
        label: 'Usuario',
        width: 1.5,
        sortable: true, // Asumiendo que se puede ordenar por usuario_id
        render: (item: DepositoBancario) => <ThemedText>{item.usuario?.username || 'N/A'}</ThemedText>,
      },
      {
        id: 'referencia_bancaria',
        label: 'Referencia',
        width: 2,
        sortable: false,
        render: (item: DepositoBancario) => <ThemedText>{item.referencia_bancaria || '-'}</ThemedText>,
      },
      {
          id: 'comprobante',
          label: 'Comprobante',
          width: 1,
          sortable: false,
          render: (item: DepositoBancario) => {
              // Usar un color secundario del tema actual en lugar de 'gray'
              const colorScheme = useColorScheme() ?? 'light';
              const noComprobanteColor = Colors[colorScheme].textSecondary;
              return (
                  <ThemedText style={{ color: item.url_comprobante_deposito ? Colors.success : noComprobanteColor }}>
                      {item.url_comprobante_deposito ? 'Sí' : 'No'}
                  </ThemedText>
              );
          },
      },
    ], []);

  // --- Otras Funciones ---
  const refresh = useCallback(() => {
    console.log("useDepositosList: Refrescando datos...");
    originalFetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [originalFetchData, pagination.currentPage, pagination.itemsPerPage]);

  const deleteDeposito = useCallback(async (id: number): Promise<boolean> => {
    // Aquí podrías añadir lógica de permisos si fuera necesario
    return await deleteDepositoDirectly(id);
  }, [deleteDepositoDirectly]);

  return {
    depositos,
    isLoading,
    error,
    columns,
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
    refresh,
    deleteDeposito,
    isAdmin,
  };
} 