import { useMemo, useEffect, useCallback } from 'react';
import { useApiResource } from '../useApiResource'; // Usamos el mismo genérico
import { proveedorApi } from '@/services/api'; // API específica de proveedores
import { Proveedor } from '@/models'; // Modelo de proveedor
import { ThemedText } from '@/components/ThemedText'; // Necesario para render en columnas

// Parámetros iniciales por defecto para la paginación de la lista
const DEFAULT_INITIAL_PARAMS = { page: 1, perPage: 10 };

export function useProveedoresList() {
  const {
    data: proveedores, // Renombrar data a proveedores para claridad
    isLoading,
    error,
    pagination,
    fetchData, // Función base para buscar la lista
    handlePageChange,
    handleItemsPerPageChange,
    // Mantenemos deleteItem por compatibilidad con EnhancedDataTable/EnhancedCardList
    deleteItem: deleteProveedorDirectly,
  } = useApiResource<Proveedor>({
    initialParams: DEFAULT_INITIAL_PARAMS,
    // SOLO pasamos las funciones necesarias para la lista
    fetchFn: proveedorApi.getProveedores,
    deleteFn: proveedorApi.deleteProveedor, // Mantenido para EnhancedDataTable/EnhancedCardList
  });

  // Cargar datos iniciales explícitamente al montar
  useEffect(() => {
    // Evita recargar si ya hay datos (útil para HMR o caché futuro)
    if (proveedores.length === 0) {
      console.log("useProveedoresList: Fetching initial list data...");
      fetchData(DEFAULT_INITIAL_PARAMS.page, DEFAULT_INITIAL_PARAMS.perPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, proveedores.length]);

  // Definir columnas para la tabla/lista
  const columns = useMemo(() => [
    { id: 'id', label: 'ID', width: 0.5, sortable: true },
    { id: 'nombre', label: 'Nombre', width: 2, sortable: true },
    { id: 'telefono', label: 'Teléfono', width: 1, sortable: true, render: (item: Proveedor) => <ThemedText>{item.telefono || '-'}</ThemedText> },
    { id: 'direccion', label: 'Dirección', width: 1.5, sortable: false, render: (item: Proveedor) => <ThemedText>{item.direccion || '-'}</ThemedText> },
  ], []);

  // Función explícita para refrescar la lista
  const refresh = useCallback(() => {
    console.log("useProveedoresList: Refreshing list data...");
    fetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [fetchData, pagination.currentPage, pagination.itemsPerPage]);

  // Wrapper para la función de borrado que viene de useApiResource
  const deleteProveedorAndRefresh = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteProveedorDirectly(id);
      return true;
    } catch (error: any) {
      console.error("Error al eliminar proveedor:", error.message);
      // Podríamos usar el estado 'error' del hook useApiResource si quisiéramos mostrarlo
      return false;
    }
  }, [deleteProveedorDirectly]);

  // Retornar solo lo necesario para la LISTA
  return {
    // Datos y estado de la lista
    proveedores,
    isLoading,
    error,
    columns, // Columnas para la tabla/lista
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
    deleteProveedor: deleteProveedorAndRefresh, // Para borrar desde la lista
    // Opcional: Podrías añadir sorting si la API lo soporta
    // sorting: { ... }
  };
} 