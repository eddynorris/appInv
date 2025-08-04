// app/gastos/index.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useGastosList } from '@/hooks/crud/useGastosList';
import { IconSymbol } from '@/components/ui/IconSymbol';
 import { Colors } from '@/styles/Theme';

export default function GastosScreen() {
  // Usar el hook refactorizado para la lista con control de permisos
  const {
    gastos,
    isLoading,
    error,
    columns,
    pagination,
    refresh,
    deleteGasto,
    getEstadisticas,
    isAdmin,
    canEditOrDelete
  } = useGastosList();
  
  // Calcular estadísticas
  const { totalMonto, totalGastos } = getEstadisticas();

  const handleAddGasto = () => {
    router.push('/gastos/create');
  };

  return (
    <ScreenContainer 
      title="Gastos"
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Registros:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : totalGastos}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Gastos:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              ${isLoading ? '0.00' : totalMonto.toFixed(2)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <EnhancedCardList
          data={gastos}
          isLoading={isLoading}
          error={error}
          baseRoute="/gastos"
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
            onView: true, // Todos pueden ver detalles
            onEdit: isAdmin, // Solo admin puede editar directamente desde la tabla
            onDelete: isAdmin // Solo admin puede eliminar directamente desde la tabla
          }}
          deleteOptions={{
            title: 'Eliminar Gasto',
            message: '¿Está seguro que desea eliminar este gasto?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteGasto(Number(id))
          }}
          emptyMessage="No hay gastos disponibles"
          onRefresh={refresh}
          renderCard={(gasto) => {
            // Obtener color para la categoría
            const getCategoryColor = (category: string) => {
              switch (category.toLowerCase()) {
                case 'servicios': return '#2196F3'; // Azul
                case 'personal': return '#4CAF50'; // Verde
                case 'alquiler': return '#FFC107'; // Amarillo
                case 'marketing': return '#9C27B0'; // Púrpura
                case 'logistica': return '#FF5722'; // Naranja
                default: return '#757575'; // Gris
              }
            };
            
            const categoryColor = getCategoryColor(gasto.categoria);
            
            return (
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.cardTitle} numberOfLines={1}>{gasto.descripcion}</ThemedText>
                  <View style={styles.badgeContainer}>
                    <View style={[styles.badge, { backgroundColor: `${categoryColor}20` }]}>
                      <ThemedText style={[styles.badgeText, { color: categoryColor }]}>
                        {gasto.categoria.charAt(0).toUpperCase() + gasto.categoria.slice(1)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="dollarsign.circle.fill" size={16} color={Colors.primary} />
                    <ThemedText style={styles.detailText}>Monto: S/.{parseFloat(gasto.monto).toFixed(2)}</ThemedText>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol name="calendar" size={16} color={Colors.primary} />
                    <ThemedText style={styles.detailText}>Fecha: {new Date(gasto.fecha).toLocaleDateString()}</ThemedText>
                  </View>
                  
                  {gasto.almacen?.nombre ? (
                    <View style={styles.detailRow}>
                      <IconSymbol name="doc.text.fill" size={16} color={Colors.primary} />
                      <ThemedText style={styles.detailText} numberOfLines={2}>{gasto.almacen?.nombre}</ThemedText>
                    </View>
                  ) : (
                    <View style={styles.detailRow}>
                      <IconSymbol name="doc.text.fill" size={16} color={Colors.primary} />
                      <ThemedText style={styles.detailText}>Sin almacén asociado</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          numColumns={1}
        />

        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddGasto} 
        />

      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summary: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
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