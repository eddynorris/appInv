// app/clientes/create.tsx
import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedText } from '@/components/ThemedText';
import { useClienteItem } from '@/hooks/crud/useClienteItem'; 
import { useForm } from '@/hooks/useForm';

export default function CreateClienteScreen() {
  // Usar el hook de ITEM para la creación
  const { createCliente, isLoading: hookIsLoading, error: hookError } = useClienteItem();

  // useForm sigue en el componente
  const { formData, errors, isSubmitting, handleChange, handleSubmit } = useForm({
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

  // submitForm usa createCliente de useClienteItem
  const submitForm = async (data: typeof formData): Promise<boolean> => {
    const response = await createCliente(data); // <-- Llama a la función del hook

    if (response) {
      Alert.alert(
        'Cliente Creado',
        'El cliente ha sido creado exitosamente',
        [{ text: 'OK', onPress: () => router.replace('/clientes') }]
      );
      return true;
    } else {
      Alert.alert('Error', hookError || 'No se pudo crear el cliente');
      return false;
    }
  };

  // isLoading combina estado de form y hook
  const isLoading = isSubmitting || hookIsLoading;

  return (
    <ScreenContainer title="Nuevo Cliente">
      <ThemedText type="title" style={{ marginBottom: 20 }}>Crear Cliente</ThemedText>

      <FormField  
        disabled={isSubmitting}
        label="Nombre"
        value={formData.nombre}
        onChangeText={(value) => handleChange('nombre', value)}
        placeholder="Ingresa el nombre del cliente"
        error={errors.nombre}
        required
      />

      <FormField
        disabled={isSubmitting}
        label="Teléfono"
        value={formData.telefono}
        onChangeText={(value) => handleChange('telefono', value)}
        placeholder="Ingresa el teléfono del cliente"
        error={errors.telefono}
        keyboardType="phone-pad"
        required
      />

      <FormField
        disabled={isSubmitting}
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