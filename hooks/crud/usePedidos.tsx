import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { useForm } from '../useForm';
import { useAuth } from '@/context/AuthContext';
import { Pedido, PedidoDetalle, ClienteSimple, Presentacion } from '@/models';
import { pedidoApi, clienteApi, productoApi } from '@/services/api';

// Tipos para la paginación
interface PaginationState {
  page: number;
  perPage: number;
  lastPage: number;
  total: number;
}

// Estado inicial para el formulario de pedidos
const initialFormData = {
  cliente_id: '',
  almacen_id: '',
  fecha_entrega: new Date().toISOString().split('T')[0],
  estado: 'programado' as 'programado' | 'confirmado' | 'entregado' | 'cancelado',
  notas: '',
  detalles: [] as {
    id?: number;
    presentacion_id: string;
    cantidad: string;
    precio_estimado: string;
  }[]
};

// Tipos posibles para el estado del pedido
export const ESTADOS_PEDIDO: Array<'programado' | 'confirmado' | 'entregado' | 'cancelado'> = [
  'programado',
  'confirmado',
  'entregado',
  'cancelado'
];

// Hook principal de pedidos
export const usePedidos = () => {
  const { user } = useAuth();
  
  // Estados principales
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [clientes, setClientes] = useState<ClienteSimple[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  
  // Estado para paginación
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    perPage: 10,
    lastPage: 1,
    total: 0,
  });
  
  // Estado para ordenamiento
  const [sortBy, setSortBy] = useState('fecha_entrega');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Usar el hook de formulario para manejar el estado
  const form = useForm(initialFormData);
  
  // Reglas de validación
  const validationRules = {
    cliente_id: (value: string) => !value ? 'El cliente es requerido' : null,
    almacen_id: (value: string) => !value ? 'El almacén es requerido' : null,
    fecha_entrega: (value: string) => !value ? 'La fecha de entrega es requerida' : null,
    detalles: (value: any[]) => !value.length ? 'Debe agregar al menos un producto al pedido' : null
  };
  
  // Cargar clientes y presentaciones (opciones para selectores)
  const loadOptions = useCallback(async () => {
    try {
      setIsLoadingOptions(true);
      setError(null);
      
      // Usar las APIs existentes para obtener los datos necesarios
      // Por ahora solo cargamos los clientes, las presentaciones se implementarían después
      const clientesResponse = await clienteApi.getClientes();
      setClientes(clientesResponse?.data || []);
      
      // Para las presentaciones, usamos un array vacío por ahora
      // Esto se implementaría cuando se cree el endpoint correspondiente
      setPresentaciones([]);
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
  
  // Cargar listado de pedidos
  const loadPedidos = useCallback(async (page = pagination.page, perPage = pagination.perPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await pedidoApi.getPedidos(page, perPage);
      
      if (response) {
        setPedidos(response.data || []);
        setPagination({
          page: response.pagination.page || 1,
          perPage: response.pagination.per_page || 10,
          lastPage: response.pagination.pages || 1,
          total: response.pagination.total || 0,
        });
      } else {
        setError('No se pudieron cargar los pedidos');
      }
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      setError('Error al cargar pedidos');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.perPage]);
  
  // Manejar cambio de página
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    loadPedidos(newPage, pagination.perPage);
  }, [loadPedidos, pagination.perPage]);
  
  // Manejar cambio de elementos por página
  const handlePerPageChange = useCallback((newPerPage: number) => {
    setPagination(prev => ({ ...prev, perPage: newPerPage, page: 1 }));
    loadPedidos(1, newPerPage);
  }, [loadPedidos]);
  
  // Manejar ordenamiento
  const handleSort = useCallback((key: string) => {
    if (key === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  }, [sortBy]);
  
  // Cargar detalle de un pedido
  const loadPedido = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await pedidoApi.getPedido(id);
      
      if (response) {
        setPedido(response);
      } else {
        setError('No se pudo cargar el pedido');
      }
    } catch (err) {
      console.error(`Error al cargar pedido ID ${id}:`, err);
      setError('Error al cargar detalles del pedido');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Cargar pedido para edición
  const loadPedidoForEdit = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Asegurar que las opciones estén cargadas
      await loadOptions();
      
      const pedidoData = await pedidoApi.getPedido(id);
      
      if (pedidoData) {
        // Asegurarnos de que la fecha es al menos la fecha actual
        const fechaEntrega = pedidoData.fecha_entrega?.split('T')[0] || new Date().toISOString().split('T')[0];
        
        form.setFormData({
          cliente_id: pedidoData.cliente_id?.toString() || '',
          almacen_id: pedidoData.almacen_id?.toString() || '',
          fecha_entrega: fechaEntrega,
          estado: pedidoData.estado || 'programado',
          notas: pedidoData.notas || '',
          detalles: pedidoData.detalles ? pedidoData.detalles.map(d => ({
            id: d.id,
            presentacion_id: d.presentacion_id?.toString() || '',
            cantidad: d.cantidad?.toString() || '1',
            precio_estimado: d.precio_estimado || '0.00'
          })) : []
        });
        
        setPedido(pedidoData);
      } else {
        setError('No se pudo cargar los datos del pedido');
      }
    } catch (err) {
      console.error('Error al cargar pedido para edición:', err);
      setError('No se pudo cargar los datos necesarios');
    } finally {
      setIsLoading(false);
    }
  }, [form, loadOptions]);
  
  // Crear nuevo pedido
  const createPedido = useCallback(async () => {
    const { formData } = form;
    
    try {
      // Validar que haya al menos un detalle
      if (!formData.detalles || formData.detalles.length === 0) {
        Alert.alert('Error', 'Debe agregar al menos un producto al pedido');
        return false;
      }
      
      const pedidoData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: user?.almacen_id || 0,
        fecha_entrega: `${formData.fecha_entrega}T00:00:00Z`,
        estado: formData.estado,
        notas: formData.notas,
        detalles: formData.detalles.map(d => ({
          presentacion_id: parseInt(d.presentacion_id),
          cantidad: parseInt(d.cantidad),
          precio_estimado: d.precio_estimado
        }))
      };
      
      const response = await pedidoApi.createPedido(pedidoData);
      
      if (response) {
        Alert.alert(
          'Proyección Registrada',
          'La proyección ha sido registrada exitosamente',
          [{ text: 'OK', onPress: () => router.replace('/pedidos') }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo registrar la proyección');
        return false;
      }
    } catch (err) {
      console.error('Error al crear pedido:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al registrar la proyección';
      Alert.alert('Error', errorMessage);
      return false;
    }
  }, [form, user?.almacen_id]);
  
  // Actualizar pedido existente
  const updatePedido = useCallback(async (id: number) => {
    const { formData } = form;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Validar el formulario
      const hasErrors = Object.keys(validationRules).some(field => {
        const error = validationRules[field as keyof typeof validationRules](formData[field as keyof typeof formData]);
        if (error) {
          form.setErrors({ ...form.errors, [field]: error });
          return true;
        }
        return false;
      });
      
      if (hasErrors) {
        setIsLoading(false);
        return false;
      }
      
      // Preparar datos para actualizar
      const updateData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id || '0'),
        fecha_entrega: `${formData.fecha_entrega}T00:00:00Z`,
        estado: formData.estado,
        notas: formData.notas,
        detalles: formData.detalles.map(d => ({
          id: d.id, // Mantener ID si existe (para actualizar)
          presentacion_id: parseInt(d.presentacion_id),
          cantidad: parseInt(d.cantidad),
          precio_estimado: d.precio_estimado
        }))
      };
      
      // Intenta hacer la actualización 
      const response = await pedidoApi.updatePedido(id, updateData);
      
      if (response) {
        Alert.alert(
          'Proyección Actualizada',
          'La proyección ha sido actualizada exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo actualizar la proyección');
        return false;
      }
    } catch (err) {
      console.error('Error al actualizar pedido:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar la proyección';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [form, validationRules]);
  
  // Eliminar pedido
  const deletePedido = useCallback(async (id: number, shouldRedirect = true) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await pedidoApi.deletePedido(id);
      
      if (result) {
        // Si se solicitó redirección, redirigir al listado
        if (shouldRedirect) {
          Alert.alert(
            'Eliminado',
            'La proyección ha sido eliminada correctamente',
            [{ text: 'OK', onPress: () => router.replace('/pedidos') }]
          );
        } else {
          // Si no hay que redirigir, solo recargar la lista
          loadPedidos();
          Alert.alert('Eliminado', 'La proyección ha sido eliminada correctamente');
        }
        return true;
      } else {
        setError('No se pudo eliminar la proyección');
        return false;
      }
    } catch (err) {
      console.error('Error al eliminar pedido:', err);
      setError('Error al eliminar la proyección');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadPedidos]);
  
  // Confirmar eliminación
  const confirmDelete = useCallback((id: number, shouldRedirect = true) => {
    Alert.alert(
      "Eliminar Proyección",
      "¿Está seguro que desea eliminar esta proyección?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deletePedido(id, shouldRedirect)
        }
      ]
    );
  }, []);
  
  // Obtener color para el estado
  const getStateColor = useCallback((state: string) => {
    switch (state.toLowerCase()) {
      case 'programado': return '#FFC107'; // Amarillo
      case 'confirmado': return '#2196F3'; // Azul
      case 'entregado': return '#4CAF50'; // Verde
      case 'cancelado': return '#F44336'; // Rojo
      default: return '#757575'; // Gris para otros casos
    }
  }, []);
  
  // Calcular estadísticas de pedidos
  const getEstadisticas = useCallback(() => {
    return {
      total: pagination.total,
      programados: pedidos.filter(p => p.estado === 'programado').length,
      confirmados: pedidos.filter(p => p.estado === 'confirmado').length,
      entregados: pedidos.filter(p => p.estado === 'entregado').length,
      cancelados: pedidos.filter(p => p.estado === 'cancelado').length,
    };
  }, [pedidos, pagination.total]);
  
  // Función para manejar la adición de detalles al pedido
  const handleAddDetalle = useCallback((detalle: {
    presentacion_id: string;
    cantidad: string;
    precio_estimado: string;
  }) => {
    form.setFormData(prev => ({
      ...prev,
      detalles: [...prev.detalles, detalle]
    }));
  }, [form]);
  
  // Función para eliminar un detalle del pedido
  const handleRemoveDetalle = useCallback((index: number) => {
    form.setFormData(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }));
  }, [form]);
  
  // Resetear el formulario
  const resetForm = useCallback(() => {
    form.setFormData(initialFormData);
  }, [form]);
  
  // Funciones para manejar detalles de productos en el pedido
  
  // Agregar un producto al pedido
  const agregarProducto = useCallback((presentacionId: string, cantidad: string, precioEstimado: string) => {
    const detalleExistente = form.formData.detalles.findIndex(
      d => d.presentacion_id === presentacionId
    );
    
    if (detalleExistente >= 0) {
      // Si ya existe, actualizamos la cantidad sumando la nueva cantidad
      const cantidadActual = parseInt(form.formData.detalles[detalleExistente].cantidad || '0');
      const nuevaCantidad = cantidadActual + parseInt(cantidad || '0');
      
      const nuevosDetalles = [...form.formData.detalles];
      nuevosDetalles[detalleExistente] = {
        ...nuevosDetalles[detalleExistente],
        cantidad: nuevaCantidad.toString()
      };
      
      form.handleChange('detalles', nuevosDetalles);
    } else {
      // Si no existe, lo agregamos al array de detalles
      const nuevoDetalle = {
        presentacion_id: presentacionId,
        cantidad: cantidad,
        precio_estimado: precioEstimado
      };
      
      form.handleChange('detalles', [...form.formData.detalles, nuevoDetalle]);
    }
  }, [form]);
  
  // Actualizar un producto en el pedido
  const actualizarProducto = useCallback((index: number, campo: string, valor: string) => {
    const nuevosDetalles = [...form.formData.detalles];
    
    // Verificar que el índice sea válido
    if (index >= 0 && index < nuevosDetalles.length) {
      // Actualizar el campo específico
      nuevosDetalles[index] = {
        ...nuevosDetalles[index],
        [campo]: valor
      };
      
      form.handleChange('detalles', nuevosDetalles);
    }
  }, [form]);
  
  // Eliminar un producto del pedido
  const eliminarProducto = useCallback((index: number) => {
    const nuevosDetalles = [...form.formData.detalles];
    
    // Verificar que el índice sea válido
    if (index >= 0 && index < nuevosDetalles.length) {
      nuevosDetalles.splice(index, 1);
      form.handleChange('detalles', nuevosDetalles);
    }
  }, [form]);
  
  // Calcular el total del pedido
  const calcularTotal = useCallback(() => {
    const total = form.formData.detalles.reduce((sum, detalle) => {
      const cantidad = parseInt(detalle.cantidad || '0');
      const precio = parseFloat(detalle.precio_estimado || '0');
      return sum + (cantidad * precio);
    }, 0);
    
    return total.toFixed(2);
  }, [form.formData.detalles]);
  
  return {
    // Estado
    pedidos,
    pedido,
    isLoading,
    isLoadingOptions,
    error,
    pagination: {
      currentPage: pagination.page,
      totalPages: pagination.lastPage,
      itemsPerPage: pagination.perPage,
      totalItems: pagination.total,
      onPageChange: handlePageChange,
      onItemsPerPageChange: handlePerPageChange
    },
    sortBy,
    sortOrder,
    clientes,
    presentaciones,
    form,
    validationRules,
    
    // Funciones
    loadPedidos,
    loadPedido,
    loadPedidoForEdit,
    handleSort,
    createPedido,
    updatePedido,
    deletePedido,
    confirmDelete,
    getEstadisticas,
    getStateColor,
    handleAddDetalle,
    handleRemoveDetalle,
    resetForm,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    calcularTotal
  };
}; 