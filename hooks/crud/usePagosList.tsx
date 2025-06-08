// hooks/crud/usePagosList.ts
import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useApiResource } from '../useApiResource';
import { pagoApi } from '@/services/api';
import { Pago } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { Alert } from 'react-native';

// Parámetros iniciales por defecto para la paginación de la lista
const DEFAULT_INITIAL_PARAMS = { page: 1, perPage: 10 };

export function usePagosList() {
  // Usar una referencia para controlar la carga inicial y evitar múltiples llamadas
  const isInitialLoadDone = useRef(false);

  // Obtener información del usuario actual
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  
  // Parámetros de filtro basados en el rol del usuario
  const filters = useMemo(() => {
    // Si el usuario no es admin, solo mostrar sus propios pagos
    if (user && user.rol !== 'admin' && user.id) {
      return { usuario_id: user.id };
    }
    return {}; // Sin filtros para admin (ve todos los pagos)
  }, [user]);

  // Función personalizada para obtener pagos con filtros
  const fetchPagosWithFilters = useCallback(async (page = 1, perPage = 10) => {
    // Aquí podemos implementar la lógica para añadir filtros adicionales
    return await pagoApi.getPagos(page, perPage, filters);
  }, [filters]);

  // Usar useApiResource con nuestra función personalizada
  const {
    data: pagos,
    isLoading,
    error,
    pagination,
    fetchData,
    handlePageChange: originalHandlePageChange,
    handleItemsPerPageChange: originalHandleItemsPerPageChange,
    deleteItem: deletePagoDirectly
  } = useApiResource<Pago>({
    initialParams: DEFAULT_INITIAL_PARAMS,
    fetchFn: fetchPagosWithFilters, // Usar la función con filtros
    deleteFn: pagoApi.deletePago
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

  // Definir columnas para la tabla
  const columns = useMemo(() => [
    {
      id: 'venta_id',
      label: 'Venta ID',
      width: 0.8,
      sortable: true,
    },
    {
      id: 'monto',
      label: 'Monto',
      width: 1,
      sortable: true,
      render: (item: Pago) => <ThemedText>${parseFloat(item.monto).toFixed(2)}</ThemedText>,
    },
    {
      id: 'fecha',
      label: 'Fecha',
      width: 1,
      sortable: true,
      render: (item: Pago) => <ThemedText>{new Date(item.fecha).toLocaleDateString()}</ThemedText>,
    },
    {
      id: 'metodo_pago',
      label: 'Método',
      width: 1,
      sortable: true,
      render: (item: Pago) => {
        // Mapeo de método de pago a etiqueta y color
        const metodoPagoMap: Record<Pago['metodo_pago'], { label: string; color: string }> = {
          efectivo: { label: 'Efectivo', color: '#4CAF50' },
          transferencia: { label: 'Transferencia', color: '#2196F3' },
          deposito: { label: 'Depósito', color: '#00BCD4' },
          tarjeta: { label: 'Tarjeta', color: '#9C27B0' },
          yape_plin: { label: 'Yape/Plin', color: '#FF9800' },
          otro: { label: 'Otros', color: '#757575' }
        };
        
        const { label, color } = metodoPagoMap[item.metodo_pago] || { 
          label: item.metodo_pago, 
          color: '#757575' 
        };
        
        return (
          <ThemedText style={{ color, fontWeight: '500' }}>
            {label}
          </ThemedText>
        );
      },
    },
  ], []);

  // Función para refrescar la lista de manera controlada
  const refresh = useCallback(() => {
    fetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [fetchData, pagination.currentPage, pagination.itemsPerPage]);

  // Wrapper para la función de borrado
  const deletePago = useCallback(async (id: number): Promise<boolean> => {
    // Verificar permisos antes de eliminar
    if (user && user.rol !== 'admin') {
      // Si no es admin, obtener el pago primero para verificar propiedad
      try {
        const pago = await pagoApi.getPago(id);
        if (pago.usuario_id !== user.id) {
          console.error("Acceso denegado: No puedes eliminar pagos de otros usuarios");
          Alert.alert("Acceso denegado", "No puedes eliminar pagos de otros usuarios");
          return false;
        }
      } catch (error) {
        console.error("Error verificando permisos:", error);
        return false;
      }
    }
    
    try {
      const success = await deletePagoDirectly(id);
      
      if (success) {
        console.log("Pago eliminado exitosamente");
      } else {
        console.error("Error al eliminar pago");
      }
      
      return success;
    } catch (error: any) {
      console.error("Error al eliminar pago:", error.message);
      Alert.alert("Error", "No se pudo eliminar el pago");
      return false;
    }
  }, [deletePagoDirectly, user]);

  // Calcular el total de pagos
  const getTotalPagos = useMemo(() => {
    return pagos.reduce((acc, pago) => acc + parseFloat(pago.monto), 0).toFixed(2);
  }, [pagos]);

  // Verificar si el usuario tiene permiso para editar/eliminar un pago
  const canEditOrDelete = useCallback((pagoUsuarioId: number | undefined) => {
    if (!user) return false;
    
    // Admins pueden editar/eliminar cualquier pago
    if (user.rol === 'admin') return true;
    
    // Usuarios normales solo pueden editar/eliminar sus propios pagos
    return pagoUsuarioId === user.id;
  }, [user]);

  return {
    // Datos y estado de la lista
    pagos,
    isLoading,
    error,
    columns,
    
    // Información de usuario y permisos
    isAdmin,
    userId: user?.id,
    canEditOrDelete,
    
    // Paginación
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      itemsPerPage: pagination.itemsPerPage,
      totalItems: pagination.totalItems,
      onPageChange: handlePageChange,
      onItemsPerPageChange: handleItemsPerPageChange,
    },
    
    // Acciones
    refresh,
    deletePago,
    
    // Cálculos
    getTotalPagos
  };
}