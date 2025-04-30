// app/pagos/create.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { PaymentForm } from '@/components/form/PaymentForm';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePagoItem } from '@/hooks/crud/usePagoItem';
import { useForm } from '@/hooks/useForm';
import { ventaApi } from '@/services/api';
import { Venta } from '@/models';

export default function CreatePagoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const params = useLocalSearchParams<{ ventaId?: string; clienteId?: string }>();
  const initialVentaId = params.ventaId;

  const [ventaEspecifica, setVentaEspecifica] = useState<Venta | null>(null);
  const [isLoadingVenta, setIsLoadingVenta] = useState(false);
  const [ventaError, setVentaError] = useState<string | null>(null);
  
  const { 
    createPago, 
    isLoading: isPagoLoading, 
    error: pagoError,
    comprobante,
    existingComprobante,
    setComprobante,
    setExistingComprobante,
    pickImage,
    takePhoto,
    pickDocument
  } = usePagoItem();
  
  const { 
    formData, 
    errors, 
    isSubmitting, 
    handleChange, 
    handleSubmit, 
    validate,
    setErrors,
    setValues
  } = useForm({
    venta_id: initialVentaId || '', 
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    referencia: '',
  });

  useEffect(() => {
    const loadVentaData = async (id: number) => {
      setIsLoadingVenta(true);
      setVentaError(null);
      try {
        const ventaData = await ventaApi.getVenta(id);
        setVentaEspecifica(ventaData);
        setValues({ venta_id: id.toString() });
      } catch (err) {
        console.error("Error cargando venta específica:", err);
        setVentaError(err instanceof Error ? err.message : "No se pudo cargar la venta");
        setVentaEspecifica(null);
      } finally {
        setIsLoadingVenta(false);
      }
    };

    if (initialVentaId) {
      const idNum = parseInt(initialVentaId);
      if (!isNaN(idNum)) {
        loadVentaData(idNum);
      } else {
        setVentaError("ID de venta inválido.");
      }
    } else {
      console.log("No se recibió ventaId, el usuario deberá seleccionar una (funcionalidad pendiente).");
    }
  }, [initialVentaId, setValues]);

  const validationRules = {
    venta_id: (value: string) => !value.trim() ? 'La venta es requerida' : null,
    monto: (value: string) => {
      if (!value.trim()) return 'El monto es requerido';
      const montoNum = parseFloat(value);
      if (isNaN(montoNum) || montoNum <= 0) return 'Ingrese un monto válido';
      const saldoPendiente = ventaEspecifica?.saldo_pendiente ? parseFloat(ventaEspecifica.saldo_pendiente) : null;
      if (saldoPendiente !== null && montoNum > saldoPendiente) {
        return `El monto supera el saldo pendiente (${saldoPendiente.toFixed(2)})`;
      }
      return null;
    },
    referencia: (value: string) => {
      if (formData.metodo_pago !== 'transferencia') return null;
      return !value.trim() ? 'La referencia es requerida para transferencias' : null;
    }
  };

  const validateComprobante = () => {
    if (formData.metodo_pago === 'transferencia' && !comprobante) {
      setErrors(prev => ({
        ...prev,
        comprobante: 'El comprobante es requerido para transferencias'
      }));
      return false;
    }
    if (formData.metodo_pago !== 'transferencia' || comprobante) {
       setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.comprobante;
          return newErrors;
        });
    }
    return true;
  };

  const submitForm = async () => {
    if (!validate(validationRules) || !validateComprobante()) {
      return;
    }
    
    try {
      const pagoData = {
        venta_id: parseInt(formData.venta_id),
        monto: formData.monto.replace(',', '.'),
        fecha: formData.fecha,
        metodo_pago: formData.metodo_pago as 'efectivo' | 'transferencia' | 'tarjeta',
        referencia: formData.referencia || undefined
      };
      
      const response = await createPago(pagoData);
      
      if (response) {
        Alert.alert(
          'Pago Registrado',
          'El pago ha sido registrado exitosamente',
          [{ text: 'OK', onPress: () => router.replace(`/ventas/${formData.venta_id}`) }]
        );
        return true;
      } else {
        throw new Error(pagoError || 'No se pudo registrar el pago');
      }
    } catch (error) {
      console.error('Error al registrar pago:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Ocurrió un error al registrar el pago');
      return false;
    }
  };

  if (isLoadingVenta) {
    return (
      <>
        <Stack.Screen options={{ title: 'Registrar Pago', headerShown: true }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos de la venta...</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (ventaError) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error', headerShown: true }} />
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Registrar Pago</ThemedText>
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{ventaError}</ThemedText>
          </ThemedView>
        </ThemedView>
      </>
    );
  }

  if (!initialVentaId && !ventaEspecifica) {
     return (
      <>
        <Stack.Screen options={{ title: 'Registrar Pago', headerShown: true }} />
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Registrar Pago</ThemedText>
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>
              Funcionalidad de selección de venta pendiente.
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </>
    );
  }

  const isProcessing = isSubmitting || isPagoLoading;

  const ventaInfoParaForm = ventaEspecifica ? {
      cliente: ventaEspecifica.cliente?.nombre || 'Desconocido',
      total: ventaEspecifica.total || '0',
      saldoPendiente: ventaEspecifica.saldo_pendiente || '0'
  } : null;

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Registrar Pago',
        headerShown: true 
      }} />
      
      <ScrollView keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Registrar Pago</ThemedText>

          {pagoError && !isProcessing && (
            <ThemedView style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{pagoError}</ThemedText>
            </ThemedView>
          )}

          <PaymentForm
            formData={formData}
            errors={errors}
            isSubmitting={isProcessing}
            isVentaSelectionDisabled={!!initialVentaId}
            onChange={(field, value) => {
              if (field === 'venta_id' && initialVentaId) return;
              handleChange(field as keyof typeof formData, value);
            }}
            onSubmit={() => handleSubmit(submitForm)}
            onCancel={() => router.back()}
            comprobante={comprobante}
            setComprobante={setComprobante}
            existingComprobante={existingComprobante}
            setExistingComprobante={setExistingComprobante}
            ventaOptions={initialVentaId ? [] : []} 
            ventaInfo={ventaInfoParaForm}
            pickImage={pickImage}
            takePhoto={takePhoto}
            pickDocument={pickDocument}
          />
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    textAlign: 'center',
  }
});