// hooks/usePayment.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { pagoApi } from '@/services/api';
import { useForm } from '@/hooks/useForm';
import { Pago, Venta } from '@/models';

interface PaymentFile {
  uri: string;
  name: string;
  type: string;
}

interface UsePaymentOptions {
  onPaymentSuccess?: (pagoId?: number) => void;
  ventaId?: number;
}

export function usePayment({ onPaymentSuccess, ventaId }: UsePaymentOptions = {}) {
  // Form state using our reusable form hook
  const { 
    formData, 
    errors, 
    isSubmitting, 
    handleChange, 
    handleSubmit, 
    setFormData,
    setErrors
  } = useForm({
    venta_id: ventaId ? ventaId.toString() : '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    referencia: '',
  });
  
  // File state for receipt
  const [comprobante, setComprobante] = useState<PaymentFile | null>(null);
  const [existingComprobante, setExistingComprobante] = useState<string | null>(null);
  
  // Ventas state for select
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [ventaInfo, setVentaInfo] = useState<{
    total: string;
    cliente: string;
    saldoPendiente: string;
  } | null>(null);
  
  // Set comprobante (receipt file)
  const handleSetComprobante = useCallback((file: PaymentFile | null) => {
    setComprobante(file);
    setExistingComprobante(null);
    
    // Clear error if exists
    if (errors.comprobante) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.comprobante;
        return newErrors;
      });
    }
  }, [errors, setErrors]);
  
  // Validation rules
  const getValidationRules = useCallback(() => {
    const rules: Record<string, (value: any) => string | null> = {
      venta_id: (value) => !value ? 'La venta es requerida' : null,
      monto: (value) => {
        if (!value.trim()) {
          return 'El monto es requerido';
        }
        
        const amount = parseFloat(value.replace(',', '.'));
        if (isNaN(amount) || amount <= 0) {
          return 'Ingrese un monto válido';
        }
        
        if (ventaInfo && amount > parseFloat(ventaInfo.saldoPendiente)) {
          return `El monto supera el saldo pendiente ($${ventaInfo.saldoPendiente})`;
        }
        
        return null;
      }
    };
    
    // For transfers, require reference and receipt
    if (formData.metodo_pago === 'transferencia') {
      rules.referencia = (value) => !value?.trim() ? 'La referencia es requerida para transferencias' : null;
      rules.comprobante = () => !comprobante && !existingComprobante ? 'El comprobante es requerido para transferencias' : null;
    }
    
    return rules;
  }, [formData.metodo_pago, comprobante, existingComprobante, ventaInfo]);
  
  // Create payment handler
  const createPayment = useCallback(async () => {
    return handleSubmit(async (data) => {
      try {
        const paymentData = {
          venta_id: parseInt(data.venta_id),
          monto: data.monto.replace(',', '.'),
          fecha: `${data.fecha}T00:00:00Z`,
          metodo_pago: data.metodo_pago,
          referencia: data.referencia || null
        };
        
        let response;
        
        // If receipt file exists, use the file upload method
        if (comprobante) {
          response = await pagoApi.createPagoWithComprobante(paymentData, comprobante.uri);
        } else {
          // Otherwise use regular JSON method
          response = await pagoApi.createPago(paymentData);
        }
        
        if (response) {
          Alert.alert(
            'Pago Registrado',
            'El pago ha sido registrado exitosamente',
            [{ text: 'OK', onPress: () => onPaymentSuccess?.(response.id) }]
          );
          return true;
        } else {
          throw new Error('No se pudo registrar el pago');
        }
      } catch (error) {
        console.error('Error creating payment:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Error al registrar el pago');
        return false;
      }
    }, getValidationRules());
  }, [handleSubmit, comprobante, getValidationRules, onPaymentSuccess]);
  
  // Update payment handler
  const updatePayment = useCallback(async (id: number) => {
    return handleSubmit(async (data) => {
      try {
        const paymentData = {
          monto: data.monto.replace(',', '.'),
          fecha: `${data.fecha}T00:00:00Z`,
          metodo_pago: data.metodo_pago,
          referencia: data.referencia || null
        };
        
        let response;
        
        // If receipt file exists, use the file upload method
        if (comprobante) {
          response = await pagoApi.updatePagoWithComprobante(id, paymentData, comprobante.uri);
        } else {
          // Otherwise use regular JSON method
          response = await pagoApi.updatePago(id, paymentData);
        }
        
        if (response) {
          Alert.alert(
            'Pago Actualizado',
            'El pago ha sido actualizado exitosamente',
            [{ text: 'OK', onPress: () => onPaymentSuccess?.(id) }]
          );
          return true;
        } else {
          throw new Error('No se pudo actualizar el pago');
        }
      } catch (error) {
        console.error('Error updating payment:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Error al actualizar el pago');
        return false;
      }
    }, getValidationRules());
  }, [handleSubmit, comprobante, getValidationRules, onPaymentSuccess]);
  
  // Load existing payment data
  const loadPayment = useCallback((payment: Pago) => {
    setFormData({
      venta_id: payment.venta_id.toString(),
      monto: payment.monto,
      fecha: payment.fecha.split('T')[0],
      metodo_pago: payment.metodo_pago,
      referencia: payment.referencia || '',
    });
    
    if (payment.url_comprobante) {
      setExistingComprobante(payment.url_comprobante);
    }
  }, [setFormData]);
  
  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    comprobante,
    setComprobante: handleSetComprobante,
    existingComprobante,
    setExistingComprobante,
    ventas,
    setVentas,
    ventaInfo,
    setVentaInfo,
    createPayment,
    updatePayment,
    loadPayment,
    getValidationRules
  };
}