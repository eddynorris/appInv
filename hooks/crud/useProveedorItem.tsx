import { useState, useCallback } from 'react';
import { proveedorApi } from '@/services/api'; // API específica de proveedores
import { Proveedor } from '@/models'; // Modelo de proveedor
import { Alert } from 'react-native';

export function useProveedorItem() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener un proveedor específico
  const getProveedor = useCallback(async (id: number): Promise<Proveedor | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Llama directamente a la función de la API
      return await proveedorApi.getProveedor(id);
    } catch (err) {
      console.error('Error getting proveedor item:', err);
      const message = err instanceof Error ? err.message : 'Error al obtener el proveedor';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Crear un nuevo proveedor
  const createProveedor = useCallback(async (data: Partial<Proveedor>): Promise<Proveedor | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Llama directamente a la función de la API
      // Asume que la API retorna el objeto creado con su ID
      return await proveedorApi.createProveedor(data);
    } catch (err) {
      console.error('Error creating proveedor item:', err);
      const message = err instanceof Error ? err.message : 'Error al crear el proveedor';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Actualizar un proveedor específico
  const updateProveedor = useCallback(async (id: number, data: Partial<Proveedor>): Promise<Proveedor | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Llama directamente a la función de la API
      return await proveedorApi.updateProveedor(id, data);
    } catch (err) {
      console.error('Error updating proveedor item:', err);
      const message = err instanceof Error ? err.message : 'Error al actualizar el proveedor';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Eliminar un proveedor específico
  const deleteProveedor = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // Llama directamente a la función de la API
      await proveedorApi.deleteProveedor(id);
      return true;
    } catch (err: any) {
        console.error('Error deleting proveedor item:', err);
        const message = err instanceof Error ? err.message : 'Error al eliminar el proveedor';
        setError(message); // Guardar el error
        Alert.alert("Error", message); // Mostrar alerta
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
    getProveedor,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    // Utilidad para manejar errores externamente si es necesario
    setError
  };
} 