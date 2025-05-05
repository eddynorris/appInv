import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProveedorItem } from '@/hooks/crud/useProveedorItem';
import { useForm } from '@/hooks/useForm';

export default function CreateProveedorScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { createProveedor, isLoading: hookIsLoading, error: hookError } = useProveedorItem();
  
  const { formData, errors, isSubmitting, handleChange, handleSubmit, setErrors } = useForm({
    nombre: '',
    telefono: '',
    direccion: '',
  });

  const validationRules = {
    nombre: (value: string) => !value.trim() ? 'El nombre es requerido' : null,
  };
  
  const submitForm = useCallback(async (data: typeof formData): Promise<boolean> => {
    const response = await createProveedor(data);

    if (response) {
      Alert.alert(
        'Proveedor Creado',
        'El proveedor ha sido creado exitosamente',
        [
          { 
            text: 'OK', 
            onPress: () => router.replace('/proveedores') 
          }
        ]
      );
      return true;
    } else {
      Alert.alert('Error', hookError || 'No se pudo crear el proveedor');
      return false;
    }
  }, [createProveedor, hookError, router]);
  
  const isLoading = isSubmitting || hookIsLoading;

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Nuevo Proveedor',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Crear Proveedor</ThemedText>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Nombre *</ThemedText>
              <TextInput
                editable={!isLoading}
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text },
                  errors.nombre && styles.inputError
                ]}
                value={formData.nombre}
                onChangeText={(value) => handleChange('nombre', value)}
                placeholder="Ingresa el nombre del proveedor"
                placeholderTextColor="#9BA1A6"
              />
              {errors.nombre && (
                <ThemedText style={styles.errorText}>{errors.nombre}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Teléfono</ThemedText>
              <TextInput
                editable={!isLoading}
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text }
                ]}
                value={formData.telefono}
                onChangeText={(value) => handleChange('telefono', value)}
                placeholder="Ingresa el teléfono"
                placeholderTextColor="#9BA1A6"
                keyboardType="phone-pad"
              />
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Dirección</ThemedText>
              <TextInput
                editable={!isLoading}
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

            <TouchableOpacity 
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled
              ]}
              onPress={() => handleSubmit(submitForm, validationRules)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Crear Proveedor</ThemedText>
              )}
            </TouchableOpacity>
            
            {hookError && !errors.api && (
                <ThemedText style={styles.errorText}>{hookError}</ThemedText>
            )}
            {errors.api && (
                <ThemedText style={styles.errorText}>{errors.api}</ThemedText>
            )}
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
    marginTop: 4,
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