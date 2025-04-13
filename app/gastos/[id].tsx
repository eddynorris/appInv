// app/gastos/[id].tsx
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Alert } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useGastoItem } from '@/hooks/crud/useGastoItem';
import { useAuth } from '@/context/AuthContext'; // Importar el contexto de autenticación
import { Gasto } from '@/models';

export default function GastoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [gasto, setGasto] = useState<Gasto | null>(null);
  const { user } = useAuth(); // Obtener información del usuario
  
  const { 
    getGasto, 
    deleteGasto, 
    isLoading, 
    error, 
    getCategoryColor 
  } = useGastoItem();
  
  // Cargar datos del gasto
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      const data = await getGasto(parseInt(id));
      if (data) {
        setGasto(data);
      }
    };
    
    fetchData();
  }, [id, getGasto]);
  
  // Determinar si el usuario tiene permisos para editar/eliminar este gasto
  const canEditOrDelete = () => {
    if (!user || !gasto) return false;
    
    // Admins pueden editar/eliminar cualquier gasto
    if (user.rol === 'admin') return true;
    
    // Usuarios normales solo pueden editar/eliminar sus propios gastos
    return gasto.usuario_id === user.id;
  };
  
  const handleEdit = () => {
    if (!canEditOrDelete()) {
      Alert.alert('Acceso denegado', 'No tienes permiso para editar este gasto');
      return;
    }
    router.push(`/gastos/edit/${id}`);
  };
  
  const handleDelete = async () => {
    if (!id) return;
    
    if (!canEditOrDelete()) {
      Alert.alert('Acceso denegado', 'No tienes permiso para eliminar este gasto');
      setShowDeleteDialog(false);
      return;
    }
    
    try {
      const success = await deleteGasto(parseInt(id));
      if (success) {
        // Mostrar mensaje de éxito y redirigir
        Alert.alert(
          'Gasto Eliminado',
          'El gasto ha sido eliminado exitosamente',
          [{ text: 'OK', onPress: () => router.replace('/gastos') }]
        );
      } else {
        Alert.alert('Error', 'No se pudo eliminar el gasto');
      }
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      Alert.alert('Error', 'No se pudo eliminar el gasto');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  // Renderizar botones solo si tiene permisos
  const renderActionButtons = () => {
    // Si no tiene permisos, no mostrar botones
    if (!canEditOrDelete()) {
      return null;
    }
    
    // Si tiene permisos, mostrar botones de acción
    return (
      <ActionButtons
        onSave={handleEdit}
        saveText="Editar"
        onDelete={() => setShowDeleteDialog(true)}
        showDelete={true}
      />
    );
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
            <DetailRow 
              label="Almacen" 
              value={gasto.almacen_id ? `${gasto.almacen?.nombre}` : 'No especificado'} 
            />
            <DetailRow 
              label="Creado por" 
              value={gasto.usuario_id ? `Usuario: ${gasto.usuario?.username}` : 'No especificado'} 
            />
          </DetailSection>

          {/* Renderizar botones condicionalmente */}
          {renderActionButtons()}
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