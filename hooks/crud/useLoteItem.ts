// hooks/crud/useLoteItem.ts
import { useState, useCallback } from 'react';
import { loteApi } from '@/services/api';
import { Lote, ProductoSimple, ProveedorSimple } from '@/models';
import { useForm } from '../useForm';
import { useAuth } from '@/context/AuthContext';

// Valores iniciales para el formulario
const initialFormValues = {
  producto_id: '',
  proveedor_id: '',
  descripcion: '',
  peso_humedo_kg: '',
  peso_seco_kg: '',
  cantidad_disponible_kg: '',
  fecha_ingreso: new Date().toISOString().split('T')[0],
};

// Reglas de validación para el formulario
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
    return null;
  },
  cantidad_disponible_kg: (value: string) => {
    if (!value.trim()) return null; // No es requerido
    if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) return 'Ingrese un peso válido';
    return null;
  }
};

export function useLoteItem() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<ProductoSimple[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorSimple[]>([]);
  const { user } = useAuth();
  
  // Inicializar el formulario
  const form = useForm<typeof initialFormValues>(initialFormValues);

  // Función para cargar productos y proveedores - debe ser llamada explícitamente
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
      return true;
    } catch (err) {
      console.error('Error al cargar opciones:', err);
      setError('No se pudieron cargar los datos necesarios');
      return false;
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  // Obtener un lote específico
  const getLote = useCallback(async (id: number): Promise<Lote | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await loteApi.getLote(id);
    } catch (err) {
      console.error('Error getting lote item:', err);
      const message = err instanceof Error ? err.message : 'Error al obtener el lote';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar un lote para edición
  const loadLoteForEdit = useCallback(async (id: number): Promise<Lote | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Asegurar que las opciones estén cargadas
      await loadOptions();
      
      const loteData = await getLote(id);
      
      if (loteData) {
        // Actualizar el formulario con los datos del lote
        form.setValues({
          producto_id: loteData.producto_id.toString(),
          proveedor_id: loteData.proveedor_id ? loteData.proveedor_id.toString() : '',
          descripcion: loteData.descripcion || '',
          peso_humedo_kg: loteData.peso_humedo_kg.toString(),
          peso_seco_kg: loteData.peso_seco_kg ? loteData.peso_seco_kg.toString() : '',
          cantidad_disponible_kg: loteData.cantidad_disponible_kg ? loteData.cantidad_disponible_kg.toString() : '',
          fecha_ingreso: loteData.fecha_ingreso.split('T')[0],
        });
        
        return loteData;
      }
      throw new Error('No se pudo cargar la información del lote');
    } catch (err) {
      console.error('Error al cargar lote para edición:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar los datos del lote';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [form, loadOptions, getLote]);

  // Preparar formulario para creación
  const prepareForCreate = useCallback(async () => {
      await loadOptions();
      form.resetForm();

  }, [loadOptions, form]);

  // Crear nuevo lote
  const createLote = useCallback(async (data: typeof initialFormValues): Promise<Lote | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const loteData = {
        producto_id: parseInt(data.producto_id),
        proveedor_id: data.proveedor_id ? parseInt(data.proveedor_id) : undefined,
        descripcion: data.descripcion,
        peso_humedo_kg: parseFloat(data.peso_humedo_kg.replace(',', '.')),
        peso_seco_kg: data.peso_seco_kg.trim() 
          ? parseFloat(data.peso_seco_kg.replace(',', '.')) 
          : undefined,
        cantidad_disponible_kg: data.cantidad_disponible_kg.trim() 
          ? parseFloat(data.cantidad_disponible_kg.replace(',', '.')) 
          : undefined,
        fecha_ingreso: `${data.fecha_ingreso}T00:00:00Z`,
        almacen_id: user?.almacen_id, // Usar el almacén del usuario si existe
      };
      
      return await loteApi.createLote(loteData as any);
    } catch (err) {
      console.error('Error creating lote item:', err);
      const message = err instanceof Error ? err.message : 'Error al crear el lote';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.almacen_id]);

  // Actualizar lote existente
  const updateLote = useCallback(async (id: number, data: typeof initialFormValues): Promise<Lote | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const loteData = {
        producto_id: parseInt(data.producto_id),
        proveedor_id: data.proveedor_id ? parseInt(data.proveedor_id) : undefined,
        descripcion: data.descripcion,
        peso_humedo_kg: parseFloat(data.peso_humedo_kg.replace(',', '.')),
        peso_seco_kg: data.peso_seco_kg.trim() 
          ? parseFloat(data.peso_seco_kg.replace(',', '.')) 
          : undefined,
        cantidad_disponible_kg: data.cantidad_disponible_kg.trim() 
          ? parseFloat(data.cantidad_disponible_kg.replace(',', '.')) 
          : undefined,
        fecha_ingreso: `${data.fecha_ingreso}T00:00:00Z`,
      };
      
      return await loteApi.updateLote(id, loteData as any);
    } catch (err) {
      console.error('Error updating lote item:', err);
      const message = err instanceof Error ? err.message : 'Error al actualizar el lote';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Eliminar lote
  const deleteLote = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await loteApi.deleteLote(id);
      return true;
    } catch (err) {
      console.error('Error deleting lote item:', err);
      const message = err instanceof Error ? err.message : 'Error al eliminar el lote';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calcular rendimiento
  const calcularRendimiento = useCallback((pesoHumedo: number, pesoSeco: number | null): string => {
    if (!pesoSeco || pesoSeco <= 0 || pesoHumedo <= 0) return '-';
    
    const rendimiento = (pesoSeco / pesoHumedo) * 100;
    return `${rendimiento.toFixed(2)}%`;
  }, []);

  return {
    // Estado de la operación actual
    isLoading,
    isLoadingOptions,
    error,
    
    // Datos para formularios/dropdowns
    productos,
    proveedores,
    form,
    validationRules,
    
    // Funciones CRUD
    getLote,
    loadLoteForEdit,
    prepareForCreate,
    createLote,
    updateLote,
    deleteLote,
    loadOptions,
    
    // Funciones de utilidad
    calcularRendimiento,
    setError
  };
}