// hooks/crud/usePresentaciones.ts - Versión mejorada
import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useApiResource } from '../useApiResource';
import { presentacionApi, productoApi } from '@/services/api';
import { Presentacion, Producto } from '@/models';
import { ThemedText } from '@/components/ThemedText';

// Estructura para formulario de presentaciones
export interface PresentacionForm {
  producto_id: string;
  nombre: string;
  capacidad_kg: string;
  tipo: 'bruto' | 'procesado' | 'merma' | 'briqueta' | 'detalle';
  precio_venta: string;
  activo: boolean;
}

// Tipos de presentación disponibles
export const TIPOS_PRESENTACION: Array<'bruto' | 'procesado' | 'merma' | 'briqueta' | 'detalle'> = [
  'bruto', 
  'procesado', 
  'merma', 
  'briqueta', 
  'detalle'
];

// Estado inicial del formulario
const initialFormData: PresentacionForm = {
  producto_id: '',
  nombre: '',
  capacidad_kg: '',
  tipo: 'bruto',
  precio_venta: '',
  activo: true
};

export function usePresentaciones() {
  // Usar el hook genérico para CRUD
  const { 
    data: presentaciones, 
    isLoading, 
    error, 
    pagination, 
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deleteItem,
    getItem
  } = useApiResource<Presentacion>({
    initialParams: { page: 1, perPage: 10 },
    fetchFn: presentacionApi.getPresentaciones,
    deleteFn: presentacionApi.deletePresentacion,
    getFn: presentacionApi.getPresentacion
  });
  
  // Estados adicionales
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoadingProductos, setIsLoadingProductos] = useState(false);
  const [formData, setFormData] = useState<PresentacionForm>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para imágenes - refactorizado según el patrón de pagos
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  // Definir columnas para la tabla (memoizadas)
  const columns = useMemo(() => [
    {
      id: 'nombre',
      label: 'Nombre',
      width: 2,
      sortable: true,
      render: (item: Presentacion) => <ThemedText>{item.nombre}</ThemedText>,
    },
    {
      id: 'producto',
      label: 'Producto',
      width: 2,
      sortable: true,
      render: (item: Presentacion) => <ThemedText>{item.producto?.nombre || '-'}</ThemedText>,
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
    {
      id: 'tipo',
      label: 'Tipo',
      width: 1.5,
      sortable: true,
      render: (item: Presentacion) => (
        <ThemedText style={{ color: getTipoColor(item.tipo) }}>
          {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
        </ThemedText>
      ),
    },
    {
      id: 'activo',
      label: 'Estado',
      width: 1,
      sortable: true,
      render: (item: Presentacion) => (
        <ThemedText style={{ color: item.activo ? '#4CAF50' : '#F44336' }}>
          {item.activo ? 'Activo' : 'Inactivo'}
        </ThemedText>
      ),
    },
  ], []);

  // Cargar productos para el selector
  const loadProductos = useCallback(async () => {
    try {
      setIsLoadingProductos(true);
      const response = await productoApi.getProductos(1, 100);
      
      if (response && response.data) {
        setProductos(response.data);
        
        // Si hay productos, preseleccionar el primero
        if (response.data.length > 0 && !formData.producto_id) {
          setFormData(prev => ({
            ...prev,
            producto_id: response.data[0].id.toString()
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setIsLoadingProductos(false);
    }
  }, [formData.producto_id]);

  // Manejar cambio de campos del formulario
  const handleChange = useCallback((field: keyof PresentacionForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error cuando se cambia el campo
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  // Validar el formulario
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.producto_id) {
      newErrors.producto_id = 'El producto es requerido';
    }
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.capacidad_kg.trim()) {
      newErrors.capacidad_kg = 'La capacidad es requerida';
    } else if (isNaN(parseFloat(formData.capacidad_kg)) || parseFloat(formData.capacidad_kg) <= 0) {
      newErrors.capacidad_kg = 'Ingrese una capacidad válida';
    }
    
    if (!formData.precio_venta.trim()) {
      newErrors.precio_venta = 'El precio es requerido';
    } else if (isNaN(parseFloat(formData.precio_venta)) || parseFloat(formData.precio_venta) < 0) {
      newErrors.precio_venta = 'Ingrese un precio válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Cargar presentación para edición
  const loadPresentacionForEdit = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true);
      
      // Asegurar que los productos estén cargados
      if (productos.length === 0) {
        await loadProductos();
      }
      
      const presentacion = await getItem(id);
      
      if (presentacion) {
        // Formatear los valores para el formulario
        setFormData({
          producto_id: presentacion.producto_id?.toString() || '',
          nombre: presentacion.nombre || '',
          capacidad_kg: presentacion.capacidad_kg ? presentacion.capacidad_kg.toString() : '',
          tipo: presentacion.tipo || 'bruto',
          precio_venta: presentacion.precio_venta ? presentacion.precio_venta.toString() : '',
          activo: presentacion.activo !== undefined ? presentacion.activo : true
        });
        
        // Si tiene imagen, establecer la URL
        if (presentacion.url_foto) {
          setExistingImage(presentacion.url_foto);
          setSelectedImage(presentacion.url_foto); // También actualizar selectedImage para compatibilidad
        } else {
          setExistingImage(null);
          setSelectedImage(null);
        }
        
        setRemoveExistingImage(false);
        
        return presentacion;
      } else {
        Alert.alert('Error', 'No se pudo cargar la información de la presentación');
        return null;
      }
    } catch (error) {
      console.error('Error al cargar presentación:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [productos.length, loadProductos, getItem]);

  // Crear nueva presentación
  const createPresentacion = useCallback(async () => {
    if (!validate()) {
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      // Preparar datos para API
      const presentacionData = {
        producto_id: parseInt(formData.producto_id),
        nombre: formData.nombre.trim(),
        capacidad_kg: formData.capacidad_kg.replace(',', '.'),
        tipo: formData.tipo,
        precio_venta: formData.precio_venta.replace(',', '.'),
        activo: formData.activo
      };
      
      let response;
      
      // Si hay una imagen seleccionada, usar el método con imagen
      if (selectedImage) {
        response = await presentacionApi.createPresentacionWithImage(
          presentacionData, 
          selectedImage
        );
      } else {
        response = await presentacionApi.createPresentacion(presentacionData);
      }
      
      if (response) {
        Alert.alert(
          'Presentación Creada',
          'La presentación ha sido creada exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/presentaciones') 
            }
          ]
        );
        
        // Refrescar la lista
        fetchData();
        resetForm();
        
        return true;
      } else {
        throw new Error('No se pudo crear la presentación');
      }
    } catch (error) {
      console.error('Error al crear presentación:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al crear la presentación';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedImage, validate, fetchData]);

  // Actualizar presentación existente
  const updatePresentacion = useCallback(async (id: number) => {
    if (!validate()) {
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      // Preparar datos para API
      const presentacionData = {
        producto_id: parseInt(formData.producto_id),
        nombre: formData.nombre.trim(),
        capacidad_kg: formData.capacidad_kg.replace(',', '.'),
        tipo: formData.tipo,
        precio_venta: formData.precio_venta.replace(',', '.'),
        activo: formData.activo,
        // Si estamos eliminando la imagen existente, agregar el parámetro
        ...(removeExistingImage && { eliminar_foto: true })
      };
      
      let response;
      
      // Determinar el método adecuado para actualizar la presentación
      if (selectedImage && selectedImage !== existingImage) {
        // Si hay una nueva imagen, usar el método con imagen
        response = await presentacionApi.updatePresentacionWithImage(
          id,
          presentacionData,
          selectedImage
        );
      } else {
        // Sin cambios en la imagen o eliminación
        response = await presentacionApi.updatePresentacion(
          id,
          presentacionData
        );
      }
      
      if (response) {
        Alert.alert(
          'Presentación Actualizada',
          'La presentación ha sido actualizada exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back() 
            }
          ]
        );
        
        // Refrescar la lista
        fetchData();
        
        return true;
      } else {
        throw new Error('No se pudo actualizar la presentación');
      }
    } catch (error) {
      console.error('Error al actualizar presentación:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al actualizar la presentación';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedImage, existingImage, removeExistingImage, validate, fetchData]);

  // Método directo para eliminar sin confirmación (usado por componentes de más alto nivel)
  const deletePresentacion = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true);
      // Usar directamente deleteItem sin alerts adicionales
      const success = await deleteItem(id);
      if (success) {
        // Refrescar data después de eliminar
        fetchData();
      }
      return success;
    } catch (error) {
      console.error('Error al eliminar presentación:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteItem, fetchData]);

  // No usar Alert.alert sino el componente ConfirmationDialog controlado desde fuera
  const confirmDelete = useCallback((id: number) => {
    // Esta función ahora solo debe pasarse al componente superior
    // para que gestione la confirmación con ConfirmationDialog
    return deletePresentacion(id);
  }, [deletePresentacion]);

  // Obtener color asociado al tipo de presentación
  const getTipoColor = useCallback((tipo: string) => {
    switch (tipo) {
      case 'bruto': return '#2196F3'; // Azul
      case 'procesado': return '#4CAF50'; // Verde
      case 'merma': return '#FFC107'; // Amarillo
      case 'briqueta': return '#9C27B0'; // Púrpura
      case 'detalle': return '#FF5722'; // Naranja
      default: return '#757575'; // Gris
    }
  }, []);

  // Obtener etiqueta legible para el tipo de presentación
  const getTipoLabel = useCallback((tipo: string) => {
    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }, []);

  // Calcular estadísticas
  const getEstadisticas = useCallback(() => {
    return {
      totalPresentaciones: pagination.totalItems,
      presentacionesActivas: presentaciones.filter(p => p.activo).length,
      tipoBreakdown: {
        bruto: presentaciones.filter(p => p.tipo === 'bruto').length,
        procesado: presentaciones.filter(p => p.tipo === 'procesado').length,
        merma: presentaciones.filter(p => p.tipo === 'merma').length,
        briqueta: presentaciones.filter(p => p.tipo === 'briqueta').length,
        detalle: presentaciones.filter(p => p.tipo === 'detalle').length
      },
      precioPromedio: presentaciones.length > 0 
        ? (presentaciones.reduce((sum, p) => sum + parseFloat(p.precio_venta), 0) / presentaciones.length).toFixed(2)
        : '0.00'
    };
  }, [presentaciones, pagination.totalItems]);

  // Obtener opciones para selector de productos
  const getProductoOptions = useCallback(() => {
    return productos.map(producto => ({
      value: producto.id.toString(),
      label: producto.nombre
    }));
  }, [productos]);

  // Restablecer formulario
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    setSelectedImage(null);
    setExistingImage(null);
    setRemoveExistingImage(false);
  }, []);

  // Manejar selección de imagen
  const handleImageSelection = useCallback((uri: string | null) => {
    if (uri) {
      setSelectedImage(uri);
      setRemoveExistingImage(false);
    } else {
      setSelectedImage(null);
    }
  }, []);

  // Manejar eliminación de imagen
  const handleImageRemoval = useCallback(() => {
    setSelectedImage(null);
    setRemoveExistingImage(true);
  }, []);

  return {
    // Estados
    presentaciones,
    productos,
    isLoading,
    isLoadingProductos,
    isSubmitting,
    error,
    formData,
    errors,
    pagination,
    selectedImage,
    existingImage,
    removeExistingImage,
    columns,
    
    // Acciones para formulario
    handleChange,
    setFormData,
    setErrors,
    setSelectedImage,
    setExistingImage,
    setRemoveExistingImage,
    validate,
    handleImageSelection,
    handleImageRemoval,
    
    // Operaciones CRUD
    loadProductos,
    loadPresentacionForEdit,
    createPresentacion,
    updatePresentacion,
    deletePresentacion: deleteItem,
    confirmDelete,
    getPresentacion: getItem,     // Exportar también como getPresentacion para compatibilidad
    getItem,
    
    // Operaciones de paginación
    handlePageChange,
    handleItemsPerPageChange,
    refresh: fetchData,
    
    // Utilidades
    getTipoColor,
    getTipoLabel,
    getEstadisticas,
    getProductoOptions,
    resetForm,
    
    // Constantes
    TIPOS_PRESENTACION
  };
}