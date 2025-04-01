// hooks/crud/useVentas.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useApiResource } from '@/hooks/useApiResource';
import { ventaApi, clienteApi, almacenApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Venta, Cliente, Almacen, Presentacion } from '@/models';
import { ThemedText } from '@/components/ThemedText';

// Interfaz para detalles de venta en el formulario
export interface DetalleVentaForm {
  presentacion_id: string;
  cantidad: string;
  precio_unitario: string;
}

// Interfaz para formulario de venta
export interface VentaForm {
  cliente_id: string;
  almacen_id: string;
  fecha: string;
  tipo_pago: 'contado' | 'credito';
  estado_pago?: 'pendiente' | 'parcial' | 'pagado';
  consumo_diario_kg?: string;
}

export function useVentas() {
  const { user } = useAuth();
  
  // Usa el hook genérico para CRUD de ventas
  const {
    data: ventas,
    isLoading,
    error,
    pagination,
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deleteItem,
    getItem
  } = useApiResource<Venta>({
    initialParams: { page: 1, perPage: 10 },
    fetchFn: ventaApi.getVentas,
    deleteFn: ventaApi.deleteVenta,
    getFn: ventaApi.getVenta
  });

  // Estado para formulario de ventas
  const [formData, setFormData] = useState<VentaForm>({
    cliente_id: '',
    almacen_id: user?.almacen_id?.toString() || '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_pago: 'contado',
    consumo_diario_kg: ''
  });

  // Estado para detalles de productos en la venta
  const [detalles, setDetalles] = useState<DetalleVentaForm[]>([]);
  
  // Estado para errores de validación
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estado para indicar si se está procesando el envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para datos adicionales
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // Definición de columnas para tabla de ventas
  const columns = useMemo(() => [
    {
      id: 'id',
      label: 'ID',
      width: 0.5,
    },
    {
      id: 'fecha',
      label: 'Fecha',
      width: 1,
      render: (item: Venta) => <ThemedText>{new Date(item.fecha).toLocaleDateString()}</ThemedText>,
    },
    {
      id: 'cliente',
      label: 'Cliente',
      width: 1.5,
      render: (item: Venta) => <ThemedText>{item.cliente?.nombre || '-'}</ThemedText>,
    },
    {
      id: 'total',
      label: 'Total',
      width: 1,
      render: (item: Venta) => <ThemedText>${parseFloat(item.total).toFixed(2)}</ThemedText>,
    },
    {
      id: 'estado_pago',
      label: 'Estado',
      width: 1,
      render: (item: Venta) => {
        let color = '#757575'; // Gris por defecto
        
        switch (item.estado_pago) {
          case 'pagado':
            color = '#4CAF50'; // Verde
            break;
          case 'pendiente':
            color = '#FFC107'; // Amarillo
            break;
          case 'parcial':
            color = '#FF9800'; // Naranja
            break;
        }
        
        return (
          <ThemedText style={{ color, fontWeight: '500', textTransform: 'capitalize' }}>
            {item.estado_pago}
          </ThemedText>
        );
      },
    },
  ], []);

  // Cargar datos relacionados (clientes y almacenes)
  const loadRelatedData = useCallback(async () => {
    try {
      setIsLoadingRelated(true);
      
      // Obtener clientes y almacenes en paralelo
      const [clientesRes, almacenesRes] = await Promise.all([
        clienteApi.getClientes(1, 100),
        almacenApi.getAlmacenes(1, 100)
      ]);
      
      // Actualizar el estado
      if (clientesRes?.data) setClientes(clientesRes.data);
      if (almacenesRes?.data) setAlmacenes(almacenesRes.data);
      
      // Inicializar el formulario con valores predeterminados
      if (clientesRes?.data?.length > 0) {
        setFormData(prev => ({
          ...prev,
          cliente_id: clientesRes.data[0].id.toString()
        }));
      }
      
      // Si el usuario tiene un almacén asignado, usarlo por defecto
      if (user?.almacen_id) {
        setFormData(prev => ({
          ...prev,
          almacen_id: user.almacen_id.toString()
        }));
      } else if (almacenesRes?.data?.length > 0) {
        // Si no, usar el primer almacén de la lista
        setFormData(prev => ({
          ...prev,
          almacen_id: almacenesRes.data[0].id.toString()
        }));
      }
    } catch (error) {
      console.error('Error cargando datos relacionados:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
    } finally {
      setIsLoadingRelated(false);
    }
  }, [user]);

  // Manejar cambios en el formulario
  const handleChange = useCallback((field: keyof VentaForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error cuando cambia el valor
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Agregar producto a la venta
  const agregarProducto = useCallback((
    presentacionId: string, 
    cantidad: string = '1', 
    precioUnitario: string = '0'
  ) => {
    // Verificar si ya existe
    const existe = detalles.some(d => d.presentacion_id === presentacionId);
    if (existe) {
      return false;
    }
    
    // Agregar nuevo detalle
    setDetalles(prev => [
      ...prev,
      {
        presentacion_id: presentacionId,
        cantidad,
        precio_unitario: precioUnitario
      }
    ]);
    
    return true;
  }, [detalles]);

  // Actualizar producto existente
  const actualizarProducto = useCallback((
    index: number, 
    field: keyof DetalleVentaForm, 
    value: string
  ) => {
    const newDetalles = [...detalles];
    
    // Validaciones específicas según el campo
    if (field === 'cantidad') {
      const numValue = value.replace(/[^0-9]/g, '');
      newDetalles[index] = { 
        ...newDetalles[index], 
        [field]: numValue === '' ? '1' : numValue
      };
    } 
    else if (field === 'precio_unitario') {
      const precio = value.replace(/[^0-9.,]/g, '').replace(',', '.');
      if (precio === '' || /^\d+(\.\d{0,2})?$/.test(precio)) {
        newDetalles[index] = { ...newDetalles[index], [field]: precio };
      }
    } 
    else {
      newDetalles[index] = { ...newDetalles[index], [field]: value };
    }
    
    setDetalles(newDetalles);
  }, [detalles]);

  // Eliminar producto
  const eliminarProducto = useCallback((index: number) => {
    setDetalles(prev => {
      const newDetalles = [...prev];
      newDetalles.splice(index, 1);
      return newDetalles;
    });
  }, []);

  // Calcular total de la venta
  const calcularTotal = useCallback(() => {
    return detalles.reduce((total, detalle) => {
      const cantidad = parseInt(detalle.cantidad || '0');
      const precio = parseFloat(detalle.precio_unitario || '0');
      return total + (cantidad * precio);
    }, 0).toFixed(2);
  }, [detalles]);

  // Validar formulario
  const validarFormulario = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cliente_id) {
      newErrors.cliente_id = 'El cliente es requerido';
    }
    
    if (!formData.almacen_id) {
      newErrors.almacen_id = 'El almacén es requerido';
    }
    
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }
    
    if (detalles.length === 0) {
      newErrors.detalles = 'Debe agregar al menos un producto';
    }
    
    // Validar cada detalle
    detalles.forEach((detalle, index) => {
      if (!detalle.presentacion_id) {
        newErrors[`detalle_${index}_presentacion`] = 'La presentación es requerida';
      }
      
      if (!detalle.cantidad || parseInt(detalle.cantidad) <= 0) {
        newErrors[`detalle_${index}_cantidad`] = 'La cantidad debe ser mayor a 0';
      }
      
      if (!detalle.precio_unitario || parseFloat(detalle.precio_unitario) <= 0) {
        newErrors[`detalle_${index}_precio`] = 'El precio debe ser mayor a 0';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, detalles]);

  // Crear venta
  const crearVenta = useCallback(async () => {
    if (!validarFormulario()) {
      return null;
    }
    
    try {
      setIsSubmitting(true);
      
      // Preparar datos con el formato correcto para la API
      const ventaData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id),
        tipo_pago: formData.tipo_pago,
        detalles: detalles.map(d => ({
          presentacion_id: parseInt(d.presentacion_id),
          cantidad: parseInt(d.cantidad || '1'),
          precio_unitario: parseFloat(d.precio_unitario || '0')
        }))
      };
      
      // Solo añadir campos opcionales si tienen valor válido
      if (formData.fecha && formData.fecha !== new Date().toISOString().split('T')[0]) {
        ventaData['fecha'] = `${formData.fecha}T00:00:00Z`;
      }
      
      if (formData.consumo_diario_kg && parseFloat(formData.consumo_diario_kg) > 0) {
        ventaData['consumo_diario_kg'] = formData.consumo_diario_kg;
      }
      
      console.log('Enviando datos de venta:', ventaData);
      const response = await ventaApi.createVenta(ventaData);
      
      if (response) {
        // Refrescar la lista después de crear
        fetchData();
        
        // Mostrar mensaje de éxito
        Alert.alert(
          'Venta Creada',
          'La venta ha sido registrada exitosamente',
          [{ text: 'OK', onPress: () => router.replace('/ventas') }]
        );
      }
      
      return response;
    } catch (error) {
      console.error('Error al crear venta:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al crear la venta');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, detalles, validarFormulario, fetchData]);

  // Actualizar venta existente
  const actualizarVenta = useCallback(async (id: number) => {
    if (!formData.cliente_id || !formData.almacen_id) {
      setErrors({
        ...(formData.cliente_id ? {} : { cliente_id: 'El cliente es requerido' }),
        ...(formData.almacen_id ? {} : { almacen_id: 'El almacén es requerido' })
      });
      return null;
    }
    
    try {
      setIsSubmitting(true);
      
      // Para actualización solo enviamos datos básicos
      const ventaData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id),
        fecha: formData.fecha,
        tipo_pago: formData.tipo_pago,
        estado_pago: formData.estado_pago
      };
      
      if (formData.consumo_diario_kg && parseFloat(formData.consumo_diario_kg) > 0) {
        ventaData['consumo_diario_kg'] = formData.consumo_diario_kg;
      }
      
      const response = await ventaApi.updateVenta(id, ventaData);
      
      if (response) {
        // Refrescar la lista después de actualizar
        fetchData();
        
        // Mostrar mensaje de éxito
        Alert.alert(
          'Venta Actualizada',
          'La venta ha sido actualizada exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
      
      return response;
    } catch (error) {
      console.error('Error al actualizar venta:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al actualizar la venta');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, fetchData]);

  // Cargar venta para edición
  const loadVenta = useCallback(async (id: number) => {
    try {
      const venta = await getItem(id);
      
      if (venta) {
        // Formatear los datos para el formulario
        setFormData({
          cliente_id: venta.cliente_id.toString(),
          almacen_id: venta.almacen_id.toString(),
          fecha: venta.fecha.split('T')[0],
          tipo_pago: venta.tipo_pago as 'contado' | 'credito',
          estado_pago: venta.estado_pago as 'pendiente' | 'parcial' | 'pagado',
          consumo_diario_kg: venta.consumo_diario_kg || ''
        });
        
        // Cargar detalles si existen
        if (venta.detalles && venta.detalles.length > 0) {
          setDetalles(venta.detalles.map(d => ({
            presentacion_id: d.presentacion_id.toString(),
            cantidad: d.cantidad.toString(),
            precio_unitario: d.precio_unitario
          })));
        }
        
        return venta;
      }
      
      return null;
    } catch (error) {
      console.error('Error al cargar venta:', error);
      Alert.alert('Error', 'No se pudo cargar la venta');
      return null;
    }
  }, [getItem]);

  // Obtener estadísticas para el dashboard
  const getEstadisticas = useCallback(() => {
    const estadisticas = {
      total: ventas.reduce((sum, venta) => sum + parseFloat(venta.total), 0).toFixed(2),
      pagadas: ventas.filter(v => v.estado_pago === 'pagado').length,
      pendientes: ventas.filter(v => v.estado_pago === 'pendiente').length,
      parciales: ventas.filter(v => v.estado_pago === 'parcial').length,
    };
    
    return estadisticas;
  }, [ventas]);

  // Información sobre estado de pago
  const getEstadoPagoInfo = useCallback((estado: string) => {
    switch (estado) {
      case 'pagado':
        return { color: '#4CAF50', text: 'Pagado' };
      case 'pendiente':
        return { color: '#FFC107', text: 'Pendiente' };
      case 'parcial':
        return { color: '#FF9800', text: 'Pago Parcial' };
      default:
        return { color: '#757575', text: estado };
    }
  }, []);

  // Resetear estado para nueva venta
  const resetForm = useCallback(() => {
    setFormData({
      cliente_id: clientes.length > 0 ? clientes[0].id.toString() : '',
      almacen_id: user?.almacen_id?.toString() || 
                  (almacenes.length > 0 ? almacenes[0].id.toString() : ''),
      fecha: new Date().toISOString().split('T')[0],
      tipo_pago: 'contado',
      consumo_diario_kg: ''
    });
    setDetalles([]);
    setErrors({});
  }, [clientes, almacenes, user]);

  return {
    // Datos y estados
    ventas,
    formData,
    detalles,
    errors,
    isLoading,
    isLoadingRelated,
    isSubmitting,
    error,
    pagination,
    clientes,
    almacenes,
    columns,
    
    // Acciones CRUD
    loadRelatedData,
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deleteVenta: deleteItem,
    
    // Manipulación del formulario
    handleChange,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    setDetalles,
    
    // Operaciones complejas
    calcularTotal,
    validarFormulario,
    crearVenta,
    actualizarVenta,
    loadVenta,
    resetForm,
    
    // Utilidades
    getEstadisticas,
    getEstadoPagoInfo
  };
}