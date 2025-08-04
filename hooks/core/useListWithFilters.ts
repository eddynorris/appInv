import { useState, useCallback, useEffect } from 'react';

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export interface SortingState {
  sortColumn: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
}

interface ApiResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    total: number;
  };
}

interface UseListWithFiltersOptions<T, F extends Record<string, any>> {
  fetchFn: (page: number, perPage: number, filters: F, sort?: { column: string; order: 'asc' | 'desc' }) => Promise<ApiResponse<T>>;
  defaultFilters: F;
  defaultSort?: { column: string; order: 'asc' | 'desc' };
  initialItemsPerPage?: number;
}

export function useListWithFilters<T, F extends Record<string, any>>(
  options: UseListWithFiltersOptions<T, F>
) {
  const { fetchFn, defaultFilters, defaultSort, initialItemsPerPage = 10 } = options;

  // State
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<F>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<F>(defaultFilters);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [totalItems, setTotalItems] = useState(0);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState(defaultSort?.column || 'id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSort?.order || 'asc');

  // Fetch data function
  const loadData = useCallback(async (
    page = currentPage,
    perPage = itemsPerPage,
    filtersToApply = appliedFilters,
    sort = { column: sortColumn, order: sortOrder }
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchFn(page, perPage, filtersToApply, sort);
      
      if (response && response.data) {
        setData(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
        setItemsPerPage(response.pagination.per_page);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading data';
      setError(message);
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, appliedFilters, sortColumn, sortOrder, fetchFn]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter management
  const handleFilterChange = useCallback((field: keyof F, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setCurrentPage(1); // Reset to first page
    loadData(1, itemsPerPage, filters);
  }, [filters, itemsPerPage, loadData]);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
    loadData(1, itemsPerPage, defaultFilters);
  }, [defaultFilters, itemsPerPage, loadData]);

  // Pagination management
  const handlePageChange = useCallback((page: number) => {
    loadData(page, itemsPerPage);
  }, [loadData, itemsPerPage]);

  const handleItemsPerPageChange = useCallback((perPage: number) => {
    loadData(1, perPage); // Reset to first page
  }, [loadData]);

  // Sorting management
  const handleSort = useCallback((column: string) => {
    const newOrder = column === sortColumn 
      ? (sortOrder === 'asc' ? 'desc' : 'asc')
      : 'asc';
    
    setSortColumn(column);
    setSortOrder(newOrder);
    
    loadData(currentPage, itemsPerPage, appliedFilters, { column, order: newOrder });
  }, [sortColumn, sortOrder, currentPage, itemsPerPage, appliedFilters, loadData]);

  // Refresh function
  const refresh = useCallback(() => {
    loadData(1, itemsPerPage, appliedFilters);
  }, [loadData, itemsPerPage, appliedFilters]);

  // Pagination object for components
  const pagination: PaginationState = {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange: handlePageChange,
    onItemsPerPageChange: handleItemsPerPageChange,
  };

  // Sorting object for components
  const sorting: SortingState = {
    sortColumn,
    sortOrder,
    onSort: handleSort,
  };

  return {
    // Data
    data,
    isLoading,
    error,
    
    // Filters
    filters,
    appliedFilters,
    handleFilterChange,
    applyFilters,
    clearFilters,
    
    // Pagination
    pagination,
    
    // Sorting  
    sorting,
    
    // Actions
    refresh,
    loadData,
  };
}