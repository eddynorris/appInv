// app/lotes/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ThemedText } from '@/components/ThemedText';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { useLoteItem } from '@/hooks/crud/useLoteItem';
import { Lote } from '@/models';

export default function LoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lote, setLote] = useState<Lote | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const initialLoadDone = useRef(false);
  
  const { 
    getLote, 
    deleteLote, 
    isLoading, 
    error,
    calcularRendimiento
  } = useLoteItem();
  
  // Cargar datos del lote una sola vez
  useEffect(() => {
    const fetchLoteData = async () => {
      if (!id || initialLoadDone.current) return;
      
      try {
        setLocalLoading(true);
        initialLoadDone.current = true; // Marcar que ya iniciamos la carga
        
        const data = await getLote(parseInt(id));
        if (data) {
          setLote(data);
        }
      } catch (error) {
        console.error('Error cargando datos del lote:', error);
      } finally {
        setLocalLoading(false);
      }
    };
    
    fetchLoteData();
  }, [id]); // No incluir getLote como dependencia
  
  // Manejar la navegación a edición
  const handleEdit = () => {
    router.push(`/lotes/edit/${id}`);
  };
  
  // Manejar la eliminación
  const handleDelete = async () => {
    if (!id) return;
    
    const success = await deleteLote(parseInt(id));
    setShowDeleteDialog(false);
    
    if (success) {
      Alert.alert(
        'Lote Eliminado',
        'El lote ha sido eliminado exitosamente',
        [{ text: 'OK', onPress: () => router.replace('/lotes') }]
      );
    } else {
      Alert.alert('Error', 'No se pudo eliminar el lote');
    }
  };
  
  // Calcular rendimiento
  const rendimiento = lote && lote.peso_seco_kg ? 
    calcularRendimiento(
      parseFloat(lote.peso_humedo_kg.toString()), 
      parseFloat(lote.peso_seco_kg.toString())
    ) : 
    'No disponible';
  
  return (
    <ScreenContainer 
      title={lote ? `Lote #${lote.id}` : 'Detalles del Lote'}
      isLoading={isLoading || localLoading}
      error={error}
      loadingMessage="Cargando datos del lote..."
    >
      {lote && (
        <DetailCard>
          <ThemedText type="title">Lote #{lote.id}</ThemedText>
          
          <DetailSection title="Información General">
            <DetailRow label="Producto" value={lote.producto?.nombre || 'No especificado'} />
            <DetailRow label="Proveedor" value={lote.proveedor?.nombre || 'No especificado'} />
            <DetailRow label="Descripción" value={lote.descripcion || 'No especificada'} />
            <DetailRow 
              label="Fecha de Ingreso" 
              value={new Date(lote.fecha_ingreso).toLocaleDateString()} 
            />
          </DetailSection>
          
          <DetailSection title="Información de Peso">
            <DetailRow 
              label="Peso Húmedo" 
              value={`${parseFloat(lote.peso_humedo_kg.toString()).toFixed(2)} kg`} 
            />
            <DetailRow 
              label="Peso Seco" 
              value={lote.peso_seco_kg ? `${parseFloat(lote.peso_seco_kg.toString()).toFixed(2)} kg` : 'No registrado'} 
            />
            <DetailRow 
              label="Disponible" 
              value={lote.cantidad_disponible_kg ? `${parseFloat(lote.cantidad_disponible_kg.toString()).toFixed(2)} kg` : 'No registrado'} 
            />
            <DetailRow 
              label="Rendimiento" 
              value={rendimiento} 
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
        title="Eliminar Lote"
        message="¿Está seguro que desea eliminar este lote? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenContainer>
  );
}