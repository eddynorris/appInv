// New modular usePedidoItem hook that combines specialized hooks
import { usePedidoOptions } from './usePedidoOptions';
import { usePedidoForm } from './usePedidoForm';
import { usePedidoCRUD } from './usePedidoCRUD';
import { ClienteSimple } from '@/models';

export function usePedidoItem() {
  // Get user's default warehouse from options hook
  const { defaultUserAlmacenId, isAdmin } = usePedidoOptions();
  
  // Initialize specialized hooks
  const options = usePedidoOptions();
  const form = usePedidoForm(defaultUserAlmacenId);
  const crud = usePedidoCRUD();

  // Enhanced handlers that coordinate between hooks
  const handleAlmacenChange = async (newAlmacenId: string) => {
    await form.handleAlmacenChange(newAlmacenId, options.filterPresentacionesByAlmacen);
  };

  const agregarProductoConValidacion = (presentacionId: string, cantidad: string, precioEstimado: string) => {
    // Basic validation
    const cantidadNum = parseFloat(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      return { success: false, error: 'Cantidad inválida' };
    }

    const success = form.agregarProducto(presentacionId, cantidad, precioEstimado);
    return { success, error: success ? null : 'Error al agregar producto' };
  };

  // Create pedido with combined data
  const createPedidoWithDetails = async (): Promise<boolean> => {
    if (!form.validateForm()) {
      return false;
    }
    
    return await crud.createPedido(form.formData, form.detalles);
  };

  // Update pedido with combined data
  const updatePedidoWithDetails = async (id: number): Promise<boolean> => {
    if (!form.validateForm()) {
      return false;
    }
    
    return await crud.updatePedido(id, form.formData, form.detalles);
  };

  const handleClienteCreated = (nuevoCliente: ClienteSimple) => {
    // Add the new client to the options list (assuming setClientes exists)
    if (options.setClientes) {
      options.setClientes(prev => [nuevoCliente, ...prev]);
    }
    // Select the new client in the form
    form.handleChange('cliente_id', nuevoCliente.id.toString());
    // Close the modal
    form.setShowClienteModal(false);
  };

  // Load pedido and populate form
  const loadPedidoForEdit = async (id: number) => {
    const pedido = await crud.loadPedidoForEdit(id);
    
    if (pedido) {
      const { formData, detalles } = crud.convertPedidoToFormData(pedido);
      form.setValues(formData);
      form.setDetalles(detalles);
      
      // Filter presentations for the loaded warehouse
      if (formData.almacen_id) {
        options.filterPresentacionesByAlmacen(formData.almacen_id);
      }
    }
    
    return pedido;
  };

  return {
    // Options data
    clientes: options.clientes,
    almacenes: options.almacenes,
    presentaciones: options.presentaciones,
    allPresentaciones: options.allPresentaciones,
    isLoadingOptions: options.isLoadingOptions,
    isLoadingPresentaciones: options.isLoadingPresentaciones,
    filterPresentacionesByAlmacen: options.filterPresentacionesByAlmacen,
    loadInitialData: options.loadInitialData,

    // Form data and state
    formData: form.formData,
    detalles: form.detalles,
    errors: form.errors,
    showDatePicker: form.showDatePicker,
    setShowDatePicker: form.setShowDatePicker,
    showClienteModal: form.showClienteModal,
    setShowClienteModal: form.setShowClienteModal,
    showProductModal: form.showProductModal,
    setShowProductModal: form.setShowProductModal,

    // Form handlers
    handleChange: form.handleChange,
    handleDateSelection: form.handleDateSelection,
    handleSelectCliente: form.handleSelectCliente,
    handleClienteCreated,
    handleAlmacenChange,
    resetForm: form.resetForm,
    resetFormWithDefaults: form.resetFormWithDefaults,
    validateForm: form.validateForm,

    // Product management
    agregarProducto: agregarProductoConValidacion,
    actualizarProducto: form.actualizarProducto,
    eliminarProducto: form.eliminarProducto,

    // CRUD operations
    pedido: crud.pedido,
    isLoading: crud.isLoading,
    isSubmitting: crud.isSubmitting,
    loadPedidoForEdit,
    getPedido: crud.getPedido,
    createPedido: createPedidoWithDetails,
    updatePedido: updatePedidoWithDetails,
    deletePedido: crud.deletePedido,
    convertPedidoToVenta: crud.convertPedidoToVenta,

    // User info
    isAdmin,
    defaultUserAlmacenId,

    // Consolidated error handling
    error: options.error || crud.error,
    clearError: crud.clearError,
  };
}