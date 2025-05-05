import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Linking } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import DepositoForm from '@/components/form/DepositoForm';
import { useDepositoItem } from '@/hooks/crud/useDepositoItem';
import { useAuth } from '@/context/AuthContext';

export default function EditDepositoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  const {
    isLoading,
    isFetchingInitial,
    error,
    form,
    uploader,
    almacenes,
    loadDeposito,
    updateDeposito,
    removeExistingComprobante,
    existingComprobanteUrl // Necesitamos la URL existente
  } = useDepositoItem();

  useEffect(() => {
    if (id) {
      loadDeposito(parseInt(id));
    }
  }, [id, loadDeposito]);

  const handleSave = async () => {
    if (!id) return;
    const success = await updateDeposito(parseInt(id));
    if (success) {
      Alert.alert('Éxito', 'Depósito actualizado correctamente');
      router.replace(`/depositos/${id}`); // Volver a la pantalla de detalle
    } else {
      // El hook maneja la alerta de error
    }
  };

  const handleRemoveComprobante = async () => {
      if (!id || !existingComprobanteUrl) return;
      Alert.alert(
          "Confirmar Eliminación",
          "¿Está seguro que desea eliminar el comprobante actual?",
          [
              { text: "Cancelar", style: "cancel" },
              {
                  text: "Eliminar",
                  style: "destructive",
                  onPress: () => removeExistingComprobante(parseInt(id))
              }
          ]
      );
  };

   const handleViewComprobante = () => {
        if (!existingComprobanteUrl) return;
        Linking.openURL(existingComprobanteUrl).catch(err => {
          console.error('Error al abrir el comprobante:', err);
          Alert.alert("Error", "No se pudo abrir el enlace.");
        });
    };

  return (
    <ScreenContainer
      title="Editar Depósito"
      isLoading={isFetchingInitial} // Carga inicial al buscar el depósito
      loadingMessage="Cargando depósito..."
    >
      <Stack.Screen options={{ title: 'Editar Depósito', headerShown: true }} />
      {/* Renderizar formulario solo después de la carga inicial */}
      {!isFetchingInitial && (
        <DepositoForm
          formData={form.formData}
          errors={form.errors}
          isSubmitting={isLoading} // isLoading para el botón guardar
          isEditing={true}
          almacenes={almacenes}
          isAdmin={isAdmin}
          onChange={form.handleChange}
          onSubmit={handleSave}
          onCancel={() => router.back()}
          // Props de uploader
          comprobante={uploader.file}
          setComprobante={uploader.setFile}
          existingComprobanteUrl={existingComprobanteUrl}
          onRemoveExistingComprobante={handleRemoveComprobante}
          onViewExistingComprobante={handleViewComprobante}
          // Ya no se pasan estas funciones:
          // pickImage={uploader.pickImage}
          // takePhoto={uploader.takePhoto}
          // pickDocument={uploader.pickDocument}
        />
      )}
    </ScreenContainer>
  );
} 