// app/proveedores/edit/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Alert,
  ScrollView
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Proveedor } from '@/models';
import { useProveedorItem } from '@/hooks/crud/useProveedorItem';
import { useForm } from '@/hooks/useForm';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';

export default function EditProveedorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isFetchingData, setIsFetchingData] = useState(true);

  const { 
    getProveedor, 
    updateProveedor, 
    isLoading: hookIsLoading, 
    error: hookError 
  } = useProveedorItem();
  
  const { 
    formData, 
    errors, 
    isSubmitting, 
    handleChange, 
    handleSubmit, 
    setFormData, 
    setErrors
  } = useForm({
    nombre: '',
    telefono: '',
    direccion: '',
  });

  const fetchProveedorData = useCallback(async () => {
    if (!id) return;
    setIsFetchingData(true);
    const data = await getProveedor(parseInt(id));
    if (data) {
      setFormData({
        nombre: data.nombre || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
      });
    } else {
      Alert.alert('Error', hookError || 'No se pudo cargar el proveedor');
      router.back();
    }
    setIsFetchingData(false);
  }, [id, getProveedor, setFormData, hookError, router]);

  useEffect(() => {
    fetchProveedorData();
  }, [fetchProveedorData]);

  const validationRules = {
    nombre: (value: string): string | null => {
        if (!value?.trim()) {
            return 'El nombre es requerido';
        }
        return null;
    },
  };

  const submitForm = useCallback(async (data: typeof formData): Promise<boolean> => {
    if (!id) return false;
    const response = await updateProveedor(parseInt(id), data);
    if (response) {
      Alert.alert(
        'Proveedor Actualizado',
        'El proveedor ha sido actualizado exitosamente',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
      return true;
    } else {
      Alert.alert('Error', hookError || 'No se pudo actualizar el proveedor');
      return false;
    }
  }, [id, updateProveedor, hookError, router]);

  const isLoading = isFetchingData || isSubmitting || hookIsLoading;

  return (
    <ScreenContainer 
      title="Editar Proveedor"
      isLoading={isFetchingData}
      error={hookError && !isFetchingData}
      loadingMessage="Cargando datos del proveedor..."
    >
      <Stack.Screen options={{ 
        title: 'Editar Proveedor',
        headerShown: true 
      }} />
      
      {!isFetchingData && (
        <ScrollView>
          <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.heading}>Editar Proveedor</ThemedText>

            <FormField
              label="Nombre *"
              value={formData.nombre}
              onChangeText={(value) => handleChange('nombre', value)}
              placeholder="Ingresa el nombre del proveedor"
              error={errors.nombre}
              required
              disabled={isLoading}
            />

            <FormField
              label="Teléfono"
              value={formData.telefono}
              onChangeText={(value) => handleChange('telefono', value)}
              placeholder="Ingresa el teléfono"
              keyboardType="phone-pad"
              disabled={isLoading}
            />

            <FormField
              label="Dirección"
              value={formData.direccion}
              onChangeText={(value) => handleChange('direccion', value)}
              placeholder="Ingresa la dirección"
              multiline
              disabled={isLoading}
            />

            <ActionButtons
              onSave={() => handleSubmit(submitForm, validationRules)}
              onCancel={() => router.back()}
              isSubmitting={isSubmitting || hookIsLoading}
              saveText="Guardar Cambios"
            />
             {hookError && !isSubmitting && (
                 <ThemedText style={styles.errorText}>{hookError}</ThemedText>
             )}
          </ThemedView>
        </ScrollView>
      )}
    </ScreenContainer>
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
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});