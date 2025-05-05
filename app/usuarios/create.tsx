import React, { useEffect } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import UsuarioForm from '@/components/form/UsuarioForm';
import { useUsuarioItem } from '@/hooks/crud/useUsuarioItem';
import { useAuth } from '@/context/AuthContext';
import { ThemedView } from '@/components/ThemedView';

export default function CreateUsuarioScreen() {
  const { user } = useAuth();
  const {
    isLoading,
    isFetchingInitial,
    error,
    form,
    almacenes,
    rolesDisponibles,
    loadInitialData,
    createUsuario,
  } = useUsuarioItem();

  useEffect(() => {
    if (user?.rol === 'admin') {
        loadInitialData();
    }
  }, [loadInitialData, user?.rol]);

  if (user?.rol !== 'admin') {
      if (!isLoading && !isFetchingInitial) {
          router.replace('/');
          return null;
      }
      return (
         <ScreenContainer title="Cargando...">
             <Stack.Screen options={{ title: 'Cargando...', headerShown: true }} />
             <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" />
             </ThemedView>
         </ScreenContainer>
      );
  }

  const handleSave = async () => {
    if (!form) return;
    const success = await createUsuario();
    if (success) {
      Alert.alert('Éxito', 'Usuario creado correctamente');
      router.replace('/usuarios');
    } else {
      // Error manejado en el hook
    }
  };

  if (!form || !rolesDisponibles) {
       return (
         <ScreenContainer title="Crear Usuario" isLoading={true}>
              <Stack.Screen options={{ title: 'Cargando...', headerShown: true }} />
         </ScreenContainer>
      );
  }

  return (
    <ScreenContainer
      title="Crear Usuario"
      isLoading={isFetchingInitial}
      loadingMessage="Cargando opciones..."
    >
      <Stack.Screen options={{ title: 'Crear Usuario', headerShown: true }} />
      <UsuarioForm
        formData={form.formData}
        errors={form.errors}
        isSubmitting={isLoading}
        isEditing={false}
        almacenes={almacenes}
        roles={rolesDisponibles}
        onChange={form.handleChange}
        onSubmit={handleSave}
        onCancel={() => router.back()}
      />
    </ScreenContainer>
  );
} 