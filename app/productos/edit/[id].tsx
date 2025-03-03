// app/productos/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  View,
  Switch
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { productoApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Producto } from '@/models';

export default function EditProductoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Producto>>({
    nombre: '',
    descripcion: '',
    precio_compra: '',
    activo: true,
  });

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load producto data
  useEffect(() => {
    const fetchProducto = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await productoApi.getProducto(parseInt(id));
        
        if (response) {
          setFormData({
            nombre: response.nombre || '',
            descripcion: response.descripcion || '',
            precio_compra: response.precio_compra || '',
            activo: response.activo,
          });
        } else {
          Alert.alert('Error', 'No se pudo cargar los datos del producto');
          router.back();
        }
      } catch (error) {
        console.error('Error al cargar producto:', error);
        Alert.alert('Error', 'No se pudo cargar los datos del producto');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducto();
  }, [id]);

  const handleChange = (field: keyof Producto, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is changed
    if (typeof value === 'string' && errors[field]) {
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
    
    if (!formData.precio_compra?.trim()) {
      newErrors.precio_compra = 'El precio de compra es requerido';
    } else if (isNaN(parseFloat(formData.precio_compra)) || parseFloat(formData.precio_compra) <= 0) {
      newErrors.precio_compra = 'Ingrese un precio válido';
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
      
      const productoData = {
        ...formData,
        precio_compra: formData.precio_compra?.replace(',', '.') // Ensure decimal format
      };
      
      const response = await productoApi.updateProducto(parseInt(id), productoData);
      
      if (response) {
        Alert.alert(
          'Producto Actualizado',
          'El producto ha sido actualizado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar el producto');
      }
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar el producto';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Producto',
          headerShown: true 
        }} />
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos del producto...</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Editar Producto',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Editar Producto</ThemedText>

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
                placeholder="Ingresa el nombre del producto"
                placeholderTextColor="#9BA1A6"
              />
              {errors.nombre && (
                <ThemedText style={styles.errorText}>{errors.nombre}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Descripción</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { color: Colors[colorScheme].text }
                ]}
                value={formData.descripcion}
                onChangeText={(value) => handleChange('descripcion', value)}
                placeholder="Ingresa una descripción"
                placeholderTextColor="#9BA1A6"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Precio de Compra *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text },
                  errors.precio_compra && styles.inputError
                ]}
                value={formData.precio_compra}
                onChangeText={(value) => handleChange('precio_compra', value)}
                placeholder="0.00"
                placeholderTextColor="#9BA1A6"
                keyboardType="numeric"
              />
              {errors.precio_compra && (
                <ThemedText style={styles.errorText}>{errors.precio_compra}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Estado</ThemedText>
              <View style={styles.switchContainer}>
                <ThemedText>{formData.activo ? 'Activo' : 'Inactivo'}</ThemedText>
                <Switch
                  value={formData.activo}
                  onValueChange={(value) => handleChange('activo', value)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={formData.activo ? '#0a7ea4' : '#f4f3f4'}
                />
              </View>
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
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