import { useState, useEffect, useCallback, useMemo } from 'react';
import { pedidoApi } from '@/services/api';
import { Pedido } from '@/models';

type DeliveryStatus = 'today' | 'next3days' | 'next7days' | 'future';

export interface CategorizedDeliveries {
  today: Pedido[];
  next3days: Pedido[];
  next7days: Pedido[];
  future: Pedido[];
}

// Obtener la fecha de hoy en formato YYYY-MM-DD
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Obtener la fecha de dentro de X días
const getDateFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 59, 999);
  return date;
};

// Categorizar las entregas por urgencia
const categorizeDeliveries = (deliveries: Pedido[]): CategorizedDeliveries => {
  const today = getToday();
  const in3Days = getDateFromToday(3);
  const in7Days = getDateFromToday(7);
  
  const result: CategorizedDeliveries = {
    today: [],
    next3days: [],
    next7days: [],
    future: []
  };

  deliveries.forEach(delivery => {
    if (!delivery.fecha_entrega) return;
    
    const deliveryDate = new Date(delivery.fecha_entrega);
    
    if (deliveryDate.toDateString() === today.toDateString()) {
      result.today.push(delivery);
    } else if (deliveryDate <= in3Days) {
      result.next3days.push(delivery);
    } else if (deliveryDate <= in7Days) {
      result.next7days.push(delivery);
    } else {
      result.future.push(delivery);
    }
  });

  return result;
};

export function useUpcomingDeliveries() {
  const [allDeliveries, setAllDeliveries] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingDeliveries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Obtener pedidos que vencen en los próximos 30 días
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      const response = await pedidoApi.getPedidos(1, 100, {
        fecha_inicio: getToday().toISOString().split('T')[0],
        fecha_fin: endDate.toISOString().split('T')[0],
        estado: 'programado', // Solo pedidos pendientes
        sort_by: 'fecha_entrega',
        sort_order: 'asc'
      });

      setAllDeliveries(response.data || []);
    } catch (err) {
      console.error('Error fetching upcoming deliveries:', err);
      setError('Error al cargar los próximos vencimientos');
      setAllDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingDeliveries();
  }, [fetchUpcomingDeliveries]);

  // Categorizar las entregas
  const categorizedDeliveries = useMemo(() => {
    return categorizeDeliveries(allDeliveries);
  }, [allDeliveries]);

  // Verificar si hay entregas en los próximos 7 días
  const hasUpcomingDeliveries = useMemo(() => {
    return (
      categorizedDeliveries.today.length > 0 ||
      categorizedDeliveries.next3days.length > 0 ||
      categorizedDeliveries.next7days.length > 0
    );
  }, [categorizedDeliveries]);

  return {
    allDeliveries,
    categorizedDeliveries,
    hasUpcomingDeliveries,
    isLoading,
    error,
    refresh: fetchUpcomingDeliveries
  };
}
