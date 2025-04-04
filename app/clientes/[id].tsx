import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { ThemedText } from '@/components/ThemedText';
import { clienteApi } from '@/services/api';
import { Cliente } from '@/models';

export default function ClienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use useEffect para cargar los datos una sola vez
  useEffect(() => {
    const fetchCliente = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await clienteApi.getCliente(parseInt(id));
        setCliente(data);
      } catch (err) {
        console.error('Error fetching cliente:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del cliente');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCliente();
  }, [id]); // Solo depende de id

  const handleEdit = useCallback(() => {
    router.push(`/clientes/edit/${id}`);
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      await clienteApi.deleteCliente(parseInt(id));
      router.replace('/clientes');
    } catch (error) {
      console.error('Error deleting cliente:', error);
      setError('Error al eliminar el cliente');
      setIsLoading(false);
    } finally {
      setShowDeleteDialog(false);
    }
  }, [id]);

  return (
    <ScreenContainer
      title={cliente?.nombre || 'Detalles del Cliente'}
      isLoading={isLoading}
      error={error}
      loadingMessage="Cargando datos del cliente..."
    >
      {cliente && (
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