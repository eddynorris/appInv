// app/almacenes/index.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useAlmacenesList } from '@/hooks/crud/useAlmacenesList';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

export default function AlmacenesScreen() {
  // Usar el hook refactorizado para la LISTA
  const {
    almacenes,
    isLoading,
    error,
    columns,
    pagination,
    refresh,       // Para el botón/gesto de refresco
    deleteAlmacen  // Para la acción de borrado en la tabla
  } = useAlmacenesList(); // No necesita opciones

  const handleAddAlmacen = () => {
    router.push('/almacenes/create');
  };

  return (
    <ScreenContainer 
      title="Almacenes"
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Almacenes:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : pagination.totalItems}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <EnhancedCardList
          data={almacenes}
          isLoading={isLoading}
          error={error}
          baseRoute="/almacenes"
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            itemsPerPage: pagination.itemsPerPage,
            totalItems: pagination.totalItems,
            onPageChange: pagination.onPageChange,
            onItemsPerPageChange: pagination.onItemsPerPageChange
          }}
          sorting={{
            sortColumn: 'id',
            sortOrder: 'asc',
            onSort: () => {} // Implementar cuando se necesite ordenación en el servidor
          }}
          actions={{
            onView: true,
            onEdit: true,
            onDelete: true
          }}
          deleteOptions={{
            title: 'Eliminar Almacén',
            message: '¿Está seguro que desea eliminar este almacén?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteAlmacen(Number(id))
          }}
          emptyMessage="No hay almacenes disponibles"
          onRefresh={refresh}
          renderCard={(almacen) => (
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>{almacen.nombre}</ThemedText>
                <View style={styles.badgeContainer}>
                  <ThemedView style={[styles.badge, styles.activeBadge]}>
                    <ThemedText style={styles.badgeText}>Activo</ThemedText>
                  </ThemedView>
                </View>
              </View>
              
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <IconSymbol name="location.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    {almacen.direccion || 'Sin ubicación especificada'}
                  </ThemedText>
                </View>
                
                {almacen.ciudad && (
                  <View style={styles.detailRow}>
                    <IconSymbol name="doc.text.fill" size={16} color={Colors.primary} />
                    <ThemedText style={styles.detailText} numberOfLines={2}>
                      {almacen.ciudad}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
          numColumns={1}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddAlmacen} 
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
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
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
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
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