import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { pedidoService } from '@/services';
import { ventaApi } from '@/services/entities/ventaService';
import { Pedido, Venta } from '@/models';
import { useErrorHandler } from '@/hooks/core/useErrorHandler';

interface DetalleForm {
  id?: number;
  presentacion_id: string;
  cantidad: string;
  precio_estimado: string;
}

interface PedidoFormValues {
  cliente_id: string;
  almacen_id: string;
  fecha_entrega: string;
  estado: 'programado' | 'confirmado' | 'entregado' | 'cancelado';
  notas: string;
}

export function usePedidoCRUD() {
  const { error, handleError, clearError } = useErrorHandler();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pedido, setPedido] = useState<Pedido | null>(null);

  // Load pedido for viewing/editing
  const loadPedidoForEdit = useCallback(async (id: number) => {
    setIsLoading(true);
    clearError();
    
    try {
      const pedidoData = await pedidoService.getPedido(id);
      
      if (pedidoData) {
        setPedido(pedidoData);
        return pedidoData;
      }
      
      return null;
    } catch (err) {
      handleError(err, 'Error al cargar el pedido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  // Get pedido details (read-only)
  const getPedido = useCallback(async (id: number) => {
    setIsLoading(true);
    clearError();
    
    try {
      const pedidoData = await pedidoService.getPedido(id);
      
      if (pedidoData) {
        setPedido(pedidoData);
        return pedidoData;
      }
      
      return null;
    } catch (err) {
      handleError(err, 'Error al cargar el pedido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  // Delete pedido
  const deletePedido = useCallback(async (id: number): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      clearError();
      
      await pedidoService.deletePedido(id);
      return true;
    } catch (err) {
      handleError(err, 'Error al eliminar el pedido');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [handleError, clearError]);

  // Create new pedido
  const createPedido = useCallback(async (formData: PedidoFormValues, detalles: DetalleForm[]): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      clearError();

      // Prepare data for API
      const pedidoData = {
        cliente_id: parseInt(formData.cliente_id, 10),
        almacen_id: parseInt(formData.almacen_id, 10),
        fecha_entrega: `${formData.fecha_entrega}T00:00:00Z`, // Convert to ISO 8601 with timezone
        estado: formData.estado,
        notas: formData.notas,
        detalles: detalles.map(detalle => ({
          presentacion_id: parseInt(detalle.presentacion_id, 10),
          cantidad: parseFloat(detalle.cantidad),
          precio_estimado: parseFloat(detalle.precio_estimado),
        })),
      };

      const nuevoPedido = await pedidoService.createPedido(pedidoData);
      
      if (nuevoPedido) {
        setPedido(nuevoPedido);
        router.back(); // Navigate back to list
        return true;
      }
      
      return false;
    } catch (err) {
      handleError(err, 'Error al crear el pedido');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [handleError, clearError]);

  // Update existing pedido
  const updatePedido = useCallback(async (id: number, formData: PedidoFormValues, detalles: DetalleForm[]): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      clearError();

      // Prepare data for API
      const pedidoData = {
        cliente_id: parseInt(formData.cliente_id, 10),
        almacen_id: parseInt(formData.almacen_id, 10),
        fecha_entrega: `${formData.fecha_entrega}T00:00:00Z`, // Convert to ISO 8601 with timezone
        estado: formData.estado,
        notas: formData.notas,
        detalles: detalles.map(detalle => ({
          id: detalle.id,
          presentacion_id: parseInt(detalle.presentacion_id, 10),
          cantidad: parseFloat(detalle.cantidad),
          precio_estimado: parseFloat(detalle.precio_estimado),
        })),
      };

      const pedidoActualizado = await pedidoService.updatePedido(id, pedidoData);
      
      if (pedidoActualizado) {
        setPedido(pedidoActualizado);
        router.back(); // Navigate back to list
        return true;
      }
      
      return false;
    } catch (err) {
      handleError(err, 'Error al actualizar el pedido');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [handleError, clearError]);

  // Convert pedido to form data
  const convertPedidoToFormData = useCallback((pedido: Pedido): { formData: PedidoFormValues, detalles: DetalleForm[] } => {
    const formData: PedidoFormValues = {
      cliente_id: pedido.cliente_id.toString(),
      almacen_id: pedido.almacen_id.toString(),
      fecha_entrega: pedido.fecha_entrega,
      estado: pedido.estado as 'programado' | 'confirmado' | 'entregado' | 'cancelado',
      notas: pedido.notas || '',
    };

    const detalles: DetalleForm[] = pedido.detalles?.map(detalle => ({
      id: detalle.id,
      presentacion_id: detalle.presentacion_id.toString(),
      cantidad: detalle.cantidad.toString(),
      precio_estimado: detalle.precio_estimado?.toString() || '0',
    })) || [];

    return { formData, detalles };
  }, []);

  // Convert pedido to venta - using the standard venta POST endpoint
  const convertPedidoToVenta = useCallback(async (pedidoId: number): Promise<Venta | null> => {
    try {
      setIsSubmitting(true);
      clearError();

      // First get the pedido data
      const pedidoData = await pedidoService.getPedido(pedidoId);
      
      if (!pedidoData) {
        throw new Error('No se pudo cargar los datos del pedido');
      }

      // Convert pedido data to venta format using standard POST /ventas endpoint
      const ventaPayload = {
        cliente_id: pedidoData.cliente_id,
        almacen_id: pedidoData.almacen_id,
        fecha: new Date().toISOString().split('T')[0] + 'T00:00:00Z', // Use today's date
        tipo_pago: 'credito' as const, // Default to credit, user can change later
        consumo_diario_kg: pedidoData.cliente?.consumo_diario_kg || undefined,
        detalles: pedidoData.detalles?.map(detalle => ({
          presentacion_id: detalle.presentacion_id,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_estimado || 0, // Use estimated price as unit price
        })) || []
      };

      // Create the venta using standard venta API
      const nuevaVenta = await ventaApi.createVenta(ventaPayload);
      
      if (nuevaVenta) {
        // Optionally update pedido status to 'entregado' or 'confirmado'
        try {
          await pedidoService.updatePedido(pedidoId, { estado: 'entregado' });
        } catch (updateErr) {
          console.warn('Could not update pedido status:', updateErr);
          // Don't fail the conversion if status update fails
        }
        
        return nuevaVenta;
      }
      
      return null;
    } catch (err) {
      handleError(err, 'Error al convertir pedido a venta');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [handleError, clearError]);

  return {
    // State
    pedido,
    isLoading,
    isSubmitting,
    error,

    // Actions
    loadPedidoForEdit,
    getPedido,
    createPedido,
    updatePedido,
    deletePedido,
    convertPedidoToFormData,
    convertPedidoToVenta,
    clearError,

    // Utilities
    setPedido,
  };
}