// hooks/crud/useAlmacenes.ts
import { useMemo, useEffect, useCallback } from 'react'; // <-- Añadido useEffect, useCallback
import { useApiResource } from '../useApiResource'; // Sigue siendo necesario para la lista
import { almacenApi } from '@/services/api';
import { Almacen } from '@/models';
import { ThemedText } from '@/components/ThemedText';

export function useAlmacenesList() {
  const {
    data: almacenes,
    isLoading,
    error,
    pagination,
    fetchData, // Función base para buscar datos de la lista
    handlePageChange,
    handleItemsPerPageChange,
    // Mantenemos deleteItem aquí porque EnhancedDataTable lo usa directamente
    // Idealmente, esto también se movería, pero requiere modificar EnhancedDataTable
    deleteItem: deleteAlmacenDirectly,
  } = useApiResource<Almacen>({
    initialParams: { page: 1, perPage: 10 },
    fetchFn: almacenApi.getAlmacenes, // <-- SOLO la función de lista
    deleteFn: almacenApi.deleteAlmacen, // <-- Mantenido para EnhancedDataTable
  });

  // Cargar datos iniciales explícitamente al montar el hook
  useEffect(() => {
    // Llama fetchData con la página inicial y por página al montar
    // Si ya hay datos (quizás por caché futuro o HMR), podríamos evitar llamar de nuevo
    if (almacenes.length === 0) {
        fetchData(1, 10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, almacenes.length]); // Ejecutar si fetchData cambia o si almacenes estaba vacío

  // Columnas: Siguen siendo relevantes para la lista
  const columns = useMemo(() => [
        { id: 'nombre', label: 'Nombre', width: 2 },
        { id: 'ciudad', label: 'Ciudad', width: 1, render: (item: Almacen) => <ThemedText>{item.ciudad || '-'}</ThemedText> },
        { id: 'direccion', label: 'Dirección', width: 1.5, render: (item: Almacen) => <ThemedText>{item.direccion || '-'}</ThemedText> },
  ], []);

  // Función explícita para refrescar la lista (vuelve a llamar a fetchData)
  const refresh = useCallback(() => {
    console.log("useAlmacenes: Refreshing list data...");
    // Usar los parámetros actuales de paginación para refrescar la vista actual
    fetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [fetchData, pagination.currentPage, pagination.itemsPerPage]);

  // Wrapper para la función de borrado que viene de useApiResource
  // Esto asegura que después de borrar, se refresque la lista (comportamiento de deleteItem en useApiResource)
  const deleteAlmacenAndRefresh = useCallback(async (id: number): Promise<boolean> => {
      const success = await deleteAlmacenDirectly(id);
      // No necesitamos llamar a refresh aquí porque deleteItem en useApiResource ya llama a fetchData
      return success;
  }, [deleteAlmacenDirectly]);


  // Retornar solo lo necesario para gestionar la LISTA
  return {
    // Datos y estado de la lista
    almacenes,
    isLoading, // Estado de carga de la lista
    error,     // Error al cargar la lista
    columns,   // Definición de columnas para la tabla

    // Paginación de la lista
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      itemsPerPage: pagination.itemsPerPage,
      totalItems: pagination.totalItems,
      onPageChange: handlePageChange,
      onItemsPerPageChange: handleItemsPerPageChange,
    },

    // Acciones relacionadas con la lista
    fetchAlmacenes: fetchData,      // Para buscar/filtrar manualmente si es necesario
    refresh,                     // Para recargar la vista actual de la lista
    deleteAlmacen: deleteAlmacenAndRefresh, // <-- Exponer la función de borrado para la tabla
  };
}