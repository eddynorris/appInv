// New modular useVentaItem hook that combines specialized hooks
import { useVentaOptions } from './useVentaOptions';
import { useVentaForm } from './useVentaForm';
import { useVentaCRUD } from './useVentaCRUD';
import { useVentaCalculations } from './useVentaCalculations';
import { ClienteSimple } from '@/models';

export function useVentaItem() {
  // Get user's default warehouse from options hook
  const { defaultUserAlmacenId, isAdmin } = useVentaOptions();
  
  // Initialize specialized hooks
  const options = useVentaOptions();
  const form = useVentaForm(defaultUserAlmacenId);
  const crud = useVentaCRUD();
  const calculations = useVentaCalculations();

  // Enhanced handlers that coordinate between hooks
  const handleAlmacenChange = async (newAlmacenId: string) => {
    await form.handleAlmacenChange(newAlmacenId, options.filterPresentacionesByAlmacen);
  };

  const calcularTotal = () => {
    return calculations.calcularTotal(form.formData.detalles);
  };

  const agregarProductoConValidacion = (presentacionId: string, cantidad: string, precioUnitario: string) => {
    // Find presentation to validate stock
    const presentacion = options.presentaciones.find(p => p.id === parseInt(presentacionId));
    
    if (presentacion && !calculations.validarStock(cantidad, presentacion.stock_disponible)) {
      return { success: false, error: 'Stock insuficiente' };
    }

    const success = form.agregarProducto(presentacionId, cantidad, precioUnitario);
    return { success, error: success ? null : 'Error al agregar producto' };
  };

  const handleClienteCreated = (nuevoCliente: ClienteSimple) => {
    // Add the new client to the options list
    options.setClientes(prev => [nuevoCliente, ...prev]);
    // Select the new client in the form
    form.handleChange('cliente_id', nuevoCliente.id.toString());
    // Auto-fill consumo_diario_kg if available
    if (nuevoCliente.consumo_diario_kg) {
      form.handleChange('consumo_diario_kg', nuevoCliente.consumo_diario_kg.toString());
    }
    // Close the modal
    form.setShowClienteModal(false);
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
    venta: crud.venta,
    pagos: crud.pagos,
    isLoading: crud.isLoading,
    isSubmitting: crud.isSubmitting,
    loadVentaForEdit: crud.loadVentaForEdit,
    getVenta: crud.getVenta,
    createVenta: crud.createVenta,
    updateVenta: crud.updateVenta,
    deleteVenta: crud.deleteVenta,
    convertVentaToFormData: crud.convertVentaToFormData,

    // Calculations
    calcularTotal,
    calcularCantidadTotal: calculations.calcularCantidadTotal,
    calcularSubtotal: calculations.calcularSubtotal,
    validarStock: calculations.validarStock,
    formatearPrecio: calculations.formatearPrecio,

    // User info
    isAdmin,
    defaultUserAlmacenId,

    // Consolidated error handling
    error: options.error || crud.error,
    clearError: crud.clearError,
  };
}