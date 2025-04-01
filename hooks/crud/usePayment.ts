// Centralized hook for payments management
import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { pagoApi, ventaApi } from '@/services/api';
import { Pago, Venta } from '@/models';
import { useApiResource } from '@/hooks/useApiResource';

// File type for payment receipts
export interface FileInfo {
  uri: string;
  name: string;
  type: string;
}

export function usePayments() {
  // Use the generic API resource hook for CRUD operations
  const {
    data: pagos,
    isLoading,
    error,
    pagination,
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deleteItem
  } = useApiResource<Pago>({
    initialParams: { page: 1, perPage: 10 },
    fetchFn: pagoApi.getPagos,
    deleteFn: pagoApi.deletePago,
    getFn: pagoApi.getPago
  });

  // Payment form state
  const [formData, setFormData] = useState({
    venta_id: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    referencia: '',
  });

  // File state for receipt
  const [comprobante, setComprobante] = useState<FileInfo | null>(null);
  const [existingComprobante, setExistingComprobante] = useState<string | null>(null);
  
  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Related data
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoadingVentas, setIsLoadingVentas] = useState(false);
  const [ventaInfo, setVentaInfo] = useState<{
    total: string;
    cliente: string;
    saldoPendiente: string;
  } | null>(null);

  // Load available sales for payment selection
  const loadVentas = useCallback(async () => {
    try {
      setIsLoadingVentas(true);
      const response = await ventaApi.getVentas(1, 100);
      
      if (response && response.data) {
        // Filter only pending or partial sales
        const ventasConPendientes = response.data.filter(venta => 
          venta.estado_pago === 'pendiente' || venta.estado_pago === 'parcial'
        );
        setVentas(ventasConPendientes);
        
        // Pre-select the first one if available
        if (ventasConPendientes.length > 0) {
          setFormData(prev => ({
            ...prev,
            venta_id: ventasConPendientes[0].id.toString()
          }));
          
          // Also set venta info
          updateVentaInfo(ventasConPendientes[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error loading sales:', error);
      Alert.alert('Error', 'Could not load available sales');
    } finally {
      setIsLoadingVentas(false);
    }
  }, []);

  // Update sale information when a sale is selected
  const updateVentaInfo = useCallback((ventaId: string) => {
    const ventaSeleccionada = ventas.find(v => v.id.toString() === ventaId);
    if (!ventaSeleccionada) return;
    
    setVentaInfo({
      total: parseFloat(ventaSeleccionada.total).toFixed(2),
      cliente: ventaSeleccionada.cliente?.nombre || 'Cliente no disponible',
      saldoPendiente: ventaSeleccionada.saldo_pendiente 
        ? parseFloat(ventaSeleccionada.saldo_pendiente).toFixed(2)
        : parseFloat(ventaSeleccionada.total).toFixed(2)
    });
  }, [ventas]);

  // Handle form field changes
  const handleChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Update venta info when venta_id changes
    if (field === 'venta_id') {
      updateVentaInfo(value);
    }
  }, [errors, updateVentaInfo]);

  // Form validation
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.venta_id) {
      newErrors.venta_id = 'La venta es requerida';
    }
    
    if (!formData.monto.trim()) {
      newErrors.monto = 'El monto es requerido';
    } else if (isNaN(parseFloat(formData.monto)) || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'Ingrese un monto válido';
    } else if (ventaInfo && parseFloat(formData.monto) > parseFloat(ventaInfo.saldoPendiente)) {
      newErrors.monto = `El monto supera el saldo pendiente ($${ventaInfo.saldoPendiente})`;
    }
    
    // Only require reference and receipt for bank transfers
    if (formData.metodo_pago === 'transferencia') {
      if (!formData.referencia?.trim()) {
        newErrors.referencia = 'La referencia es requerida para transferencias';
      }
      
      if (!comprobante && !existingComprobante) {
        newErrors.comprobante = 'El comprobante es requerido para transferencias';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, ventaInfo, comprobante, existingComprobante]);

  // Create new payment
  const createPayment = useCallback(async () => {
    if (!validate()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create payment data object
      const pagoData = {
        venta_id: parseInt(formData.venta_id),
        monto: formData.monto.replace(',', '.'),
        fecha: formData.fecha,
        metodo_pago: formData.metodo_pago,
        referencia: formData.referencia || null // Ensure we always send a value, even if empty
      };
      
      let response;
      
      // If we have a receipt file, use the file upload method
      if (comprobante) {
        response = await pagoApi.createPagoWithComprobante(pagoData, comprobante.uri);
      } else {
        // Otherwise use the standard JSON method
        response = await pagoApi.createPago(pagoData);
      }
      
      if (response) {
        Alert.alert(
          'Pago Registrado',
          'El pago ha sido registrado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/pagos') 
            }
          ]
        );
        
        // Reset form
        resetForm();
        
        // Refresh payments list
        fetchData();
        
        return true;
      } else {
        throw new Error('No se pudo registrar el pago');
      }
    } catch (err) {
      console.error('Detailed error:', err);
      
      // Try to get a more specific error message
      let errorMessage = 'Ocurrió un error al registrar el pago';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, comprobante, validate, fetchData]);

  // Update existing payment
  const updatePayment = useCallback(async (id: number) => {
    if (!validate()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Ensure date is in the right format for the API
      let fechaFormateada = formData.fecha;
      if (fechaFormateada && !fechaFormateada.includes('T')) {
        fechaFormateada = `${fechaFormateada}T00:00:00Z`;
      }
      
      const pagoData = {
        monto: formData.monto.replace(',', '.'),
        fecha: fechaFormateada,
        metodo_pago: formData.metodo_pago,
        referencia: formData.referencia
      };
      
      let response;
      
      // If we have a new receipt file, use the file upload method
      if (comprobante) {
        response = await pagoApi.updatePagoWithComprobante(id, pagoData, comprobante.uri);
      } else {
        // Otherwise use the standard JSON method
        response = await pagoApi.updatePago(id, pagoData);
      }
      
      if (response) {
        Alert.alert(
          'Pago Actualizado',
          'El pago ha sido actualizado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back() 
            }
          ]
        );
        
        // Refresh payments list
        fetchData();
        
        return true;
      } else {
        throw new Error('No se pudo actualizar el pago');
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar el pago';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, comprobante, validate, fetchData]);

  // Load payment details for editing
  const loadPayment = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true);
      const pago = await pagoApi.getPago(id);
      
      if (pago) {
        // Format date correctly
        const fechaFormateada = pago.fecha 
          ? new Date(pago.fecha).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0];
          
        setFormData({
          venta_id: pago.venta_id.toString(),
          monto: pago.monto || '',
          fecha: fechaFormateada,
          metodo_pago: pago.metodo_pago || 'efectivo',
          referencia: pago.referencia || '',
        });
        
        if (pago.url_comprobante) {
          setExistingComprobante(pago.url_comprobante);
        }
        
        return pago;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading payment:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData({
      venta_id: '',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      metodo_pago: 'efectivo',
      referencia: '',
    });
    setComprobante(null);
    setExistingComprobante(null);
    setErrors({});
  }, []);

  // Get sale options for select input
  const getVentaOptions = useCallback(() => {
    return ventas.map(venta => ({
      value: venta.id.toString(),
      label: `Venta #${venta.id} - ${venta.cliente?.nombre || 'Cliente'} - $${parseFloat(venta.total).toFixed(2)}`
    }));
  }, [ventas]);

  // Calculate total payments
  const getTotalPagos = useCallback(() => {
    return pagos.reduce((acc, pago) => acc + parseFloat(pago.monto), 0).toFixed(2);
  }, [pagos]);

  return {
    // Data
    pagos,
    isLoading,
    error,
    pagination,
    ventas,
    isLoadingVentas,
    ventaInfo,
    
    // Form state
    formData,
    comprobante,
    existingComprobante,
    errors,
    isSubmitting,
    
    // Actions
    fetchData,
    handlePageChange,
    handleItemsPerPageChange,
    deletePayment: deleteItem,
    handleChange,
    setComprobante,
    setExistingComprobante,
    loadVentas,
    updateVentaInfo,
    
    // CRUD Operations
    createPayment,
    updatePayment,
    loadPayment,
    resetForm,
    validate,
    
    // Helper methods
    getVentaOptions,
    getTotalPagos
  };
}
