// hooks/crud/useClienteItem.ts
import { useState, useCallback } from 'react';
import { clienteApi } from '@/services/api'; // Asume que tienes este servicio API
import { Cliente } from '@/models'; // Asume que tienes este modelo
import { Alert } from 'react-native';

export function useClienteItem() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener un cliente específico
  const getCliente = useCallback(async (id: number): Promise<Cliente | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Llama directamente a la función de la API
      return await clienteApi.getCliente(id);
    } catch (err) {
      console.error('Error getting cliente item:', err);
      const message = err instanceof Error ? err.message : 'Error al obtener el cliente';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Crear un nuevo cliente
  const createCliente = useCallback(async (data: Partial<Cliente>): Promise<Cliente | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Llama directamente a la función de la API
      // Asume que la API retorna el objeto creado con su ID
      return await clienteApi.createCliente(data);
    } catch (err) {
      console.error('Error creating cliente item:', err);
      const message = err instanceof Error ? err.message : 'Error al crear el cliente';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Actualizar un cliente específico
  const updateCliente = useCallback(async (id: number, data: Partial<Cliente>): Promise<Cliente | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Llama directamente a la función de la API
      return await clienteApi.updateCliente(id, data);
    } catch (err) {
      console.error('Error updating cliente item:', err);
      const message = err instanceof Error ? err.message : 'Error al actualizar el cliente';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Eliminar un cliente específico
  const deleteCliente = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // Llama directamente a la función de la API
      await clienteApi.deleteCliente(id);
      return true;
    } catch (err: any) { // Capturar como 'any' para inspeccionar propiedades de forma segura
        Alert.alert("Error", error || "No se pudo eliminar el cliente");
        return false; // Fallo
      } finally {
        setIsLoading(false);
      }
  }, []);

  return {
    // Estado de la operación actual del ítem
    isLoading,
    error,
    // Funciones para operar sobre un ítem
    getCliente,
    createCliente,
    updateCliente,
    deleteCliente,
    // Utilidad para manejar errores externamente si es necesario
    setError
  };
}