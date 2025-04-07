// hooks/crud/useInventarios.tsx - Versión optimizada
import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { useApiResource } from '@/hooks/useApiResource';
import { Inventario, Almacen, Presentacion, Lote } from '@/models';
import { inventarioApi, almacenApi, presentacionApi, loteApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// Interface para los datos del formulario de inventario
interface InventarioFormData {
  presentacion_id: string;
  almacen_id: string;
  cantidad: string;
  stock_minimo: string;
  lote_id?: string;
}

// Interface para los parámetros de ajuste simplificado
interface AjusteSimplificadoParams {
  inventarioId: number;
  accion: 'aumentar' | 'disminuir';
  cantidad: number;
  motivo: string;
  loteId?: number;
}

// Estado inicial del formulario
const initialFormData: InventarioFormData = {
  presentacion_id: '',
  almacen_id: '',
  cantidad: '',
  stock_minimo: '',
  lote_id: '',
};

export function useInventarios() {
  const { user } = useAuth();
  
  // Usar el hook genérico para operaciones CRUD
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

  // Estados para formulario y datos relacionados
  const [formData, setFormData] = useState<InventarioFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  
  // Estados para datos relacionados
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [selectedAlmacen, setSelectedAlmacen] = useState<string | null>(null);
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Cargar opciones (almacenes y presentaciones)
  const loadOptions = useCallback(async () => {
    try {
      setIsLoadingOptions(true);
      
      // Cargar almacenes
      const almacenesResponse = await almacenApi.getAlmacenes();
      if (almacenesResponse?.data) {
        setAlmacenes(almacenesResponse.data);
        
        // Si el usuario tiene un almacén asignado, seleccionarlo automáticamente
        if (user?.almacen_id) {
          setSelectedAlmacen(user.almacen_id.toString());
          setFormData(prev => ({
            ...prev,
            almacen_id: user.almacen_id.toString()
          }));
        }
      }
      
      // Cargar presentaciones
      const presentacionesResponse = await presentacionApi.getPresentaciones();
      if (presentacionesResponse?.data) {
        setPresentaciones(presentacionesResponse.data);
      }
      
      // Cargar lotes
      const lotesResponse = await loteApi.getLotes();
      if (lotesResponse?.data) {
        setLotes(lotesResponse.data);
      }
    } catch (error) {
      console.error('Error loading options:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
    } finally {
      setIsLoadingOptions(false);
    }
  }, [user?.almacen_id]);

  // Efecto para cargar opciones al montar
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // Formatear lote para mostrar
  const formatLoteForDisplay = useCallback((lote: Lote) => {
    if (!lote) return '';
    const fechaIngreso = new Date(lote.fecha_ingreso).toLocaleDateString();
    return `Lote #${lote.id} (${fechaIngreso})${lote.proveedor ? ` - ${lote.proveedor.nombre}` : ''}`;
  }, []);

  // Filtrar inventario por almacén
  const filtrarPorAlmacen = useCallback(async (almacenId: string) => {
    try {
      setSelectedAlmacen(almacenId);
      
      // Convertir a número o usar undefined si está vacío
      const almacenIdParam = almacenId ? parseInt(almacenId) : undefined;
      
      await fetchData({
        page: 1,
        perPage: pagination.perPage,
        almacenId: almacenIdParam
      });
    } catch (error) {
      console.error('Error filtering by warehouse:', error);
    }
  }, [fetchData, pagination.perPage]);

  // Filtrar inventario por texto
  const filtrarPorTexto = useCallback((texto: string) => {
    setSearchText(texto);
  }, []);

  // Alternar filtro de stock bajo
  const toggleStockBajo = useCallback(() => {
    setShowOnlyLowStock(prev => !prev);
  }, []);

  // Obtener inventario filtrado
  const getInventariosFiltrados = useCallback(() => {
    if (!inventarios) return [];
    
    return inventarios.filter((item) => {
      const matchesSearch = !searchText || 
        (item.presentacion?.nombre?.toLowerCase().includes(searchText.toLowerCase()) ||
         item.presentacion?.producto?.nombre?.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchesAlmacen = !selectedAlmacen || 
        item.almacen_id.toString() === selectedAlmacen;
      
      const matchesLowStock = !showOnlyLowStock || 
        (item.cantidad <= item.stock_minimo);
      
      return matchesSearch && matchesAlmacen && matchesLowStock;
    });
  }, [inventarios, searchText, selectedAlmacen, showOnlyLowStock]);
  
  // Obtener presentaciones que no están en el inventario para el almacén seleccionado
  const getAvailablePresentaciones = useCallback(() => {
    if (!presentaciones.length || !inventarios.length) return presentaciones;
    
    // Si no hay almacén seleccionado, devolver todas las presentaciones
    if (!selectedAlmacen) return presentaciones;
    
    // Obtener todos los presentacion_id que ya están en el almacén seleccionado
    const existingPresentacionIds = inventarios
      .filter(inv => inv.almacen_id.toString() === selectedAlmacen)
      .map(inv => inv.presentacion_id);
    
    // Devolver solo las presentaciones que no están en el almacén
    return presentaciones.filter(
      presentacion => !existingPresentacionIds.includes(presentacion.id)
    );
  }, [presentaciones, inventarios, selectedAlmacen]);

  // Manejar cambio de campo de formulario
  const handleChange = useCallback((field: keyof InventarioFormData, value: string) => {
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

  // Validar formulario
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
      
      // Asegurar que todos los valores se convierten correctamente a sus tipos esperados
      const inventarioData = {
        presentacion_id: parseInt(formData.presentacion_id),
        almacen_id: parseInt(formData.almacen_id),
        cantidad: parseInt(formData.cantidad),
        stock_minimo: parseInt(formData.stock_minimo),
        // Solo incluir lote_id si tiene un valor
        ...(formData.lote_id && formData.lote_id.trim() !== '' 
           ? { lote_id: parseInt(formData.lote_id) } 
           : {})
      };
      
      console.log("Sending inventory data:", JSON.stringify(inventarioData, null, 2));
      
      const response = await inventarioApi.createInventario(inventarioData);
      
      if (response) {
        Alert.alert(
          'Inventario Actualizado',
          'El inventario ha sido actualizado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/inventarios') 
            }
          ]
        );
        
        // Actualizar la lista
        await fetchData();
        
        return true;
      } else {
        Alert.alert('Error', 'No se pudo actualizar el inventario');
        return false;
      }
    } catch (error) {
      console.error('Error creating inventory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al actualizar el inventario';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate, fetchData]);

  // Actualizar registro de inventario existente
  const updateInventario = useCallback(async (id: number) => {
    if (!validate()) {
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      // Asegurar que todos los valores se convierten correctamente
      const inventarioData = {
        presentacion_id: parseInt(formData.presentacion_id),
        almacen_id: parseInt(formData.almacen_id),
        cantidad: parseInt(formData.cantidad),
        stock_minimo: parseInt(formData.stock_minimo),
        // Solo incluir lote_id si tiene un valor
        ...(formData.lote_id && formData.lote_id.trim() !== '' 
           ? { lote_id: parseInt(formData.lote_id) } 
           : {})
      };
      
      console.log("Updating inventory with data:", JSON.stringify(inventarioData, null, 2));
      
      const response = await inventarioApi.updateInventario(id, inventarioData);
      
      if (response) {
        Alert.alert(
          'Inventario Actualizado',
          'El inventario ha sido actualizado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back() 
            }
          ]
        );
        
        // Actualizar la lista
        await fetchData();
        
        return true;
      } else {
        Alert.alert('Error', 'No se pudo actualizar el inventario');
        return false;
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al actualizar el inventario';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate, fetchData]);

  // Cargar registro de inventario para editar
  const loadInventarioForEdit = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true);
      
      // Asegurar que las opciones están cargadas
      await loadOptions();
      
      const inventario = await getItem(id);
      
      if (inventario) {
        setFormData({
          presentacion_id: inventario.presentacion_id.toString(),
          almacen_id: inventario.almacen_id.toString(),
          cantidad: inventario.cantidad.toString(),
          stock_minimo: inventario.stock_minimo.toString(),
          lote_id: inventario.lote_id ? inventario.lote_id.toString() : '',
        });
        
        return inventario;
      } else {
        Alert.alert('Error', 'No se pudo cargar el inventario');
        return null;
      }
    } catch (error) {
      console.error('Error loading inventory for edit:', error);
      Alert.alert('Error', 'No se pudo cargar el inventario');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [getItem, loadOptions]);

// Versión optimizada de la función de ajuste de inventario que considera los lotes
const ajustarInventarioSimplificado = useCallback(async ({ 
  inventarioId, 
  accion, 
  cantidad, 
  motivo,
  loteId
}: AjusteSimplificadoParams) => {
  try {
    setIsSubmitting(true);
    
    // Validar cantidad
    if (cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a cero');
    }
    
    // Obtener inventario actual para validación
    const inventario = await getItem(inventarioId);
    
    if (!inventario) {
      throw new Error('No se pudo cargar el inventario. No se encontró el registro.');
    }
    
    // Validación adicional para operación de disminución
    if (accion === 'disminuir' && cantidad > inventario.cantidad) {
      throw new Error('No puede restar más unidades de las disponibles');
    }
    
    // Calcular nueva cantidad según la acción
    const nuevaCantidad = accion === 'aumentar' 
      ? inventario.cantidad + cantidad
      : inventario.cantidad - cantidad;
    
    // Preparar datos para la actualización
    const updatedData: any = {
      cantidad: nuevaCantidad,
      motivo: motivo || 'Ajuste de inventario'
    };
    
    // Solo incluir lote_id si se está aumentando stock y se especificó un lote diferente
    if (accion === 'aumentar' && loteId && loteId !== inventario.lote_id) {
      console.log(`Cambiando lote de ${inventario.lote_id} a ${loteId} para aumento de inventario`);
      updatedData.lote_id = loteId;
    }
    
    console.log("Enviando datos de ajuste:", JSON.stringify(updatedData, null, 2));
    
    // Llamar al método de actualización
    const response = await inventarioApi.updateInventario(inventarioId, updatedData);
    
    if (response) {
      // Actualizar los datos
      await fetchData({
        page: pagination.page,
        perPage: pagination.perPage,
        almacenId: selectedAlmacen ? parseInt(selectedAlmacen) : undefined
      });
      
      return true;
    }
    
    throw new Error('No se pudo actualizar el inventario');
  } catch (error) {
    console.error('Error ajustando inventario:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al ajustar el inventario';
    Alert.alert('Error', errorMessage);
    return false;
  } finally {
    setIsSubmitting(false);
  }
}, [getItem, fetchData, pagination, selectedAlmacen, inventarioApi]);

  // Versión compatible con el código existente (pero delegando a la versión simplificada)
  const ajustarInventario = useCallback(async (
    id: number, 
    accion: 'aumentar' | 'disminuir', 
    cantidad: number, 
    motivo: string,
    loteId?: number
  ) => {
    return ajustarInventarioSimplificado({
      inventarioId: id,
      accion,
      cantidad,
      motivo,
      loteId
    });
  }, [ajustarInventarioSimplificado]);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, []);

  // Obtener estadísticas de inventario
  const getEstadisticas = useCallback(() => {
    if (!inventarios || inventarios.length === 0) {
      return {
        totalItems: 0,
        stockBajo: 0,
        sinStock: 0,
        valorTotal: 0
      };
    }
    
    const totalItems = inventarios.length;
    const stockBajo = inventarios.filter(inv => inv.cantidad <= inv.stock_minimo && inv.cantidad > 0).length;
    const sinStock = inventarios.filter(inv => inv.cantidad === 0).length;
    
    // Calcular valor total del inventario (si los productos tienen precio)
    const valorTotal = inventarios.reduce((sum, inv) => {
      const precio = inv.presentacion?.precio_venta || 0;
      return sum + (precio * inv.cantidad);
    }, 0);
    
    return {
      totalItems,
      stockBajo,
      sinStock,
      valorTotal
    };
  }, [inventarios]);

  // Actualizar datos de inventario
  const refresh = useCallback(async () => {
    try {
      // Convertir a número o usar undefined si está vacío
      const almacenIdParam = selectedAlmacen ? parseInt(selectedAlmacen) : undefined;
      
      await fetchData({
        page: pagination.page,
        perPage: pagination.perPage,
        almacenId: almacenIdParam
      });
    } catch (error) {
      console.error('Error refreshing inventory:', error);
    }
  }, [fetchData, pagination.page, pagination.perPage, selectedAlmacen]);

  // Confirmar eliminación de inventario
  const confirmDelete = useCallback((id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este registro de inventario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(id);
              await refresh();
              Alert.alert('Éxito', 'Registro eliminado correctamente');
            } catch (error) {
              console.error('Error deleting inventory:', error);
              Alert.alert('Error', 'No se pudo eliminar el registro');
            }
          }
        }
      ]
    );
  }, [deleteItem, refresh]);

  return {
    // Estados
    inventarios,
    almacenes,
    presentaciones,
    lotes,
    selectedAlmacen,
    isLoading,
    isLoadingOptions,
    error,
    formData,
    errors,
    isSubmitting,
    pagination,
    searchText,
    showOnlyLowStock,
    
    // Acciones de formulario
    handleChange,
    setFormData,
    setErrors,
    validate,
    
    // Operaciones CRUD
    loadOptions,
    filtrarPorAlmacen,
    filtrarPorTexto,
    toggleStockBajo,
    createInventario,
    updateInventario,
    ajustarInventario,
    ajustarInventarioSimplificado, // Nueva función simplificada
    deleteInventario: deleteItem,
    confirmDelete,
    loadInventarioForEdit,
    getItem,
    
    // Operaciones de paginación
    handlePageChange,
    handleItemsPerPageChange,
    refresh,
    
    // Utilidades
    getInventariosFiltrados,
    getEstadisticas,
    resetForm,
    getAvailablePresentaciones,
    formatLoteForDisplay
  };
}