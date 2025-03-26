// app/almacenes/create.tsx
import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedText } from '@/components/ThemedText';
import { almacenApi } from '@/services/api';
import { useForm } from '@/hooks/useForm';

export default function CreateAlmacenScreen() {
  // Use our custom form hook for state management
  const { 
    formData, 
    errors, 
    isSubmitting, 
    handleChange, 
    handleSubmit 
  } = useForm({
    nombre: '',
    direccion: '',
    ciudad: '',
  });

  // Validation rules for form fields
  const validationRules = {
    nombre: (value: string) => !value.trim() ? 'El nombre es requerido' : null,
  };

  // Form submission handler with validation
  const submitForm = async (data: typeof formData) => {
    try {
      const response = await almacenApi.createAlmacen(data);
      
      if (response) {
        Alert.alert(
          'Almacén Creado',
          'El almacén ha sido creado exitosamente',
          [{ text: 'OK', onPress: () => router.replace('/almacenes') }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo crear el almacén');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al crear el almacén';
      Alert.alert('Error', errorMessage);
      return false;
    }
  };

  return (
    <ScreenContainer title="Nuevo Almacén">
      <ThemedText type="title" style={{ marginBottom: 20 }}>Crear Almacén</ThemedText>

      <FormField
        label="Nombre"
        value={formData.nombre}
        onChangeText={(value) => handleChange('nombre', value)}
        placeholder="Ingresa el nombre del almacén"
        error={errors.nombre}
        required
      />

      <FormField
        label="Ciudad"
        value={formData.ciudad}
        onChangeText={(value) => handleChange('ciudad', value)}
        placeholder="Ingresa la ciudad"
      />

      <FormField
        label="Dirección"
        value={formData.direccion}
        onChangeText={(value) => handleChange('direccion', value)}
        placeholder="Ingresa la dirección"
        multiline
      />

      <ActionButtons
        onSave={() => handleSubmit(submitForm, validationRules)}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
        saveText="Crear Almacén"
      />
    </ScreenContainer>
  );
}