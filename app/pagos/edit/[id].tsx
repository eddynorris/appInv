// app/pagos/edit/[id].tsx - Versión refactorizada
import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { PaymentForm } from '@/components/form/PaymentForm';
import { pagoApi, API_CONFIG } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Pago } from '@/models';
import { useImageUploader, FileInfo } from '@/hooks/useImageUploader';

export default function EditPagoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Pago>>({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    referencia: '',
  });

  // Estado de errores
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Gestión de archivos con el hook personalizado
  const { 
    file: comprobante, 
    setFile: setComprobante,
    pickImage,
    takePhoto,
    pickDocument
  } = useImageUploader({
    maxSizeMB: 5,
    allowedTypes: ['image', 'document']
  });

  // Comprobante existente
  const [existingComprobante, setExistingComprobante] = useState<string | null>(null);

  // Cargar datos del pago
  useEffect(() => {
    const fetchPago = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await pagoApi.getPago(parseInt(id));
        
        if (response) {
          // Asegurar que la fecha sea correcta
          const fechaFormateada = response.fecha 
            ? new Date(response.fecha).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0];
            
          setFormData({
            venta_id: response.venta_id.toString(),
            monto: response.monto || '',
            fecha: fechaFormateada,
            metodo_pago: response.metodo_pago || 'efectivo',
            referencia: response.referencia || '',
          });
          
          if (response.url_comprobante) {
            setExistingComprobante(response.url_comprobante);
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
        setIsLoading(false);
      }
    };

    fetchPago();
  }, [id]);

  // Handler de cambio de campos
  const handleChange = (field: keyof Pago, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error cuando se cambia el campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validación del formulario
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.monto?.trim()) {
      newErrors.monto = 'El monto es requerido';
    } else if (isNaN(parseFloat(formData.monto)) || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'Ingrese un monto válido';
    }
    
    // Si el método de pago es transferencia, se requiere referencia
    if (formData.metodo_pago === 'transferencia') {
      if (!formData.referencia?.trim()) {
        newErrors.referencia = 'La referencia es requerida para transferencias';
      }
      
      // Si no hay comprobante existente y tampoco se ha seleccionado uno nuevo
      if (!existingComprobante && !comprobante) {
        newErrors.comprobante = 'El comprobante es requerido para transferencias';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Envío del formulario
  const handleSubmit = async () => {
    if (!validate() || !id) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Asegurar que la fecha está en el formato correcto para la API
      let fechaFormateada = formData.fecha;
      if (fechaFormateada && !fechaFormateada.includes('T')) {
        fechaFormateada = `${fechaFormateada}T00:00:00Z`;
      }
      
      const pagoData = {
        monto: formData.monto?.replace(',', '.'),
        fecha: fechaFormateada,
        metodo_pago: formData.metodo_pago,
        referencia: formData.referencia
      };
      
      let response;
      
      // Si hay un nuevo comprobante, usar el método con comprobante
      if (comprobante) {
        response = await pagoApi.updatePagoWithComprobante(parseInt(id), pagoData, comprobante.uri);
      } else {
        response = await pagoApi.updatePago(parseInt(id), pagoData);
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
      } else {
        Alert.alert('Error', 'No se pudo actualizar el pago');
      }
    } catch (err) {
      console.error('Error al actualizar pago:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar el pago';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para ver el comprobante existente
  const viewExistingComprobante = () => {
    if (existingComprobante) {
      const comprobanteUrl = `${API_CONFIG.baseUrl}/uploads/${existingComprobante}`;
      Alert.alert('Comprobante', `URL: ${comprobanteUrl}`);
    }
  };

  // Si está cargando, mostrar indicador
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Pago',
          headerShown: true 
        }} />
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos del pago...</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Editar Pago',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Editar Pago</ThemedText>

          <PaymentForm
            formData={formData}
            errors={errors}
            isSubmitting={isSubmitting}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            comprobante={comprobante}
            setComprobante={setComprobante}
            existingComprobante={existingComprobante}
            setExistingComprobante={setExistingComprobante}
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
  }
});