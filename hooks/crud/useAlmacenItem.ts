// hooks/crud/useAlmacenItem.ts
import { useState, useCallback } from 'react';
import { almacenApi } from '@/services';
import { Almacen } from '@/models';

export function useAlmacenItem() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener un almacén específico
  const getAlmacen = useCallback(async (id: number): Promise<Almacen | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await almacenApi.getAlmacen(id);
    } catch (err) {
      console.error('Error getting almacen item:', err);
      const message = err instanceof Error ? err.message : 'Error al obtener el almacén';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Crear un nuevo almacén
  const createAlmacen = useCallback(async (data: Partial<Almacen>): Promise<Almacen | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Asume que la API retorna el objeto creado con su ID
      return await almacenApi.createAlmacen(data);
    } catch (err) {
      console.error('Error creating almacen item:', err);
      const message = err instanceof Error ? err.message : 'Error al crear el almacén';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Actualizar un almacén específico
  const updateAlmacen = useCallback(async (id: number, data: Partial<Almacen>): Promise<Almacen | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await almacenApi.updateAlmacen(id, data);
    } catch (err) {
      console.error('Error updating almacen item:', err);
      const message = err instanceof Error ? err.message : 'Error al actualizar el almacén';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Eliminar un almacén específico
  const deleteAlmacen = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await almacenApi.deleteAlmacen(id);
      return true;
    } catch (err) {
      console.error('Error deleting almacen item:', err);
      const message = err instanceof Error ? err.message : 'Error al eliminar el almacén';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Estado de la operación actual del ítem
    isLoading,
    error,
    // Funciones para operar sobre un ítem
    getAlmacen,
    createAlmacen, // <-- Añadido
    updateAlmacen,
    deleteAlmacen,
    // Utilidad para manejar errores externamente si es necesario
    setError
  };
}