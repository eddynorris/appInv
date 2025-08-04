// hooks/crud/useClientesList.tsx - Migrated to use useListWithFilters
import { useMemo, useCallback } from 'react';
import { clienteService } from '@/services';
import { Cliente } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { useListWithFilters } from '@/hooks/core/useListWithFilters';

// Default filters
const DEFAULT_FILTERS = { ciudad: '' };

interface ClienteFilters {
  ciudad: string;
}

export function useClientesList() {
  // Memoized fetch function to prevent infinite loops
  const fetchClientes = useCallback(async (page: number, perPage: number, filters: ClienteFilters) => {
    const queryFilters: Record<string, any> = {};
    if (filters.ciudad) queryFilters.ciudad = filters.ciudad;
    
    return await clienteService.getClientes(page, perPage, queryFilters);
  }, []);

  // Use the generic list hook
  const listHook = useListWithFilters<Cliente, ClienteFilters>({
    fetchFn: fetchClientes,
    defaultFilters: DEFAULT_FILTERS,
    initialItemsPerPage: 10,
  });

  // Define table columns
  const columns = useMemo(() => [
    {
      id: 'id',
      label: 'ID',
      width: 0.5,
      sortable: true,
    },
    {
      id: 'nombre',
      label: 'Nombre',
      width: 2,
      sortable: true,
    },
    {
      id: 'telefono',
      label: 'Teléfono',
      width: 1.5,
      render: (item: Cliente) => (
        <ThemedText numberOfLines={1}>
          {item.telefono || 'N/A'}
        </ThemedText>
      ),
    },
    {
      id: 'ciudad',
      label: 'Ciudad',
      width: 1.5,
      render: (item: Cliente) => (
        <ThemedText numberOfLines={1}>
          {item.ciudad || 'N/A'}
        </ThemedText>
      ),
    },
  ], []);

  // Delete function
  const deleteCliente = async (id: number): Promise<boolean> => {
    try {
      await clienteService.deleteCliente(id);
      listHook.refresh(); // Refresh the list after deletion
      return true;
    } catch (error) {
      console.error('Error deleting cliente:', error);
      return false;
    }
  };

  return {
    // Data from the generic hook
    clientes: listHook.data,
    isLoading: listHook.isLoading,
    error: listHook.error,
    
    // Filters
    filters: listHook.filters,
    handleFilterChange: listHook.handleFilterChange,
    applyFilters: listHook.applyFilters,
    clearFilters: listHook.clearFilters,
    
    // Pagination and sorting
    pagination: listHook.pagination,
    sorting: listHook.sorting,
    
    // Actions
    refresh: listHook.refresh,
    deleteCliente,
    
    // Table configuration
    columns,
  };
}