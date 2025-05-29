import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { pedidoApi, PedidoFormDataResponse } from '@/services/api';
import { Pedido, PedidoDetalle, ClienteSimple, Presentacion, AlmacenSimple, ESTADOS_PEDIDO, StockPorAlmacen } from '@/models';
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
  // 'detalles' NO VA AQUÍ
}

// --- TIPO DE CAMPO EDITABLE ---
// Usar un tipo más genérico compatible con ProductGrid, pero ignorar campos no relevantes para Pedido
type UpdateFieldKey = 'cantidad' | 'precio_estimado' | 'precio_unitario';
type EditableDetallePedidoField = Extract<UpdateFieldKey, 'cantidad' | 'precio_estimado'>;

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
  const defaultUserAlmacenId = user?.almacen_id?.toString();

  // Estados generales
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);

  // Estados para opciones de selectores
  const [clientes, setClientes] = useState<ClienteSimple[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenSimple[]>([]);
  const [allPresentaciones, setAllPresentaciones] = useState<Presentacion[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Estado para detalles (manejado fuera de useForm)
  const [detalles, setDetalles] = useState<DetalleForm[]>([]);

  // Estado UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Hook de formulario para datos principales
  const form = useForm<PedidoFormValues>(initialFormValues);
  const { formData, errors, setErrors, handleChange, setValues /* ya no se necesita? */ } = form;

  // Reglas de validación - MOVIDAS DENTRO DEL HOOK
  const validationRules = {
    cliente_id: (value: string) => !value ? 'El cliente es requerido' : null,
    almacen_id: (value: string) => !value ? 'El almacén es requerido' : null,
    fecha_entrega: (value: string) => !value ? 'La fecha de entrega es requerida' : null,
    detalles: () => detalles.length === 0 ? 'Debe agregar al menos un producto' : null
  };

  // --- Carga de Datos Simplificada ---
  const loadFormData = useCallback(async () => {
    setIsLoadingOptions(true);
    setError(null);
    try {
      const data = await pedidoApi.getFormData();

      setClientes(data.clientes || []);

      // CORRECCIÓN LINTER: Usar type guards para acceder a propiedades específicas
      let fetchedAlmacenes: AlmacenSimple[] = [];
      if ('almacenes' in data && data.almacenes) {
        fetchedAlmacenes = data.almacenes;
      }
      setAlmacenes(fetchedAlmacenes);

      let fetchedPresentaciones: Presentacion[] = [];
      if ('presentaciones_activas' in data && data.presentaciones_activas) {
        fetchedPresentaciones = data.presentaciones_activas;
      } else if ('presentaciones_con_stock_global' in data && data.presentaciones_con_stock_global) {
        // Aunque la API ahora solo devuelve activas, mantenemos esto por si acaso
        fetchedPresentaciones = data.presentaciones_con_stock_global;
      }
      setAllPresentaciones(fetchedPresentaciones);

      // CORRECCIÓN LINTER: Acceder a fetchedAlmacenes que ya está definida
      const initialAlmacenId = defaultUserAlmacenId || (isAdmin && fetchedAlmacenes.length > 0 ? fetchedAlmacenes[0].id.toString() : '');

      form.resetForm({
          ...initialFormValues,
          almacen_id: initialAlmacenId,
      });

    } catch (err) {
      console.error('❌ Error al cargar datos del formulario:', err);
      setError('No se pudieron cargar los datos necesarios.');
      setClientes([]);
      setAlmacenes([]);
      setAllPresentaciones([]);
    } finally {
      setIsLoadingOptions(false);
    }
  }, [isAdmin, defaultUserAlmacenId, form.resetForm]);

  // --- Manejar cambio de almacén SIMPLIFICADO ---
  const handleAlmacenChange = useCallback((newAlmacenId: string) => {
    if (!newAlmacenId) return;

    const proceedWithChange = () => {
      handleChange('almacen_id', newAlmacenId);
      // CORRECCIÓN LINTER: Limpiar el estado de detalles, no el formulario
      setDetalles([]);
      // Limpiar error de detalles si existía
      setErrors((currentErrors) => {
         if (currentErrors && 'detalles' in currentErrors) {
           const { detalles, ...rest } = currentErrors;
           return rest;
         }
         return currentErrors;
       });
    };

    // CORRECCIÓN LINTER: Usar el estado `detalles` para la comprobación
    if (detalles.length > 0) {
      Alert.alert(
        "Cambiar Almacén",
        "Esto eliminará los productos agregados. ¿Continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Confirmar", onPress: proceedWithChange }
        ]
      );
    } else {
      proceedWithChange();
    }
  }, [handleChange, detalles, setErrors, setDetalles]);

  // --- Cargar Pedido para Editar SIMPLIFICADO ---
  const loadPedidoForEdit = useCallback(async (id: number): Promise<Pedido | null> => {
    setIsLoading(true);
    setError(null);
    try {
      await loadFormData(); // Cargar opciones primero (clientes, almacenes, presentaciones)
      const pedidoData = await pedidoApi.getPedido(id);

      if (pedidoData) {
        setPedido(pedidoData);
        form.setValues({
          cliente_id: pedidoData.cliente_id?.toString() || '',
          almacen_id: pedidoData.almacen_id?.toString() || '',
          fecha_entrega: pedidoData.fecha_entrega?.split('T')[0] || new Date().toISOString().split('T')[0],
          estado: pedidoData.estado || 'programado',
          notas: pedidoData.notas || '',
        });
        setDetalles(pedidoData.detalles ? pedidoData.detalles.map(d => ({
          id: d.id,
          presentacion_id: d.presentacion_id.toString(),
          cantidad: d.cantidad.toString(),
          precio_estimado: d.precio_estimado?.toString() ?? '0'
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
  }, [loadFormData, form, setDetalles]);

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
    await loadFormData();
    const initialAlmacen = defaultUserAlmacenId || (isAdmin && almacenes.length > 0 ? almacenes[0].id.toString() : '');
    form.resetForm({
      ...initialFormValues,
      almacen_id: initialAlmacen,
    });
    setDetalles([]);
    setPedido(null);
    setError(null);
    setIsLoading(false);
  }, [loadFormData, form, defaultUserAlmacenId, isAdmin, almacenes]);

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

  // --- Gestión de Detalles --- (Ajustar firma de actualizarProducto)
  const actualizarProducto = useCallback((index: number, field: UpdateFieldKey, value: string) => {
    // Solo procesar si el campo es relevante para Pedido
    if (field === 'cantidad' || field === 'precio_estimado') {
      const typedField = field as EditableDetallePedidoField; // Hacer type assertion seguro aquí
      const nuevosDetalles = [...detalles];
      if (index >= 0 && index < nuevosDetalles.length) {
          if (typedField === 'cantidad') {
              const numValue = parseInt(value.replace(/[^0-9]/g, ''));
              nuevosDetalles[index] = { ...nuevosDetalles[index], [typedField]: isNaN(numValue) || numValue < 1 ? '1' : numValue.toString() };
          } else if (typedField === 'precio_estimado') {
              const precio = value.replace(/[^0-9.]/g, '');
              nuevosDetalles[index] = { ...nuevosDetalles[index], [typedField]: precio };
          }
          setDetalles(nuevosDetalles);
      }
    } else {
      // Ignorar otros campos como 'precio_unitario' que pueden venir de ProductGrid
      console.log(`Campo '${field}' ignorado en actualizarProducto para Pedidos.`);
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

  // CORRECCIÓN LINTER: La firma debe aceptar ClienteSimple
  const handleSelectCliente = useCallback((cliente: ClienteSimple) => {
    if (!cliente || typeof cliente.id === 'undefined') {
      console.error("handleSelectCliente: cliente inválido o sin ID:", cliente);
      Alert.alert("Error", "No se pudo seleccionar el cliente.");
      return;
    }
    form.handleChange('cliente_id', cliente.id.toString());
    setShowClienteModal(false);
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
    presentaciones: allPresentaciones,
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
    handleAlmacenChange, // Exportar el nuevo handler
    setError, // Permitir setear errores desde fuera
  };
} 