import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { useForm } from '../useForm';
import { useAuth } from '@/context/AuthContext';
import { Lote, ProductoSimple, ProveedorSimple } from '@/models';
import { loteApi } from '@/services/api';

// Tipo para alertas
interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

// Tipo para la respuesta de la API
interface ApiLoteResponse {
  data: Lote[];
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

// Tipos para manejar la paginación
interface PaginationState {
  page: number;
  perPage: number;
  lastPage: number;
  total: number;
}

// Tipo para columnas de ordenamiento
interface Column {
  key: string;
  label: string;
  sortable: boolean;
}

// Tipo para datos de lote para enviar a la API
interface LoteSubmitData {
  producto_id: number;
  proveedor_id?: number;
  descripcion: string;
  peso_humedo_kg: number;
  peso_seco_kg?: number;
  fecha_ingreso: string;
  almacen_id?: number;
}

// Estado inicial para el formulario de lotes
const initialFormData = {
  producto_id: '',
  proveedor_id: '',
  descripcion: '',
  peso_humedo_kg: '',
  peso_seco_kg: '',
  fecha_ingreso: new Date().toISOString().split('T')[0],
};

// Hook principal
export const useLotes = () => {
  const showAlert = (options: { title: string; message: string; type?: string }) => {
    Alert.alert(options.title, options.message);
  };
  
  const { user } = useAuth();
  
  // Estados principales
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [lote, setLote] = useState<Lote | null>(null);
  const [productos, setProductos] = useState<ProductoSimple[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorSimple[]>([]);
  
  // Estado para paginación
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    perPage: 10,
    lastPage: 1,
    total: 0,
  });
  
  // Estado para ordenamiento
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Usar el hook de formulario para manejar el estado
  const form = useForm(initialFormData);
  
  // Reglas de validación
  const validationRules = {
    producto_id: (value: string) => !value ? 'El producto es requerido' : null,
    peso_humedo_kg: (value: string) => {
      if (!value.trim()) return 'El peso húmedo es requerido';
      if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) return 'Ingrese un peso válido';
      return null;
    },
    peso_seco_kg: (value: string) => {
      if (!value.trim()) return null; // No es requerido
      if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) return 'Ingrese un peso válido';
      if (form.formData.peso_humedo_kg && parseFloat(value) > parseFloat(form.formData.peso_humedo_kg)) {
        return 'El peso seco no puede ser mayor que el peso húmedo';
      }
      return null;
    }
  };
  
  // Columnas para la tabla
  const columns: Column[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'producto.nombre', label: 'Producto', sortable: true },
    { key: 'peso_humedo_kg', label: 'Peso Húmedo (kg)', sortable: true },
    { key: 'peso_seco_kg', label: 'Peso Seco (kg)', sortable: true },
    { key: 'rendimiento', label: 'Rendimiento', sortable: true },
    { key: 'fecha_ingreso', label: 'Fecha de Ingreso', sortable: true },
    { key: 'acciones', label: 'Acciones', sortable: false },
  ];
  
  // Cargar productos y proveedores (opciones para selectores)
  const loadOptions = useCallback(async () => {
    try {
      setIsLoadingOptions(true);
      setError(null);
      
      // Cargar datos relacionados en paralelo
      const [productosData, proveedoresData] = await Promise.all([
        loteApi.getProductos(),
        loteApi.getProveedores(),
      ]);
      
      setProductos(productosData || []);
      setProveedores(proveedoresData || []);
    } catch (err) {
      console.error('Error al cargar opciones:', err);
      setError('No se pudieron cargar los datos necesarios');
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);
  
  // Efecto para cargar opciones al montar el componente
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);
  
  // Cargar listado de lotes
  const loadLotes = useCallback(async (page = 1, perPage = 10) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Usamos una llamada ajustada al API existente
      const response = await loteApi.getLotes(page, perPage);
      
      if (response) {
        const apiResponse = response as unknown as ApiLoteResponse;
        setLotes(apiResponse.data || []);
        setPagination({
          page: apiResponse.current_page || 1,
          perPage: apiResponse.per_page || 10,
          lastPage: apiResponse.last_page || 1,
          total: apiResponse.total || 0,
        });
      } else {
        setError('No se pudieron cargar los lotes');
      }
    } catch (err) {
      console.error('Error al cargar lotes:', err);
      setError('Error al cargar lotes');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Manejar cambio de página
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    loadLotes(newPage, pagination.perPage);
  }, [loadLotes, pagination.perPage]);
  
  // Manejar cambio de elementos por página
  const handlePerPageChange = useCallback((newPerPage: number) => {
    setPagination(prev => ({ ...prev, perPage: newPerPage, page: 1 }));
    loadLotes(1, newPerPage);
  }, [loadLotes]);
  
  // Manejar ordenamiento
  const handleSort = useCallback((key: string) => {
    if (key === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  }, [sortBy]);
  
  // Cargar detalle de un lote
  const loadLote = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await loteApi.getLote(id);
      
      if (response) {
        setLote(response);
      } else {
        setError('No se pudo cargar el lote');
      }
    } catch (err) {
      console.error(`Error al cargar lote ID ${id}:`, err);
      setError('Error al cargar detalles del lote');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Cargar lote para edición
  const loadLoteForEdit = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Asegurar que las opciones estén cargadas
      await loadOptions();
      
      const loteData = await loteApi.getLote(id);
      
      if (loteData) {
        form.setFormData({
          producto_id: loteData.producto_id.toString(),
          proveedor_id: loteData.proveedor_id ? loteData.proveedor_id.toString() : '',
          descripcion: loteData.descripcion ? loteData.descripcion.toString() : '',
          peso_humedo_kg: loteData.peso_humedo_kg.toString(),
          peso_seco_kg: loteData.peso_seco_kg ? loteData.peso_seco_kg.toString() : '',
          fecha_ingreso: loteData.fecha_ingreso.split('T')[0],
        });
        
        setLote(loteData);
      } else {
        setError('No se pudo cargar los datos del lote');
      }
    } catch (err) {
      console.error('Error al cargar lote para edición:', err);
      setError('No se pudo cargar los datos necesarios');
    } finally {
      setIsLoading(false);
    }
  }, [form, loadOptions]);
  
  // Crear nuevo lote
  const createLote = useCallback(async () => {
    const { formData } = form;
    
    try {
      const loteData: LoteSubmitData = {
        producto_id: parseInt(formData.producto_id),
        proveedor_id: formData.proveedor_id ? parseInt(formData.proveedor_id) : undefined,
        peso_humedo_kg: parseFloat(formData.peso_humedo_kg.replace(',', '.')),
        descripcion: formData.descripcion,
        peso_seco_kg: formData.peso_seco_kg.trim() 
          ? parseFloat(formData.peso_seco_kg.replace(',', '.')) 
          : undefined,
        fecha_ingreso: `${formData.fecha_ingreso}T00:00:00Z`,
        almacen_id: user?.almacen_id,
      };
      
      const response = await loteApi.createLote(loteData);
      
      if (response) {
        showAlert({
          title: 'Lote Registrado',
          message: 'El lote ha sido registrado exitosamente',
          type: 'success',
        });
        router.back();
        return true;
      } else {
        showAlert({
          title: 'Error',
          message: 'No se pudo registrar el lote',
          type: 'error',
        });
        return false;
      }
    } catch (err) {
      console.error('Error al crear lote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al registrar el lote';
      showAlert({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
      return false;
    }
  }, [form, user?.almacen_id]);
  
  // Actualizar lote existente
  const updateLote = useCallback(async (id: number) => {
    const { formData } = form;
    
    try {
      const loteData: LoteSubmitData = {
        producto_id: parseInt(formData.producto_id),
        proveedor_id: formData.proveedor_id ? parseInt(formData.proveedor_id) : undefined,
        peso_humedo_kg: parseFloat(formData.peso_humedo_kg.replace(',', '.')),
        descripcion: formData.descripcion,
        peso_seco_kg: formData.peso_seco_kg.trim() 
          ? parseFloat(formData.peso_seco_kg.replace(',', '.')) 
          : undefined,
        fecha_ingreso: `${formData.fecha_ingreso}T00:00:00Z`,
      };
      
      const response = await loteApi.updateLote(id, loteData as any);
      
      if (response) {
        showAlert({
          title: 'Lote Actualizado',
          message: 'El lote ha sido actualizado exitosamente',
          type: 'success',
        });
        router.back();
        return true;
      } else {
        showAlert({
          title: 'Error',
          message: 'No se pudo actualizar el lote',
          type: 'error',
        });
        return false;
      }
    } catch (err) {
      console.error('Error al actualizar lote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar el lote';
      showAlert({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
      return false;
    }
  }, [form]);
  
  // Eliminar lote
  const deleteLote = useCallback(async (id: number, shouldRedirect = false) => {
    try {
      const success = await loteApi.deleteLote(id);
      
      if (success) {
        showAlert({
          title: 'Lote Eliminado',
          message: 'El lote ha sido eliminado exitosamente',
          type: 'success',
        });
        
        // Solo redirigir si se especifica explícitamente
        if (shouldRedirect) {
          router.back();
        }
        
        return true;
      } else {
        showAlert({
          title: 'Error',
          message: 'No se pudo eliminar el lote',
          type: 'error',
        });
        return false;
      }
    } catch (err) {
      console.error('Error al eliminar lote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al eliminar el lote';
      showAlert({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
      return false;
    }
  }, []);
  
  // Confirmar eliminación
  const confirmDelete = useCallback((id: number, shouldRedirect = false) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Está seguro que desea eliminar este lote? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteLote(id, shouldRedirect) },
      ]
    );
  }, [deleteLote]);
  
  // Calcular rendimiento de un lote
  const calcularRendimiento = useCallback((pesoHumedo: number, pesoSeco: number | null): string => {
    if (!pesoSeco || pesoSeco <= 0 || pesoHumedo <= 0) return '-';
    
    const rendimiento = (pesoSeco / pesoHumedo) * 100;
    return `${rendimiento.toFixed(2)}%`;
  }, []);
  
  return {
    // Estado
    lotes,
    lote,
    isLoading,
    isLoadingOptions,
    error,
    pagination,
    columns,
    productos,
    proveedores,
    sortBy,
    sortOrder,
    form,
    validationRules,
    
    // Funciones
    loadLotes,
    loadLote,
    loadLoteForEdit,
    handlePageChange,
    handlePerPageChange,
    handleSort,
    createLote,
    updateLote,
    deleteLote,
    confirmDelete,
    calcularRendimiento,
  };
}; 