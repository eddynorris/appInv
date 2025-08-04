import { useState, useCallback } from 'react';
import { Venta } from '@/models/venta';
import { ventaApi } from '@/services/entities/ventaService';
import { pagoApi } from '@/services'; // Para la creación del pago
import { useFocusEffect } from 'expo-router';

// Interface para los datos que el componente necesita del hook
interface UsePagosBatchProcessReturn {
  // Para obtener datos de ventas
  ventasPendientes: Venta[];
  isLoadingVentas: boolean;
  errorVentas: string | null;
  refetchVentasPendientes: () => void;
  // Para crear el batch de pagos
  createPagoBatch: (formData: FormData) => Promise<boolean>;
  isSubmitting: boolean;
  submissionError: string | null;
}

// Interfaz para el detalle de cada pago en el JSON que se envía al backend
export interface PagoJsonDataItem {
  venta_id: number;
  monto: string;
}

// Interfaz para la estructura de respuesta esperada de getAllVentas
interface GetAllVentasResponse {
  data: Venta[];
  // Podría tener otras propiedades si la API las devuelve, pero 'data' es la clave aquí
}

export const usePagosBatchProcess = (): UsePagosBatchProcessReturn => {
  // Estados para la obtención de ventas
  const [ventasPendientes, setVentasPendientes] = useState<Venta[]>([]); // Initialize as empty array
  const [isLoadingVentas, setIsLoadingVentas] = useState(true);
  const [errorVentas, setErrorVentas] = useState<string | null>(null);

  // Estados para la creación del batch de pagos
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Función para obtener las ventas pendientes
  const fetchVentasPendientes = useCallback(async () => {
    setIsLoadingVentas(true); 
    setErrorVentas(null);
    try {
      const queryParams = 'estado_pago=pendiente,parcial';
      // getAllVentas devuelve un objeto { data: Venta[] } según el log de error.
      const response = await ventaApi.getAllVentas(queryParams);
      
      // Verificar que la respuesta y la propiedad 'data' existan y que 'data' sea un array
      if (response && Array.isArray((response as any).data)) {
        setVentasPendientes((response as any).data);
      } else if (response && typeof response === 'object' && (response as any).data === undefined && Array.isArray(response)) {
        // Fallback por si getAllVentas a veces devuelve Venta[] directamente (aunque el log dice que no)
        setVentasPendientes(response as Venta[]);
         console.warn('usePagosBatchProcess: ventaApi.getAllVentas returned a direct array, but expected {data: [...]}. Using direct array.');
      }
      else {
        console.warn('usePagosBatchProcess: ventaApi.getAllVentas did not return the expected structure {data: Venta[]}. Received:', response);
        setVentasPendientes([]); 
      }
    } catch (err: any) {
      console.error("Error in usePagosBatchProcess fetching pending sales:", err);
      setErrorVentas(err.message || "Error al cargar las ventas pendientes.");
      setVentasPendientes([]); // Asegurar que es un array en caso de error
    } finally {
      setIsLoadingVentas(false);
    }
  }, []);

  // Obtener datos cuando la pantalla entra en foco
  useFocusEffect(
    useCallback(() => {
      fetchVentasPendientes();
    }, [fetchVentasPendientes])
  );

  // Función para crear el batch de pagos
  const createPagoBatch = async (formData: FormData): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      await pagoApi.createPagosBatchWithFormData(formData); 
      return true; // Éxito
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err.message || "No se pudieron registrar los pagos en lote.";
      setSubmissionError(errorMessage);
      return false; // Fallo
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ventasPendientes,
    isLoadingVentas,
    errorVentas,
    refetchVentasPendientes: fetchVentasPendientes,
    createPagoBatch,
    isSubmitting,
    submissionError,
  };
};
