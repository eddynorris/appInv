import { useState, useCallback } from 'react';
// Importar Venta y getAllVentas desde api.ts
import { ventaApi } from '../../services/api'; // Assuming ventaApi is exported from here
import { Venta } from '@/models';
import dayjs from 'dayjs';

// Tipos para los datos del gráfico
export interface SalesChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }[];
  legend?: string[];
}

// Tipos para las opciones de configuración
export interface SalesChartOptions {
  startDate?: string; // Formato YYYY-MM-DD
  endDate?: string;   // Formato YYYY-MM-DD
  almacenId?: number; // Mantenido por si se necesita filtrar por almacén en el futuro
  // groupBy ya no es necesario si la API no lo soporta directamente
}

// Hook principal
export function useSalesChart() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<SalesChartData | null>(null);

  // Función para cargar los datos de ventas para el gráfico
  const loadSalesData = useCallback(async (options: SalesChartOptions = {}) => {
    setIsLoading(true);
    setError(null);
    setChartData(null); // Limpiar datos anteriores

    try {
      // Configurar fechas por defecto si no se proporcionan
      const endDate = options.endDate || dayjs().format('YYYY-MM-DD');
      const startDate = options.startDate || dayjs().subtract(30, 'day').format('YYYY-MM-DD');

      // Construir la cadena de queryParams para getAllVentas
      // IMPORTANT: Add 'all=true' based on terminal logs
      const queryParams = new URLSearchParams({
        fecha_inicio: startDate,
        fecha_fin: endDate,
        all: 'true' // Add this parameter based on the API request log
      });

      // Añadir almacen_id si está presente
      if (options.almacenId) {
        queryParams.append('almacen_id', options.almacenId.toString());
      }

      // Llamar a getAllVentas y esperar un objeto { data: Venta[] }
      // The actual type might be { data: Venta[] } or similar based on API response structure
      const response = await ventaApi.getAllVentas(queryParams.toString());

      // --- MODIFICATION START ---
      // Check if response exists and has a 'data' property which is an array
      if (!response || !Array.isArray(response.data)) {
        console.warn('La respuesta de getAllVentas no fue un objeto con un array en la propiedad "data":', response);
        throw new Error('Formato de respuesta inválido desde getAllVentas');
      }
      const ventas: Venta[] = response.data; // Extract the array from the 'data' property
      // --- MODIFICATION END ---


      // --- Procesar datos para el gráfico ---
      // Agrupar ventas por día y sumar totales
      const salesByDate: { [date: string]: number } = {};

      ventas.forEach((venta: Venta) => {
        // Asegurarse que la fecha existe y es válida
        if (venta.fecha) {
          // Extraer solo la parte de la fecha (YYYY-MM-DD)
          const dateKey = venta.fecha.split('T')[0];
          const totalVenta = parseFloat(venta.total || '0');

          if (!salesByDate[dateKey]) {
            salesByDate[dateKey] = 0;
          }
          salesByDate[dateKey] += totalVenta;
        }
      });

      // Ordenar las fechas
      const sortedDates = Object.keys(salesByDate).sort();

      // Crear labels y values a partir de los datos agrupados
      const labels: string[] = [];
      const values: number[] = [];

      sortedDates.forEach(date => {
        // Formatear la etiqueta para mostrar (opcional, puedes usar solo YYYY-MM-DD)
        labels.push(dayjs(date).format('DD/MM')); // Formato corto para el label
        values.push(salesByDate[date]);
      });

      // Crear estructura de datos para el gráfico
      const formattedData: SalesChartData = {
        labels,
        datasets: [
          {
            data: values,
            color: (opacity = 1) => `rgba(71, 136, 199, ${opacity})`, // Azul
            strokeWidth: 2
          }
        ]
      };

      setChartData(formattedData);
      return formattedData;

    } catch (err) {
      console.error('Error cargando datos para gráfico de ventas:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar datos de ventas';
      setError(message);
      setChartData({ labels: [], datasets: [{ data: [] }] }); // Estado vacío en caso de error
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencias vacías si loadSalesData no depende de props/estado externo al hook

  return {
    isLoading,
    error,
    chartData,
    loadSalesData // Esta es la función que se llamará desde el componente
  };
}