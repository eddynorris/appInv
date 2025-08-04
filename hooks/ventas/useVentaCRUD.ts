import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { ventaApi } from '@/services/entities/ventaService';
import { pagoApi } from '@/services';
import { Venta, Pago } from '@/models';
import { useErrorHandler } from '@/hooks/core/useErrorHandler';

interface VentaDetalleForm {
  id?: number;
  presentacion_id: number;
  cantidad: number;
  precio_unitario: string;
}

interface VentaForm {
  cliente_id: string;
  almacen_id: string;
  fecha: string;
  tipo_pago: 'contado' | 'credito';
  consumo_diario_kg: string;
  detalles: VentaDetalleForm[];
}

export function useVentaCRUD() {
  const { error, handleError, clearError } = useErrorHandler();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [venta, setVenta] = useState<Venta | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);

  // Load sale for viewing/editing
  const loadVentaForEdit = useCallback(async (id: number) => {
    setIsLoading(true);
    clearError();
    
    try {
      const ventaData = await ventaApi.getVenta(id);
      
      if (ventaData) {
        setVenta(ventaData);
        
        // Load payments if any
        if (ventaData.pagos && ventaData.pagos.length > 0) {
          setPagos(ventaData.pagos);
        }
        
        return ventaData;
      }
      
      return null;
    } catch (err) {
      handleError(err, 'Error al cargar la venta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  // Get sale details (read-only)
  const getVenta = useCallback(async (id: number) => {
    setIsLoading(true);
    clearError();
    
    try {
      const ventaData = await ventaApi.getVenta(id);
      
      if (ventaData) {
        setVenta(ventaData);
        
        // Load payments
        try {
          const pagosData = await pagoApi.getPagosByVenta(id);
          setPagos(pagosData || []);
        } catch (pagosErr) {
          console.warn('Error loading payments:', pagosErr);
          setPagos([]);
        }
        
        return ventaData;
      }
      
      return null;
    } catch (err) {
      handleError(err, 'Error al cargar la venta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  // Delete sale
  const deleteVenta = useCallback(async (id: number): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      clearError();
      
      await ventaApi.deleteVenta(id);
      return true;
    } catch (err) {
      handleError(err, 'Error al eliminar la venta');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [handleError, clearError]);

  // Create new sale
  const createVenta = useCallback(async (formData: VentaForm): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      clearError();

      // Prepare data for API
      const ventaData = {
        cliente_id: parseInt(formData.cliente_id, 10),
        almacen_id: parseInt(formData.almacen_id, 10),
        fecha: `${formData.fecha}T00:00:00Z`, // Convert to ISO 8601 with timezone
        tipo_pago: formData.tipo_pago,
        consumo_diario_kg: formData.consumo_diario_kg ? parseFloat(formData.consumo_diario_kg) : undefined,
        detalles: formData.detalles.map(detalle => ({
          presentacion_id: detalle.presentacion_id,
          cantidad: detalle.cantidad,
          precio_unitario: parseFloat(detalle.precio_unitario),
        })),
      };

      const nuevaVenta = await ventaApi.createVenta(ventaData);
      
      if (nuevaVenta) {
        setVenta(nuevaVenta);
        router.back(); // Navigate back to list
        return true;
      }
      
      return false;
    } catch (err) {
      handleError(err, 'Error al crear la venta');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [handleError, clearError]);

  // Update existing sale
  const updateVenta = useCallback(async (id: number, formData: VentaForm): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      clearError();

      // Prepare data for update API
      const ventaData: Partial<Venta> = {
        cliente_id: parseInt(formData.cliente_id, 10),
        almacen_id: parseInt(formData.almacen_id, 10),
        fecha: `${formData.fecha}T00:00:00Z`, // Convert to ISO 8601 with timezone
        tipo_pago: formData.tipo_pago,
        consumo_diario_kg: formData.consumo_diario_kg ? parseFloat(formData.consumo_diario_kg) : undefined,
        // Para update, incluir los detalles como están esperados por la API
        detalles: formData.detalles.map(detalle => ({
          id: detalle.id,
          venta_id: id, // Agregar venta_id requerido
          presentacion_id: detalle.presentacion_id,
          cantidad: detalle.cantidad,
          precio_unitario: parseFloat(detalle.precio_unitario),
        })) as any,
      };

      const ventaActualizada = await ventaApi.updateVenta(id, ventaData);
      
      if (ventaActualizada) {
        setVenta(ventaActualizada);
        router.back(); // Navigate back to list
        return true;
      }
      
      return false;
    } catch (err) {
      handleError(err, 'Error al actualizar la venta');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [handleError, clearError]);

  // Convert form data from loaded sale
  const convertVentaToFormData = useCallback((venta: Venta): VentaForm => {
    return {
      cliente_id: venta.cliente_id.toString(),
      almacen_id: venta.almacen_id.toString(),
      fecha: venta.fecha,
      tipo_pago: venta.tipo_pago as 'contado' | 'credito',
      consumo_diario_kg: venta.consumo_diario_kg?.toString() || '',
      detalles: venta.detalles?.map(detalle => ({
        id: detalle.id,
        presentacion_id: detalle.presentacion_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario.toString(),
      })) || [],
    };
  }, []);

  return {
    // State
    venta,
    pagos,
    isLoading,
    isSubmitting,
    error,

    // Actions
    loadVentaForEdit,
    getVenta,
    createVenta,
    updateVenta,
    deleteVenta,
    convertVentaToFormData,
    clearError,

    // Utilities
    setVenta,
    setPagos,
  };
}