// hooks/crud/usePagoItem.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { pagoApi, ventaApi } from '@/services/api';
import { API_CONFIG } from '@/services/httpClient';
import { Pago } from '@/models';
import { useImageUploader, FileInfo } from '@/hooks/useImageUploader';

export function usePagoItem() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usar el hook personalizado para la gestión de archivos
  const { 
    file: comprobante, 
    setFile: setComprobante,
    pickImage,
    takePhoto,
    pickDocument,
    clearFile
  } = useImageUploader({
    maxSizeMB: 5,
    allowedTypes: ['image', 'document']
  });
  
  // Estado para el comprobante existente
  const [existingComprobante, setExistingComprobante] = useState<string | null>(null);

  // Obtener un pago específico con información enriquecida de la venta
  const getPago = useCallback(async (id: number): Promise<Pago | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await pagoApi.getPago(id);
      
      // Si existe un comprobante en el pago, guardarlo en el estado
      if (data && data.url_comprobante) {
        setExistingComprobante(data.url_comprobante);
      }
      
      // Verificar si la venta ya tiene todos los datos necesarios
      const hasCompleteVentaData = data?.venta && data.venta.cliente;
      
      // Si no tiene todos los datos y tenemos un ID de venta, intentar enriquecer
      if (data && data.venta_id && !hasCompleteVentaData) {
        try {
          // Usar ventaApi importado directamente
          const ventaData = await ventaApi.getVenta(data.venta_id);
          
          if (ventaData) {
            // Enriquecer el pago con datos completos de la venta
            data.venta = ventaData;
          }
        } catch (ventaError) {
          console.error('Error fetching venta details:', ventaError);
          // No fallar la operación principal si esto falla
        }
      }
      
      return data;
    } catch (err) {
      console.error('Error getting pago:', err);
      const message = err instanceof Error ? err.message : 'Error al obtener el pago';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Crear un nuevo pago
  const createPago = useCallback(async (data: Partial<Pago>): Promise<Pago | null> => {
    setIsLoading(true);
    setError(null);
    try {
      let response;
      
      // Si hay un comprobante, usar el método con comprobante
      if (comprobante) {
        response = await pagoApi.createPagoWithComprobante(data, comprobante.uri);
      } else {
        // Si no hay comprobante, usar el método JSON estándar
        response = await pagoApi.createPago(data);
      }
      
      // Limpiar el estado después de un éxito
      clearFile();
      
      return response;
    } catch (err) {
      console.error('Error creating pago:', err);
      const message = err instanceof Error ? err.message : 'Error al crear el pago';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [comprobante, clearFile]);

  // Actualizar un pago específico
  const updatePago = useCallback(async (id: number, data: Partial<Pago>): Promise<Pago | null> => {
    setIsLoading(true);
    setError(null);
    try {
      let response;
      
      // Si hay un nuevo comprobante, usar el método con comprobante
      if (comprobante) {
        response = await pagoApi.updatePagoWithComprobante(id, data, comprobante.uri);
      } else {
        // Si no hay un nuevo comprobante, usar el método estándar
        response = await pagoApi.updatePago(id, data);
      }
      
      // Limpiar el estado después de un éxito
      clearFile();
      
      return response;
    } catch (err) {
      console.error('Error updating pago:', err);
      const message = err instanceof Error ? err.message : 'Error al actualizar el pago';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [comprobante, clearFile]);

  // Eliminar un pago específico
  const deletePago = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await pagoApi.deletePago(id);
      return true;
    } catch (err) {
      console.error('Error deleting pago:', err);
      const message = err instanceof Error ? err.message : 'Error al eliminar el pago';
      setError(message);
      Alert.alert("Error", message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Estado de la operación actual
    isLoading,
    error,
    
    // Estado de archivos
    comprobante,
    existingComprobante,
    
    // Funciones CRUD básicas
    getPago,
    createPago,
    updatePago,
    deletePago,
    
    // Gestión de archivos
    setComprobante,
    setExistingComprobante,
    pickImage,
    takePhoto,
    pickDocument,
    
    // Utilidad para manejar errores externamente
    setError
  };
}