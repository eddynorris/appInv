import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useApiResource } from '../useApiResource';
import { presentacionApi, API_CONFIG } from '@/services/api';
import { Presentacion } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Parámetros iniciales por defecto para la paginación y ordenación
const DEFAULT_PARAMS = { page: 1, perPage: 10, sort: 'nombre', order: 'asc', search: '' };

export function usePresentacionesList() {
  // Usar una referencia para controlar la carga inicial y evitar múltiples llamadas
  const isInitialLoadDone = useRef(false);
  
  // Estados para ordenamiento y búsqueda
  const [sortColumn, setSortColumn] = useState(DEFAULT_PARAMS.sort);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(DEFAULT_PARAMS.order as 'asc' | 'desc');
  const [searchTerm, setSearchTerm] = useState(DEFAULT_PARAMS.search);

  // fetchFn que incluye sort/order/search
  const fetchPresentacionesWithFilters = useCallback(async (page = DEFAULT_PARAMS.page, perPage = DEFAULT_PARAMS.perPage) => {
    const filters: Record<string, any> = {
      sort_by: sortColumn,
      sort_order: sortOrder,
      search: searchTerm,
    };
    console.log(`Consultando presentaciones con filtros: ${JSON.stringify(filters)}, página: ${page}, por página: ${perPage}`);
    return await presentacionApi.getPresentaciones(page, perPage);
  }, [sortColumn, sortOrder, searchTerm]);

  // Usar useApiResource con nuestra función personalizada
  const {
    data: presentaciones,
    isLoading,
    error,
    pagination,
    fetchData: originalFetchData,
    handlePageChange: originalHandlePageChange,
    handleItemsPerPageChange: originalHandleItemsPerPageChange,
    deleteItem: deletePresentacionDirectly,
  } = useApiResource<Presentacion>({
    initialParams: { page: DEFAULT_PARAMS.page, perPage: DEFAULT_PARAMS.perPage },
    fetchFn: fetchPresentacionesWithFilters,
    deleteFn: presentacionApi.deletePresentacion,
  });

  // Cargar datos iniciales explícitamente al montar
  useEffect(() => {
    if (!isInitialLoadDone.current) {
      console.log("usePresentacionesList: Carga inicial de datos...");
      isInitialLoadDone.current = true;
      originalFetchData(DEFAULT_PARAMS.page, DEFAULT_PARAMS.perPage);
    }
  }, []); // Solo ejecutar al montar

  // Wrappers para manejo de paginación, ordenamiento y búsqueda
  const handlePageChange = useCallback((page: number) => {
    originalHandlePageChange(page);
  }, [originalHandlePageChange]);

  const handleItemsPerPageChange = useCallback((perPage: number) => {
    originalHandleItemsPerPageChange(perPage);
  }, [originalHandleItemsPerPageChange]);

  const handleSort = useCallback((columnId: string) => {
    const newSortOrder = (columnId === sortColumn && sortOrder === 'asc') ? 'desc' : 'asc';
    setSortColumn(columnId);
    setSortOrder(newSortOrder);
    // Refrescar desde la página 1 con el nuevo ordenamiento
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [sortColumn, sortOrder, originalFetchData, pagination.itemsPerPage]);

  const handleSearch = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    // Refrescar desde la página 1 con el nuevo término de búsqueda
    originalFetchData(1, pagination.itemsPerPage ?? DEFAULT_PARAMS.perPage);
  }, [originalFetchData, pagination.itemsPerPage]);

  // Función para obtener el color según el tipo
  const getTipoColor = useCallback((tipo: string) => {
    switch (tipo) {
      case 'bruto': return '#A1887F'; // Marrón
      case 'procesado': return '#4CAF50'; // Verde
      case 'merma': return '#F44336'; // Rojo
      case 'briqueta': return '#FF9800'; // Naranja
      case 'detalle': return '#2196F3'; // Azul
      default: return '#757575'; // Gris
    }
  }, []);

  // Definir columnas para la tabla
  const columns = useMemo(() => [
    {
      id: 'imagen',
      label: '', // Sin etiqueta
      width: 1.5,
      sortable: false,
      render: (item: Presentacion) => {
        const imageUrl = item.url_foto ? API_CONFIG.getImageUrl(item.url_foto) : null;
        return (
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
            ) : (
              <IconSymbol name="cube.box" size={24} color="#ccc" /> // Placeholder icon
            )}
          </View>
        );
      },
    },
    {
      id: 'nombre',
      label: 'Nombre',
      width: 2.5,
      sortable: true,
    },
    {
      id: 'producto',
      label: 'Producto Base',
      width: 2,
      sortable: true,
      render: (item: Presentacion) => <ThemedText>{item.producto?.nombre || 'N/A'}</ThemedText>,
    },
    {
      id: 'capacidad_kg',
      label: 'KG',
      width: 1,
      sortable: true,
      render: (item: Presentacion) => <ThemedText>{parseFloat(item.capacidad_kg).toFixed(2)}</ThemedText>,
    },
    {
      id: 'precio_venta',
      label: 'Precio',
      width: 1.5,
      sortable: true,
      render: (item: Presentacion) => <ThemedText>${parseFloat(item.precio_venta).toFixed(2)}</ThemedText>,
    },
  ], [getTipoColor]);

  // Función para refrescar la lista
  const refresh = useCallback(() => {
    console.log("usePresentacionesList: Refrescando datos...");
    originalFetchData(pagination.currentPage, pagination.itemsPerPage);
  }, [originalFetchData, pagination.currentPage, pagination.itemsPerPage]);

  // Función wrapper para eliminar una presentación
  const deletePresentacion = useCallback(async (id: number): Promise<boolean> => {
    // Aquí podrías añadir lógica de confirmación si es necesario, aunque EnhancedDataTable ya la tiene
    try {
      const success = await deletePresentacionDirectly(id);
      return success;
    } catch (error: any) {
      console.error("Error al eliminar presentación:", error.message);
      // Considerar mostrar un Alert aquí si EnhancedDataTable no lo maneja
      return false;
    }
  }, [deletePresentacionDirectly]);

  return {
    // Datos y estado de la lista
    presentaciones,
    isLoading,
    error,
    columns,

    // Paginación, ordenamiento y búsqueda
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      itemsPerPage: pagination.itemsPerPage,
      totalItems: pagination.totalItems,
      sortColumn: sortColumn,
      sortOrder: sortOrder,
      searchTerm: searchTerm,
      onPageChange: handlePageChange,
      onItemsPerPageChange: handleItemsPerPageChange,
      onSort: handleSort,
      onSearch: handleSearch,
    },

    // Funciones
    refresh,
    deletePresentacion,
  };
}

const styles = StyleSheet.create({
  imageContainer: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
}); 