// hooks/crud/useEntityCRUD.ts
import { useState, useCallback, useEffect } from 'react';

export function useEntityCRUD({ apiService, entityName }) {
  const [entities, setEntities] = useState([]);
  const [entity, setEntity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  // Cargar lista de entidades
  const loadEntities = useCallback(async (page = 1, perPage = pagination.itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getEntities(page, perPage);
      
      if (response && response.data) {
        setEntities(response.data);
        setPagination({
          currentPage: response.pagination.page,
          totalPages: response.pagination.pages,
          itemsPerPage: response.pagination.per_page,
          totalItems: response.pagination.total
        });
      }
    } catch (err) {
      setError(`Error al cargar ${entityName}`);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.itemsPerPage, apiService, entityName]);

  // Cargar una entidad por ID
  const loadEntity = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await apiService.getEntity(id);
      setEntity(data);
    } catch (err) {
      setError(`Error al cargar el ${entityName}`);
    } finally {
      setIsLoading(false);
    }
  }, [apiService, entityName]);

  // Crear una entidad
  const createEntity = useCallback(async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiService.createEntity(data);
      return result;
    } catch (err) {
      setError(`Error al crear el ${entityName}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiService, entityName]);

  // Actualizar una entidad
  const updateEntity = useCallback(async (id, data) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiService.updateEntity(id, data);
      return result;
    } catch (err) {
      setError(`Error al actualizar el ${entityName}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiService, entityName]);

  // Eliminar una entidad
  const deleteEntity = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await apiService.deleteEntity(id);
      return true;
    } catch (err) {
      setError(`Error al eliminar el ${entityName}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [apiService, entityName]);

  // Gestión de paginación
  const handlePageChange = useCallback((page) => {
    loadEntities(page, pagination.itemsPerPage);
  }, [loadEntities, pagination.itemsPerPage]);

  const handleItemsPerPageChange = useCallback((perPage) => {
    loadEntities(1, perPage);
  }, [loadEntities]);

  return {
    // Estado
    entities,
    entity,
    isLoading,
    error,
    pagination: {
      ...pagination,
      onPageChange: handlePageChange,
      onItemsPerPageChange: handleItemsPerPageChange
    },
    
    // Acciones
    loadEntities,
    loadEntity,
    createEntity,
    updateEntity,
    deleteEntity,
    
    // Helpers
    refresh: () => loadEntities(pagination.currentPage, pagination.itemsPerPage)
  };
}