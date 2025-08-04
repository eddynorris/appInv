// hooks/crud/useGastoItem.ts - Specialized hook for gastos with form handling
import { useState, useCallback, useEffect } from 'react';
import { gastoService, almacenService } from '@/services';
import { Gasto, AlmacenSimple } from '@/models';
import { useForm } from '@/hooks/useForm';
import { useAuth } from '@/context/AuthContext';
import { useErrorHandler } from '@/hooks/core/useErrorHandler';
import { router } from 'expo-router';

// Categorías de gastos predefinidas - exported for use in components
export const CATEGORIAS_GASTO: Array<'logistica' | 'personal' | 'otros'> = [
  'logistica',
  'personal', 
  'otros'
];

interface GastoFormData {
  descripcion: string;
  monto: string;
  categoria: 'logistica' | 'personal' | 'otros';
  fecha: string;
  almacen_id?: number;
}

const initialFormData: GastoFormData = {
  descripcion: '',
  monto: '',
  categoria: 'otros',
  fecha: new Date().toISOString().split('T')[0],
  almacen_id: undefined
};

const validationRules = {
  descripcion: { required: true, minLength: 3 },
  monto: { required: true, pattern: /^\d+(\.\d{1,2})?$/ },
  categoria: { required: true },
  fecha: { required: true }
};

export function useGastoItem() {
  const { user } = useAuth();
  const { error, handleError, clearError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [almacenes, setAlmacenes] = useState<AlmacenSimple[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const form = useForm<GastoFormData>({
    initialData: initialFormData,
    validationRules
  });

  const isAdmin = user?.rol === 'admin';

  // Load almacenes for admin users
  const loadAlmacenes = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      setIsLoading(true);
      const response = await almacenService.getAlmacenes(1, 100);
      setAlmacenes(response.data);
    } catch (err) {
      handleError(err, 'Error al cargar almacenes');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, handleError]);

  // Prepare for creating a new gasto
  const prepareForCreate = useCallback(async () => {
    clearError();
    form.resetForm();
    
    // Set user's warehouse if not admin
    if (!isAdmin && user?.almacen_id) {
      form.handleChange('almacen_id', user.almacen_id);
    }
    
    await loadAlmacenes();
  }, [clearError, form, isAdmin, user?.almacen_id, loadAlmacenes]);

  // Load gasto for editing
  const loadGastoForEdit = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      clearError();
      
      const gasto = await gastoService.getGasto(id);
      
      // Fill form with gasto data
      form.handleChange('descripcion', gasto.descripcion || '');
      form.handleChange('monto', gasto.monto?.toString() || '');
      form.handleChange('categoria', gasto.categoria || 'otros');
      form.handleChange('fecha', gasto.fecha?.split('T')[0] || new Date().toISOString().split('T')[0]);
      
      if (gasto.almacen_id) {
        form.handleChange('almacen_id', gasto.almacen_id);
      }
      
      await loadAlmacenes();
      
      return gasto;
    } catch (err) {
      handleError(err, 'Error al cargar gasto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, form, handleError, loadAlmacenes]);

  // Get single gasto (for permissions check)
  const getGasto = useCallback(async (id: number) => {
    try {
      return await gastoService.getGasto(id);
    } catch (err) {
      handleError(err, 'Error al obtener gasto');
      return null;
    }
  }, [handleError]);

  // Create gasto
  const createGasto = useCallback(async (formData: GastoFormData) => {
    try {
      setIsLoading(true);
      clearError();
      
      const gastoData = {
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        categoria: formData.categoria,
        fecha: `${formData.fecha}T00:00:00Z`,
        ...(formData.almacen_id && { almacen_id: formData.almacen_id })
      };
      
      const newGasto = await gastoService.createGasto(gastoData);
      return newGasto;
    } catch (err) {
      handleError(err, 'Error al crear gasto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError]);

  // Update gasto
  const updateGasto = useCallback(async (id: number, formData: GastoFormData) => {
    try {
      setIsLoading(true);
      clearError();
      
      const gastoData = {
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        categoria: formData.categoria,
        fecha: `${formData.fecha}T00:00:00Z`,
        ...(formData.almacen_id && { almacen_id: formData.almacen_id })
      };
      
      const updatedGasto = await gastoService.updateGasto(id, gastoData);
      return updatedGasto;
    } catch (err) {
      handleError(err, 'Error al actualizar gasto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError]);

  // Delete gasto
  const deleteGasto = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      clearError();
      
      await gastoService.deleteGasto(id);
      router.push('/gastos');
      return true;
    } catch (err) {
      handleError(err, 'Error al eliminar gasto');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError]);

  // Handle date selection
  const handleDateSelection = useCallback((date: Date | undefined) => {
    setShowDatePicker(false);
    if (date) {
      const dateString = date.toISOString().split('T')[0];
      form.handleChange('fecha', dateString);
    }
  }, [form]);

  // State for detail screen compatibility
  const [item, setItem] = useState<Gasto | null>(null);

  // Load item (for detail screen compatibility)
  const loadItem = useCallback(async (id: number) => {
    const gasto = await getGasto(id);
    setItem(gasto);
    return gasto;
  }, [getGasto]);

  // Delete item (for detail screen compatibility)
  const deleteItem = useCallback(async (id: number) => {
    const success = await deleteGasto(id);
    if (success) {
      setItem(null);
    }
    return success;
  }, [deleteGasto]);

  return {
    // Form state
    form,
    validationRules,
    
    // Loading and error state
    isLoading,
    error,
    
    // Options
    categorias: CATEGORIAS_GASTO,
    almacenes,
    
    // Date picker
    showDatePicker,
    setShowDatePicker,
    handleDateSelection,
    
    // User state
    isAdmin,
    
    // Actions
    prepareForCreate,
    loadGastoForEdit,
    getGasto,
    createGasto,
    updateGasto,
    deleteGasto,
    
    // Detail screen compatibility
    item,
    loadItem,
    deleteItem,
    
    // Utils
    clearError
  };
}