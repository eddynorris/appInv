import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useApiResource } from '../useApiResource';
import { usuarioApi } from '@/services/api';
import { User, Almacen } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';

// Parámetros iniciales
const DEFAULT_PARAMS = { page: 1, perPage: 10, sort: 'username', order: 'asc' };
const DEFAULT_FILTERS = {
  rol: '',
  almacen_id: '',
  search: '' // Para username
};

export function useUsuariosList() {
  const isInitialLoadDone = useRef(false);
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.rol === 'admin';

  // Estados para filtros, ordenamiento y búsqueda
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortColumn, setSortColumn] = useState('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Función de fetch adaptada
  const fetchUsuariosWithFilters = useCallback(async (page = DEFAULT_PARAMS.page, perPage = DEFAULT_PARAMS.perPage) => {
    const queryFilters: Record<string, any> = {
        sort_by: sortColumn,
        sort_order: sortOrder
    };
    if (filters.search) queryFilters.username = filters.search; // Filtrar por username
    if (filters.rol) queryFilters.rol = filters.rol;
    if (filters.almacen_id) queryFilters.almacen_id = filters.almacen_id;

    console.log(`Consultando usuarios (p${page}, pp${perPage}) con filtros:`, queryFilters);
    return await usuarioApi.getUsuarios(page, perPage, queryFilters);

  }, [sortColumn, sortOrder, filters]);

  const {
    data: usuarios,
    isLoading,
    error,
    pagination,
    fetchData: originalFetchData,
    handlePageChange: originalHandlePageChange,
    handleItemsPerPageChange: originalHandleItemsPerPageChange,
    deleteItem: deleteUsuarioDirectly,
  } = useApiResource<User>({
    initialParams: { page: DEFAULT_PARAMS.page, perPage: DEFAULT_PARAMS.perPage },
    fetchFn: fetchUsuariosWithFilters,
    deleteFn: usuarioApi.deleteUsuario,
  });

  // Carga inicial
  useEffect(() => {
    if (!isInitialLoadDone.current && isAdmin) {
      console.log("useUsuariosList: Carga inicial...");
      isInitialLoadDone.current = true;
      originalFetchData(DEFAULT_PARAMS.page, DEFAULT_PARAMS.perPage);
    }
  }, [originalFetchData, isAdmin]);

  // --- Handlers --- (Similares a useDepositosList)
  const handlePageChange = useCallback((page: number) => {
    if (page !== pagination.currentPage) {
      originalHandlePageChange(page);
    }
  }, [originalHandlePageChange, pagination.currentPage]);

  const handleItemsPerPageChange = useCallback((perPage: number) => {
    if (perPage !== pagination.itemsPerPage) {
      originalHandleItemsPerPageChange(perPage);
    }
  }, [originalHandleItemsPerPageChange, pagination.itemsPerPage]);

  const handleSort = useCallback((columnId: string) => {
    const newSortOrder = (columnId === sortColumn && sortOrder === 'asc') ? 'desc' : 'asc';
    setSortColumn(columnId);
    setSortOrder(newSortOrder);
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [sortColumn, sortOrder, originalFetchData, pagination.itemsPerPage]);

  const handleFilterChange = useCallback((filterKey: keyof typeof DEFAULT_FILTERS, value: string) => setFilters(prev => ({ ...prev, [filterKey]: value })), []);
  const applyFilters = useCallback(() => originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage), [originalFetchData, pagination.itemsPerPage]);
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [originalFetchData, pagination.itemsPerPage]);

  // --- Definición de Columnas ---
  const columns = useMemo(() => [
      {
        id: 'username',
        label: 'Usuario',
        width: 2,
        sortable: true,
      },
      {
        id: 'rol',
        label: 'Rol',
        width: 1.5,
        sortable: true,
      },
      {
        id: 'almacen',
        label: 'Almacén Asignado',
        width: 2,
        sortable: true, // Ordenar por almacen_id
        render: (item: User) => <ThemedText>{item.almacen?.nombre || (item.almacen_id ? `ID: ${item.almacen_id}` : 'Ninguno')}</ThemedText>,
      },
    ], []);

  // --- Otras Funciones ---
  const refresh = useCallback(() => {
    console.log("useUsuariosList: Refrescando datos...");
    originalFetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [originalFetchData, pagination.currentPage, pagination.itemsPerPage]);

  const deleteUsuario = useCallback(async (id: number): Promise<boolean> => {
    if (!isAdmin) {
      Alert.alert("Permiso denegado", "No tiene permiso para eliminar usuarios.");
      return false;
    }
    try {
      return await deleteUsuarioDirectly(id);
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error.message);
      Alert.alert("Error", "No se pudo eliminar el usuario.");
      return false;
    }
  }, [deleteUsuarioDirectly, isAdmin]);

  return {
    usuarios,
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
    deleteUsuario,
    isAdmin,
    sorting: {
      sortColumn: sortColumn,
      sortOrder: sortOrder,
      onSort: handleSort,
    },
  };
} 