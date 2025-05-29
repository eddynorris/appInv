// hooks/crud/useGastosList.tsx
import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useApiResource } from '../useApiResource';
import { gastoApi } from '@/services/api';
import { Gasto } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';

// Parámetros iniciales por defecto para la paginación de la lista
const DEFAULT_INITIAL_PARAMS = { page: 1, perPage: 10 };

export function useGastosList() {
  // Usar una referencia para controlar la carga inicial y evitar múltiples llamadas
  const isInitialLoadDone = useRef(false);

  // Obtener información del usuario actual
  const { user } = useAuth();
  
  // Parámetros de filtro basados en el rol del usuario
  const filters = useMemo(() => {
    // Si el usuario no es admin, solo mostrar sus propios gastos
    if (user && user.rol !== 'admin' && user.id) {
      return { usuario_id: user.id };
    }
    return {}; // Sin filtros para admin (ve todos los gastos)
  }, [user]);

  // Función personalizada para obtener gastos con filtros
  const fetchGastosWithFilters = useCallback(async (page = 1, perPage = 10) => {
    // Aquí podemos implementar la lógica para añadir filtros adicionales
    return await gastoApi.getGastos(page, perPage, filters);
  }, [filters]);

  const {
    data: gastos,
    isLoading,
    error,
    pagination,
    fetchData,
    handlePageChange: originalHandlePageChange,
    handleItemsPerPageChange: originalHandleItemsPerPageChange,
    deleteItem: deleteGastoDirectly,
  } = useApiResource<Gasto>({
    initialParams: DEFAULT_INITIAL_PARAMS,
    fetchFn: fetchGastosWithFilters, // Usar la función con filtros
    deleteFn: gastoApi.deleteGasto,
  });

  // Cargar datos iniciales explícitamente al montar, con control para evitar llamadas duplicadas
  useEffect(() => {
    if (!isInitialLoadDone.current) {
      // Marcar como ejecutado para evitar llamadas duplicadas
      isInitialLoadDone.current = true;
      fetchData(DEFAULT_INITIAL_PARAMS.page, DEFAULT_INITIAL_PARAMS.perPage);
    }
  }, [fetchData, filters]);

  // Wrapper para handlePageChange que evita llamadas innecesarias
  const handlePageChange = useCallback((page: number) => {
    // Solo llamar si es una página diferente
    if (page !== pagination.currentPage) {
      originalHandlePageChange(page);
    }
  }, [originalHandlePageChange, pagination.currentPage]);

  // Wrapper para handleItemsPerPageChange que evita llamadas innecesarias
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    // Solo llamar si es un valor diferente
    if (perPage !== pagination.itemsPerPage) {
      originalHandleItemsPerPageChange(perPage);
    }
  }, [originalHandleItemsPerPageChange, pagination.itemsPerPage]);

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

  // Función para refrescar la lista de manera controlada
  const refresh = useCallback(() => {
    fetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [fetchData, pagination.currentPage, pagination.itemsPerPage]);
  
  // Función wrapper para eliminar un gasto
  const deleteGasto = useCallback(async (id: number): Promise<boolean> => {
    // Verificar permisos antes de eliminar
    if (user && user.rol !== 'admin') {
      // Si no es admin, obtener el gasto primero para verificar propiedad
      try {
        const gasto = await gastoApi.getGasto(id);
        if (gasto.usuario_id !== user.id) {
          console.error("Acceso denegado: No puedes eliminar gastos de otros usuarios");
          return false;
        }
      } catch (error) {
        console.error("Error verificando permisos:", error);
        return false;
      }
    }
    
    try {
      const success = await deleteGastoDirectly(id);
      return success;
    } catch (error: any) {
      console.error("Error al eliminar gasto:", error.message);
      return false;
    }
  }, [deleteGastoDirectly, user]);

  // Calcular estadísticas de gastos
  const getEstadisticas = useCallback(() => {
    const totalMonto = gastos.reduce(
      (acc, gasto) => acc + parseFloat(gasto.monto || '0'), 
      0
    );
    
    return {
      totalMonto,
      totalGastos: pagination.totalItems
    };
  }, [gastos, pagination.totalItems]);

  // Verificar si el usuario tiene permiso para editar/eliminar un gasto
  const canEditOrDelete = useCallback((gastoUsuarioId: number | undefined) => {
    if (!user) return false;
    
    // Admins pueden editar/eliminar cualquier gasto
    if (user.rol === 'admin') return true;
    
    // Usuarios normales solo pueden editar/eliminar sus propios gastos
    return gastoUsuarioId === user.id;
  }, [user]);

  return {
    // Datos y estado de la lista
    gastos,
    isLoading,
    error,
    columns,
    
    // Información del usuario y permisos
    isAdmin: user?.rol === 'admin',
    canEditOrDelete,
    
    // Paginación
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      itemsPerPage: pagination.itemsPerPage,
      totalItems: pagination.totalItems,
      onPageChange: handlePageChange, // Usar nuestro wrapper
      onItemsPerPageChange: handleItemsPerPageChange, // Usar nuestro wrapper
    },
    
    // Funciones
    refresh,
    deleteGasto,
    getEstadisticas,
    getCategoryColor,
  };
}