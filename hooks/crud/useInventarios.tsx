import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { useApiResource } from '@/hooks/useApiResource';
import { Inventario, Almacen, Presentacion, Lote } from '@/models';
import { inventarioApi, almacenApi, presentacionApi, loteApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// Interface for inventory form data
interface InventarioFormData {
  presentacion_id: string;
  almacen_id: string;
  cantidad: string;
  stock_minimo: string;
  lote_id?: string;
}

// Interface for inventory movement data
interface MovimientoData {
  inventario_id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: string;
  lote_id?: number;
}

// Initial form state
const initialFormData: InventarioFormData = {
  presentacion_id: '',
  almacen_id: '',
  cantidad: '',
  stock_minimo: '',
  lote_id: '',
};

export function useInventarios() {
  const { user } = useAuth();
  
  // Use the generic API resource hook for CRUD operations
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

  // States for form and related data
  const [formData, setFormData] = useState<InventarioFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  
  // States for related data
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [selectedAlmacen, setSelectedAlmacen] = useState<string | null>(null);
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Load options (warehouses and presentations)
  const loadOptions = useCallback(async () => {
    try {
      setIsLoadingOptions(true);
      
      // Load warehouses
      const almacenesResponse = await almacenApi.getAlmacenes();
      if (almacenesResponse && almacenesResponse.data) {
        setAlmacenes(almacenesResponse.data);
        
        // If user has an assigned warehouse, select it automatically
        if (user?.almacen_id) {
          setSelectedAlmacen(user.almacen_id.toString());
          setFormData(prev => ({
            ...prev,
            almacen_id: user.almacen_id.toString()
          }));
        }
      }
      
      // Load presentations
      const presentacionesResponse = await presentacionApi.getPresentaciones();
      if (presentacionesResponse && presentacionesResponse.data) {
        setPresentaciones(presentacionesResponse.data);
      }
      
      // Load lotes for dropdown selection
      const lotesResponse = await loteApi.getLotes();
      if (lotesResponse && lotesResponse.data) {
        setLotes(lotesResponse.data);
      }
    } catch (error) {
      console.error('Error loading options:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
    } finally {
      setIsLoadingOptions(false);
    }
  }, [user?.almacen_id]);

  // Effect to load options on mount
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // Filter inventory by warehouse
  const filtrarPorAlmacen = useCallback(async (almacenId: string) => {
    try {
      setSelectedAlmacen(almacenId);
      
      // Convert to number or use undefined if empty
      const almacenIdParam = almacenId ? parseInt(almacenId) : undefined;
      
      // Fetch data with the proper almacen_id parameter
      await fetchData({
        page: 1,
        perPage: pagination.perPage,
        almacenId: almacenIdParam
      });
    } catch (error) {
      console.error('Error filtering by warehouse:', error);
    }
  }, [fetchData, pagination.perPage]);

  // Filter inventory by search text
  const filtrarPorTexto = useCallback((texto: string) => {
    setSearchText(texto);
  }, []);

  // Toggle low stock filter
  const toggleStockBajo = useCallback(() => {
    setShowOnlyLowStock(prev => !prev);
  }, []);

  // Get filtered inventory based on search, warehouse and low stock
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

  // Handle form field changes
  const handleChange = useCallback((field: keyof InventarioFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Form validation
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

  // Create new inventory item
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
              onPress: () => router.replace('/inventarios') 
            }
          ]
        );
        
        // Refresh the list
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

  // Update existing inventory item
  const updateInventario = useCallback(async (id: number) => {
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
        
        // Refresh the list
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

  // Load inventory item for editing
  const loadInventarioForEdit = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true);
      
      // Ensure options are loaded
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

  // Adjust inventory (increase or decrease stock)
  const ajustarInventario = useCallback(async (
    id: number, 
    accion: 'aumentar' | 'disminuir', 
    cantidad: number, 
    motivo: string,
    loteId?: number
  ) => {
    try {
      setIsSubmitting(true);
      
      // Validate quantity
      if (cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a cero');
      }
      
      // Get current inventory
      const inventario = await getItem(id);
      if (!inventario) {
        throw new Error('No se pudo cargar el inventario');
      }
      
      // Calculate new quantity based on action
      let nuevaCantidad = inventario.cantidad;
      if (accion === 'aumentar') {
        nuevaCantidad += cantidad;
      } else {
        // Validate that we don't subtract more than available
        if (cantidad > inventario.cantidad) {
          throw new Error('No puede restar más unidades de las disponibles');
        }
        nuevaCantidad -= cantidad;
      }
      
      // Create movement object
      const movimientoData: MovimientoData = {
        inventario_id: id,
        tipo: accion === 'aumentar' ? 'entrada' : 'salida',
        cantidad: cantidad,
        motivo: motivo,
        lote_id: loteId
      };
      
      // Call API to register movement
      const response = await inventarioApi.registrarMovimiento(movimientoData);
      
      if (response) {
        // Refresh the list
        await fetchData({
          page: pagination.page,
          perPage: pagination.perPage,
          almacenId: selectedAlmacen ? parseInt(selectedAlmacen) : undefined
        });
        
        return true;
      } else {
        throw new Error('No se pudo registrar el movimiento');
      }
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al ajustar el inventario';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [getItem, fetchData, pagination.page, pagination.perPage, selectedAlmacen]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, []);

  // Get inventory statistics
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
    
    // Calculate total inventory value (if products have price)
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

  // Refresh inventory data
  const refresh = useCallback(async () => {
    try {
      // Convert to number or use undefined if empty
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

  // Delete inventory item with confirmation
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
    // States
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
    
    // Form actions
    handleChange,
    setFormData,
    setErrors,
    validate,
    
    // CRUD operations
    loadOptions,
    filtrarPorAlmacen,
    filtrarPorTexto,
    toggleStockBajo,
    createInventario,
    updateInventario,
    ajustarInventario,
    deleteInventario: deleteItem,
    confirmDelete,
    loadInventarioForEdit,
    getItem,
    
    // Pagination operations
    handlePageChange,
    handleItemsPerPageChange,
    refresh,
    
    // Utilities
    getInventariosFiltrados,
    getEstadisticas,
    resetForm
  };
}