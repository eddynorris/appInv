// hooks/crud/useGastoItem.ts
import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { gastoApi, almacenApi } from '@/services/api';
import { Gasto, AlmacenSimple } from '@/models';
import { useForm } from '@/hooks/useForm';
import { useAuth } from '@/context/AuthContext';

// Categorías de gastos predefinidas
export const CATEGORIAS_GASTO: Array<'logistica' | 'personal' | 'otros'> = [
  'logistica',
  'personal',
  'otros'
];

// Valores iniciales del formulario
const initialFormValues = {
  descripcion: '',
  monto: '',
  categoria: 'logistica' as 'logistica' | 'personal' | 'otros',
  fecha: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
  almacen_id: undefined as number | undefined,
};

// Reglas de validación para el formulario
const validationRules = {
  descripcion: (value: string) => !value.trim() ? 'La descripción es requerida' : null,
  monto: (value: string) => {
    if (!value.trim()) return 'El monto es requerido';
    if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) return 'Ingrese un monto válido';
    return null;
  }
};

export function useGastoItem() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [almacenes, setAlmacenes] = useState<AlmacenSimple[]>([]);
  const { user } = useAuth();
  
  // Crear un formulario utilizando el hook useForm
  const form = useForm<typeof initialFormValues>(initialFormValues);

  // Obtener un gasto específico
  const getGasto = useCallback(async (id: number): Promise<Gasto | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await gastoApi.getGasto(id);
      return data;
    } catch (err) {
      console.error('Error getting gasto item:', err);
      const message = err instanceof Error ? err.message : 'Error al obtener el gasto';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para cargar almacenes - No se ejecuta automáticamente sino solo cuando se llama
  const loadAlmacenes = useCallback(async () => {
    if (user?.rol === 'admin' && almacenes.length === 0) {
      try {
        setIsLoading(true);
        const response = await almacenApi.getAlmacenes(1, 100);
        setAlmacenes(response.data);
      } catch (err) {
        console.error('Error fetching almacenes:', err);
        setError('No se pudieron cargar los almacenes');
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, almacenes.length]);

  // Cargar un gasto para edición
  const loadGastoForEdit = useCallback(async (id: number): Promise<Gasto | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Si es admin, cargar almacenes para el selector
      if (user?.rol === 'admin') {
        await loadAlmacenes();
      }
      const gasto = await getGasto(id);
      
      if (gasto) {
        // Actualizar el formulario con los datos recibidos
        form.setValues({
          descripcion: gasto.descripcion || '',
          monto: gasto.monto ? gasto.monto.toString() : '',
          categoria: gasto.categoria || CATEGORIAS_GASTO[0],
          fecha: gasto.fecha ? gasto.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
          almacen_id: gasto.almacen_id,
        });
        return gasto;
      } else {
        setError('No se pudo cargar la información del gasto');
        return null;
      }
    } catch (error) {
      console.error('Error al cargar gasto para edición:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar el gasto';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [form, getGasto, loadAlmacenes]);

   // Preparar formulario para creación de gasto
   const prepareForCreate = useCallback(async () => {
    // Si es admin, cargar almacenes para el selector
    if (user?.rol === 'admin') {
      await loadAlmacenes();
    }
    
    // Resetear el formulario
    form.resetForm();
  }, [loadAlmacenes, form, user]);

  // Crear un nuevo gasto
  const createGasto = useCallback(async (data: typeof initialFormValues): Promise<Gasto | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Validar que tenemos usuario autenticado
      if (!user?.id) {
        setError('No se pudo identificar el usuario actual');
        return null;
      }

      // Preparar datos del gasto
      const gastoData: Partial<Gasto> = {
        descripcion: data.descripcion,
        monto: data.monto.replace(',', '.'), // Asegurar formato decimal correcto
        categoria: data.categoria,
        fecha: data.fecha,
        usuario_id: user.id, // ID del usuario logueado
      };
      
      // Si es admin y seleccionó un almacén, usar ese
      if (user.rol === 'admin' && data.almacen_id) {
        gastoData.almacen_id = data.almacen_id;
      } 
      // Si no es admin o no seleccionó almacén, usar el del usuario
      else if (user.almacen_id) {
        gastoData.almacen_id = user.almacen_id;
      }
      
      return await gastoApi.createGasto(gastoData);
    } catch (err) {
      console.error('Error creating gasto item:', err);
      const message = err instanceof Error ? err.message : 'Error al crear el gasto';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Actualizar un gasto específico
  const updateGasto = useCallback(async (id: number, data: typeof initialFormValues): Promise<Gasto | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Preparar datos del gasto
      const gastoData: Partial<Gasto> = {
        descripcion: data.descripcion,
        monto: data.monto.replace(',', '.'), // Asegurar formato decimal correcto
        categoria: data.categoria,
        fecha: data.fecha
      };
      
      // Si es admin y se proporcionó un almacen_id, incluirlo en la actualización
      if (user?.rol === 'admin' && data.almacen_id !== undefined) {
        gastoData.almacen_id = data.almacen_id;
      }
      
      return await gastoApi.updateGasto(id, gastoData);
    } catch (err) {
      console.error('Error updating gasto item:', err);
      const message = err instanceof Error ? err.message : 'Error al actualizar el gasto';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Eliminar un gasto específico
  const deleteGasto = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await gastoApi.deleteGasto(id);
      return true;
    } catch (err) {
      console.error('Error deleting gasto item:', err);
      const message = err instanceof Error ? err.message : 'Error al eliminar el gasto';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manejar selección de fecha
  const handleDateSelection = useCallback((selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      form.handleChange('fecha', formattedDate);
    }
  }, [form]);

  // Obtener color para la categoría
  const getCategoryColor = useCallback((category: string) => {
    switch (category.toLowerCase()) {
      case 'servicios': return '#2196F3'; // Azul
      case 'personal': return '#4CAF50'; // Verde
      case 'alquiler': return '#FFC107'; // Amarillo
      case 'marketing': return '#9C27B0'; // Púrpura
      case 'logistica': return '#FF5722'; // Naranja
      default: return '#757575'; // Gris
    }
  }, []);

  return {
    // Estado de la operación
    isLoading,
    error,
    setError,
    
    // Formulario y validación
    form,
    validationRules,
    
    // Estado del date picker
    showDatePicker,
    setShowDatePicker,
    
    // Datos para selects
    categorias: CATEGORIAS_GASTO,
    almacenes,
    
    // Información de usuario
    isAdmin: user?.rol === 'admin',
    
    // Funciones específicas
    getGasto,
    loadGastoForEdit,
    prepareForCreate, // Nueva función para preparar creación
    createGasto,
    updateGasto,
    deleteGasto,
    handleDateSelection,
    getCategoryColor
  };
}