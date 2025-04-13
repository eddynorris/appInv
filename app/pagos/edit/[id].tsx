// app/pagos/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { PaymentForm } from '@/components/form/PaymentForm';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePagoItem } from '@/hooks/crud/usePagoItem';
import { useForm } from '@/hooks/useForm';
import { Pago } from '@/models';

export default function EditPagoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const [ventaId, setVentaId] = useState<string>('');
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [ventaInfo, setVentaInfo] = useState<{
    total: string;
    cliente: string;
    saldoPendiente: string;
  } | null>(null);

  // Hook para operaciones CRUD de pagos
  const {
    getPago,
    updatePago,
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
    setFormData,
    setErrors
  } = useForm({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    referencia: '',
    venta_id: ''
  });

  // Cargar los datos del pago
  useEffect(() => {
    const fetchPago = async () => {
      if (!id) return;

      try {
        setIsFetchingInitial(true);
        const pago = await getPago(parseInt(id));

        if (pago) {
          // Formatear fecha correctamente
          const fechaFormateada = pago.fecha
            ? new Date(pago.fecha).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

          // Actualizar el formulario con los datos
          setFormData({
            venta_id: pago.venta_id.toString(),
            monto: pago.monto || '',
            fecha: fechaFormateada,
            metodo_pago: pago.metodo_pago || 'efectivo',
            referencia: pago.referencia || '',
          });

          // Guardar el ID de la venta para referencia
          setVentaId(pago.venta_id.toString());

          // Establecer info detallada de la venta para mostrar
          if (pago.venta) {
            setVentaInfo({
              total: parseFloat(pago.venta.total).toFixed(2),
              cliente: pago.venta?.cliente?.nombre || 'Cliente no disponible',
              saldoPendiente: pago.venta.saldo_pendiente 
                ? parseFloat(pago.venta.saldo_pendiente).toFixed(2) 
                : '0.00'
            });
          }
        } else {
          Alert.alert('Error', 'No se pudo cargar los datos del pago');
          router.back();
        }
      } catch (error) {
        console.error('Error al cargar pago:', error);
        Alert.alert('Error', 'No se pudo cargar los datos del pago');
        router.back();
      } finally {
        setIsFetchingInitial(false);
      }
    };

    fetchPago();
  }, [id, getPago, setFormData]);

  // Reglas de validación para el formulario
  const validationRules = {
    monto: (value: string) => {
      if (!value.trim()) return 'El monto es requerido';
      if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) return 'Ingrese un monto válido';
      return null;
    },
    // Solo para transferencias exigimos referencia
    referencia: (value: string) => {
      if (formData.metodo_pago !== 'transferencia') return null;
      return !value.trim() ? 'La referencia es requerida para transferencias' : null;
    }
  };

  // Validación adicional para comprobante
  const validateComprobante = () => {
    if (formData.metodo_pago === 'transferencia' && !existingComprobante && !comprobante) {
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
    if (!id) return;

    // Validar reglas del formulario y comprobante
    if (!validate(validationRules) || !validateComprobante()) {
      return;
    }

    try {
      // Preparar los datos del pago
      const pagoData = {
        monto: formData.monto.replace(',', '.'),
        fecha: formData.fecha,
        metodo_pago: formData.metodo_pago,
        referencia: formData.referencia || undefined
      };

      // Actualizar el pago
      const response = await updatePago(parseInt(id), pagoData);

      if (response) {
        Alert.alert(
          'Pago Actualizado',
          'El pago ha sido actualizado exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return true;
      } else {
        throw new Error(pagoError || 'No se pudo actualizar el pago');
      }
    } catch (error) {
      console.error('Error al actualizar pago:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Ocurrió un error al actualizar el pago');
      return false;
    }
  };

  // Mostrar pantalla de carga durante la carga inicial
  if (isFetchingInitial) {
    return (
      <>
        <Stack.Screen options={{ title: 'Editar Pago', headerShown: true }} />
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos del pago...</ThemedText>
        </ThemedView>
      </>
    );
  }

  // Determinar si se está procesando
  const isProcessing = isSubmitting || isPagoLoading;

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Editar Pago',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Editar Pago</ThemedText>

          {pagoError && !isProcessing && (
            <ThemedView style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{pagoError}</ThemedText>
            </ThemedView>
          )}

          <PaymentForm
            formData={formData}
            errors={errors}
            isSubmitting={isProcessing}
            onChange={handleChange}
            onSubmit={() => handleSubmit(submitForm)}
            onCancel={() => router.back()}
            comprobante={comprobante}
            setComprobante={setComprobante}
            existingComprobante={existingComprobante}
            setExistingComprobante={setExistingComprobante}
            ventaInfo={ventaInfo}
            isEdit={true}
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