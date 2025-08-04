import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useSimpleCRUD } from '@/hooks/core/useSimpleCRUD';
import { ventaApi } from '@/services/entities/ventaService';
import { Venta } from '@/models';

interface UseVentaDetailProps {
  id: string | null;
}

export function useVentaDetail({ id }: UseVentaDetailProps) {
  // Adaptador para create que convierte Partial<Venta> a CreateVentaPayload
  const createAdapter = useCallback(async (data: Partial<Venta>): Promise<Venta> => {
    if (!data.cliente_id || !data.almacen_id || !data.fecha || !data.tipo_pago) {
      throw new Error('Datos insuficientes para crear la venta');
    }
    
    const payload = {
      cliente_id: data.cliente_id,
      almacen_id: data.almacen_id,
      fecha: data.fecha,
      tipo_pago: data.tipo_pago as 'contado' | 'credito',
      consumo_diario_kg: data.consumo_diario_kg,
      detalles: data.detalles?.map(detalle => ({
        presentacion_id: detalle.presentacion_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario?.toString() || '0',
      })) || [],
    };
    
    return ventaApi.createVenta(payload);
  }, []);

  // Usar el hook genérico CRUD
  const crud = useSimpleCRUD<Venta>({
    apiService: {
      get: ventaApi.getVenta,
      create: createAdapter,
      update: ventaApi.updateVenta,
      delete: ventaApi.deleteVenta,
    },
    entityName: 'Venta',
    routePrefix: '/ventas',
  });

  // Cargar datos de la venta
  const fetchVenta = useCallback(async () => {
    if (!id) return;
    
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      console.error('ID de venta inválido:', id);
      return;
    }
    
    await crud.loadItem(numericId);
  }, [id, crud]);

  // Editar venta
  const handleEdit = useCallback(() => {
    if (!id) return;
    router.push(`/ventas/edit/${id}`);
  }, [id]);

  // Eliminar venta con confirmación
  const handleDelete = useCallback(async () => {
    if (!id) return;
    
    Alert.alert(
      "Eliminar Venta",
      "¿Está seguro que desea eliminar esta venta?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const numericId = parseInt(id);
            if (isNaN(numericId)) {
              Alert.alert('Error', 'ID de venta inválido');
              return;
            }
            
            const success = await crud.deleteItem(numericId);
            if (success) {
              router.replace('/ventas');
            }
          }
        }
      ]
    );
  }, [id, crud]);

  // Obtener información del estado de pago
  const getEstadoPagoInfo = useCallback((estado: string) => {
    switch (estado) {
      case 'pagado':
        return { color: '#4CAF50', text: 'Pagado' };
      case 'pendiente':
        return { color: '#FFC107', text: 'Pendiente' };
      case 'parcial':
        return { color: '#FF9800', text: 'Pago Parcial' };
      default:
        return { color: '#757575', text: estado };
    }
  }, []);

  return {
    venta: crud.item,
    isLoading: crud.isLoading,
    error: crud.error,
    refresh: fetchVenta,
    handleEdit,
    handleDelete,
    getEstadoPagoInfo
  };
}