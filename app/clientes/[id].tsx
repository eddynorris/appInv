// app/clientes/id.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { ThemedText } from '@/components/ThemedText';
import { useClienteItem } from '@/hooks/crud/useClienteItem';
import { Cliente } from '@/models';
import { Alert } from 'react-native';

export default function ClienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const { getCliente, deleteCliente, isLoading, error: hookError } = useClienteItem();

  // Cargar datos usando el hook
  useEffect(() => {
    const fetchClienteData = async () => {
      if (!id) return;
      const data = await getCliente(parseInt(id));
      // Si getCliente falla, el error estará en hookError
      if (data) {
        setCliente(data);
      }
      // No es necesario manejar error aquí, se mostrará a través de hookError
    };
    fetchClienteData();
  }, [id, getCliente]); // Depende de id y la función del hook

  const handleEdit = useCallback(() => {
    router.push(`/clientes/edit/${id}`);
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const success = await deleteCliente(parseInt(id));
    setShowDeleteDialog(false); // Siempre cerrar
    if (success) {
      router.replace('/clientes'); // Volver a la lista
    } else {
      Alert.alert('Error al Eliminar', hookError || 'Ocurrió un error inesperado.');
    }
    // No es necesario setError aquí, hookError se actualizará si deleteCliente falla
  }, [id, deleteCliente]);

  return (
    <ScreenContainer
      title={cliente?.nombre || 'Detalles del Cliente'}
      isLoading={isLoading && !cliente} // Muestra carga si el hook está cargando Y AÚN no hay datos
      error={hookError}
      loadingMessage="Cargando datos del cliente..."
    >
      {!isLoading && hookError && <ThemedText>Error al cargar...</ThemedText>}
      
      {!isLoading && !hookError && cliente && (
        <DetailCard>
          <ThemedText type="title">{cliente.nombre}</ThemedText>
          
          <DetailSection title="Información Financiera">
            <DetailRow 
              label="Saldo Pendiente" 
              value={`$${parseFloat(cliente.saldo_pendiente || '0').toFixed(2)}`} 
            />
          </DetailSection>
          
          <DetailSection title="Información de Contacto">
            <DetailRow label="Teléfono" value={cliente.telefono || 'No especificado'} />
            <DetailRow label="Dirección" value={cliente.direccion || 'No especificada'} />
            <DetailRow label="Ciudad" value={cliente.ciudad || 'No especificada'} />
          </DetailSection>

          <DetailSection title="Datos Adicionales">
            <DetailRow 
              label="Fecha de Registro" 
              value={cliente.created_at ? new Date(cliente.created_at).toLocaleDateString() : 'No especificada'} 
            />
            <DetailRow 
              label="Frecuencia de Compra" 
              value={cliente.frecuencia_compra_dias ? `${cliente.frecuencia_compra_dias} días` : 'No especificada'} 
            />
            <DetailRow 
              label="Última Compra" 
              value={cliente.ultima_fecha_compra ? new Date(cliente.ultima_fecha_compra).toLocaleDateString() : 'No hay compras registradas'} 
            />
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
        title="Eliminar Cliente"
        message="¿Está seguro que desea eliminar este cliente? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenContainer>
  );
}