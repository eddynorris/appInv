// app/pagos/create.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { PaymentForm } from '@/components/form/PaymentForm';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePagoItem } from '@/hooks/crud/usePagoItem';
import { useVentasPendientes } from '@/hooks/crud/useVentasPendientes';
import { useForm } from '@/hooks/useForm';

export default function CreatePagoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  
  // Hook para gestión de ventas pendientes
  const { 
    ventaOptions, 
    selectedVentaId, 
    selectedVentaInfo, 
    setSelectedVentaId, 
    isLoading: isLoadingVentas, 
    error: ventasError 
  } = useVentasPendientes();
  
  // Hook para operaciones CRUD de pagos
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
  
  // Hook para manejo del formulario
  const { 
    formData, 
    errors, 
    isSubmitting, 
    handleChange, 
    handleSubmit, 
    validate,
    setErrors 
  } = useForm({
    venta_id: selectedVentaId,
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    referencia: '',
  });

  // Actualizar el ID de venta cuando cambie la selección
  useEffect(() => {
    if (selectedVentaId) {
      handleChange('venta_id', selectedVentaId);
    }
  }, [selectedVentaId, handleChange]);

  // Reglas de validación para el formulario
  const validationRules = {
    venta_id: (value: string) => !value.trim() ? 'La venta es requerida' : null,
    monto: (value: string) => {
      if (!value.trim()) return 'El monto es requerido';
      if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) return 'Ingrese un monto válido';
      if (selectedVentaInfo && parseFloat(value) > parseFloat(selectedVentaInfo.saldoPendiente)) {
        return `El monto supera el saldo pendiente (${selectedVentaInfo.saldoPendiente})`;
      }
      return null;
    },
    // Solo para transferencias exigimos referencia y comprobante
    referencia: (value: string) => {
      if (formData.metodo_pago !== 'transferencia') return null;
      return !value.trim() ? 'La referencia es requerida para transferencias' : null;
    }
  };

  // Validación adicional para comprobante
  const validateComprobante = () => {
    if (formData.metodo_pago === 'transferencia' && !comprobante) {
      setErrors(prev => ({
        ...prev,
        comprobante: 'El comprobante es requerido para transferencias'
      }));
      return false;
    }
    return true;
  };

  // Manejar envío del formulario
  const submitForm = async () => {
    // Validar reglas del formulario y comprobante
    if (!validate(validationRules) || !validateComprobante()) {
      return;
    }
    
    try {
      // Preparar los datos del pago
      const pagoData = {
        venta_id: parseInt(formData.venta_id),
        monto: formData.monto.replace(',', '.'),
        fecha: formData.fecha,
        metodo_pago: formData.metodo_pago,
        referencia: formData.referencia || undefined
      };
      
      // Crear el pago
      const response = await createPago(pagoData);
      
      if (response) {
        Alert.alert(
          'Pago Registrado',
          'El pago ha sido registrado exitosamente',
          [{ text: 'OK', onPress: () => router.replace('/pagos') }]
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

  // Manejar cambio de venta seleccionada
  const handleVentaChange = (value: string) => {
    setSelectedVentaId(value);
    handleChange('venta_id', value); // Actualizar el formulario con el nuevo ID de venta
  };

  // Mostrar pantalla de carga mientras se cargan las ventas
  if (isLoadingVentas) {
    return (
      <>
        <Stack.Screen options={{ title: 'Registrar Pago', headerShown: true }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando ventas disponibles...</ThemedText>
        </ThemedView>
      </>
    );
  }

  // Mostrar mensaje si no hay ventas disponibles
  if (ventaOptions.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Registrar Pago', headerShown: true }} />
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Registrar Pago</ThemedText>
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>
              No hay ventas con pagos pendientes
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </>
    );
  }

  // Determinar si se está procesando
  const isProcessing = isSubmitting || isPagoLoading;

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Registrar Pago',
        headerShown: true 
      }} />
      
      <ScrollView>
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
            onChange={(field, value) => {
              // Manejar el cambio de venta_id de forma especial
              if (field === 'venta_id') {
                handleVentaChange(value);
              } else {
                handleChange(field, value);
              }
            }}
            onSubmit={() => handleSubmit(submitForm)}
            onCancel={() => router.back()}
            comprobante={comprobante}
            setComprobante={setComprobante}
            existingComprobante={existingComprobante}
            setExistingComprobante={setExistingComprobante}
            ventaOptions={ventaOptions}
            ventaInfo={selectedVentaInfo}
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