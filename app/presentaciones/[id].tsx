// app/presentaciones/[id].tsx - Versión mejorada
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { Badge } from '@/components/ui/Badge';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { usePresentaciones } from '@/hooks/crud/usePresentaciones';
import { API_CONFIG } from '@/services/api';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';

export default function PresentacionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Usar el hook personalizado para presentaciones con todas sus funcionalidades
  const { 
    getTipoColor, 
    deletePresentacion,
    getItem,
    isLoading: isLoadingFromHook,
    error: errorFromHook,
  } = usePresentaciones();
  
  // Asignar getItem a getPresentacion para mantener compatibilidad
  const getPresentacion = getItem;
  
  // Estado local para la presentación específica
  const [presentacion, setPresentacion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de la presentación
  const loadPresentacion = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getPresentacion(parseInt(id));
      if (data) {
        setPresentacion(data);
      } else {
        setError('No se pudo cargar la presentación');
      }
    } catch (err) {
      console.error('Error al cargar presentación:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  }, [id, getPresentacion]);

  // Cargar datos al montar
  useEffect(() => {
    loadPresentacion();
  }, [loadPresentacion]);

  // Navegar a pantalla de edición
  const handleEdit = useCallback(() => {
    router.push(`/presentaciones/edit/${id}`);
  }, [id]);

  // Mostrar diálogo de confirmación para eliminar
  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  // Ejecutar eliminación utilizando directamente el método deletePresentacion
  const handleDelete = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      // Llamar directamente al método del hook sin gestionar alertas adicionales
      const success = await deletePresentacion(parseInt(id));
      
      if (success) {
        router.replace('/presentaciones');
      } else {
        setError('No se pudo eliminar la presentación');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error al eliminar presentación:', error);
      setError('Error al eliminar la presentación');
      setIsLoading(false);
    } finally {
      setShowDeleteDialog(false);
    }
  }, [id, deletePresentacion]);

  // Ver imagen a tamaño completo
  const viewFullImage = useCallback(() => {
    if (presentacion?.url_foto) {
      const imageUrl = API_CONFIG.getImageUrl(presentacion.url_foto);
      Linking.openURL(imageUrl).catch(err => {
        console.error('Error al abrir la imagen:', err);
      });
    }
  }, [presentacion?.url_foto]);

  // Renderizar imagen de la presentación
  const renderImage = useCallback(() => {
    if (presentacion?.url_foto) {
      const imageUrl = API_CONFIG.getImageUrl(presentacion.url_foto);
      return (
        <TouchableOpacity onPress={viewFullImage} style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image}
            resizeMode="contain"
          />
        </TouchableOpacity>
      );
    }
    
    return (
      <ThemedView style={styles.imagePlaceholder}>
        <IconSymbol name="photo" size={48} color="#9BA1A6" />
        <ThemedText style={styles.placeholderText}>Sin imagen</ThemedText>
      </ThemedView>
    );
  }, [presentacion?.url_foto, viewFullImage]);

  // Determinar loading y error combinando el estado local y el del hook
  const combinedLoading = isLoading || isLoadingFromHook;
  const combinedError = error || errorFromHook;

  return (
    <ScreenContainer
      title={presentacion ? presentacion.nombre : 'Detalles de Presentación'}
      isLoading={combinedLoading}
      error={combinedError}
      loadingMessage="Cargando datos de la presentación..."
      onRefresh={loadPresentacion}
    >
      {presentacion && (
        <DetailCard>
          {/* Sección de imagen */}
          <ThemedView style={styles.imageContainer}>
            {renderImage()}
          </ThemedView>
          
          {/* Badge de tipo */}
          <ThemedView style={styles.badgeContainer}>
            <Badge 
              text={presentacion.tipo.toUpperCase()} 
              color={getTipoColor(presentacion.tipo)}
              size="medium"
            />
            
            {/* Badge de estado */}
            <Badge 
              text={presentacion.activo ? 'ACTIVO' : 'INACTIVO'} 
              color={presentacion.activo ? '#4CAF50' : '#F44336'}
              size="medium"
            />
          </ThemedView>
          
          {/* Información general */}
          <DetailSection title="Información General">
            <DetailRow 
              label="Producto" 
              value={
                <TouchableOpacity 
                  onPress={() => presentacion.producto_id && router.push(`/productos/${presentacion.producto_id}`)}
                >
                  <ThemedText style={styles.linkText}>
                    {presentacion.producto?.nombre || 'No especificado'}
                  </ThemedText>
                </TouchableOpacity>
              } 
            />
            <DetailRow 
              label="Capacidad" 
              value={`${parseFloat(presentacion.capacidad_kg).toFixed(2)} KG`} 
            />
            <DetailRow 
              label="Precio de Venta" 
              value={`$${parseFloat(presentacion.precio_venta).toFixed(2)}`} 
            />
          </DetailSection>
          
          {/* Botones de acción */}
          <ActionButtons
            onSave={handleEdit}
            saveText="Editar"
            onDelete={handleDeleteClick}
            showDelete={true}
          />
        </DetailCard>
      )}
      
      {/* Diálogo de confirmación para eliminar */}
      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Eliminar Presentación"
        message="¿Está seguro que desea eliminar esta presentación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    marginTop: 8,
    color: '#9BA1A6',
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  linkText: {
    color: '#0a7ea4',
    textDecorationLine: 'underline',
  }
});