import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { usuarioApi } from '@/services/api';
import { User } from '@/models';
import { useAuth } from '@/context/AuthContext';
 import { Colors } from '@/styles/Theme';

export default function UsuarioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.rol === 'admin';

  const [usuario, setUsuario] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchUsuario = useCallback(async () => {
    if (!id || !isAdmin) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await usuarioApi.getUsuario(parseInt(id));
      setUsuario(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el usuario');
    } finally {
      setIsLoading(false);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    fetchUsuario();
  }, [fetchUsuario]);

  const handleEdit = () => {
    router.push(`/usuarios/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id || !isAdmin || usuario?.id === currentUser?.id) {
        setShowDeleteDialog(false);
        Alert.alert("Error", "No puedes eliminar este usuario.");
        return;
    };
    setShowDeleteDialog(false);
    setIsLoading(true);
    try {
      await usuarioApi.deleteUsuario(parseInt(id));
      Alert.alert('Éxito', 'Usuario eliminado correctamente');
      router.replace('/usuarios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el usuario');
      Alert.alert('Error', error || 'No se pudo eliminar');
    } finally {
      setIsLoading(false);
    }
  };

  // Si no es admin, mostrar pantalla de no autorizado
  if (!isAdmin) {
    return (
        <ScreenContainer title="Usuarios">
            <Stack.Screen options={{ title: 'Usuarios', headerShown: true }} />
            <ThemedView style={styles.unauthorizedContainer}>
                <IconSymbol name="lock.fill" size={48} color={Colors.danger} />
                <ThemedText type="subtitle">Acceso Denegado</ThemedText>
                <ThemedText>No tienes permiso para ver esta sección.</ThemedText>
            </ThemedView>
        </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title={usuario ? `${usuario.username}` : 'Detalle Usuario'}
      isLoading={isLoading && !usuario}
      error={error}
    >
      <Stack.Screen options={{ title: 'Detalle Usuario', headerShown: true }} />
      {usuario && (
        <DetailCard>
           <ThemedText type="title" style={styles.usernameText}>
            {usuario.username}
          </ThemedText>

          <DetailSection title="Información de Cuenta">
            <DetailRow label="ID" value={usuario.id.toString()} />
            <DetailRow label="Rol" value={usuario.rol} />
            <DetailRow label="Almacén Asignado" value={usuario.almacen?.nombre || (usuario.almacen_id ? `ID: ${usuario.almacen_id}` : 'Ninguno')} />
          </DetailSection>

          <ActionButtons
            onSave={handleEdit}
            saveText="Editar"
            // No mostrar botón de borrar si es el propio admin
            onDelete={() => setShowDeleteDialog(true)}
            showDelete={usuario.id !== currentUser?.id}
          />
        </DetailCard>
      )}

      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Eliminar Usuario"
        message={`¿Está seguro que desea eliminar al usuario ${usuario?.username}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
   unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
}); 