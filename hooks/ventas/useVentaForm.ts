import { useState, useCallback } from 'react';
import { useForm } from '@/hooks/useForm';
import { ClienteSimple, Presentacion } from '@/models';

// Interfaces
interface VentaDetalleForm {
  id?: number;
  presentacion_id: number;
  cantidad: number;
  precio_unitario: string;
}

interface VentaForm {
  cliente_id: string;
  almacen_id: string;
  fecha: string;
  tipo_pago: 'contado' | 'credito';
  consumo_diario_kg: string;
  detalles: VentaDetalleForm[];
}

// Initial form values
const initialFormValues: VentaForm = {
  cliente_id: '',
  almacen_id: '',
  fecha: new Date().toISOString().split('T')[0],
  tipo_pago: 'contado',
  consumo_diario_kg: '',
  detalles: [],
};

// Validation rules
const validationRules = {
  cliente_id: (value: string) => !value ? 'El cliente es requerido' : null,
  almacen_id: (value: string) => !value ? 'El almacén es requerido' : null,
  fecha: (value: string) => !value ? 'La fecha es requerida' : null,
  detalles: (value: VentaDetalleForm[]) => value.length === 0 ? 'Debe agregar al menos un producto' : null,
};

export function useVentaForm(defaultAlmacenId?: string) {
  // UI State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Form management
  const form = useForm<VentaForm>({
    ...initialFormValues,
    almacen_id: defaultAlmacenId || initialFormValues.almacen_id
  });
  const { formData, setValues, resetForm, handleChange, errors, setErrors } = form;

  // Date handling
  const handleDateSelection = useCallback((selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      handleChange('fecha', dateStr);
    }
  }, [handleChange]);

  // Client selection
  const handleSelectCliente = useCallback((cliente: ClienteSimple) => {
    handleChange('cliente_id', cliente.id.toString());
    
    // Auto-fill consumo_diario_kg if available
    if (cliente.consumo_diario_kg) {
      handleChange('consumo_diario_kg', cliente.consumo_diario_kg.toString());
    }
    
    setShowClienteModal(false);
  }, [handleChange]);

  // Warehouse change handler
  const handleAlmacenChange = useCallback(async (newAlmacenId: string, onAlmacenChange?: (almacenId: string) => Promise<void>) => {
    handleChange('almacen_id', newAlmacenId);
    
    // Clear products when warehouse changes
    handleChange('detalles', []);
    
    // Call callback to filter presentations
    if (onAlmacenChange) {
      await onAlmacenChange(newAlmacenId);
    }
  }, [handleChange]);

  // Helper function to apply changes to details
  const applyChange = useCallback((changeFn: (prevDetalles: VentaDetalleForm[]) => VentaDetalleForm[]) => {
    const updatedDetalles = changeFn(formData.detalles);
    handleChange('detalles', updatedDetalles);
  }, [formData.detalles, handleChange]);

  // Product management
  const agregarProducto = useCallback((presentacionId: string, cantidad: string, precioUnitario: string) => {
    const cantidadNum = parseFloat(cantidad);
    const presentacionIdNum = parseInt(presentacionId, 10);

    if (isNaN(cantidadNum) || cantidadNum <= 0 || isNaN(presentacionIdNum)) {
      return false;
    }

    // Check if product already exists
    const existingIndex = formData.detalles.findIndex(d => d.presentacion_id === presentacionIdNum);
    
    if (existingIndex >= 0) {
      // Update existing product
      applyChange(prevDetalles => 
        prevDetalles.map((detalle, idx) => 
          idx === existingIndex 
            ? { ...detalle, cantidad: cantidadNum, precio_unitario: precioUnitario }
            : detalle
        )
      );
    } else {
      // Add new product
      const nuevoDetalle: VentaDetalleForm = {
        presentacion_id: presentacionIdNum,
        cantidad: cantidadNum,
        precio_unitario: precioUnitario,
      };
      
      applyChange(prevDetalles => [...prevDetalles, nuevoDetalle]);
    }

    setShowProductModal(false);
    return true;
  }, [formData.detalles, applyChange]);

  const actualizarProducto = useCallback((index: number, field: 'cantidad' | 'precio_unitario', value: string) => {
    if (field === 'cantidad') {
      const cantidadNum = parseFloat(value);
      if (isNaN(cantidadNum) || cantidadNum < 0) return;
    }

    applyChange(prevDetalles => 
      prevDetalles.map((detalle, idx) => 
        idx === index ? { ...detalle, [field]: field === 'cantidad' ? parseFloat(value) : value } : detalle
      )
    );
  }, [applyChange]);

  const eliminarProducto = useCallback((index: number) => {
    applyChange(prevDetalles => prevDetalles.filter((_, idx) => idx !== index));
  }, [applyChange]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    Object.entries(validationRules).forEach(([field, rule]) => {
      const error = rule(formData[field as keyof VentaForm] as any);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, setErrors]);

  // Reset form with optional values
  const resetFormWithDefaults = useCallback((defaults?: Partial<VentaForm>) => {
    const newValues = {
      ...initialFormValues,
      almacen_id: defaultAlmacenId || initialFormValues.almacen_id,
      ...defaults,
    };
    setValues(newValues);
  }, [defaultAlmacenId, setValues]);

  return {
    // Form data and management
    formData,
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

    // Utilities
    applyChange,
  };
}