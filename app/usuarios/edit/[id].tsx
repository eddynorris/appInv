import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import UsuarioForm from '@/components/form/UsuarioForm';
import { useUsuarioItem } from '@/hooks/crud/useUsuarioItem';
import { useAuth } from '@/context/AuthContext';

export default function EditUsuarioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth(); // Para verificar permisos

  const {
    isLoading,
    isFetchingInitial,
    error,
    form,
    almacenes,
    rolesDisponibles,
    loadUsuario,
    updateUsuario,
  } = useUsuarioItem();

  // Cargar datos del usuario al montar
  useEffect(() => {
    // Asegurarse de que id es válido y es admin antes de cargar
    if (id && user?.rol === 'admin') {
      loadUsuario(parseInt(id));
    }
  }, [id, loadUsuario, user?.rol]);

  // Si no es admin, redirigir (chequeo robusto)
  if (user?.rol !== 'admin' && !isLoading && !isFetchingInitial) {
    router.replace('/');
    return null;
  }

  const handleSave = async () => {
    if (!id || !form) return;
    const success = await updateUsuario(parseInt(id));
    if (success) {
      Alert.alert('Éxito', 'Usuario actualizado correctamente');
      router.replace(`/usuarios/${id}`); // Volver a la pantalla de detalle
    } else {
      // Error manejado en el hook
    }
  };

  // Si el form no está listo (por chequeo de rol o carga), mostrar carga
  if (!form || !rolesDisponibles) {
      return (
         <ScreenContainer title="Editar Usuario" isLoading={true}>
              <Stack.Screen options={{ title: 'Cargando...', headerShown: true }} />
         </ScreenContainer>
      );
  }

  return (
    <ScreenContainer
      title="Editar Usuario"
      isLoading={isFetchingInitial}
      loadingMessage="Cargando datos del usuario..."
    >
      <Stack.Screen options={{ title: 'Editar Usuario', headerShown: true }} />
      <UsuarioForm
        formData={form.formData}
        errors={form.errors}
        isSubmitting={isLoading}
        isEditing={true}
        almacenes={almacenes}
        roles={rolesDisponibles}
        onChange={form.handleChange}
        onSubmit={handleSave}
        onCancel={() => router.back()}
      />
    </ScreenContainer>
  );
} 