import { useState, useEffect, useCallback, useMemo } from 'react';
import { ventaApi } from '@/services/entities/ventaService';
import { Venta } from '@/models';
import { useErrorHandler } from '@/hooks/core/useErrorHandler';

export function useVentasPendientes() {
  const { error, handleError, clearError } = useErrorHandler();
  
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVentaId, setSelectedVentaId] = useState<string>('');

  // Cargar las ventas con pagos pendientes
  const loadVentas = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();
      
      // Obtener ventas con estado pendiente o parcial
      const response = await ventaApi.getVentas(1, 100, {
        estado_pago: 'pendiente,parcial'
      });
      
      if (response && response.data) {
        const ventasConPendientes = response.data;
        setVentas(ventasConPendientes);
        
        // Preseleccionar la primera venta si hay alguna disponible
        if (ventasConPendientes.length > 0) {
          setSelectedVentaId(ventasConPendientes[0].id.toString());
        }
      }
      
    } catch (err) {
      handleError(err, 'Error al cargar ventas pendientes');
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadVentas();
  }, [loadVentas]);

  // Obtener información de la venta seleccionada
  const selectedVentaInfo = useMemo(() => {
    if (!selectedVentaId) return null;
    
    const ventaSeleccionada = ventas.find(v => v.id.toString() === selectedVentaId);
    if (!ventaSeleccionada) return null;
    
    return {
      total: parseFloat(ventaSeleccionada.total).toFixed(2),
      cliente: ventaSeleccionada.cliente?.nombre || 'Cliente no disponible',
      saldoPendiente: ventaSeleccionada.saldo_pendiente 
        ? parseFloat(ventaSeleccionada.saldo_pendiente).toFixed(2)
        : parseFloat(ventaSeleccionada.total).toFixed(2)
    };
  }, [selectedVentaId, ventas]);

  // Opciones de venta para el selector
  const ventaOptions = useMemo(() => {
    return ventas.map(venta => ({
      id: venta.id.toString(),
      label: `Venta #${venta.id} - ${venta.cliente?.nombre || 'Cliente'} - $${parseFloat(venta.total).toFixed(2)}`,
      saldoPendiente: venta.saldo_pendiente || venta.total
    }));
  }, [ventas]);

  return {
    ventas,
    isLoading,
    error,
    ventaOptions,
    selectedVentaId,
    setSelectedVentaId,
    selectedVentaInfo,
    loadVentas
  };
}