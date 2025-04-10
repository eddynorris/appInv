// app/almacenes/create.tsx
import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedText } from '@/components/ThemedText';
import { useAlmacenItem } from '@/hooks/crud/useAlmacenItem';
import { useForm } from '@/hooks/useForm';

export default function CreateAlmacenScreen() {
  // Obtener la función de creación del hook
  const { createAlmacen, isLoading: hookIsLoading, error: hookError } = useAlmacenItem();
  
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

  // submitForm usa createAlmacen de useAlmacenItem
  const submitForm = async (data: typeof formData): Promise<boolean> => {
    const response = await createAlmacen(data); // <-- Llama a la función correcta

    if (response) {
      Alert.alert(
        'Almacén Creado',
        'El almacén ha sido creado exitosamente',
        // Navegar de vuelta. La pantalla de lista se actualizará al montarse.
        [{ text: 'OK', onPress: () => router.replace('/almacenes') }]
      );
      return true;
    } else {
      Alert.alert('Error', hookError || 'No se pudo crear el almacén');
      return false;
    }
  };

  // Combinar el estado de carga del formulario con el del hook
  const isLoading = isSubmitting || hookIsLoading;

  return (
    <ScreenContainer title="Nuevo Almacén">
      <ThemedText type="title" style={{ marginBottom: 20 }}>Crear Almacén</ThemedText>
      {hookError && !isSubmitting && (
          <ThemedText style={{ color: 'red', marginBottom: 10 }}>Error: {hookError}</ThemedText>
      )}
      <FormField disabled={isSubmitting}
        label="Nombre"
        value={formData.nombre}
        onChangeText={(value) => handleChange('nombre', value)}
        placeholder="Ingresa el nombre del almacén"
        error={errors.nombre}
        required
      />

      <FormField disabled={isSubmitting}
        label="Ciudad"
        value={formData.ciudad}
        onChangeText={(value) => handleChange('ciudad', value)}
        placeholder="Ingresa la ciudad"
      />
 
      <FormField disabled={isSubmitting}
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