// app/almacenes/[id].tsx
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { ThemedText } from '@/components/ThemedText';
import { useAlmacenItem } from '@/hooks/crud/useAlmacenItem';
import { Almacen } from '@/models';

export default function AlmacenDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [almacen, setAlmacen] = useState<Almacen | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  
   // Usar el hook con
   const { getAlmacen, deleteAlmacen, isLoading: hookLoading, error: hookError } = useAlmacenItem(); // <-- Usa el nuevo hook
  // Cargar datos del almacén
  // Cargar datos del almacén
  useEffect(() => {
    const fetchAlmacen = async () => {
      if (!id) return;

      const data = await getAlmacen(parseInt(id));
      if (data) {
          setAlmacen(data);
      } else {
          // El error se puede obtener de hookError después de la llamada
          // O manejarlo dentro del componente si prefieres
          setLocalError(hookError || 'Error al cargar los datos del almacén');
      }
      // setLocalLoading(false); // El hook ya maneja isLoading
    };

    fetchAlmacen();
  }, [id, getAlmacen, hookError]); // Añade hookError a las dependencias si lo usas para setear localError


  const handleEdit = () => {
    router.push(`/almacenes/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;

    // setLocalLoading(true); // El hook ya maneja isLoading
    const success = await deleteAlmacen(parseInt(id));
    // setLocalLoading(false); // El hook ya maneja isLoading
    setShowDeleteDialog(false); // Siempre cierra el diálogo

    if (success) {
      router.replace('/almacenes'); // Navega si fue exitoso
    } else {
      // Muestra el error del hook si falló
      setLocalError(hookError || 'Error al eliminar el almacén');
    }
  };

  // El estado de carga ahora viene directamente del hook
  const isLoading = hookLoading;
  // Combina el error local (si aún lo usas) con el del hook
  const displayError = localError || hookError;

  return (
    <ScreenContainer
      title={almacen?.nombre || 'Detalles del Almacén'}
      isLoading={isLoading}
      error={displayError}
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