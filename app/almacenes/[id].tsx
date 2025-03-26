// app/almacenes/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { ThemedText } from '@/components/ThemedText';
import { almacenApi } from '@/services/api';
import { Almacen } from '@/models';

export default function AlmacenDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [almacen, setAlmacen] = useState<Almacen | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use useEffect para cargar los datos una sola vez
  useEffect(() => {
    const fetchAlmacen = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await almacenApi.getAlmacen(parseInt(id));
        setAlmacen(data);
      } catch (err) {
        console.error('Error fetching almacen:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del almacén');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlmacen();
  }, [id]); // Solo depende de id

  const handleEdit = useCallback(() => {
    router.push(`/almacenes/edit/${id}`);
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      await almacenApi.deleteAlmacen(parseInt(id));
      router.replace('/almacenes');
    } catch (error) {
      console.error('Error deleting almacen:', error);
      setError('Error al eliminar el almacén');
      setIsLoading(false);
    } finally {
      setShowDeleteDialog(false);
    }
  }, [id]);

  return (
    <ScreenContainer
      title={almacen?.nombre || 'Detalles del Almacén'}
      isLoading={isLoading}
      error={error}
      loadingMessage="Cargando datos del almacén..."
    >
      {almacen && (
        <DetailCard>
          <ThemedText type="title">{almacen.nombre}</ThemedText>
          
          <DetailSection title="Ubicación">
            <DetailRow label="Ciudad" value={almacen.ciudad || 'No especificada'} />
            <DetailRow label="Dirección" value={almacen.direccion || 'No especificada'} />
          </DetailSection>

          <DetailSection title="Inventario">
            <ThemedText>Este almacén gestiona productos de inventario activos.</ThemedText>
          </DetailSection>

          <ActionButtons
            onSave={handleEdit}
            saveText="Editar"
            onDelete={() => setShowDeleteDialog(true)}
            showDelete={true}
          />
        </DetailCard>
      )}
      
      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Eliminar Almacén"
        message="¿Está seguro que desea eliminar este almacén? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenContainer>
  );
}