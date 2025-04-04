// app/clientes/edit/[id].tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedText } from '@/components/ThemedText';
import { clienteApi } from '@/services/api';
import { useForm } from '@/hooks/useForm';
import { Cliente } from '@/models';

export default function EditClienteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom hook for form state
  const { 
    formData, 
    errors, 
    isSubmitting, 
    handleChange, 
    handleSubmit,
    setFormData
  } = useForm({
    nombre: '',
    telefono: '',
    direccion: '',
  });

  // Use useEffect para cargar los datos una sola vez
  useEffect(() => {
    const fetchCliente = async () => {
      if (!id) return;
      
      try {
        setIsLoadingData(true);
        setError(null);
        
        const data = await clienteApi.getCliente(parseInt(id));
        
        if (data) {
          // Cargar datos en el formulario
          setFormData({
            nombre: data.nombre || '',
            telefono: data.telefono || '',
            direccion: data.direccion || '',
          });
        } else {
          setError('No se pudo cargar los datos del cliente');
        }
      } catch (err) {
        console.error('Error fetching cliente:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del cliente');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchCliente();
  }, [id, setFormData]); // Solo depende de id y setFormData

  // Validation rules
  const validationRules = {
    nombre: (value: string) => !value.trim() ? 'El nombre es requerido' : null,
    telefono: (value: string) => !value.trim() ? 'El teléfono es requerido' : null,
    direccion: (value: string) => !value.trim() ? 'La dirección es requerida' : null,
  };

  // Handle form submission
  const submitForm = useCallback(async (data: typeof formData) => {
    if (!id) return false;
    
    try {
      const response = await clienteApi.updateCliente(parseInt(id), data);
      
      if (response) {
        Alert.alert(
          'Cliente Actualizado',
          'El cliente ha sido actualizado exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo actualizar el cliente');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al actualizar el cliente';
      Alert.alert('Error', errorMessage);
      return false;
    }
  }, [id]);

  return (
    <ScreenContainer 
      title="Editar Cliente"
      isLoading={isLoadingData}
      error={error}
      loadingMessage="Cargando datos del cliente..."
    >
      <ThemedText type="title" style={{ marginBottom: 20 }}>Editar Cliente</ThemedText>

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
        saveText="Guardar Cambios"
      />
    </ScreenContainer>
  );
}