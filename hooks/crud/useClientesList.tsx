// hooks/crud/useClientesList.ts
import { useMemo, useEffect, useCallback, useState } from 'react';
import { useApiResource } from '../useApiResource';
import { clienteApi } from '@/services/api';
import { Cliente } from '@/models';
import { ThemedText } from '@/components/ThemedText';

// Parámetros iniciales y filtros
const DEFAULT_INITIAL_PARAMS = { page: 1, perPage: 10 };
const DEFAULT_FILTERS = { ciudad: '' }; // Añadir filtro inicial para ciudad

export function useClientesList() {
  // Estado para filtros locales
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Función de fetch adaptada para incluir filtros
  const fetchClientesWithFilters = useCallback(async (page = DEFAULT_INITIAL_PARAMS.page, perPage = DEFAULT_INITIAL_PARAMS.perPage) => {
    const queryFilters: Record<string, any> = {};
    if (filters.ciudad) queryFilters.ciudad = filters.ciudad;
    // Aquí podrías añadir más filtros si fueran necesarios (ej: nombre, etc.)
    
    return await clienteApi.getClientes(page, perPage, queryFilters);
  }, [filters]); // Depende de los filtros locales

  const {
    data: clientes,
    isLoading,
    error,
    pagination,
    fetchData: originalFetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deleteItem: deleteClienteDirectly,
  } = useApiResource<Cliente>({
    initialParams: DEFAULT_INITIAL_PARAMS,
    fetchFn: fetchClientesWithFilters, // Usar la función con filtros
    deleteFn: clienteApi.deleteCliente,
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (clientes.length === 0) {
      // Usar originalFetchData para evitar bucle con fetchClientesWithFilters
      originalFetchData(DEFAULT_INITIAL_PARAMS.page, DEFAULT_INITIAL_PARAMS.perPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalFetchData, clientes.length]);

  // Definir columnas, añadiendo ciudad
  const columns = useMemo(() => [
    { id: 'id', label: 'ID', width: 0.5, sortable: true },
    { id: 'nombre', label: 'Nombre', width: 2, sortable: true },
    { id: 'telefono', label: 'Teléfono', width: 1, sortable: true },
    { id: 'ciudad', label: 'Ciudad', width: 1, sortable: true, render: (item: Cliente) => <ThemedText>{item.ciudad || '-'}</ThemedText> }, // Nueva columna
    { id: 'direccion', label: 'Dirección', width: 1.5, render: (item: Cliente) => <ThemedText>{item.direccion || '-'}</ThemedText> },
    { id: 'saldo_pendiente', label: 'Saldo', width: 1, render: (item: Cliente) => <ThemedText>${parseFloat(item.saldo_pendiente || '0').toFixed(2)}</ThemedText> },
  ], []);

  // Función explícita para refrescar la lista
  const refresh = useCallback(() => {
    // Usar originalFetchData para refrescar con los filtros actuales
    originalFetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [originalFetchData, pagination.currentPage, pagination.itemsPerPage]);

  // Wrapper para la función de borrado
  const deleteClienteAndRefresh = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteClienteDirectly(id);
      return true;
    } catch (error: any) {
      console.error("Error al eliminar cliente:", error.message);
      return false;
    }
  }, [deleteClienteDirectly]);

  // Handlers para filtros locales
  const handleFilterChange = useCallback((filterKey: keyof typeof DEFAULT_FILTERS, value: string) => {
      setFilters(prev => ({ ...prev, [filterKey]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    // Refrescar desde la página 1 con los filtros aplicados
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_INITIAL_PARAMS.perPage);
  }, [originalFetchData, pagination.itemsPerPage]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS); // Resetear estado local
    // Refrescar desde la página 1 sin filtros locales
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_INITIAL_PARAMS.perPage);
  }, [originalFetchData, pagination.itemsPerPage]);

  return {
    clientes,
    isLoading,
    error,
    columns,
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      itemsPerPage: pagination.itemsPerPage,
      totalItems: pagination.totalItems,
      onPageChange: handlePageChange,
      onItemsPerPageChange: handleItemsPerPageChange,
    },
    // Exponer filtros y sus handlers
    filters,
    handleFilterChange,
    applyFilters,
    clearFilters,
    refresh,
    deleteCliente: deleteClienteAndRefresh,
  };
}