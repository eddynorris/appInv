// hooks/useApiResource.tsx
import { useState, useEffect, useCallback } from 'react';

interface PaginationParams {
  page: number;
  perPage: number;
}

interface ApiResourceOptions<T> {
  initialParams?: PaginationParams;
  fetchFn: (page?: number, perPage?: number) => Promise<{
    data: T[];
    pagination: {
      page: number;
      pages: number;
      per_page: number;
      total: number;
    }
  }>;
  createFn?: (data: Partial<T>) => Promise<T>;
  updateFn?: (id: number, data: Partial<T>) => Promise<T>;
  deleteFn?: (id: number) => Promise<any>;
  getFn?: (id: number) => Promise<T>;
}

export function useApiResource<T extends { id: number }>({
  initialParams = { page: 1, perPage: 10 },
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  getFn
}: ApiResourceOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: initialParams.page,
    totalPages: 1,
    itemsPerPage: initialParams.perPage,
    totalItems: 0
  });
  
  // Fetch data
  const fetchData = useCallback(async (page = pagination.currentPage, perPage = pagination.itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchFn(page, perPage);
      
      if (response && response.data) {
        setData(response.data);
        setPagination({
          currentPage: response.pagination.page,
          totalPages: response.pagination.pages,
          itemsPerPage: response.pagination.per_page,
          totalItems: response.pagination.total
        });
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, pagination.currentPage, pagination.itemsPerPage]);
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    fetchData(page, pagination.itemsPerPage);
  }, [fetchData, pagination.itemsPerPage]);
  
  // Handle items per page change
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    fetchData(1, perPage);
  }, [fetchData]);
  
  // Create item
  const createItem = useCallback(async (itemData: Partial<T>) => {
    if (!createFn) {
      throw new Error('Create function not provided');
    }
    
    try {
      setIsLoading(true);
      const result = await createFn(itemData);
      
      // Refresh data
      await fetchData();
      
      return result;
    } catch (err) {
      console.error('Error creating item:', err);
      setError(err instanceof Error ? err.message : 'Error creating item');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [createFn, fetchData]);
  
  // Update item
  const updateItem = useCallback(async (id: number, itemData: Partial<T>) => {
    if (!updateFn) {
      throw new Error('Update function not provided');
    }
    
    try {
      setIsLoading(true);
      const result = await updateFn(id, itemData);
      
      // Refresh data
      await fetchData();
      
      return result;
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err instanceof Error ? err.message : 'Error updating item');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateFn, fetchData]);
  
  // Delete item
  const deleteItem = useCallback(async (id: number) => {
    if (!deleteFn) {
      throw new Error('Delete function not provided');
    }
    
    try {
      setIsLoading(true);
      await deleteFn(id);
      
      // If this is the last item on the page and not the first page, go to previous page
      if (data.length === 1 && pagination.currentPage > 1) {
        fetchData(pagination.currentPage - 1, pagination.itemsPerPage);
      } else {
        // Otherwise refresh current page
        fetchData();
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err instanceof Error ? err.message : 'Error deleting item');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [deleteFn, fetchData, data.length, pagination]);
  
  // Get single item
  const getItem = useCallback(async (id: number) => {
    if (!getFn) {
      throw new Error('Get function not provided');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      return await getFn(id);
    } catch (err) {
      console.error('Error getting item:', err);
      setError(err instanceof Error ? err.message : 'Error getting item');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getFn]);
  
  return {
    data,
    isLoading,
    error,
    pagination,
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    createItem,
    updateItem,
    deleteItem,
    getItem,
    setError
  };
}