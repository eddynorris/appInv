import { useState, useCallback } from 'react';
import { useForm } from '@/hooks/useForm';
import { ClienteSimple } from '@/models';

// Interfaces
interface DetalleForm {
  id?: number;
  presentacion_id: string;
  cantidad: string;
  precio_estimado: string;
}

interface PedidoFormValues {
  cliente_id: string;
  almacen_id: string;
  fecha_entrega: string;
  estado: 'programado' | 'confirmado' | 'entregado' | 'cancelado';
  notas: string;
}

// Initial form values
const initialFormValues: PedidoFormValues = {
  cliente_id: '',
  almacen_id: '',
  fecha_entrega: new Date().toISOString().split('T')[0],
  estado: 'programado',
  notas: '',
};

export function usePedidoForm(defaultAlmacenId?: string) {
  // UI State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [detalles, setDetalles] = useState<DetalleForm[]>([]);

  // Form management
  const form = useForm<PedidoFormValues>({
    ...initialFormValues,
    almacen_id: defaultAlmacenId || initialFormValues.almacen_id
  });
  const { formData, setValues, resetForm, handleChange, errors, setErrors } = form;

  // Date handling
  const handleDateSelection = useCallback((selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      handleChange('fecha_entrega', dateStr);
    }
  }, [handleChange]);

  // Client selection
  const handleSelectCliente = useCallback((cliente: ClienteSimple) => {
    handleChange('cliente_id', cliente.id.toString());
    setShowClienteModal(false);
  }, [handleChange]);

  // Warehouse change handler
  const handleAlmacenChange = useCallback(async (newAlmacenId: string, onAlmacenChange?: (almacenId: string) => Promise<void>) => {
    handleChange('almacen_id', newAlmacenId);
    
    // Clear products when warehouse changes
    setDetalles([]);
    
    // Call callback to filter presentations
    if (onAlmacenChange) {
      await onAlmacenChange(newAlmacenId);
    }
  }, [handleChange]);

  // Product management
  const agregarProducto = useCallback((presentacionId: string, cantidad: string, precioEstimado: string) => {
    const cantidadNum = parseFloat(cantidad);
    
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      return false;
    }

    // Check if product already exists
    const existingIndex = detalles.findIndex(d => d.presentacion_id === presentacionId);
    
    if (existingIndex >= 0) {
      // Update existing product
      setDetalles(prev => 
        prev.map((detalle, idx) => 
          idx === existingIndex 
            ? { ...detalle, cantidad, precio_estimado: precioEstimado }
            : detalle
        )
      );
    } else {
      // Add new product
      const nuevoDetalle: DetalleForm = {
        presentacion_id: presentacionId,
        cantidad,
        precio_estimado: precioEstimado,
      };
      
      setDetalles(prev => [...prev, nuevoDetalle]);
    }

    setShowProductModal(false);
    return true;
  }, [detalles]);

  const actualizarProducto = useCallback((index: number, field: 'cantidad' | 'precio_estimado', value: string) => {
    if (field === 'cantidad') {
      const cantidadNum = parseFloat(value);
      if (isNaN(cantidadNum) || cantidadNum < 0) return;
    }

    setDetalles(prev => 
      prev.map((detalle, idx) => 
        idx === index ? { ...detalle, [field]: value } : detalle
      )
    );
  }, []);

  const eliminarProducto = useCallback((index: number) => {
    setDetalles(prev => prev.filter((_, idx) => idx !== index));
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cliente_id) newErrors.cliente_id = 'El cliente es requerido';
    if (!formData.almacen_id) newErrors.almacen_id = 'El almacén es requerido';
    if (!formData.fecha_entrega) newErrors.fecha_entrega = 'La fecha de entrega es requerida';
    if (detalles.length === 0) newErrors.detalles = 'Debe agregar al menos un producto';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, detalles, setErrors]);

  // Reset form with optional values
  const resetFormWithDefaults = useCallback((defaults?: Partial<PedidoFormValues>) => {
    const newValues = {
      ...initialFormValues,
      almacen_id: defaultAlmacenId || initialFormValues.almacen_id,
      ...defaults,
    };
    setValues(newValues);
    setDetalles([]);
  }, [defaultAlmacenId, setValues]);

  return {
    // Form data and management
    formData,
    detalles,
    errors,
    handleChange,
    setValues,
    resetForm,
    resetFormWithDefaults,
    validateForm,

    // UI state
    showDatePicker,
    setShowDatePicker,
    showClienteModal,
    setShowClienteModal,
    showProductModal,
    setShowProductModal,

    // Handlers
    handleDateSelection,
    handleSelectCliente,
    handleAlmacenChange,

    // Product management
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    setDetalles,
  };
}