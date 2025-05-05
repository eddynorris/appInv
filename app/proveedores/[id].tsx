import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Proveedor } from '@/models';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProveedorItem } from '@/hooks/crud/useProveedorItem';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';

export default function ProveedorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { 
    getProveedor, 
    deleteProveedor, 
    isLoading: hookIsLoading, 
    error: hookError 
  } = useProveedorItem();

  useEffect(() => {
    const fetchProveedor = async () => {
      if (!id) return;
      const data = await getProveedor(parseInt(id));
      if (data) {
        setProveedor(data);
      }
    };

    fetchProveedor();
  }, [id, getProveedor]);

  const handleEdit = useCallback(() => {
    if (!id) return;
    router.push(`/proveedores/edit/${id}`);
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const success = await deleteProveedor(parseInt(id));
    setShowDeleteDialog(false);
    if (success) {
      router.replace('/proveedores');
    }
  }, [id, deleteProveedor, router]);

  const isLoading = hookIsLoading && !proveedor;

  return (
    <ScreenContainer
      title={proveedor ? proveedor.nombre : 'Detalles del Proveedor'}
      isLoading={isLoading}
      error={hookError}
      loadingMessage="Cargando datos del proveedor..."
    >
      <Stack.Screen options={{ 
        title: proveedor ? proveedor.nombre : 'Detalles del Proveedor',
        headerShown: true 
      }} />
      
      {!isLoading && !hookError && proveedor && (
        <ScrollView>
          <ThemedView style={styles.container}>
            <DetailCard> 
              <ThemedText type="title" style={styles.title}>{proveedor.nombre}</ThemedText>
              
              <DetailSection title="Información de Contacto">
                <DetailRow label="Teléfono" value={proveedor.telefono || 'No especificado'} />
                <DetailRow label="Dirección" value={proveedor.direccion || 'No especificada'} />
              </DetailSection>

              <DetailSection title="Datos Adicionales">
                <DetailRow 
                  label="Fecha de Registro" 
                  value={proveedor.created_at ? new Date(proveedor.created_at).toLocaleDateString() : 'No especificada'}
                />
              </DetailSection>

              <ActionButtons
                onSave={handleEdit}
                saveText="Editar"
                onDelete={() => setShowDeleteDialog(true)}
                showDelete={true}
              />
            </DetailCard>
          </ThemedView>
        </ScrollView>
      )}

      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Eliminar Proveedor"
        message="¿Está seguro que desea eliminar este proveedor? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center', 
  },
});