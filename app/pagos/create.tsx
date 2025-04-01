// app/pagos/create.tsx - Versión refactorizada
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, Alert, View, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { PaymentForm } from '@/components/form/PaymentForm';
import { pagoApi, ventaApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Venta } from '@/models';
import { useImageUploader, FileInfo } from '@/hooks/useImageUploader';

// Tipos
interface FormData {
  venta_id: string;
  monto: string;
  fecha: string;
  metodo_pago: string;
  referencia: string;
}

export default function CreatePagoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoadingVentas, setIsLoadingVentas] = useState(true);
  
  // Usar hook personalizado para la gestión de archivos
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
  
  // Estado del formulario
  const [formData, setFormData] = useState<FormData>({
    venta_id: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    metodo_pago: 'efectivo',
    referencia: '',
  });

  // Estado de errores
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar ventas disponibles para asignar pagos
  useEffect(() => {
    const loadVentas = async () => {
      try {
        setIsLoadingVentas(true);
        const response = await ventaApi.getVentas(1, 100);
        
        if (response && response.data) {
          // Filtrar solo ventas con pagos pendientes
          const ventasConPendientes = response.data.filter(venta => 
            venta.estado_pago === 'pendiente' || venta.estado_pago === 'parcial'
          );
          setVentas(ventasConPendientes);
          
          // Si hay ventas, preseleccionar la primera
          if (ventasConPendientes.length > 0) {
            setFormData(prev => ({
              ...prev,
              venta_id: ventasConPendientes[0].id.toString()
            }));
          }
        }
      } catch (error) {
        console.error('Error al cargar ventas:', error);
        Alert.alert('Error', 'No se pudieron cargar las ventas disponibles');
      } finally {
        setIsLoadingVentas(false);
      }
    };
    
    loadVentas();
  }, []);

  // Handler de cambio de campos
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
  }, [errors]);

  // Validación de formulario
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
    
    // Solo para transferencias exigimos referencia y comprobante
    if (formData.metodo_pago === 'transferencia') {
      if (!formData.referencia?.trim()) {
        newErrors.referencia = 'La referencia es requerida para transferencias';
      }
      
      if (!comprobante) {
        newErrors.comprobante = 'El comprobante es requerido para transferencias';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, comprobante, ventaInfo]);

  // Envío del formulario
  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Crear el objeto base de datos del pago
      const pagoData = {
        venta_id: parseInt(formData.venta_id),
        monto: formData.monto.replace(',', '.'),
        fecha: formData.fecha,
        metodo_pago: formData.metodo_pago,
        referencia: formData.referencia || null
      };
      
      let response;
      
      // Si hay un comprobante, usar el método con comprobante
      if (comprobante) {
        response = await pagoApi.createPagoWithComprobante(pagoData, comprobante.uri);
      } else {
        // Si no hay comprobante, usar el método JSON estándar
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
      } else {
        Alert.alert('Error', 'No se pudo registrar el pago');
      }
    } catch (err) {
      // Intentar obtener un mensaje de error más específico
      let errorMessage = 'Ocurrió un error al registrar el pago';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, comprobante, validate]);

  // Obtener información de la venta seleccionada (memoizada)
  const ventaInfo = useMemo(() => {
    if (!formData.venta_id) return null;
    
    const ventaSeleccionada = ventas.find(v => v.id.toString() === formData.venta_id);
    if (!ventaSeleccionada) return null;
    
    return {
      total: parseFloat(ventaSeleccionada.total).toFixed(2),
      cliente: ventaSeleccionada.cliente?.nombre || 'Cliente no disponible',
      saldoPendiente: ventaSeleccionada.saldo_pendiente 
        ? parseFloat(ventaSeleccionada.saldo_pendiente).toFixed(2)
        : parseFloat(ventaSeleccionada.total).toFixed(2)
    };
  }, [formData.venta_id, ventas]);

  // Opciones de venta para el selector (memoizadas)
  const ventaOptions = useMemo(() => {
    return ventas.map(venta => ({
      id: venta.id.toString(),
      label: `Venta #${venta.id} - ${venta.cliente?.nombre || 'Cliente'} - $${parseFloat(venta.total).toFixed(2)}`,
      saldoPendiente: venta.saldo_pendiente || venta.total
    }));
  }, [ventas]);

  // Renderizar pantalla de carga
  if (isLoadingVentas) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Registrar Pago',
          headerShown: true 
        }} />
        
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando ventas disponibles...</ThemedText>
        </ThemedView>
      </>
    );
  }

  // Renderizar mensaje si no hay ventas disponibles
  if (ventas.length === 0) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Registrar Pago',
          headerShown: true 
        }} />
        
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

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Registrar Pago',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Registrar Pago</ThemedText>

          <PaymentForm
            formData={formData}
            errors={errors}
            isSubmitting={isSubmitting}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            comprobante={comprobante}
            setComprobante={setComprobante}
            existingComprobante={null}
            setExistingComprobante={() => {}}
            ventaOptions={ventaOptions}
            ventaInfo={ventaInfo}
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    color: '#E53935',
    fontSize: 16,
    textAlign: 'center',
  }
});