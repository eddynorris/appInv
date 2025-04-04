import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Alert } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useGastos } from '@/hooks/crud/useGastos';
import { Gasto } from '@/models';

export default function GastoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { 
    entity, 
    isLoading, 
    error, 
    loadEntity, 
    deleteEntity,
    getCategoryColor
  } = useGastos();

  // Tipo explícito para corregir errores de TypeScript
  const gasto = entity as Gasto | null;
  
  // Referencia para controlar la primera carga
  const isInitialMount = useRef(true);
  
  // Cargar datos al inicio, solo una vez
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      console.log(`Cargando detalles de gasto ID: ${id}`);
      await loadEntity(parseInt(id));
    };
    
    fetchData();
  }, [id]); // Solo depende del ID
  
  const handleEdit = () => {
    router.push(`/gastos/edit/${id}`);
  };
  
  const handleDelete = async () => {
    if (!id) return;
    
    try {
      const success = await deleteEntity(parseInt(id));
      if (success) {
        // Mostrar mensaje de éxito y redirigir
        Alert.alert(
          'Gasto Eliminado',
          'El gasto ha sido eliminado exitosamente',
          [{ text: 'OK', onPress: () => router.replace('/gastos') }]
        );
      }
    } catch (error) {
      console.error('Error deleting gasto:', error);
      Alert.alert('Error', 'No se pudo eliminar el gasto');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <ScreenContainer
      title={gasto ? `Gasto #${gasto.id}` : 'Detalles del Gasto'}
      isLoading={isLoading}
      error={error}
      loadingMessage="Cargando datos del gasto..."
    >
      {gasto && (
        <DetailCard>
          <ThemedText type="title" style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>
            ${parseFloat(gasto.monto).toFixed(2)}
          </ThemedText>
          
          <ThemedView style={{
            alignSelf: 'center',
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 16,
            marginBottom: 16,
            backgroundColor: `${getCategoryColor(gasto.categoria)}20`
          }}>
            <ThemedText style={{ 
              fontWeight: '600',
              color: getCategoryColor(gasto.categoria)
            }}>
              {gasto.categoria}
            </ThemedText>
          </ThemedView>
          
          <DetailSection title="Descripción">
            <ThemedText style={{ fontSize: 16, lineHeight: 24 }}>
              {gasto.descripcion}
            </ThemedText>
          </DetailSection>

          <DetailSection title="Detalles">
            <DetailRow 
              label="Fecha" 
              value={new Date(gasto.fecha).toLocaleDateString()} 
            />
            <DetailRow 
              label="Monto" 
              value={`$${parseFloat(gasto.monto).toFixed(2)}`} 
            />
            <DetailRow 
              label="Categoría" 
              value={gasto.categoria} 
            />
            {gasto.almacen && (
              <DetailRow 
                label="Almacén" 
                value={gasto.almacen.nombre} 
              />
            )}
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
        title="Eliminar Gasto"
        message="¿Está seguro que desea eliminar este gasto?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenContainer>
  );
}