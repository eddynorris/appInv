import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedText } from '@/components/ThemedText';
import { clienteApi } from '@/services/api';
import { useForm } from '@/hooks/useForm';

export default function CreateClienteScreen() {
  // Use our custom form hook for state management
  const { 
    formData, 
    errors, 
    isSubmitting, 
    handleChange, 
    handleSubmit 
  } = useForm({
    nombre: '',
    telefono: '',
    direccion: '',
  });

  // Validation rules for form fields
  const validationRules = {
    nombre: (value: string) => !value.trim() ? 'El nombre es obligatorio' : null,
    telefono: (value: string) => !value.trim() ? 'El teléfono es obligatorio' : null,
    direccion: (value: string) => !value.trim() ? 'La dirección es obligatoria' : null,
  };

  // Form submission handler with validation
  const submitForm = async (data: typeof formData) => {
    try {
      const response = await clienteApi.createCliente(data);
      
      if (response) {
        Alert.alert(
          'Cliente Creado',
          'El cliente ha sido creado exitosamente',
          [{ text: 'OK', onPress: () => router.replace('/clientes') }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo crear el cliente');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al crear el cliente';
      Alert.alert('Error', errorMessage);
      return false;
    }
  };

  return (
    <ScreenContainer title="Nuevo Cliente">
      <ThemedText type="title" style={{ marginBottom: 20 }}>Crear Cliente</ThemedText>

      <FormField
        label="Nombre"
        value={formData.nombre}
        onChangeText={(value) => handleChange('nombre', value)}
        placeholder="Ingresa el nombre del cliente"
        error={errors.nombre}
        required
      />

      <FormField
        label="Teléfono"
        value={formData.telefono}
        onChangeText={(value) => handleChange('telefono', value)}
        placeholder="Ingresa el teléfono del cliente"
        error={errors.telefono}
        keyboardType="phone-pad"
        required
      />

      <FormField
        label="Dirección"
        value={formData.direccion}
        onChangeText={(value) => handleChange('direccion', value)}
        placeholder="Ingresa la dirección del cliente"
        error={errors.direccion}
        multiline
        required
      />

      <ActionButtons
        onSave={() => handleSubmit(submitForm, validationRules)}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
        saveText="Crear Cliente"
      />
    </ScreenContainer>
  );
}