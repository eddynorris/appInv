// app/almacenes/edit/[id].tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedText } from '@/components/ThemedText';
import { almacenApi } from '@/services/api';
import { useForm } from '@/hooks/useForm';
import { Almacen } from '@/models';

export default function EditAlmacenScreen() {
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
    direccion: '',
    ciudad: '',
  });

  // Use useEffect para cargar los datos una sola vez
  useEffect(() => {
    const fetchAlmacen = async () => {
      if (!id) return;
      
      try {
        setIsLoadingData(true);
        setError(null);
        
        const data = await almacenApi.getAlmacen(parseInt(id));
        
        if (data) {
          // Cargar datos en el formulario
          setFormData({
            nombre: data.nombre || '',
            direccion: data.direccion || '',
            ciudad: data.ciudad || '',
          });
        } else {
          setError('No se pudo cargar los datos del almacén');
        }
      } catch (err) {
        console.error('Error fetching almacen:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del almacén');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAlmacen();
  }, [id, setFormData]); // Solo depende de id y setFormData

  // Validation rules
  const validationRules = {
    nombre: (value: string) => !value.trim() ? 'El nombre es requerido' : null,
  };

  // Handle form submission
  const submitForm = useCallback(async (data: typeof formData) => {
    if (!id) return false;
    
    try {
      const response = await almacenApi.updateAlmacen(parseInt(id), data);
      
      if (response) {
        Alert.alert(
          'Almacén Actualizado',
          'El almacén ha sido actualizado exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo actualizar el almacén');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al actualizar el almacén';
      Alert.alert('Error', errorMessage);
      return false;
    }
  }, [id]);

  return (
    <ScreenContainer 
      title="Editar Almacén"
      isLoading={isLoadingData}
      error={error}
      loadingMessage="Cargando datos del almacén..."
    >
      <ThemedText type="title" style={{ marginBottom: 20 }}>Editar Almacén</ThemedText>

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
        saveText="Guardar Cambios"
      />
    </ScreenContainer>
  );
}