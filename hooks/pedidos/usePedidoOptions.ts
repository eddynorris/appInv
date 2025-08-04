import { useState, useCallback, useEffect } from 'react';
import { pedidoService, NormalizedPedidoFormData } from '@/services';
import { ClienteSimple, AlmacenSimple, Presentacion, StockPorAlmacen } from '@/models';
import { useAuth } from '@/context/AuthContext';
import { useErrorHandler } from '@/hooks/core/useErrorHandler';

export function usePedidoOptions() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const defaultUserAlmacenId = user?.almacen_id?.toString();
  const { error, handleError, clearError } = useErrorHandler();

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingPresentaciones, setIsLoadingPresentaciones] = useState(false);
  const [clientes, setClientes] = useState<ClienteSimple[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenSimple[]>([]);
  const [allPresentaciones, setAllPresentaciones] = useState<Presentacion[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);

  // Filter presentations by warehouse - make new API call to get warehouse-specific data
  const filterPresentacionesByAlmacen = useCallback(async (almacenId: string) => {
    if (!almacenId) {
      setPresentaciones([]);
      return;
    }
    
    const numAlmacenId = parseInt(almacenId, 10);
    if (isNaN(numAlmacenId)) {
      console.warn(`Almacen ID inválido para filtrar: ${almacenId}`);
      setPresentaciones([]);
      return;
    }
    
    // For admin users, make a new API call to get presentations for the selected warehouse
    if (isAdmin) {
      try {
        setIsLoadingPresentaciones(true);
        const formData = await pedidoService.getFormData(numAlmacenId);
        const presentacionesData = formData.presentaciones || [];
        setPresentaciones(presentacionesData);
      } catch (err) {
        handleError(err, `Error al cargar presentaciones para almacén ${almacenId}`);
        setPresentaciones([]);
      } finally {
        setIsLoadingPresentaciones(false);
      }
    } else {
      // For non-admin users, they can only see their assigned warehouse (shouldn't reach here)
      setPresentaciones(allPresentaciones);
    }
  }, [isAdmin, handleError]);

  // Load initial data using /pedidos/form-data endpoint
  const loadInitialData = useCallback(async () => {
    setIsLoadingOptions(true);
    clearError();
    
    try {
      // Load data with user's default warehouse to get presentations for that warehouse
      const almacenIdParam = defaultUserAlmacenId ? parseInt(defaultUserAlmacenId, 10) : undefined;
      const formData = await pedidoService.getFormData(almacenIdParam);
      
      setClientes(formData.clientes || []);
      setAlmacenes(formData.almacenes || []);
      
      const presentacionesData = formData.presentaciones || [];
      setAllPresentaciones(presentacionesData);
      
      // For user's default warehouse, show presentations directly
      // The API already filters by warehouse and includes stock information
      setPresentaciones(presentacionesData);
      
    } catch (err) {
      handleError(err, 'Error al cargar datos iniciales del pedido');
    } finally {
      setIsLoadingOptions(false);
    }
  }, [defaultUserAlmacenId, handleError, clearError]);

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    // Data
    clientes,
    almacenes,
    allPresentaciones,
    presentaciones,
    
    // State
    isLoadingOptions,
    isLoadingPresentaciones,
    error,
    
    // Actions
    filterPresentacionesByAlmacen,
    loadInitialData,
    setClientes,
    
    // User info
    isAdmin,
    defaultUserAlmacenId,
  };
}