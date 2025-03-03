// app/clientes/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { clienteApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Cliente } from '@/models';

export default function EditClienteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nombre: '',
    telefono: '',
    direccion: '',
  });

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load cliente data
  useEffect(() => {
    const fetchCliente = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await clienteApi.getCliente(parseInt(id));
        
        if (response) {
          setFormData({
            nombre: response.nombre || '',
            telefono: response.telefono || '',
            direccion: response.direccion || '',
          });
        } else {
          Alert.alert('Error', 'No se pudo cargar los datos del cliente');
          router.back();
        }
      } catch (error) {
        console.error('Error al cargar cliente:', error);
        Alert.alert('Error', 'No se pudo cargar los datos del cliente');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchCliente();
  }, [id]);

  const handleChange = (field: keyof Cliente, value: string) => {
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
    
    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.telefono?.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }
    
    if (!formData.direccion?.trim()) {
      newErrors.direccion = 'La dirección es requerida';
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
      
      const response = await clienteApi.updateCliente(parseInt(id), formData);
      
      if (response) {
        Alert.alert(
          'Cliente Actualizado',
          'El cliente ha sido actualizado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar el cliente');
      }
    } catch (err) {
      console.error('Error al actualizar cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar el cliente';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Cliente',
          headerShown: true 
        }} />
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos del cliente...</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Editar Cliente',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Editar Cliente</ThemedText>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Nombre *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text },
                  errors.nombre && styles.inputError
                ]}
                value={formData.nombre}
                onChangeText={(value) => handleChange('nombre', value)}
                placeholder="Ingresa el nombre"
                placeholderTextColor="#9BA1A6"
              />
              {errors.nombre && (
                <ThemedText style={styles.errorText}>{errors.nombre}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Teléfono *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text },
                  errors.telefono && styles.inputError
                ]}
                value={formData.telefono}
                onChangeText={(value) => handleChange('telefono', value)}
                placeholder="Ingresa el teléfono"
                placeholderTextColor="#9BA1A6"
                keyboardType="phone-pad"
              />
              {errors.telefono && (
                <ThemedText style={styles.errorText}>{errors.telefono}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Dirección *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text },
                  errors.direccion && styles.inputError
                ]}
                value={formData.direccion}
                onChangeText={(value) => handleChange('direccion', value)}
                placeholder="Ingresa la dirección"
                placeholderTextColor="#9BA1A6"
              />
              {errors.direccion && (
                <ThemedText style={styles.errorText}>{errors.direccion}</ThemedText>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    marginBottom: 20,
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
  inputError: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
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