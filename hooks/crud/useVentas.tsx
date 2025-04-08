// hooks/crud/useVentas.tsx - Versión optimizada para reducir peticiones API
import { useState, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { useForm } from '../useForm';
import { useAuth } from '@/context/AuthContext';
import { Venta, VentaDetalle, Cliente, Almacen, Presentacion, Pago } from '@/models';
import { ventaApi, clienteApi, almacenApi, pagoApi } from '@/services/api';
import { useProductos } from '@/hooks/crud/useProductos';
import { ThemedText } from '@/components/ThemedText';

// Tipos simplificados
interface VentaForm {
  cliente_id: string;
  almacen_id: string;
  tipo_pago: 'contado' | 'credito';
  consumo_diario_kg: string;
  fecha: string;
  detalles: DetalleVentaForm[];
}

// Tipo para detalles de venta
export interface DetalleVentaForm {
  id?: number;
  presentacion_id: string;
  cantidad: string;
  precio_unitario: string;
}

// Estado inicial del formulario
const initialFormData: VentaForm = {
  cliente_id: '',
  almacen_id: '',
  tipo_pago: 'contado',
  consumo_diario_kg: '0',
  fecha: new Date().toISOString().split('T')[0],
  detalles: []
};

// Hook principal para gestión de ventas
export const useVentas = () => {
  const { user } = useAuth();
  // Estados principales
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Datos
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [venta, setVenta] = useState<Venta | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  
  // Paginación y filtros
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    lastPage: 1,
    total: 0
  });
  
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [filters, setFilters] = useState({
    cliente_id: '',
    almacen_id: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  
  // Referencias para evitar llamadas duplicadas
  const ventaCargadaRef = useRef(false);
  const ventaIdRef = useRef<number | null>(null);
  const optionsLoadedRef = useRef(false);
  const loadingPresentacionesRef = useRef(false);
  const almacenIdRef = useRef<string | null>(null);
  
  // Cache de presentaciones por almacén
  const [presentacionesCache, setPresentacionesCache] = useState<Record<string, Presentacion[]>>({});
  
  // Hook de productos optimizado con opciones
  const { 
    presentacionesFiltradas, 
    isLoading: isLoadingProductos,
    filtrarPorAlmacenId,
    cargarPresentaciones
  } = useProductos({ 
    filtrarPorAlmacen: true, 
    soloConStock: true,
    cargarAlInicio: false // No cargar automáticamente
  });
  
  // Formulario
  const form = useForm<VentaForm>(initialFormData);
  
  // Reglas de validación
  const validationRules = {
    cliente_id: (value: string) => !value ? 'El cliente es requerido' : null,
    almacen_id: (value: string) => !value ? 'El almacén es requerido' : null,
    tipo_pago: (value: string) => !value ? 'El tipo de pago es requerido' : null,
    fecha: (value: string) => !value ? 'La fecha es requerida' : null,
    consumo_diario_kg: (value: string) => value && isNaN(parseFloat(value)) ? 'Debe ser un número válido' : null,
    detalles: (detalles: VentaForm['detalles']) => !detalles || detalles.length === 0 ? 'Debe agregar al menos un producto' : null
  };

  // Columnas para la tabla de ventas (memoizadas)
  const columns = useMemo(() => [
    {
      id: 'fecha',
      label: 'Fecha',
      width: 1.5,
      sortable: true,
      render: (item: Venta) => {
        const fecha = new Date(item.fecha);
        return <ThemedText>{fecha.toLocaleDateString()}</ThemedText>;
      },
    },
    {
      id: 'cliente',
      label: 'Cliente',
      width: 2,
      sortable: true,
      render: (item: Venta) => <ThemedText>{item.cliente?.nombre || 'Sin cliente'}</ThemedText>,
    },
    {
      id: 'vendedor',
      label: 'Vendedor',
      width: 1.5,
      sortable: true,
      render: (item: Venta) => <ThemedText>{item.vendedor?.username || 'No asignado'}</ThemedText>,
    },
    {
      id: 'tipo_pago',
      label: 'Tipo',
      width: 1,
      sortable: true,
      render: (item: Venta) => (
        <ThemedText style={{ 
          color: item.tipo_pago === 'contado' ? '#4CAF50' : '#2196F3',
          fontWeight: '500'
        }}>
          {item.tipo_pago === 'contado' ? 'Contado' : 'Crédito'}
        </ThemedText>
      ),
    },
    {
      id: 'estado_pago',
      label: 'Estado',
      width: 1.2,
      sortable: true,
      render: (item: Venta) => {
        let color = '#757575';
        switch (item.estado_pago) {
          case 'pagado': color = '#4CAF50'; break;
          case 'parcial': color = '#FFC107'; break;
          case 'pendiente': color = '#F44336'; break;
        }
        return (
          <ThemedText style={{ color, fontWeight: '500' }}>
            {item.estado_pago.charAt(0).toUpperCase() + item.estado_pago.slice(1)}
          </ThemedText>
        );
      },
    },
    {
      id: 'total',
      label: 'Total',
      width: 1.2,
      sortable: true,
      render: (item: Venta) => (
        <ThemedText style={{ fontWeight: '500' }}>
          ${parseFloat(item.total).toFixed(2)}
        </ThemedText>
      ),
    },
  ], []);

  // Cargar opciones (clientes, almacenes) - Optimizado
  const loadOptions = useCallback(async () => {
    // Si ya hemos cargado opciones y tenemos datos, no es necesario volver a cargar
    if (optionsLoadedRef.current && clientes.length > 0 && almacenes.length > 0) {
      return { clientes, almacenes };
    }
    
    try {
      setIsLoadingOptions(true);
      
      // Cargar datos en paralelo para mayor eficiencia
      const [clientesRes, almacenesRes] = await Promise.all([
        clienteApi.getClientes(1, 100),
        almacenApi.getAlmacenes()
      ]);
      
      // Verificar y establecer datos
      if (clientesRes?.data) {
        setClientes(clientesRes.data);
      }
      
      if (almacenesRes?.data) {
        setAlmacenes(almacenesRes.data);
      }
      
      // Marcar como cargado
      optionsLoadedRef.current = true;
      
      return {
        clientes: clientesRes?.data || [],
        almacenes: almacenesRes?.data || []
      };
    } catch (error) {
      console.error('Error al cargar opciones:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar opciones');
      return { clientes: [], almacenes: [] };
    } finally {
      setIsLoadingOptions(false);
    }
  }, [clientes, almacenes]);

  // Cargar ventas (optimizado para reducir llamadas)
  const loadVentas = useCallback(async (page = pagination.page, perPage = pagination.perPage) => {
    try {
      // Evitar cargas redundantes si ya estamos en la página y tenemos datos
      if (page === pagination.page && ventas.length > 0 && !isLoading) {
        return ventas;
      }
      
      setIsLoading(true);
      console.log(`Cargando ventas (página ${page}, por página ${perPage})...`);
      
      // Construir parámetros de filtro
      const params = new URLSearchParams();
      if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);
      if (filters.almacen_id) params.append('almacen_id', filters.almacen_id);
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
      
      // Filtrar por vendedor si no es admin
      if (user && user.rol !== 'admin' && user.id) {
        params.append('vendedor_id', user.id.toString());
      }
      
      // Llamar a la API
      const response = await ventaApi.getVentas(page, perPage, params.toString());
      
      if (response?.data && response?.pagination) {
        setVentas(response.data);
        setPagination({
          page: response.pagination.page,
          perPage: response.pagination.per_page,
          lastPage: response.pagination.pages,
          total: response.pagination.total
        });
        return response.data;
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      setError('Error al cargar ventas');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.perPage, ventas.length, filters, user, isLoading]);

  // Manejar cambio de página y filtros
  const handlePageChange = useCallback((page: number) => {
    if (page !== pagination.page) {
      setPagination(prev => ({ ...prev, page }));
      loadVentas(page, pagination.perPage);
    }
  }, [loadVentas, pagination.page, pagination.perPage]);

  const handlePerPageChange = useCallback((perPage: number) => {
    setPagination(prev => ({ ...prev, perPage, page: 1 }));
    loadVentas(1, perPage);
  }, [loadVentas]);

  const applyFilters = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    loadVentas(1, pagination.perPage);
  }, [loadVentas, pagination.perPage]);
  
  const clearFilters = useCallback(() => {
    setFilters({
      cliente_id: '',
      almacen_id: '',
      fecha_inicio: '',
      fecha_fin: ''
    });
    loadVentas(1, pagination.perPage);
  }, [loadVentas, pagination.perPage]);

  // Cargar venta individual (optimizado)
  const loadVenta = useCallback(async (id: number) => {
    // Si ya tenemos la venta cargada, no la cargamos de nuevo
    if (venta?.id === id && ventaCargadaRef.current) {
      return venta;
    }
    
    try {
      setIsLoading(true);
      console.log(`Cargando detalle de venta ${id}...`);
      
      const ventaData = await ventaApi.getVenta(id);
      if (ventaData) {
        setVenta(ventaData);
        ventaCargadaRef.current = true;
        
        // Solo cargar pagos si existen y no están cargados
        if (ventaData.pagos && ventaData.pagos.length > 0 && (!pagos.length || pagos[0].venta_id !== id)) {
          const pagosData = await pagoApi.getPagosByVenta(id);
          if (pagosData) setPagos(pagosData);
        }
        
        return ventaData;
      }
      
      return null;
    } catch (error) {
      console.error(`Error al cargar venta ${id}:`, error);
      setError(`Error al cargar venta: ${error}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [venta, pagos]);

  // Cargar venta para edición (optimizado)
  const loadVentaForEdit = useCallback(async (id: number) => {
    // Evitar cargas duplicadas
    if (isLoading || (ventaIdRef.current === id && venta !== null)) {
      return venta;
    }
    
    try {
      setIsLoading(true);
      ventaIdRef.current = id;
      
      // Cargar opciones primero si no están cargadas
      if (!optionsLoadedRef.current) {
        await loadOptions();
      }
      
      // Cargar venta
      const ventaData = await ventaApi.getVenta(id);
      if (!ventaData) {
        setError('No se pudo cargar la venta');
        return null;
      }
      
      setVenta(ventaData);
      
      // Formatear fecha
      const fecha = ventaData.fecha?.split('T')[0] || new Date().toISOString().split('T')[0];
      
      // Actualizar formulario
      form.setFormData({
        cliente_id: ventaData.cliente_id?.toString() || '',
        almacen_id: ventaData.almacen_id?.toString() || '',
        fecha,
        tipo_pago: ventaData.tipo_pago || 'contado',
        consumo_diario_kg: ventaData.consumo_diario_kg?.toString() || '0',
        detalles: ventaData.detalles?.map(d => ({
          id: d.id,
          presentacion_id: d.presentacion_id?.toString() || '',
          cantidad: d.cantidad?.toString() || '',
          precio_unitario: d.precio_unitario || ''
        })) || []
      });
      
      return ventaData;
    } catch (error) {
      console.error(`Error al cargar venta ${id} para edición:`, error);
      setError(`Error al cargar venta: ${error}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadOptions, form, venta, isLoading]);

  // Cambio de almacén - Versión optimizada
  const handleAlmacenChange = useCallback(async (almacenId: string) => {
    // Validación básica
    if (!almacenId) return;
    
    // Evitar cambios innecesarios si es el mismo almacén
    if (almacenId === almacenIdRef.current && presentacionesFiltradas.length > 0) {
      console.log(`Almacén ${almacenId} ya seleccionado y con productos cargados`);
      return;
    }
    
    // Verificar si hay productos ya agregados antes de cambiar el almacén
    if (form.formData.detalles.length > 0) {
      Alert.alert(
        "Cambiar almacén",
        "Cambiar de almacén eliminará los productos seleccionados. ¿Desea continuar?",
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Confirmar",
            onPress: async () => {
              // Actualizar el almacén y limpiar productos
              form.handleChange('almacen_id', almacenId);
              form.handleChange('detalles', []);
              
              // Actualizar referencia y cargar presentaciones
              almacenIdRef.current = almacenId;
              await _loadPresentacionesPorAlmacen(almacenId);
            }
          }
        ]
      );
      return;
    }
    
    // Actualizar formulario y referencia
    form.handleChange('almacen_id', almacenId);
    almacenIdRef.current = almacenId;
    
    // Cargar presentaciones
    await _loadPresentacionesPorAlmacen(almacenId);
  }, [form, presentacionesFiltradas.length]);

  // Función interna para cargar presentaciones por almacén (con caché)
  const _loadPresentacionesPorAlmacen = useCallback(async (almacenId: string) => {
    // Evitar cargas duplicadas
    if (loadingPresentacionesRef.current) {
      console.log('Ya hay una carga de presentaciones en progreso');
      return;
    }
    
    // Verificar si tenemos en caché
    if (presentacionesCache[almacenId]?.length > 0) {
      console.log(`Usando caché para almacén ${almacenId}: ${presentacionesCache[almacenId].length} presentaciones`);
      // TODO: Aplicar presentaciones de caché
      return presentacionesCache[almacenId];
    }
    
    try {
      loadingPresentacionesRef.current = true;
      console.log(`Cargando presentaciones para almacén ${almacenId}...`);
      
      // Usar el método del hook de productos
      const result = await filtrarPorAlmacenId(almacenId);
      
      // Guardar en caché
      if (result && result.length > 0) {
        setPresentacionesCache(prev => ({
          ...prev,
          [almacenId]: result
        }));
      }
      
      return result;
    } catch (error) {
      console.error(`Error al cargar presentaciones para almacén ${almacenId}:`, error);
      return [];
    } finally {
      loadingPresentacionesRef.current = false;
    }
  }, [filtrarPorAlmacenId, presentacionesCache]);

  // Crear venta
  const createVenta = useCallback(async () => {
    if (!form.validate(validationRules)) return false;
    
    try {
      setIsLoading(true);
      console.log('Enviando solicitud para crear venta...');
      
      // Preparar datos
      const ventaData = {
        cliente_id: parseInt(form.formData.cliente_id),
        almacen_id: parseInt(form.formData.almacen_id),
        tipo_pago: form.formData.tipo_pago,
        consumo_diario_kg: form.formData.consumo_diario_kg,
        fecha: `${form.formData.fecha}T00:00:00Z`,
        detalles: form.formData.detalles.map(d => ({
          presentacion_id: parseInt(d.presentacion_id),
          cantidad: parseInt(d.cantidad),
          precio_unitario: parseFloat(d.precio_unitario).toFixed(2)
        }))
      };
      
      const response = await ventaApi.createVenta(ventaData);
      
      if (response && response.id) {
        Alert.alert(
          'Venta Registrada',
          'La venta ha sido registrada exitosamente',
          [{ text: 'OK', onPress: () => router.replace('/ventas') }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo registrar la venta');
        return false;
      }
    } catch (error) {
      console.error('Error al crear venta:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al crear venta');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [form, validationRules]);

  // Actualizar venta
  const updateVenta = useCallback(async () => {
    if (!form.validate(validationRules)) return false;
    if (!ventaIdRef.current) {
      Alert.alert('Error', 'ID de venta no válido');
      return false;
    }
    
    try {
      setIsLoading(true);
      console.log(`Actualizando venta ${ventaIdRef.current}...`);
      
      // Preparar datos - solo enviar campos editables
      const ventaData = {
        cliente_id: parseInt(form.formData.cliente_id),
        almacen_id: parseInt(form.formData.almacen_id),
        tipo_pago: form.formData.tipo_pago,
        consumo_diario_kg: form.formData.consumo_diario_kg,
        fecha: `${form.formData.fecha}T00:00:00Z`,
      };
      
      const response = await ventaApi.updateVenta(ventaIdRef.current, ventaData);
      
      if (response) {
        Alert.alert(
          'Venta Actualizada',
          'La venta ha sido actualizada exitosamente',
          [{ text: 'OK', onPress: () => router.replace('/ventas') }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo actualizar la venta');
        return false;
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al actualizar venta');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [form, validationRules]);

  // Eliminar venta
  const deleteVenta = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      console.log(`Eliminando venta ${id}...`);
      
      await ventaApi.deleteVenta(id);
      
      // Recalcular página si es necesario
      const page = ventas.length === 1 && pagination.page > 1 
        ? pagination.page - 1 
        : pagination.page;
      
      // Recargar lista después de eliminar
      await loadVentas(page, pagination.perPage);
      
      Alert.alert('Éxito', 'Venta eliminada correctamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      Alert.alert('Error', 'No se pudo eliminar la venta');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadVentas, pagination.page, pagination.perPage, ventas.length]);

  // Confirmar eliminación
  const confirmDelete = useCallback((id: number) => {
    Alert.alert(
      'Eliminar Venta',
      '¿Está seguro que desea eliminar esta venta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteVenta(id) }
      ]
    );
  }, [deleteVenta]);

  // Calcular total
  const calcularTotal = useCallback(() => {
    return form.formData.detalles.reduce((total, detalle) => {
      const cantidad = parseInt(detalle.cantidad) || 0;
      const precio = parseFloat(detalle.precio_unitario) || 0;
      return total + (cantidad * precio);
    }, 0).toFixed(2);
  }, [form.formData.detalles]);

  // Gestión de productos
  const agregarProducto = useCallback((presentacionId: string, cantidad: string = '1', precioUnitario?: string) => {
    // Verificar si el producto ya existe
    const existeIndex = form.formData.detalles.findIndex(d => d.presentacion_id === presentacionId);
    
    if (existeIndex >= 0) {
      // Actualizar cantidad
      const detallesActualizados = [...form.formData.detalles];
      const cantidadActual = parseInt(detallesActualizados[existeIndex].cantidad) || 0;
      detallesActualizados[existeIndex].cantidad = (cantidadActual + parseInt(cantidad)).toString();
      
      form.handleChange('detalles', detallesActualizados);
      return;
    }
    
    // Obtener precio si no se proporciona
    let precio = precioUnitario;
    if (!precio) {
      const presentacion = presentacionesFiltradas.find(p => p.id.toString() === presentacionId);
      precio = presentacion?.precio_venta || '0';
    }
    
    form.handleChange('detalles', [
      ...form.formData.detalles, 
      { presentacion_id: presentacionId, cantidad, precio_unitario: precio }
    ]);
  }, [form, presentacionesFiltradas]);

  const actualizarProducto = useCallback((index: number, cantidad: string, precio: string) => {
    if (index < 0 || index >= form.formData.detalles.length) return;
    
    const detallesActualizados = [...form.formData.detalles];
    detallesActualizados[index] = {
      ...detallesActualizados[index],
      cantidad,
      precio_unitario: precio
    };
    
    form.handleChange('detalles', detallesActualizados);
  }, [form]);

  const eliminarProducto = useCallback((index: number) => {
    if (index < 0 || index >= form.formData.detalles.length) return;
    
    const detallesActualizados = [...form.formData.detalles];
    detallesActualizados.splice(index, 1);
    form.handleChange('detalles', detallesActualizados);
  }, [form]);

  // Cargar pagos
  const loadPagos = useCallback(async (ventaId: number) => {
    try {
      console.log(`Cargando pagos para venta ${ventaId}...`);
      const pagosData = await pagoApi.getPagosByVenta(ventaId);
      if (pagosData) {
        setPagos(pagosData);
        return pagosData;
      }
      return [];
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      return [];
    }
  }, []);

  // Resetear formulario
  const resetForm = useCallback(() => {
    form.resetForm();
    ventaCargadaRef.current = false;
    ventaIdRef.current = null;
  }, [form]);

  // Calcular estadísticas
  const getEstadisticas = useCallback(() => {
    const totalVentas = pagination.total || 0;
    
    // Total de montos
    const totalMonto = ventas.reduce((acc, venta) => 
      acc + parseFloat(venta.total || '0'), 0);
    
    // Deuda total
    const deudaTotal = ventas.reduce((acc, venta) => {
      if (venta.estado_pago === 'pendiente') {
        return acc + parseFloat(venta.total || '0');
      } else if (venta.estado_pago === 'parcial') {
        // Estimación para parciales
        return acc + (parseFloat(venta.total || '0') * 0.5);
      }
      return acc;
    }, 0);
    
    // Contadores por estado
    const ventasPagadas = ventas.filter(v => v.estado_pago === 'pagado').length;
    const ventasParciales = ventas.filter(v => v.estado_pago === 'parcial').length;
    const ventasPendientes = ventas.filter(v => v.estado_pago === 'pendiente').length;
    
    // Contadores por tipo
    const ventasContado = ventas.filter(v => v.tipo_pago === 'contado').length;
    const ventasCredito = ventas.filter(v => v.tipo_pago === 'credito').length;
    
    return {
      totalVentas,
      totalMonto,
      deudaTotal,
      ventasPagadas,
      ventasParciales,
      ventasPendientes,
      ventasContado,
      ventasCredito
    };
  }, [ventas, pagination.total]);

  // Retornar objeto con todas las funciones y estados necesarios
  return {
    // Estados
    ventas,
    venta,
    isLoading,
    isLoadingOptions,
    isLoadingProductos,
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
    almacenes,
    pagos,
    presentacionesFiltradas,
    filters,
    
    // Formulario
    form,
    validationRules,
    
    // Columnas
    columns,
    
    // Funciones CRUD
    loadVentas,
    fetchData: loadVentas,
    loadVenta,
    loadVentaForEdit,
    loadOptions,
    createVenta,
    updateVenta,
    deleteVenta,
    confirmDelete,
    
    // Funciones específicas
    calcularTotal,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    handleAlmacenChange,
    loadPagos,
    getEstadisticas,
    resetForm,

    setClientes,
    
    // Filtros
    applyFilters,
    clearFilters
  };
};