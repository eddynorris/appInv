// app/ventas/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ventaApi, clienteApi, almacenApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Cliente, Almacen, Venta } from '@/models';

export default function EditVentaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data for dropdowns
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Venta>>({
    cliente_id: 0,
    almacen_id: 0,
    fecha: new Date().toISOString().split('T')[0],
    tipo_pago: 'contado',
    estado_pago: 'pendiente',
    total: '0',
  });

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load data for form
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Cargar datos en paralelo
        const [ventaData, clientesData, almacenesData] = await Promise.all([
          ventaApi.getVenta(parseInt(id)),
          clienteApi.getClientes(),
          almacenApi.getAlmacenes()
        ]);
        
        // Cargar listas de clientes y almacenes
        setClientes(clientesData.data || []);
        setAlmacenes(almacenesData.data || []);
        
        // Cargar datos de la venta
        if (ventaData) {
          setFormData({
            cliente_id: ventaData.cliente_id,
            almacen_id: ventaData.almacen_id,
            fecha: ventaData.fecha.split('T')[0],
            tipo_pago: ventaData.tipo_pago,
            estado_pago: ventaData.estado_pago,
            total: ventaData.total,
            // No podemos editar los detalles de venta desde aquí
          });
        } else {
          Alert.alert('Error', 'No se pudo cargar la venta');
          router.back();
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (field: string, value: string) => {
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
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cliente_id) {
      newErrors.cliente_id = 'El cliente es requerido';
    }
    
    if (!formData.almacen_id) {
      newErrors.almacen_id = 'El almacén es requerido';
    }
    
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !id) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Preparar datos para actualizar
      // NOTA: Solo actualizamos algunos campos, ya que los detalles de la venta no se pueden editar desde aquí
      const updateData = {
        cliente_id: formData.cliente_id,
        almacen_id: formData.almacen_id,
        fecha: formData.fecha,
        tipo_pago: formData.tipo_pago,
        estado_pago: formData.estado_pago,
      };
      
      const response = await ventaApi.updateVenta(parseInt(id), updateData);
      
      if (response) {
        Alert.alert(
          'Venta Actualizada',
          'La venta ha sido actualizada exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar la venta');
      }
    } catch (err) {
      console.error('Error updating venta:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar la venta';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Venta',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos...</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Editar Venta',
        headerShown: true 
      }} />
      
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>Editar Venta</ThemedText>
        
        <ThemedView style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            Nota: Solo puedes modificar información básica de la venta. Los detalles de productos no se pueden editar.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          {/* Cliente Selector */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Cliente *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.cliente_id?.toString()}
                onValueChange={(value) => handleChange('cliente_id', value)}
                style={[
                  styles.picker,
                  { color: Colors[colorScheme].text }
                ]}
              >
                {clientes.map(cliente => (
                  <Picker.Item 
                    key={cliente.id} 
                    label={cliente.nombre} 
                    value={cliente.id.toString()} 
                  />
                ))}
              </Picker>
            </View>
            {errors.cliente_id && (
              <ThemedText style={styles.errorText}>{errors.cliente_id}</ThemedText>
            )}
          </ThemedView>

          {/* Almacén Selector */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Almacén *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.almacen_id?.toString()}
                onValueChange={(value) => handleChange('almacen_id', value)}
                style={[
                  styles.picker,
                  { color: Colors[colorScheme].text }
                ]}
              >
                {almacenes.map(almacen => (
                  <Picker.Item 
                    key={almacen.id} 
                    label={almacen.nombre} 
                    value={almacen.id.toString()} 
                  />
                ))}
              </Picker>
            </View>
            {errors.almacen_id && (
              <ThemedText style={styles.errorText}>{errors.almacen_id}</ThemedText>
            )}
          </ThemedView>

          {/* Tipo de Pago */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Tipo de Pago</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.tipo_pago}
                onValueChange={(value) => handleChange('tipo_pago', value)}
                style={[
                  styles.picker,
                  { color: Colors[colorScheme].text }
                ]}
              >
                <Picker.Item label="Contado" value="contado" />
                <Picker.Item label="Crédito" value="credito" />
              </Picker>
            </View>
          </ThemedView>

          {/* Estado de Pago */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Estado de Pago</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.estado_pago}
                onValueChange={(value) => handleChange('estado_pago', value)}
                style={[
                  styles.picker,
                  { color: Colors[colorScheme].text }
                ]}
              >
                <Picker.Item label="Pagado" value="pagado" />
                <Picker.Item label="Pendiente" value="pendiente" />
                <Picker.Item label="Pago Parcial" value="parcial" />
              </Picker>
            </View>
          </ThemedView>

          {/* Fecha */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Fecha *</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme].text },
                errors.fecha && styles.inputError
              ]}
              value={formData.fecha}
              onChangeText={(value) => handleChange('fecha', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9BA1A6"
            />
            {errors.fecha && (
              <ThemedText style={styles.errorText}>{errors.fecha}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Guardar Cambios</ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  inputError: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#88c8d8',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});