// app/presentaciones/[id].tsx - Refactorizado
import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, ActivityIndicator, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { usePresentacionItem } from '@/hooks/crud/usePresentacionItem'; // Importar hook de item
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { Presentacion } from '@/models'; // Importar modelo

export default function PresentacionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idNumerico = id ? parseInt(id as string) : 0;
  const colorScheme = useColorScheme() ?? 'light';
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [presentacion, setPresentacion] = useState<Presentacion | null>(null);

  // Usar el hook de item
  const {
    isLoading,
    error,
    getPresentacion,
    deletePresentacion,
    existingImageUrl, // Usar la URL de imagen existente del hook
  } = usePresentacionItem();

  // Cargar datos de la presentación
  useEffect(() => {
    if (idNumerico) {
      const fetchData = async () => {
        const data = await getPresentacion(idNumerico);
        if (data) {
          setPresentacion(data);
        }
      };
      fetchData();
    }
  }, [idNumerico, getPresentacion]);

  const handleEdit = () => {
    router.push(`/presentaciones/edit/${idNumerico}`);
  };

  const handleDelete = async () => {
    const success = await deletePresentacion(idNumerico);
    setShowDeleteDialog(false); // Cerrar diálogo independientemente del resultado
    // La redirección se maneja dentro de deletePresentacion en el hook si tiene éxito
  };

  // Función para obtener color y texto del tipo
  const getTipoInfo = (tipo?: string) => {
    if (!tipo) return { color: '#757575', text: 'Desconocido' };
    let color = '#757575';
    switch (tipo) {
      case 'bruto': color = '#A1887F'; break;
      case 'procesado': color = '#4CAF50'; break;
      case 'merma': color = '#F44336'; break;
      case 'briqueta': color = '#FF9800'; break;
      case 'detalle': color = '#2196F3'; break;
    }
    return { color, text: tipo.charAt(0).toUpperCase() + tipo.slice(1) };
  };

  const tipoInfo = getTipoInfo(presentacion?.tipo);
  const estadoColor = presentacion?.activo ? Colors.success : Colors.danger;

  return (
    <ScreenContainer
      title={presentacion ? `Presentación: ${presentacion.nombre}` : 'Detalles'}
      isLoading={isLoading && !presentacion}
      error={error}
      loadingMessage="Cargando datos de la presentación..."
    >
      <Stack.Screen options={{ 
        title: presentacion ? `Presentación #${presentacion.id}` : 'Detalles',
        headerShown: true 
      }} />

      {presentacion && (
        <ScrollView>
          <DetailCard>
            {/* Imagen */} 
            <ThemedView style={styles.imageContainer}>
              {existingImageUrl ? (
                <Image source={{ uri: existingImageUrl }} style={styles.image} resizeMode="contain" />
              ) : (
                <IconSymbol name="cube.box" size={64} color="#ccc" />
              )}
            </ThemedView>

            {/* Nombre y Producto Base */} 
            <ThemedText type="title" style={styles.titleText}>{presentacion.nombre}</ThemedText>
            <ThemedText style={styles.subtitleText}>{presentacion.producto?.nombre || 'Producto base no especificado'}</ThemedText>

            {/* Badges de Tipo y Estado */} 
            <ThemedView style={styles.badgeContainer}>
              <ThemedView style={[styles.badge, { backgroundColor: `${tipoInfo.color}20` }]}>
                <ThemedText style={[styles.badgeText, { color: tipoInfo.color }]}>{tipoInfo.text}</ThemedText>
              </ThemedView>
              <ThemedView style={[styles.badge, { backgroundColor: `${estadoColor}20` }]}>
                <ThemedText style={[styles.badgeText, { color: estadoColor }]}>
                  {presentacion.activo ? 'Activo' : 'Inactivo'}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Detalles */} 
            <DetailSection title="Detalles">
              <DetailRow label="Capacidad" value={`${parseFloat(presentacion.capacidad_kg).toFixed(2)} kg`} />
              <DetailRow label="Precio Venta" value={`$${parseFloat(presentacion.precio_venta).toFixed(2)}`} />
              {/* Añadir más detalles si son relevantes */} 
            </DetailSection>

            {/* Botones de Acción */} 
            <ActionButtons
              onSave={handleEdit}
              saveText="Editar"
              onDelete={() => setShowDeleteDialog(true)}
              showDelete={true}
            />
          </DetailCard>
        </ScrollView>
      )}

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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  titleText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleText: {
    textAlign: 'center',
    color: Colors.light.textSecondary, // Ajustar para dark mode si es necesario
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 14,
  },
});