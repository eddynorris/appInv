import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { presentacionApi, productoApi, API_CONFIG } from '@/services/api';
import { Presentacion, ProductoSimple } from '@/models';
import { useForm } from '@/hooks/useForm';
import { useImageUploader, FileInfo } from '@/hooks/useImageUploader';
import { router } from 'expo-router';

// Tipos de presentación permitidos
export const TIPOS_PRESENTACION: Array<'bruto' | 'procesado' | 'merma' | 'briqueta' | 'detalle'> = [
  'bruto',
  'procesado',
  'merma',
  'briqueta',
  'detalle'
];

// Valores iniciales del formulario
const initialFormValues = {
  producto_id: '',
  nombre: '',
  capacidad_kg: '',
  tipo: 'bruto' as typeof TIPOS_PRESENTACION[number],
  precio_venta: '',
  activo: true,
};

// Reglas de validación para el formulario
const validationRules = {
  producto_id: (value: string) => !value ? 'Seleccione un producto base' : null,
  nombre: (value: string) => !value.trim() ? 'El nombre es requerido' : null,
  capacidad_kg: (value: string) => {
    if (!value.trim()) return 'La capacidad es requerida';
    const numValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numValue) || numValue <= 0) return 'Ingrese una capacidad válida';
    return null;
  },
  precio_venta: (value: string) => {
    if (!value.trim()) return 'El precio es requerido';
    const numValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numValue) || numValue < 0) return 'Ingrese un precio válido'; // Permite 0
    return null;
  },
  tipo: (value: string) => !TIPOS_PRESENTACION.includes(value as any) ? 'Seleccione un tipo válido' : null,
};

export function usePresentacionItem() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<ProductoSimple[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null); // Para mostrar imagen actual en edit

  // Hook para el formulario
  const form = useForm<typeof initialFormValues>(initialFormValues);

  // Hook para la imagen
  const imageUploader = useImageUploader({
    maxSizeMB: 5,
    allowedTypes: ['image'], // Solo imágenes para presentaciones
  });

  // Cargar productos para el selector
  const loadProductos = useCallback(async () => {
    if (productos.length > 0) return; // Evitar recargar si ya están
    setIsLoadingOptions(true);
    setError(null);
    try {
      // Obtener *todos* los productos simples para el selector
      const response = await productoApi.getProductos(1, 999);
      setProductos(response.data);
    } catch (err) {
      console.error('Error fetching productos:', err);
      setError('No se pudieron cargar los productos base');
    } finally {
      setIsLoadingOptions(false);
    }
  }, [productos.length]);

  // Obtener una presentación específica
  const getPresentacion = useCallback(async (id: number): Promise<Presentacion | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await presentacionApi.getPresentacion(id);
      // Establecer la URL de la imagen existente si la hay
      setExistingImageUrl(data.url_foto ? API_CONFIG.getImageUrl(data.url_foto) : null);
      return data;
    } catch (err) {
      console.error('Error getting presentacion item:', err);
      const message = err instanceof Error ? err.message : 'Error al obtener la presentación';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar una presentación para edición
  const loadPresentacionForEdit = useCallback(async (id: number): Promise<Presentacion | null> => {
    setIsLoading(true);
    setIsLoadingOptions(true);
    setError(null);
    form.resetForm(); // Resetear formulario antes de cargar
    imageUploader.clearFile(); // Limpiar imagen seleccionada
    setExistingImageUrl(null); // Limpiar imagen existente

    try {
      // Cargar productos primero
      await loadProductos();
      const presentacion = await getPresentacion(id);

      if (presentacion) {
        // Llenar el formulario con los datos existentes
        form.setValues({
          producto_id: presentacion.producto_id?.toString() || '',
          nombre: presentacion.nombre || '',
          capacidad_kg: presentacion.capacidad_kg || '',
          tipo: presentacion.tipo || TIPOS_PRESENTACION[0],
          precio_venta: presentacion.precio_venta || '',
          activo: presentacion.activo !== undefined ? presentacion.activo : true,
        });
        // Establecer la URL de la imagen existente (ya se hace en getPresentacion)
        // setExistingImageUrl(presentacion.url_foto ? API_CONFIG.getImageUrl(presentacion.url_foto) : null);
        return presentacion;
      } else {
        setError('No se pudo cargar la información de la presentación');
        return null;
      }
    } catch (error) {
      console.error('Error al cargar presentación para edición:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar la presentación';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
      setIsLoadingOptions(false);
    }
  }, [form, getPresentacion, loadProductos, imageUploader]);

  // Preparar formulario para creación
  const prepareForCreate = useCallback(async () => {
    setIsLoadingOptions(true);
    setError(null);
    form.resetForm();
    imageUploader.clearFile();
    setExistingImageUrl(null);
    try {
      await loadProductos();
    } finally {
      setIsLoadingOptions(false);
    }
  }, [form, loadProductos, imageUploader]);

  // Crear una nueva presentación
  const createPresentacion = useCallback(async (formData: typeof initialFormValues): Promise<Presentacion | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const dataToSubmit: Partial<Presentacion> & { url_foto?: any } = {
        producto_id: parseInt(formData.producto_id),
        nombre: formData.nombre,
        capacidad_kg: formData.capacidad_kg.replace(',', '.'),
        tipo: formData.tipo,
        precio_venta: formData.precio_venta.replace(',', '.'),
        activo: formData.activo,
      };

      let response;
      if (imageUploader.file) {
        response = await presentacionApi.createPresentacionWithImage(dataToSubmit, imageUploader.file.uri);
      } else {
        response = await presentacionApi.createPresentacion(dataToSubmit);
      }

      Alert.alert('Éxito', 'Presentación creada correctamente');
      imageUploader.clearFile(); // Limpiar imagen después de crear
      router.replace('/presentaciones'); // Redirigir a la lista
      return response;
    } catch (err) {
      console.error('Error creating presentacion:', err);
      const message = err instanceof Error ? err.message : 'Error al crear la presentación';
      setError(message);
      Alert.alert('Error', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [imageUploader]);

  // Actualizar una presentación
  const updatePresentacion = useCallback(async (id: number, formData: typeof initialFormValues): Promise<Presentacion | null> => {
    setIsLoading(true);
    setError(null);
    try {
       const dataToSubmit: Partial<Presentacion> & { url_foto?: any } = {
        producto_id: parseInt(formData.producto_id),
        nombre: formData.nombre,
        capacidad_kg: formData.capacidad_kg.replace(',', '.'),
        tipo: formData.tipo,
        precio_venta: formData.precio_venta.replace(',', '.'),
        activo: formData.activo,
      };

      let response;
      if (imageUploader.file) {
        response = await presentacionApi.updatePresentacionWithImage(id, dataToSubmit, imageUploader.file.uri);
      } else {
        response = await presentacionApi.updatePresentacion(id, dataToSubmit);
      }

      Alert.alert('Éxito', 'Presentación actualizada correctamente');
      imageUploader.clearFile(); // Limpiar imagen después de actualizar
      router.replace(`/presentaciones/${id}`); // Redirigir a detalles
      return response;
    } catch (err) {
      console.error('Error updating presentacion:', err);
      const message = err instanceof Error ? err.message : 'Error al actualizar la presentación';
      setError(message);
      Alert.alert('Error', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [imageUploader]);

  // Eliminar (ya se maneja en el hook de lista, pero se puede añadir aquí si se necesita desde detalles/edit)
  const deletePresentacion = useCallback(async (id: number): Promise<boolean> => {
     return new Promise((resolve) => {
       Alert.alert(
         'Confirmar Eliminación',
         '¿Está seguro que desea eliminar esta presentación? Esta acción no se puede deshacer.',
         [
           { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
           {
             text: 'Eliminar',
             style: 'destructive',
             onPress: async () => {
               setIsLoading(true);
               setError(null);
               try {
                 await presentacionApi.deletePresentacion(id);
                 Alert.alert('Éxito', 'Presentación eliminada.');
                 router.replace('/presentaciones'); // Ir a la lista
                 resolve(true);
               } catch (err) {
                 const message = err instanceof Error ? err.message : 'Error al eliminar';
                 setError(message);
                 Alert.alert('Error', message);
                 resolve(false);
               } finally {
                 setIsLoading(false);
               }
             },
           },
         ]
       );
     });
  }, []);


  return {
    // Estado
    isLoading,
    isLoadingOptions,
    error,
    setError,

    // Formulario
    form,
    validationRules,

    // Datos relacionados
    productos,
    tiposPresentacion: TIPOS_PRESENTACION,

    // Gestión de imagen
    imageUploader,
    existingImageUrl,

    // Funciones CRUD
    getPresentacion,
    loadPresentacionForEdit,
    prepareForCreate,
    createPresentacion,
    updatePresentacion,
    deletePresentacion // Opcional aquí
  };
} 