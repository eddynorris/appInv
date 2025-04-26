import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { pedidoApi, clienteApi, productoApi, almacenApi, presentacionApi } from '@/services/api';
import { Pedido, PedidoDetalle, ClienteSimple, Presentacion, AlmacenSimple, ESTADOS_PEDIDO } from '@/models';
import { useForm } from '../useForm';
import { useAuth } from '@/context/AuthContext';

// Tipo para los detalles dentro del hook (simplificado para el formulario)
interface DetalleForm {
  id?: number; // Para actualizaciones
  presentacion_id: string;
  cantidad: string;
  precio_estimado: string;
}

// Interfaz para los valores del formulario principal manejados por useForm
interface PedidoFormValues {
  cliente_id: string;
  almacen_id: string;
  fecha_entrega: string;
  estado: 'programado' | 'confirmado' | 'entregado' | 'cancelado';
  notas: string;
  // 'detalles' se maneja en un estado separado, no aquí
}

// Tipo para los campos editables en ProductGrid para pedidos
type EditableDetallePedidoField = 'cantidad' | 'precio_estimado';

// Valores iniciales del formulario principal
const initialFormValues: PedidoFormValues = {
  cliente_id: '',
  almacen_id: '',
  fecha_entrega: new Date().toISOString().split('T')[0],
  estado: 'programado',
  notas: '',
};

export function usePedidoItem() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  // Estados generales
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);

  // Estados para opciones de selectores
  const [clientes, setClientes] = useState<ClienteSimple[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenSimple[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Estado para detalles (manejado fuera de useForm)
  const [detalles, setDetalles] = useState<DetalleForm[]>([]);

  // Estado UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Hook de formulario para datos principales
  const form = useForm<PedidoFormValues>(initialFormValues);

  // Reglas de validación - MOVIDAS DENTRO DEL HOOK
  const validationRules = {
    cliente_id: (value: string) => !value ? 'El cliente es requerido' : null,
    almacen_id: (value: string) => !value ? 'El almacén es requerido' : null,
    fecha_entrega: (value: string) => !value ? 'La fecha de entrega es requerida' : null,
    // Validación de detalles ahora usa el estado 'detalles' que está en scope
    detalles: () => detalles.length === 0 ? 'Debe agregar al menos un producto' : null
  };

  // --- Carga de Datos ---

  // Cargar opciones (clientes, almacenes, presentaciones)
  const loadOptions = useCallback(async (forceReload = false) => {
    // Evitar recargas innecesarias si ya hay datos
    if (!forceReload && clientes.length > 0 && almacenes.length > 0 && presentaciones.length > 0) {
      return;
    }

    setIsLoadingOptions(true);
    setError(null);
    try {
      const [clientesRes, almacenesRes, presentacionesRes] = await Promise.all([
        forceReload || clientes.length === 0 ? clienteApi.getClientes() : Promise.resolve({ data: clientes }),
        forceReload || almacenes.length === 0 ? almacenApi.getAlmacenes() : Promise.resolve({ data: almacenes }), // Asumiendo existe getAlmacenesSimple
        forceReload || presentaciones.length === 0 ? presentacionApi.getPresentaciones() : Promise.resolve({ data: presentaciones }) // Asumiendo existe getPresentaciones
      ]);

      if (clientesRes) setClientes(clientesRes.data || []);
      if (almacenesRes) setAlmacenes(almacenesRes.data || []);
      if (presentacionesRes) setPresentaciones(presentacionesRes.data || []);

    } catch (err) {
      console.error('Error al cargar opciones:', err);
      setError('No se pudieron cargar los datos necesarios (clientes/almacenes/productos)');
    } finally {
      setIsLoadingOptions(false);
    }
  }, [clientes, almacenes, presentaciones]); // Dependencias para evitar recargas si no cambian

  // Obtener un pedido específico
  const getPedido = useCallback(async (id: number): Promise<Pedido | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await pedidoApi.getPedido(id);
      setPedido(data);
      return data;
    } catch (err) {
      console.error(`Error al cargar pedido ID ${id}:`, err);
      setError('Error al cargar detalles del pedido');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Preparar formulario para creación
  const prepareForCreate = useCallback(async () => {
    setIsLoading(true);
    await loadOptions(); // Asegura que las opciones estén cargadas
    form.resetForm({
      ...initialFormValues,
      almacen_id: user?.almacen_id?.toString() || '', // Preseleccionar almacén del usuario
    });
    setDetalles([]); // Limpiar detalles
    setPedido(null);
    setError(null);
    setIsLoading(false);
  }, [loadOptions, form, user]);

  // Cargar pedido para edición
  const loadPedidoForEdit = useCallback(async (id: number): Promise<Pedido | null> => {
    setIsLoading(true);
    setError(null);
    try {
      await loadOptions(); // Cargar opciones primero
      const pedidoData = await pedidoApi.getPedido(id);

      if (pedidoData) {
        setPedido(pedidoData);
        form.setValues({
          cliente_id: pedidoData.cliente_id?.toString() || '',
          // Solo permitir cambiar almacén si es admin, sino usar el del pedido
          almacen_id: isAdmin ? pedidoData.almacen_id?.toString() : (pedidoData.almacen_id?.toString() || ''),
          fecha_entrega: pedidoData.fecha_entrega?.split('T')[0] || new Date().toISOString().split('T')[0],
          estado: pedidoData.estado || 'programado',
          notas: pedidoData.notas || '',
        });
        // Cargar detalles existentes
        setDetalles(pedidoData.detalles ? pedidoData.detalles.map(d => ({
          id: d.id,
          presentacion_id: d.presentacion_id.toString(),
          cantidad: d.cantidad.toString(),
          precio_estimado: d.precio_estimado.toString() // Asegurar string
        })) : []);
        return pedidoData;
      } else {
        setError('No se pudo cargar el pedido para editar');
        return null;
      }
    } catch (err) {
      console.error('Error al cargar pedido para edición:', err);
      setError('No se pudo cargar la información necesaria');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadOptions, form, isAdmin]);

  // --- Gestión de Detalles ---

  const agregarProducto = useCallback((presentacionId: string, cantidadStr: string, precioEstimadoStr: string) => {
    const indexExistente = detalles.findIndex(d => d.presentacion_id === presentacionId);

    if (indexExistente !== -1) {
      // Actualizar cantidad si ya existe
      const nuevosDetalles = [...detalles];
      const cantidadActual = parseInt(nuevosDetalles[indexExistente].cantidad || '0');
      const cantidadAAgregar = parseInt(cantidadStr || '0');
      nuevosDetalles[indexExistente].cantidad = (cantidadActual + cantidadAAgregar).toString();
      setDetalles(nuevosDetalles);
    } else {
      // Agregar nuevo detalle
      setDetalles(prev => [
        ...prev,
        {
          presentacion_id: presentacionId,
          cantidad: cantidadStr || '1',
          precio_estimado: precioEstimadoStr || '0'
        }
      ]);
    }
  }, [detalles]);

  // CORREGIDO: Usar el tipo correcto y el nombre de parámetro 'field'
  const actualizarProducto = useCallback((index: number, field: EditableDetallePedidoField, value: string) => {
    const nuevosDetalles = [...detalles];
    if (index >= 0 && index < nuevosDetalles.length) {
        // Validaciones simples para cantidad y precio
        if (field === 'cantidad') {
            const numValue = parseInt(value.replace(/[^0-9]/g, ''));
            nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: isNaN(numValue) || numValue < 1 ? '1' : numValue.toString() };
        } else if (field === 'precio_estimado') {
            const precio = value.replace(/[^0-9.]/g, ''); // Permitir solo números y punto
            nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: precio };
        } // Ya no hay 'else' porque solo manejamos 'cantidad' y 'precio_estimado'
        setDetalles(nuevosDetalles);
    }
  }, [detalles]);

  const eliminarProducto = useCallback((index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const calcularTotal = useCallback(() => {
    return detalles.reduce((total, detalle) => {
      const cantidad = parseInt(detalle.cantidad || '0');
      const precio = parseFloat(detalle.precio_estimado || '0');
      return total + (cantidad * precio);
    }, 0);
  }, [detalles]);

  // --- Validación y Submit ---
  // Crear un nuevo pedido - CORREGIDO: precio_estimado como string para API
  const createPedido = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { formData } = form;
      const pedidoData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id),
        fecha_entrega: `${formData.fecha_entrega}T00:00:00Z`,
        estado: formData.estado,
        notas: formData.notas || '',
        detalles: detalles.map(d => ({
          presentacion_id: parseInt(d.presentacion_id),
          cantidad: parseInt(d.cantidad || '1'),
          // Convertir a string para la API, asumiendo que espera string
          precio_estimado: parseFloat(d.precio_estimado || '0').toString()
        }))
      };

      if (isNaN(pedidoData.cliente_id) || isNaN(pedidoData.almacen_id)) {
         throw new Error("Cliente o Almacén inválido.");
      }
      // Validar los detalles parseados antes de enviar
      if (pedidoData.detalles.some(d => isNaN(d.presentacion_id) || isNaN(d.cantidad))) { // Ya no validamos precio_estimado aquí porque es string
          throw new Error("Hay datos inválidos en los productos.");
      }

      const response = await pedidoApi.createPedido(pedidoData);
      Alert.alert('Éxito', 'Proyección creada correctamente.', [
        { text: 'OK', onPress: () => router.replace('/pedidos') }
      ]);
      return response;
    } catch (err) {
      console.error("Error creating pedido:", err);
      const message = err instanceof Error ? err.message : "No se pudo crear la proyección.";
      setError(message);
      Alert.alert('Error', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [form, detalles]);

  // Actualizar un pedido existente - CORREGIDO: Ajustar validación para 'update'
  const updatePedido = useCallback(async (id: number) => {
    // Crear reglas específicas para update si es necesario (sin 'detalles')
    // Usar desestructuración para excluir 'detalles' de forma segura
    const { detalles: _, ...updateValidationRules } = validationRules;

    if (!form.validate(updateValidationRules)) {
        Alert.alert('Error de Validación', 'Por favor revise los campos marcados.');
        return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { formData } = form;
      const pedidoDataToUpdate = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id),
        fecha_entrega: `${formData.fecha_entrega}T00:00:00Z`,
        estado: formData.estado,
        notas: formData.notas || '',
      };
       if (isNaN(pedidoDataToUpdate.cliente_id) || isNaN(pedidoDataToUpdate.almacen_id)) {
            throw new Error("Cliente o Almacén inválido.");
        }
      const response = await pedidoApi.updatePedido(id, pedidoDataToUpdate);
      Alert.alert('Éxito', 'Proyección actualizada correctamente.', [
          { text: 'OK', onPress: () => router.push(`/pedidos/${id}`) }
      ]);
      return response;
    } catch (err) {
      console.error("Error updating pedido:", err);
      const message = err instanceof Error ? err.message : "No se pudo actualizar la proyección.";
      setError(message);
      Alert.alert('Error', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [form, validationRules]); // Añadir validationRules como dependencia

  // Eliminar un pedido específico
  const deletePedido = useCallback(async (id: number): Promise<boolean> => {
    // Mostrar confirmación antes de eliminar
    return new Promise((resolve) => {
        Alert.alert(
            "Confirmar Eliminación",
            "¿Está seguro que desea eliminar esta proyección? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoading(true);
                        setError(null);
                        try {
                            await pedidoApi.deletePedido(id);
                            Alert.alert('Éxito', 'Proyección eliminada correctamente.');
                            router.replace('/pedidos');
                            resolve(true);
                        } catch (err) {
                            console.error('Error deleting pedido:', err);
                            const message = err instanceof Error ? err.message : 'Error al eliminar la proyección';
                            setError(message);
                            Alert.alert('Error', message);
                            resolve(false);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    });
  }, []);

  // --- Handlers UI ---

  const handleDateSelection = useCallback((selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      form.handleChange('fecha_entrega', formattedDate);
    }
  }, [form]);

  // Seleccionar cliente desde el modal de búsqueda
   const handleSelectCliente = useCallback((cliente: ClienteSimple) => {
    form.handleChange('cliente_id', cliente.id.toString());
    setShowClienteModal(false); // Cerrar modal de búsqueda
  }, [form]);

  // Cliente creado desde el modal de creación dentro del modal de búsqueda
  const handleClienteCreated = useCallback((newCliente: ClienteSimple) => {
     // Añadir el nuevo cliente a la lista local para que aparezca inmediatamente
     setClientes(prev => [newCliente, ...prev]);
     // Seleccionar el nuevo cliente en el formulario
     form.handleChange('cliente_id', newCliente.id.toString());
     // Cerrar ambos modales si es necesario (asumiendo que el de creación se cierra solo)
     // setShowClienteCreateModal(false); // Si hubiera un modal de creación separado
     setShowClienteModal(false); // Cerrar modal de búsqueda
  }, [form]);

  // --- Permisos ---
   const canEditOrDelete = useCallback((pedidoToCheck: Pedido | null = pedido): boolean => {
       if (!user || !pedidoToCheck) return false;
       if (user.rol === 'admin') return true;
       return pedidoToCheck.vendedor_id === user.id;
   }, [user, pedido]);


  return {
    // Estado general
    isLoading,
    error,
    pedido, // El pedido actual cargado

    // Formulario y detalles
    form,
    detalles,
    validationRules, // Exportar reglas para usarlas externamente si es necesario

    // Opciones para selectores
    clientes,
    almacenes,
    presentaciones, // Para ProductPicker
    isLoadingOptions,

    // Estado UI
    showDatePicker,
    setShowDatePicker,
    showClienteModal,
    setShowClienteModal,
    showProductModal,
    setShowProductModal,

    // Funciones CRUD
    getPedido,
    prepareForCreate,
    loadPedidoForEdit,
    createPedido,
    updatePedido,
    deletePedido, // Incluye confirmación

    // Funciones de Detalles
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    calcularTotal,

    // Handlers UI
    handleDateSelection,
    handleSelectCliente,
    handleClienteCreated,

    // Permisos
    isAdmin,
    canEditOrDelete,

    // Otras utilidades
    loadOptions, // Permitir recargar opciones si es necesario
    setError, // Permitir setear errores desde fuera
  };
} 