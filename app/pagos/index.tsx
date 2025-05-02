// app/pagos/index.tsx - Versión refactorizada
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { usePagosList } from '@/hooks/crud/usePagosList';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function PagosScreen() {
  // Usar el hook refactorizado para la lista con control de permisos
  const { 
    pagos, 
    isLoading, 
    error, 
    columns,
    pagination,
    refresh,
    deletePago,
    getTotalPagos,
    isAdmin,
    canEditOrDelete 
  } = usePagosList();

  // Función para navegar a la pantalla de creación
  const handleAddPago = () => {
    router.push('/pagos/create');
  };

  return (
    <ScreenContainer 
      title="Pagos"
      scrollable={false}
    >
      <Stack.Screen options={{ 
        title: 'Pagos',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Registros:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : pagination.totalItems}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Monto Total:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              ${isLoading ? '0.00' : getTotalPagos}
            </ThemedText>
          </ThemedView>
          
          {/* Mostrar mensaje de filtrado para usuarios no administradores */}
          {!isAdmin && (
            <ThemedView style={styles.filterInfo}>
              <ThemedText style={styles.filterInfoText}>
                Solo se muestran los pagos registrados por ti
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
        
        <EnhancedCardList
          data={pagos}
          isLoading={isLoading}
          error={error}
          baseRoute="/pagos"
          pagination={pagination}
          sorting={{
            sortColumn: 'fecha',
            sortOrder: 'desc',
            onSort: () => {} // Implementar cuando se necesite ordenación en el servidor
          }}
          actions={{
            onView: true, // Todos pueden ver detalles
            onEdit: isAdmin, // Verificar permiso para editar
            onDelete: isAdmin // Verificar permiso para eliminar
          }}
          deleteOptions={{
            title: 'Eliminar Pago',
            message: '¿Está seguro que desea eliminar este pago?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deletePago(Number(id))
          }}
          emptyMessage="No hay pagos registrados"
          onRefresh={refresh}
          renderCard={(pago) => (
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>Pago #{pago.id} por {pago.usuario?.username} </ThemedText>

              </View>
              
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <IconSymbol name="calendar" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Fecha: {pago.fecha ? formatDate(pago.fecha) : 'N/A'}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="creditcard.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Monto: {pago.monto ? formatCurrency(parseFloat(pago.monto)) : '$0.00'}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="person.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Total: {pago.venta?.total || 'N/A'}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="doc.text.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText} numberOfLines={2}>
                    Metodo: {pago.metodo_pago || 'Sin metodo'}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
          numColumns={1}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddPago} 
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
  filterInfo: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  filterInfoText: {
    fontSize: 12,
    color: '#F57C00',
    textAlign: 'center',
    fontWeight: '500',
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
  pendingBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
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