// hooks/crud/useVentas.tsx - Versión optimizada
import { useState, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { useForm } from '../useForm';
import { useAuth } from '@/context/AuthContext';
import { Venta, VentaDetalle, Cliente, Almacen, Presentacion, Pago } from '@/models';
import { ventaApi, clienteApi, almacenApi, pagoApi, inventarioApi } from '@/services/api';
import { useProductos } from '@/hooks/crud/useProductos';
import { ThemedText } from '@/components/ThemedText';

// Tipos simplificados
interface VentaForm {
  cliente_id: string;
  almacen_id: string;
  tipo_pago: 'contado' | 'credito';
  consumo_diario_kg: string;
  fecha: string;
  detalles: {
    id?: number;
    presentacion_id: string;
    cantidad: string;
    precio_unitario: string;
  }[];
}

// Tipo para respuesta de la API
interface ApiResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    pages: number;
  }
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
  // Auth
  const { user } = useAuth();
  
  // Estados principales (reducidos y agrupados semánticamente)
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Datos
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [venta, setVenta] = useState<Venta | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  
  // Caché y productos
  const [productsByAlmacen, setProductsByAlmacen] = useState<Record<number, any[]>>({});
  const [isLoadingPresentaciones, setIsLoadingPresentaciones] = useState(false);
  
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
  
  // Hook de productos
  const { 
    presentacionesFiltradas, 
    isLoading: isLoadingProductos, 
    filtrarPorAlmacenId: originalFiltrarPorAlmacenId 
  } = useProductos({ filtrarPorAlmacen: true, soloConStock: true });
  
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
      id: 'id',
      label: 'ID',
      width: 0.5,
      sortable: true,
      render: (item: Venta) => <ThemedText>{item.id}</ThemedText>,
    },
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
    try {
      console.log('Iniciando carga de opciones...');
      setIsLoadingOptions(true);
      
      // Cargar primero los almacenes y verificar la respuesta
      const almacenesRes = await almacenApi.getAlmacenes();
      console.log('Respuesta de almacenes:', almacenesRes);
      
      // Verificar si la respuesta tiene la estructura esperada
      if (!almacenesRes || !Array.isArray(almacenesRes.data)) {
        console.error('Respuesta de almacenes inválida:', almacenesRes);
        // Establecer un array vacío como fallback
        setAlmacenes([]);
      } else {
        const almacenesData = almacenesRes.data;
        console.log(`Almacenes cargados: ${almacenesData.length}`, almacenesData);
        setAlmacenes(almacenesData);
      }
      
      // Cargar clientes después
      const clientesRes = await clienteApi.getClientes(1, 100);
      console.log('Respuesta de clientes:', clientesRes);
      
      // Verificar si la respuesta tiene la estructura esperada
      if (!clientesRes || !Array.isArray(clientesRes.data)) {
        console.error('Respuesta de clientes inválida:', clientesRes);
        // Establecer un array vacío como fallback
        setClientes([]);
      } else {
        const clientesData = clientesRes.data;
        console.log(`Clientes cargados: ${clientesData.length}`);
        setClientes(clientesData);
      }
      
      return {
        clientes: clientesRes?.data || [],
        almacenes: almacenesRes?.data || []
      };
    } catch (error) {
      console.error('Error detallado al cargar opciones:', error);
      // Mostrar más detalles del error
      if (error instanceof Error) {
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
      }
      setError(error instanceof Error ? error.message : 'Error al cargar opciones');
      return { clientes: [], almacenes: [] };
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  // Filtrar productos por almacén - Optimizado
  const filtrarPorAlmacenId = useCallback(async (almacenId: number) => {
    // Validar parámetro
    if (!almacenId) {
      console.warn('ID de almacén no válido');
      return [];
    }
    
    // Evitar llamadas duplicadas
    if (isLoadingPresentaciones) {
      console.log(`Ya se están cargando productos para almacén ${almacenId}`);
      return productsByAlmacen[almacenId] || [];
    }
    
    // Usar caché si existe
    if (productsByAlmacen[almacenId]?.length > 0) {
      console.log(`Usando productos en caché para almacén ${almacenId}`);
      return productsByAlmacen[almacenId];
    }
    
    try {
      setIsLoadingPresentaciones(true);
      console.log(`Cargando productos para almacén ${almacenId}...`);
      
      const response = await inventarioApi.getInventarios(1, 100, almacenId);
      const productos = response?.data || [];
      
      // Guardar en caché
      setProductsByAlmacen(prev => ({
      ...prev,
        [almacenId]: productos
      }));
      
      return productos;
    } catch (error) {
      console.error(`Error al cargar productos para almacén ${almacenId}:`, error);
      return [];
    } finally {
      setIsLoadingPresentaciones(false);
    }
  }, [productsByAlmacen, isLoadingPresentaciones]);

  // Cargar ventas - Optimizado y corregido para evitar llamadas redundantes
  const loadVentas = useCallback(async (page = pagination.page, perPage = pagination.perPage) => {
    try {
      // Evitar cargas innecesarias si ya estamos en esa página y ya tenemos datos
      if (page === pagination.page && ventas.length > 0 && !isLoading) {
        console.log(`Ya estamos en la página ${page} con ${ventas.length} registros, evitando recarga`);
        return ventas;
      }
      
      setIsLoading(true);
      console.log(`Cargando ventas (página ${page}, por página ${perPage})...`);
      
      // Preparar parámetros
      const params = new URLSearchParams();
      if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);
      if (filters.almacen_id) params.append('almacen_id', filters.almacen_id);
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
      
      // Llamar API
      const response = await ventaApi.getVentas(page, perPage);
      
      // Procesar respuesta
      if (response?.data && response?.pagination) {
        setVentas(response.data);
        setPagination({
          page: response.pagination.page || 1,
          perPage: response.pagination.per_page || 10,
          lastPage: response.pagination.pages || 1,
          total: response.pagination.total || 0
        });
        
        console.log(`Cargadas ${response.data.length} ventas. Total: ${response.pagination.total}`);
        return response.data;
      } else {
        console.error('Formato de respuesta inválido:', response);
        setError('Error al procesar respuesta del servidor');
        return [];
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      setError('Error al cargar ventas');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.perPage, filters, ventas.length, isLoading]);

  // Manejar cambio de página - Corregido para evitar recargas automáticas
  const handlePageChange = useCallback((page: number) => {
    console.log(`Cambiando a página ${page} desde handlePageChange`);
    // Actualizar estado de paginación solo si es necesario
    if (page !== pagination.page) {
      setPagination(prev => ({ ...prev, page }));
      loadVentas(page, pagination.perPage);
    }
  }, [loadVentas, pagination.page, pagination.perPage]);

  // Manejar cambio de elementos por página
  const handlePerPageChange = useCallback((perPage: number) => {
    console.log(`Cambiando a ${perPage} elementos por página`);
    setPagination(prev => ({ ...prev, perPage, page: 1 }));
    loadVentas(1, perPage);
  }, [loadVentas]);

  // Aplicar filtros
  const applyFilters = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    loadVentas(1, pagination.perPage);
  }, [loadVentas, pagination.perPage]);
  
  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      cliente_id: '',
      almacen_id: '',
      fecha_inicio: '',
      fecha_fin: ''
    });
    loadVentas(1, pagination.perPage);
  }, [loadVentas, pagination.perPage]);

  // Cargar venta individual
  const loadVenta = useCallback(async (id: number) => {
    if (venta?.id === id && ventaCargadaRef.current) {
      return venta;
    }
    
    try {
      setIsLoading(true);
      
      const ventaData = await ventaApi.getVenta(id);
      if (ventaData) {
        setVenta(ventaData);
        ventaCargadaRef.current = true;
        
        // Cargar pagos si existen - corregido para evitar error con undefined
        if (ventaData.pagos && Array.isArray(ventaData.pagos) && ventaData.pagos.length > 0) {
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
  }, [venta]);

  // Cargar venta para edición
  const loadVentaForEdit = useCallback(async (id: number) => {
    if (isLoading) return null;
    
    try {
      setIsLoading(true);
      ventaIdRef.current = id;
      
      // Cargar datos maestros si no existen
      if (!optionsLoadedRef.current) {
        await loadOptions();
      }
      
      // Cargar venta
      const ventaData = await ventaApi.getVenta(id);
      if (!ventaData) {
        setError('No se pudo cargar la venta');
        return null;
      }
      
      // Cargar productos por almacén si hay detalles
      if (ventaData.almacen_id && ventaData.detalles?.length) {
        await filtrarPorAlmacenId(ventaData.almacen_id);
      }
      
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
  }, [loadOptions, filtrarPorAlmacenId, form, isLoading]);

  // Crear venta
  const createVenta = useCallback(async () => {
    if (!form.validate(validationRules)) return false;
    
    try {
      setIsLoading(true);
      
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
      
      console.log('Creando venta:', ventaData);
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
      
      // Preparar datos
      const ventaData = {
        cliente_id: parseInt(form.formData.cliente_id),
        almacen_id: parseInt(form.formData.almacen_id),
        tipo_pago: form.formData.tipo_pago,
        consumo_diario_kg: form.formData.consumo_diario_kg,
        fecha: `${form.formData.fecha}T00:00:00Z`,
        detalles: form.formData.detalles.map(d => {
          const detalle: any = {
            presentacion_id: parseInt(d.presentacion_id),
            cantidad: parseInt(d.cantidad),
            precio_unitario: d.precio_unitario
          };
          if (d.id) detalle.id = d.id;
          return detalle;
        })
      };
      
      console.log(`Actualizando venta ${ventaIdRef.current}:`, ventaData);
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
      console.error('Error al actualizar venta:', error);
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
      
      await ventaApi.deleteVenta(id);
      
      // Recalcular página si necesario
      const page = ventas.length === 1 && pagination.page > 1 
        ? pagination.page - 1 
        : pagination.page;
      
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

  // Funciones auxiliares simplificadas
  
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

  // Cambio de almacén - Optimizado
  const handleAlmacenChange = useCallback(async (almacenId: string) => {
    // Validación básica
    if (!almacenId) {
      console.log('ID de almacén inválido');
      return;
    }

    // Si el almacén no cambió y no es una llamada forzada, no hacer nada
    if (form.formData.almacen_id === almacenId) {
      console.log(`Almacén ${almacenId} ya seleccionado, evitando recarga innecesaria`);
      return;
    }
    
    console.log(`Cambiando almacén a: ${almacenId}`);
    
    // Verificar si hay productos ya agregados antes de cambiar el almacén
    if (form.formData.detalles.length > 0) {
      // Usar Alert.alert para mostrar diálogo de confirmación
      Alert.alert(
        "Cambiar almacén",
        "Cambiar de almacén eliminará los productos seleccionados. ¿Desea continuar?",
        [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => {
              // No hacer nada, mantener el almacén actual
              console.log("Cambio de almacén cancelado por el usuario");
            }
          },
          {
            text: "Confirmar",
            onPress: async () => {
              // Actualizar el almacén y limpiar productos
              form.handleChange('almacen_id', almacenId);
              form.handleChange('detalles', []);
              
              // Cargar presentaciones del nuevo almacén
              try {
                setIsLoadingPresentaciones(true);
                
                // Limpiar caché local primero para evitar resultados mezclados
                // Llamar solo a originalFiltrarPorAlmacenId que maneja el estado global
                await originalFiltrarPorAlmacenId(almacenId);
                
                console.log(`Presentaciones cargadas para almacén ${almacenId}`);
              } catch (error) {
                console.error(`Error al cargar presentaciones para almacén ${almacenId}:`, error);
                Alert.alert("Error", "No se pudieron cargar los productos para este almacén");
              } finally {
                setIsLoadingPresentaciones(false);
              }
            }
          }
        ]
      );
      return;
    }
    
    // Si no hay productos, cambiar directamente
    form.handleChange('almacen_id', almacenId);
    
    try {
      // Cargar presentaciones asociadas al almacén
      console.log(`Cargando presentaciones para almacén ID: ${almacenId}`);
      
      setIsLoadingPresentaciones(true);
      
      // Limpiar caché local primero para evitar resultados mezclados
      // Llamar solo a originalFiltrarPorAlmacenId que maneja el estado global
      const result = await originalFiltrarPorAlmacenId(almacenId);
      
      console.log(`Presentaciones cargadas para almacén ${almacenId}, total: ${result?.length || 0}`);
    } catch (error) {
      console.error(`Error al cargar presentaciones para almacén ${almacenId}:`, error);
      Alert.alert("Error", "No se pudieron cargar los productos para este almacén");
    } finally {
      setIsLoadingPresentaciones(false);
    }
  }, [form, originalFiltrarPorAlmacenId]);

  // Calcular total
  const calcularTotal = useCallback(() => {
    return form.formData.detalles.reduce((total, detalle) => {
      const cantidad = parseInt(detalle.cantidad) || 0;
      const precio = parseFloat(detalle.precio_unitario) || 0;
      return total + (cantidad * precio);
    }, 0).toFixed(2);
  }, [form.formData.detalles]);

  // Manejar productos
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

  // Cargar presentaciones por almacén
  const loadPresentaciones = useCallback(async (almacenId?: number) => {
    const idAlmacen = almacenId || parseInt(form.formData.almacen_id);
    if (!idAlmacen) return [];
    
    return await filtrarPorAlmacenId(idAlmacen);
  }, [form.formData.almacen_id, filtrarPorAlmacenId]);

  // Cargar pagos
  const loadPagos = useCallback(async (ventaId: number) => {
    try {
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

  // Calcular estado de pago
  const calcularEstadoPago = useCallback((total: number, pagosRealizados: number): 'pendiente' | 'parcial' | 'pagado' => {
    if (pagosRealizados <= 0) return 'pendiente';
    if (pagosRealizados >= total) return 'pagado';
    return 'parcial';
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
    handleSort: () => {}, // Simplificado, no implementado en el servidor
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
    loadPresentaciones,
    loadPagos,
    calcularEstadoPago,
    getEstadisticas,
    resetForm,

    setClientes,
    
    // Filtros
    applyFilters,
    clearFilters
  };
};