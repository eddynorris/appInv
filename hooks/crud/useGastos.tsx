import { useMemo, useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useEntityCRUD } from './useEntityCRUD';
import { gastoApi } from '@/services/api';
import { Gasto } from '@/models';
import { useForm } from '@/hooks/useForm';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';

// Valores iniciales del formulario
const initialFormValues = {
  descripcion: '',
  monto: '',
  categoria: 'logistica' as 'logistica' | 'personal' | 'otros',
  fecha: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
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

// Categorías de gastos predefinidas
export const CATEGORIAS_GASTO: Array<'logistica' | 'personal' | 'otros'> = [
  'logistica',
  'personal',
  'otros'
];

export function useGastos() {
  // Obtener usuario autenticado
  const { user } = useAuth();
  
  // Usar el hook genérico para CRUD
  const crudHook = useEntityCRUD({
    apiService: {
      getEntities: gastoApi.getGastos,
      getEntity: gastoApi.getGasto,
      createEntity: gastoApi.createGasto,
      updateEntity: gastoApi.updateGasto,
      deleteEntity: gastoApi.deleteGasto
    },
    entityName: 'gasto'
  });
  
  // Estado del formulario independiente
  const form = useForm<typeof initialFormValues>(initialFormValues);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Cargar un gasto para edición
  const loadGastoForEdit = useCallback(async (id: number) => {
    try {
      console.log(`Iniciando carga de gasto ID ${id} para edición`);
      
      // Evitar cargar el mismo gasto si ya está en caché
      if (id === selectedId && crudHook.entity && form.formData.descripcion) {
        console.log('Usando gasto en caché:', crudHook.entity);
        return crudHook.entity;
      }
      
      // Establecer el ID del gasto seleccionado
      setSelectedId(id);
      
      // Cargar datos directamente de la API 
      console.log(`Solicitando datos directamente para gasto ID ${id}`);
      const gasto = await gastoApi.getGasto(id);
      
      console.log('Respuesta de la API para gasto:', gasto);
      
      // Actualizar también el estado del crudHook
      await crudHook.loadEntity(id);
      
      if (gasto) {
        // Actualizar el formulario con los datos recibidos
        form.setValues({
          descripcion: gasto.descripcion || '',
          monto: gasto.monto ? gasto.monto.toString() : '',
          categoria: gasto.categoria || CATEGORIAS_GASTO[0],
          fecha: gasto.fecha ? gasto.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
        });
        
        return gasto;
      } else {
        Alert.alert('Error', 'No se pudo cargar la información del gasto');
        return null;
      }
    } catch (error) {
      console.error('Error al cargar gasto para edición:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar los datos del gasto');
      return null;
    }
  }, [crudHook, form, selectedId]);
  
  // Crear un nuevo gasto
  const createGasto = useCallback(async () => {
    if (!form.validate(validationRules)) {
      return false;
    }
    
    try {
      // Validar que tenemos usuario y almacén
      if (!user?.id) {
        Alert.alert('Error', 'No se pudo identificar el usuario actual');
        return false;
      }

      // Asegurarse de que la categoría sea del tipo correcto
      const gastoData: Partial<Gasto> = {
        descripcion: form.formData.descripcion,
        monto: form.formData.monto.replace(',', '.'), // Asegurar formato decimal correcto
        categoria: form.formData.categoria,
        fecha: form.formData.fecha,
        usuario_id: user.id, // ID del usuario logueado
      };
      
      // Añadir almacén si existe
      if (user.almacen_id) {
        gastoData.almacen_id = user.almacen_id;
      }
      
      console.log('Enviando datos de gasto:', JSON.stringify(gastoData));
      const result = await crudHook.createEntity(gastoData);
      
      if (result) {
        Alert.alert(
          'Gasto Creado',
          'El gasto ha sido creado exitosamente',
          [{ text: 'OK', onPress: () => router.replace('/gastos') }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo crear el gasto');
        return false;
      }
    } catch (error) {
      console.error('Error al crear gasto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al crear el gasto';
      Alert.alert('Error', errorMessage);
      return false;
    }
  }, [crudHook, form, user]);
  
  // Actualizar un gasto existente
  const updateGasto = useCallback(async (id: number) => {
    if (!form.validate(validationRules)) {
      return false;
    }
    
    try {
      // Asegurarse de que la categoría sea del tipo correcto
      const gastoData: Partial<Gasto> = {
        descripcion: form.formData.descripcion,
        monto: form.formData.monto.replace(',', '.'), // Asegurar formato decimal correcto
        categoria: form.formData.categoria,
        fecha: form.formData.fecha
      };
      
      console.log('Actualizando gasto con datos:', JSON.stringify(gastoData));
      const result = await crudHook.updateEntity(id, gastoData);
      
      if (result) {
        Alert.alert(
          'Gasto Actualizado',
          'El gasto ha sido actualizado exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo actualizar el gasto');
        return false;
      }
    } catch (error) {
      console.error('Error al actualizar gasto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al actualizar el gasto';
      Alert.alert('Error', errorMessage);
      return false;
    }
  }, [crudHook, form]);
  
  // Manejar selección de fecha
  const handleDateSelection = useCallback((selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      form.handleChange('fecha', formattedDate);
    }
  }, [form]);
  
  // Calcular estadísticas de gastos
  const getEstadisticas = useCallback(() => {
    const totalMonto = crudHook.entities.reduce(
      (acc, gasto: Gasto) => acc + parseFloat(gasto.monto || '0'), 
      0
    );
    
    return {
      totalMonto,
      totalGastos: crudHook.pagination.totalItems
    };
  }, [crudHook.entities, crudHook.pagination.totalItems]);
  
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
  
  // Restablecer el formulario
  const resetForm = useCallback(() => {
    form.resetForm();
    setSelectedId(null);
  }, [form]);
  
  // Eliminar un gasto con recarga automática
  const deleteGasto = useCallback(async (id: number) => {
    try {
      const success = await crudHook.deleteEntity(id);
      
      // Si se eliminó correctamente, recargar la lista
      if (success) {
        setTimeout(() => {
          crudHook.loadEntities();
        }, 300); // Breve retraso para permitir que se complete la operación en el servidor
      }
      
      return success;
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      return false;
    }
  }, [crudHook]);
  
  return {
    // Datos básicos de CRUD
    ...crudHook,
    
    // Método personalizado de eliminación
    deleteEntity: deleteGasto,
    
    // Formulario y validación
    form,
    validationRules,
    
    // Estado del date picker
    showDatePicker,
    setShowDatePicker,
    
    // Categorías disponibles
    categorias: CATEGORIAS_GASTO,
    
    // Funciones específicas
    loadGastoForEdit,
    createGasto,
    updateGasto,
    resetForm,
    handleDateSelection,
    getEstadisticas,
    getCategoryColor
  };
} 