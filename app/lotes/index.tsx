// app/lotes/index.tsx - Versión refactorizada
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { Divider } from '@/components/layout/Divider';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useLotesList } from '@/hooks/crud/useLotesList';
import { IconSymbol } from '@/components/ui/IconSymbol';
 import { Colors } from '@/styles/Theme';

export default function LotesScreen() {
  // Usar el hook refactorizado para la lista
  const {
    lotes,
    isLoading,
    error,
    columns,
    pagination,
    refresh,
    deleteLote,
    getEstadisticas,
    sortBy,
    sortOrder,
    handleSort
  } = useLotesList();
  
  // Obtener estadísticas
  const { totalPesoHumedo, totalPesoSeco, totalDisponible } = getEstadisticas();
  
  const handleAddLote = () => {
    router.push('/lotes/create');
  };
  
  return (
    <ScreenContainer 
      title="Lotes" 
      isLoading={isLoading && lotes.length === 0}
      error={error}
      loadingMessage="Cargando lotes..."
      scrollable={false}
    >
      <Stack.Screen options={{ 
        title: 'Lotes',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        {/* Resumen */}
        <ThemedView style={styles.summary}>
          <ThemedText type="subtitle">Resumen</ThemedText>
          <Divider style={{ marginVertical: 8 }} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{totalPesoHumedo.toFixed(2)} kg</ThemedText>
              <ThemedText style={styles.summaryLabel}>Peso Húmedo Total</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{totalPesoSeco.toFixed(2)} kg</ThemedText>
              <ThemedText style={styles.summaryLabel}>Peso Seco Total</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{totalDisponible.toFixed(2)} kg</ThemedText>
              <ThemedText style={styles.summaryLabel}>Total Disponible</ThemedText>
            </View>
          </View>
        </ThemedView>
        
        {/* Lista de tarjetas */}
        <EnhancedCardList
          data={lotes}
          isLoading={isLoading}
          error={error}
          baseRoute="/lotes"
          pagination={pagination}
          sorting={{
            sortColumn: sortBy,
            sortOrder: sortOrder,
            onSort: handleSort
          }}
          actions={{
            onView: true,
            onEdit: true,
            onDelete: true
          }}
          deleteOptions={{
            title: 'Eliminar Lote',
            message: '¿Está seguro que desea eliminar este lote? Esta acción podría afectar al inventario.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteLote(Number(id))
          }}
          emptyMessage="No hay lotes disponibles"
          onRefresh={refresh}
          renderCard={(lote) => (
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>{lote.descripcion}</ThemedText>
              </View>
              
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <IconSymbol name="leaf.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Producto: {lote.producto?.nombre || 'N/A'}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="calendar" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Fecha: {lote.fecha_ingreso || 'N/A'}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="scalemass.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Proveedor: {lote.proveedor?.nombre || '0'}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="scalemass" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Disponible: {lote.cantidad_disponible_kg || '0'} kg
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
          numColumns={1}
        />
      </ThemedView>
      
      {/* Botón flotante para agregar */}
      <FloatingActionButton 
        icon="plus.circle.fill" 
        onPress={handleAddLote} 
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summary: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 16,
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