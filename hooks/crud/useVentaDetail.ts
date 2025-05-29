// hooks/useVentaDetail.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { ventaApi } from '@/services/venta';
import { Venta } from '@/models';
import { router } from 'expo-router';

interface UseVentaDetailProps {
  id: string | null;
}

export function useVentaDetail({ id }: UseVentaDetailProps) {
  const [venta, setVenta] = useState<Venta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de la venta
  const fetchVenta = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ventaApi.getVenta(parseInt(id));
      
      if (response) {
        setVenta(response);
      } else {
        setError('Error al cargar los datos de la venta');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos de la venta');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Efecto para cargar al inicio
  useEffect(() => {
    fetchVenta();
  }, [fetchVenta]);

  // Editar venta
  const handleEdit = useCallback(() => {
    if (!id) return;
    router.push(`/ventas/edit/${id}`);
  }, [id]);

  // Eliminar venta
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
            try {
              setIsLoading(true);
              await ventaApi.deleteVenta(parseInt(id));
              router.replace('/ventas');
            } catch (error) {
              setError('Error al eliminar la venta');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  }, [id]);

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
    venta,
    isLoading,
    error,
    refresh: fetchVenta,
    handleEdit,
    handleDelete,
    getEstadoPagoInfo
  };
}