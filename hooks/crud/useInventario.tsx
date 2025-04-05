// hooks/crud/useInventario.ts
import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useApiResource } from '../useApiResource';
import { inventarioApi, almacenApi, presentacionApi } from '@/services/api';
import { Inventario, Almacen, Presentacion } from '@/models';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';

export interface InventarioForm {
  presentacion_id: string;
  almacen_id: string;
  cantidad: string;
  stock_minimo: string;
  lote_id?: string;
}

// Estado inicial del formulario
const initialFormData: InventarioForm = {
  presentacion_id: '',
  almacen_id: '',
  cantidad: '0',
  stock_minimo: '0',
  lote_id: ''
};

export function useInventario() {
  const { user } = useAuth();
  
  // Usar el hook genérico para CRUD
  const { 
    data: inventarios, 
    isLoading, 
    error, 
    pagination, 
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deleteItem,
    getItem
  } = useApiResource<Inventario>({
    initialParams: { page: 1, perPage: 10 },
    fetchFn: inventarioApi.getInventarios,
    deleteFn: inventarioApi.deleteInventario,
    getFn: inventarioApi.getInventario
  });
  
  // Estados adicionales
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [selectedAlmacen, setSelectedAlmacen] = useState<string>('');
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [formData, setFormData] = useState<InventarioForm>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Definir columnas para la tabla (memoizadas)
  const columns = useMemo(() => [
    {
      id: 'presentacion',
      label: 'Presentación',
      width: 2,
      sortable: true,
      render: (item: Inventario) => (
        <ThemedText>{item.presentacion?.nombre || '-'}</ThemedText>
      ),
    },
    {
      id: 'almacen',
      label: 'Almacén',
      width: 1.5,
      sortable: true,
      render: (item: Inventario) => (
        <ThemedText>{item.almacen?.nombre || '-'}</ThemedText>
      ),
    },
    {
      id: 'cantidad',
      label: 'Stock',
      width: 1,
      sortable: true,
      render: (item: Inventario) => (
        <ThemedText style={{ 
          fontWeight: 'bold',
          color: item.cantidad <= item.stock_minimo ? '#F44336' : '#4CAF50' 
        }}>
          {item.cantidad}
        </ThemedText>
      ),
    },
    {
      id: 'stock_minimo',
      label: 'Min',
      width: 0.8,
      sortable: true,
      render: (item: Inventario) => (
        <ThemedText>{item.stock_minimo}</ThemedText>
      ),
    },
    {
      id: 'ultima_actualizacion',
      label: 'Actualización',
      width: 1.5,
      sortable: true,
      render: (item: Inventario) => (
        <ThemedText>
          {new Date(item.ultima_actualizacion).toLocaleDateString()}
        </ThemedText>
      ),
    },
  ], []);

  // Cargar opciones (almacenes y presentaciones)
  const loadOptions = useCallback(async () => {
    try {
      setIsLoadingOptions(true);
      
      // Cargar almacenes
      const almacenesResponse = await almacenApi.getAlmacenes();
      if (almacenesResponse && almacenesResponse.data) {
        setAlmacenes(almacenesResponse.data);
        
        // Si el usuario tiene un almacén asignado, seleccionarlo automáticamente
        if (user?.almacen_id) {
          setSelectedAlmacen(user.almacen_id.toString());
          setFormData(prev => ({
            ...prev,
            almacen_id: user.almacen_id.toString()
          }));
          
          // Si el usuario tiene un almacén asignado, cargar presentaciones del almacén
          const inventariosPorAlmacen = await inventarioApi.getInventarios(
            1, 100, { almacen_id: user.almacen_id }
          );
          
          // Extraer presentaciones únicas del inventario
          if (inventariosPorAlmacen && inventariosPorAlmacen.data) {
            // Crear un conjunto de IDs de presentaciones para filtrar duplicados
            const presentacionIds = new Set(
              inventariosPorAlmacen.data.map(inv => inv.presentacion_id)
            );
            
            // Si no hay presentaciones en el inventario, cargar todas
            if (presentacionIds.size === 0) {
              const presentacionesResponse = await presentacionApi.getPresentaciones();
              if (presentacionesResponse && presentacionesResponse.data) {
                setPresentaciones(presentacionesResponse.data);
              }
            } else {
              // Cargar solo las presentaciones que están en el inventario
              // (En una implementación real, aquí fetcharías solo las presentaciones necesarias)
              const presentacionesResponse = await presentacionApi.getPresentaciones();
              if (presentacionesResponse && presentacionesResponse.data) {
                const presentacionesFiltradas = presentacionesResponse.data.filter(
                  p => presentacionIds.has(p.id)
                );
                setPresentaciones(presentacionesFiltradas);
              }
            }
          }
        } else {
          // Si no hay almacén asignado, cargar todas las presentaciones
          const presentacionesResponse = await presentacionApi.getPresentaciones();
          if (presentacionesResponse && presentacionesResponse.data) {
            setPresentaciones(presentacionesResponse.data);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar opciones:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
    } finally {
      setIsLoadingOptions(false);
    }
  }, [user?.almacen_id]);

  // Filtrar inventario por almacén
  const filtrarPorAlmacen = useCallback(async (almacenId: string) => {
    try {
      setIsLoading(true);
      setSelectedAlmacen(almacenId);
      
      // Actualizar almacén en formulario
      setFormData(prev => ({
        ...prev,
        almacen_id: almacenId
      }));
      
      // Cargar inventario filtrado
      const params = { almacen_id: almacenId };
      await fetchData(1, pagination.itemsPerPage, params);
    } catch (error) {
      console.error('Error al filtrar por almacén:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, pagination.itemsPerPage]);

  // Manejar cambio de campos del formulario
  const handleChange = useCallback((field: keyof InventarioForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error cuando se cambia el campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validar el formulario
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.presentacion_id) {
      newErrors.presentacion_id = 'La presentación es requerida';
    }
    
    if (!formData.almacen_id) {
      newErrors.almacen_id = 'El almacén es requerido';
    }
    
    if (!formData.cantidad.trim()) {
      newErrors.cantidad = 'La cantidad es requerida';
    } else if (isNaN(parseInt(formData.cantidad)) || parseInt(formData.cantidad) < 0) {
      newErrors.cantidad = 'Ingrese una cantidad válida';
    }
    
    if (!formData.stock_minimo.trim()) {
      newErrors.stock_minimo = 'El stock mínimo es requerido';
    } else if (isNaN(parseInt(formData.stock_minimo)) || parseInt(formData.stock_minimo) < 0) {
      newErrors.stock_minimo = 'Ingrese un valor válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Crear nuevo registro de inventario
  const createInventario = useCallback(async () => {
    if (!validate()) {
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      const inventarioData = {
        presentacion_id: parseInt(formData.presentacion_id),
        almacen_id: parseInt(formData.almacen_id),
        cantidad: parseInt(formData.cantidad),
        stock_minimo: parseInt(formData.stock_minimo),
        lote_id: formData.lote_id ? parseInt(formData.lote_id) : undefined
      };
      
      const response = await inventarioApi.createInventario(inventarioData);
      
      if (response) {
        Alert.alert(
          'Inventario Actualizado',
          'El inventario ha sido actualizado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/inventario') 
            }
          ]
        );
        
        // Refrescar la lista
        fetchData();
        
        return true;
      } else {
        Alert.alert('Error', 'No se pudo actualizar el inventario');
        return false;
      }
    } catch (error) {
      console.error('Error al crear inventario:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al actualizar el inventario';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate, fetchData]);

  // Ajustar inventario (aumentar o disminuir stock)
  const ajustarInventario = useCallback(async (id: number, cantidad: number, motivo: string) => {
    try {
      setIsLoading(true);
      
      // En una implementación real, aquí llamarías a un endpoint específico
      // para registrar movimientos de inventario
      const inventario = await getItem(id);
      if (!inventario) {
        throw new Error('No se pudo cargar el inventario');
      }
      
      const nuevoInventario = {
        ...inventario,
        cantidad: inventario.cantidad + cantidad
      };
      
      // Aquí simulo la actualización usando el método PUT general
      // En tu API real, deberías implementar un endpoint específico
      const response = await inventarioApi.updateInventario(id, nuevoInventario);
      
      if (response) {
        Alert.alert(
          'Inventario Ajustado',
          `El stock ha sido ${cantidad > 0 ? 'aumentado' : 'disminuido'} exitosamente`
        );
        
        // Refrescar la lista
        fetchData();
        
        return true;
      } else {
        throw new Error('No se pudo ajustar el inventario');
      }
    } catch (error) {
      console.error('Error al ajustar inventario:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Ocurrió un error al ajustar el inventario');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getItem, fetchData]);

  // Confirmar eliminación
  const confirmDelete = useCallback((id: number) => {
    Alert.alert(
      'Eliminar Registro de Inventario',
      '¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            const success = await deleteItem(id);
            if (success) {
              // Refrescar data después de eliminar
              fetchData();
            }
          } 
        }
      ]
    );
  }, [deleteItem, fetchData]);

  // Cargar inventario para edición
  const loadInventarioForEdit = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true);
      
      // Asegurar que las opciones estén cargadas
      await loadOptions();
      
      const inventario = await getItem(id);
      
      if (inventario) {
        setFormData({
          presentacion_id: inventario.presentacion_id.toString(),
          almacen_id: inventario.almacen_id.toString(),
          cantidad: inventario.cantidad.toString(),
          stock_minimo: inventario.stock_minimo.toString(),
          lote_id: inventario.lote_id ? inventario.lote_id.toString() : ''
        });
        
        return inventario;
      } else {
        Alert.alert('Error', 'No se pudo cargar la información del inventario');
        return null;
      }
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadOptions, getItem]);

  // Calcular estadísticas
  const getEstadisticas = useCallback(() => {
    const totalItems = pagination.totalItems;
    const bajosStock = inventarios.filter(inv => inv.cantidad <= inv.stock_minimo).length;
    
    // Calcular la suma total de unidades en inventario
    const totalUnidades = inventarios.reduce((sum, inv) => sum + inv.cantidad, 0);
    
    return {
      totalRegistros: totalItems,
      bajosStock,
      totalUnidades,
      porcentajeBajosStock: totalItems > 0 ? (bajosStock / totalItems) * 100 : 0
    };
  }, [inventarios, pagination.totalItems]);

  // Restablecer formulario
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, []);

  return {
    // Estados
    inventarios,
    almacenes,
    presentaciones,
    selectedAlmacen,
    isLoading,
    isLoadingOptions,
    error,
    formData,
    errors,
    isSubmitting,
    pagination,
    columns,
    
    // Acciones para formulario
    handleChange,
    setFormData,
    setErrors,
    validate,
    
    // Operaciones CRUD
    loadOptions,
    filtrarPorAlmacen,
    createInventario,
    ajustarInventario,
    deleteInventario: deleteItem,
    confirmDelete,
    loadInventarioForEdit,
    
    // Operaciones de paginación
    handlePageChange,
    handleItemsPerPageChange,
    refresh: fetchData,
    
    // Utilidades
    getEstadisticas,
    resetForm
  };
}