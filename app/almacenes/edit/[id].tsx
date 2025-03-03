// app/almacenes/edit/[id].tsx
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
import { almacenApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Almacen } from '@/models';

export default function EditAlmacenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Almacen>>({
    nombre: '',
    direccion: '',
    ciudad: '',
  });

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load almacen data
  useEffect(() => {
    const fetchAlmacen = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await almacenApi.getAlmacen(parseInt(id));
        
        if (response) {
          setFormData({
            nombre: response.nombre || '',
            direccion: response.direccion || '',
            ciudad: response.ciudad || '',
          });
        } else {
          Alert.alert('Error', 'No se pudo cargar los datos del almacén');
          router.back();
        }
      } catch (error) {
        console.error('Error al cargar almacén:', error);
        Alert.alert('Error', 'No se pudo cargar los datos del almacén');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlmacen();
  }, [id]);

  const handleChange = (field: keyof Almacen, value: string) => {
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !id) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await almacenApi.updateAlmacen(parseInt(id), formData);
      
      if (response) {
        Alert.alert(
          'Almacén Actualizado',
          'El almacén ha sido actualizado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar el almacén');
      }
    } catch (err) {
      console.error('Error al actualizar almacén:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar el almacén';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Almacén',
          headerShown: true 
        }} />
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos del almacén...</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Editar Almacén',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Editar Almacén</ThemedText>

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
                placeholder="Ingresa el nombre del almacén"
                placeholderTextColor="#9BA1A6"
              />
              {errors.nombre && (
                <ThemedText style={styles.errorText}>{errors.nombre}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Ciudad</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text }
                ]}
                value={formData.ciudad}
                onChangeText={(value) => handleChange('ciudad', value)}
                placeholder="Ingresa la ciudad"
                placeholderTextColor="#9BA1A6"
              />
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Dirección</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { color: Colors[colorScheme].text }
                ]}
                value={formData.direccion}
                onChangeText={(value) => handleChange('direccion', value)}
                placeholder="Ingresa la dirección"
                placeholderTextColor="#9BA1A6"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
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
  textArea: {
    minHeight: 80,
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