// app/clientes/edit/[id].tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedText } from '@/components/ThemedText';
import { useClienteItem } from '@/hooks/crud/useClienteItem';
import { useForm } from '@/hooks/useForm';
import { Cliente } from '@/models';

export default function EditClienteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isFetchingData, setIsFetchingData] = useState(true); // Estado local para la carga inicial
  // Usar el hook de ITEM
  const { getCliente, updateCliente, isLoading: hookIsLoading, error: hookError } = useClienteItem();
  // useForm sigue en el componente
  const { formData, errors, isSubmitting, handleChange, handleSubmit, setFormData } = useForm({
    nombre: '',
    telefono: '',
    direccion: '',
    ciudad: '',
  });  

  // Función para cargar datos iniciales en el formulario
  const fetchClienteData = useCallback(async () => {
    if (!id) return;
    setIsFetchingData(true); // Inicia carga local
    const data = await getCliente(parseInt(id)); // Usa hook
    if (data) {
      setFormData({ // Carga datos en el formulario
        nombre: data.nombre || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        ciudad: data.ciudad || '',
      });
    } else {
      Alert.alert('Error', hookError || 'No se pudo cargar el cliente');
      router.back();
    }
    // Si hay error, se mostrará via hookError
    setIsFetchingData(false); // Termina carga local
  }, [id, getCliente, setFormData, hookError, router]);

  // Cargar datos al montar
  useEffect(() => {
    fetchClienteData();
  }, [fetchClienteData]);

  // Validation rules
  const validationRules = {
    nombre: (value: string) => !value.trim() ? 'El nombre es requerido' : null,
    telefono: (value: string) => !value.trim() ? 'El teléfono es requerido' : null,
    direccion: (value: string) => !value.trim() ? 'La dirección es requerida' : null,
    ciudad: (value: string) => !value.trim() ? 'La ciudad es requerida' : null,
  };

  // Handle form submission
  // submitForm usa updateCliente de useClienteItem
  const submitForm = async (data: typeof formData): Promise<boolean> => {
    if (!id) return false;
    const response = await updateCliente(parseInt(id), data); // Usa hook
    if (response) {
      Alert.alert(
        'Cliente Actualizado',
        'El cliente ha sido actualizado exitosamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return true;
    } else {
      Alert.alert('Error', hookError || 'No se pudo actualizar el cliente');
      return false;
    }
  };

  // hookIsLoading será true durante getCliente y updateCliente
  const isProcessing = isSubmitting || hookIsLoading;

  return (
    <ScreenContainer 
      title="Editar Cliente"
      isLoading={isFetchingData}
      error={hookError}
      loadingMessage="Cargando datos del cliente..."
    >
      {hookError && !isFetchingData && !isSubmitting && (
        <ThemedText style={{ color: 'red', marginBottom: 10 }}>Error: {hookError}</ThemedText>
      )}
      {!isFetchingData && (
      <>
        <ThemedText type="title" style={{ marginBottom: 20 }}>Editar Cliente</ThemedText>

        <FormField
          disabled={isProcessing}
          label="Nombre"
          value={formData.nombre}
          onChangeText={(value) => handleChange('nombre', value)}
          placeholder="Ingresa el nombre del cliente"
          error={errors.nombre}
          required
        />

        <FormField
          disabled={isProcessing}
          label="Teléfono"
          value={formData.telefono}
          onChangeText={(value) => handleChange('telefono', value)}
          placeholder="Ingresa el teléfono del cliente" 
          error={errors.telefono}
          keyboardType="phone-pad"
          required
        />

        <FormField
          disabled={isProcessing}
          label="Dirección"
          value={formData.direccion}
          onChangeText={(value) => handleChange('direccion', value)}
          placeholder="Ingresa la dirección del cliente"
          error={errors.direccion}
          multiline
          required
        />

        <FormField
          disabled={isProcessing}
          label="Ciudad"
          value={formData.ciudad}
          onChangeText={(value) => handleChange('ciudad', value)}
          placeholder="Ingresa la ciudad (opcional)"
          error={errors.ciudad}
        />

        <ActionButtons
          onSave={() => handleSubmit(submitForm, validationRules)}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting}
          saveText="Guardar Cambios"
        />
      </>
    )}
    </ScreenContainer>
  );
}