// Create this file at app/productos/create.tsx (make sure it exists)

import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Switch, View } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { productoApi } from '@/services';
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function CreateProductoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_compra: '',
    activo: true,
  });

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | boolean) => {
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
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.precio_compra.trim()) {
      newErrors.precio_compra = 'El precio de compra es requerido';
    } else if (isNaN(parseFloat(formData.precio_compra)) || parseFloat(formData.precio_compra) <= 0) {
      newErrors.precio_compra = 'Ingrese un precio válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const productoData = {
        ...formData,
        precio_compra: formData.precio_compra.replace(',', '.') // Ensure decimal format
      };
      
      const response = await productoApi.createProducto(productoData);
      
      if (response) {
        Alert.alert(
          'Producto Creado',
          'El producto ha sido creado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/productos') 
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo crear el producto');
      }
    } catch (err) {
      console.error('Error creating producto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al crear el producto';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Nuevo Producto',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Crear Producto</ThemedText>

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
                <ThemedText style={styles.submitButtonText}>Crear Producto</ThemedText>
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
  submitButton: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
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