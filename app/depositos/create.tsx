import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import DepositoForm from '@/components/form/DepositoForm';
import { useDepositoItem } from '@/hooks/crud/useDepositoItem';
import { useAuth } from '@/context/AuthContext';

export default function CreateDepositoScreen() {
  const { user } = useAuth();
  const {
    isLoading,
    isFetchingInitial,
    error,
    form,
    uploader,
    almacenes,
    loadInitialData,
    createDeposito,
  } = useDepositoItem();

  // Cargar almacenes al montar (si es admin)
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSave = async () => {
    const success = await createDeposito();
    if (success) {
      Alert.alert('Éxito', 'Depósito registrado correctamente');
      router.replace('/depositos');
    } else {
      // El hook ya debería mostrar alerta de error
    }
  };

  return (
    <ScreenContainer
      title="Registrar Depósito"
      isLoading={isFetchingInitial} // Mostrar carga mientras se obtienen almacenes
      loadingMessage="Cargando opciones..."
    >
      <Stack.Screen options={{ title: 'Registrar Depósito', headerShown: true }} />
      <DepositoForm
        formData={form.formData}
        errors={form.errors}
        isSubmitting={isLoading} // Usar isLoading general para el botón
        isEditing={false}
        almacenes={almacenes}
        isAdmin={user?.rol === 'admin'}
        onChange={form.handleChange}
        onSubmit={handleSave}
        onCancel={() => router.back()}
        // Props de uploader simplificadas
        comprobante={uploader.file}
        setComprobante={uploader.setFile}
        existingComprobanteUrl={null} // No hay existente en creación
      />
    </ScreenContainer>
  );
} 