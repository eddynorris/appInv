import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { useErrorHandler } from './useErrorHandler';

interface UseSimpleCRUDOptions<T> {
  apiService: {
    get: (id: number) => Promise<T>;
    create: (data: Partial<T>) => Promise<T>;
    update: (id: number, data: Partial<T>) => Promise<T>;
    delete: (id: number) => Promise<void>;
  };
  entityName: string;
  routePrefix: string;
}

export function useSimpleCRUD<T extends { id?: number }>(
  options: UseSimpleCRUDOptions<T>
) {
  const { apiService, entityName, routePrefix } = options;
  const { error, handleError, clearError } = useErrorHandler();
  
  const [item, setItem] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load item by ID
  const loadItem = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      clearError();
      
      const data = await apiService.get(id);
      setItem(data);
      
      return data;
    } catch (err) {
      handleError(err, `Error al cargar ${entityName.toLowerCase()}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiService, entityName, handleError, clearError]);

  // Create new item
  const createItem = useCallback(async (data: Partial<T>) => {
    try {
      setIsSubmitting(true);
      clearError();
      
      const newItem = await apiService.create(data);
      setItem(newItem);
      
      // Navigate back to list
      router.back();
      
      return newItem;
    } catch (err) {
      handleError(err, `Error al crear ${entityName.toLowerCase()}`);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [apiService, entityName, handleError, clearError]);

  // Update existing item
  const updateItem = useCallback(async (id: number, data: Partial<T>) => {
    try {
      setIsSubmitting(true);
      clearError();
      
      const updatedItem = await apiService.update(id, data);
      setItem(updatedItem);
      
      // Navigate back to list
      router.back();
      
      return updatedItem;
    } catch (err) {
      handleError(err, `Error al actualizar ${entityName.toLowerCase()}`);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [apiService, entityName, handleError, clearError]);

  // Delete item
  const deleteItem = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true);
      clearError();
      
      await apiService.delete(id);
      
      return true;
    } catch (err) {
      handleError(err, `Error al eliminar ${entityName.toLowerCase()}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [apiService, entityName, handleError, clearError]);

  // Navigation helpers
  const navigateToCreate = useCallback(() => {
    router.push(`${routePrefix}/create`);
  }, [routePrefix]);

  const navigateToEdit = useCallback((id: number) => {
    router.push(`${routePrefix}/edit/${id}`);
  }, [routePrefix]);

  const navigateToDetail = useCallback((id: number) => {
    router.push(`${routePrefix}/${id}`);
  }, [routePrefix]);

  const navigateToList = useCallback(() => {
    router.push(routePrefix);
  }, [routePrefix]);

  return {
    // State
    item,
    isLoading,
    isSubmitting,
    error,
    
    // Actions
    loadItem,
    createItem,
    updateItem,
    deleteItem,
    clearError,
    
    // Navigation
    navigateToCreate,
    navigateToEdit,
    navigateToDetail,
    navigateToList,
    
    // Utilities
    setItem,
    
    // Legacy API compatibility - these will be overridden by specific hooks
  };
}