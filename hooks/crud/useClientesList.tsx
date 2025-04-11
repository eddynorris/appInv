// hooks/crud/useClientesList.ts
import { useMemo, useEffect, useCallback } from 'react';
import { useApiResource } from '../useApiResource'; // Usamos el mismo genérico
import { clienteApi } from '@/services/api';
import { Cliente } from '@/models';
import { ThemedText } from '@/components/ThemedText'; // Necesario para render en columnas

// Parámetros iniciales por defecto para la paginación de la lista
const DEFAULT_INITIAL_PARAMS = { page: 1, perPage: 10 };

export function useClientesList() {
  const {
    data: clientes, // Renombrar data a clientes para claridad
    isLoading,
    error,
    pagination,
    fetchData, // Función base para buscar la lista
    handlePageChange,
    handleItemsPerPageChange,
    // Mantenemos deleteItem por compatibilidad con EnhancedDataTable
    deleteItem: deleteClienteDirectly,
  } = useApiResource<Cliente>({
    initialParams: DEFAULT_INITIAL_PARAMS,
    // SOLO pasamos las funciones necesarias para la lista
    fetchFn: clienteApi.getClientes,
    deleteFn: clienteApi.deleteCliente, // Mantenido para EnhancedDataTable
  });

  // Cargar datos iniciales explícitamente al montar
  useEffect(() => {
    // Evita recargar si ya hay datos (útil para HMR o caché futuro)
    if (clientes.length === 0) {
      console.log("useClientesList: Fetching initial list data...");
      fetchData(DEFAULT_INITIAL_PARAMS.page, DEFAULT_INITIAL_PARAMS.perPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, clientes.length]);

  // Definir columnas para la tabla (igual que antes)
  const columns = useMemo(() => [
    { id: 'id', label: 'ID', width: 0.5, sortable: true },
    { id: 'nombre', label: 'Nombre', width: 2, sortable: true },
    { id: 'telefono', label: 'Teléfono', width: 1, sortable: true },
    { id: 'direccion', label: 'Dirección', width: 1.5, render: (item: Cliente) => <ThemedText>{item.direccion || '-'}</ThemedText>, }, // Añadida de index.tsx
    { id: 'saldo_pendiente', label: 'Saldo', width: 1, render: (item: Cliente) => <ThemedText>${parseFloat(item.saldo_pendiente || '0').toFixed(2)}</ThemedText> },
  ], []);

  // Función explícita para refrescar la lista
  const refresh = useCallback(() => {
    console.log("useClientesList: Refreshing list data...");
    fetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [fetchData, pagination.currentPage, pagination.itemsPerPage]);

  
  // Wrapper para la función de borrado que viene de useApiResource
  const deleteClienteAndRefresh = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteClienteDirectly(id);
      return true;
    } catch (error: any) {
      console.error("Error al eliminar cliente:", error.message);
      return false;
    }
  }, [deleteClienteDirectly]);

  // Retornar solo lo necesario para la LISTA
  return {
    // Datos y estado de la lista
    clientes,
    isLoading,
    error,
    columns, // Columnas para la tabla
    // Paginación
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      itemsPerPage: pagination.itemsPerPage,
      totalItems: pagination.totalItems,
      onPageChange: handlePageChange,
      onItemsPerPageChange: handleItemsPerPageChange,
    },
    // Acciones de lista
    refresh, // Para recargar
    deleteCliente: deleteClienteAndRefresh, // Para borrar desde la tabla
  };
}