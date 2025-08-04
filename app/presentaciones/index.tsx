// app/presentaciones/index.tsx - Versión refactorizada
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { usePresentacionesList } from '@/hooks/crud/usePresentacionesList';
import { IconSymbol } from '@/components/ui/IconSymbol';
 import { Colors } from '@/styles/Theme';

export default function PresentacionesScreen() {
  // Usar el nuevo hook para la lista
  const {
    presentaciones,
    isLoading,
    error,
    columns,
    pagination,
    refresh,
    deletePresentacion,
  } = usePresentacionesList();

  const handleAddPresentacion = () => {
    router.push('/presentaciones/create');
  };

  return (
    <ScreenContainer 
      title="Presentaciones"
      scrollable={false}
    >
      <Stack.Screen options={{ 
        title: 'Presentaciones',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        {/* Panel de resumen/estadísticas */}
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Presentaciones:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : presentaciones.length}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Presentaciones Activas:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {presentaciones.length}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        {/* Lista de tarjetas */}
        <EnhancedCardList
          data={presentaciones}
          isLoading={isLoading}
          error={error}
          baseRoute="/presentaciones"
          pagination={pagination}
          sorting={{
            sortColumn: pagination.sortColumn,
            sortOrder: pagination.sortOrder,
            onSort: pagination.onSort,
          }}
          actions={{
            onView: true,
            onEdit: true,
            onDelete: true,
          }}
          deleteOptions={{
            title: 'Eliminar Presentación',
            message: '¿Está seguro que desea eliminar esta presentación? Los productos asociados podrían verse afectados.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deletePresentacion(Number(id)),
          }}
          emptyMessage="No hay presentaciones disponibles"
          onRefresh={refresh}
          renderCard={(presentacion) => (
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>{presentacion.nombre}</ThemedText>
                <View style={styles.badgeContainer}>
                  <ThemedView style={[styles.badge, styles.activeBadge]}>
                    <ThemedText style={styles.badgeText}>Activo</ThemedText>
                  </ThemedView>
                </View>
              </View>
              
              <View style={styles.cardDetails}>
                {presentacion.capacidad_kg && (
                  <View style={styles.detailRow}>
                    <IconSymbol name="doc.text.fill" size={16} color={Colors.primary} />
                    <ThemedText style={styles.detailText} numberOfLines={2}>
                      Capacidad: {presentacion.capacidad_kg} kg
                    </ThemedText>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <IconSymbol name="cube.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Precio: {presentacion.precio_venta || 'N/A'} S/
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
          numColumns={1}
        />
        
        {/* Botón para agregar nueva presentación */}
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddPresentacion} 
        />
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summary: {
    padding: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Estilos para las tarjetas
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
});