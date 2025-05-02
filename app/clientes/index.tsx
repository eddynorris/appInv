// app/clientes/index.tsx
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useClientesList } from '@/hooks/crud/useClientesList'; 
import { Cliente } from '@/models';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';


export default function ClientesScreen() {
  // Usar el hook refactorizado para la LISTA
  const {
    clientes,
    isLoading,
    error,
    columns, // <-- Columnas vienen del hook
    pagination,
    refresh, // <-- Para refrescar
    deleteCliente // <-- Para borrar desde la tabla
  } = useClientesList();
 
  // Calcular estadísticas de clientes
  const saldoTotal = useMemo(() => {
    // Asegúrate que 'clientes' sea un array antes de reducir
    if (!Array.isArray(clientes)) return 0;
    return clientes.reduce((total, cliente) =>
      total + parseFloat(cliente.saldo_pendiente || '0'), 0);
  }, [clientes]); // Depende de los datos de la lista}
  
  const handleAddCliente = () => {
    router.push('/clientes/create');
  };

  return (
    <ScreenContainer 
      title="Clientes"
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Clientes:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : pagination.totalItems}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Saldo Total:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              S./{(isLoading || !Array.isArray(clientes)) ? '$0.00' : `$${saldoTotal.toFixed(2)}`}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        {/* Renderizar clientes como tarjetas */}
        <EnhancedCardList
          data={clientes}
          isLoading={isLoading}
          error={error}
          baseRoute="/clientes"
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
            title: 'Eliminar Cliente',
            message: '¿Está seguro que desea eliminar este cliente?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteCliente(Number(id))
          }}
          emptyMessage="No hay clientes disponibles"
          onRefresh={refresh}
          renderCard={(cliente) => (
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>{cliente.nombre}</ThemedText>
                <View style={styles.badgeContainer}>
                  <View style={[styles.badge, parseFloat(cliente.saldo_pendiente || '0') > 0 ? styles.warningBadge : styles.successBadge]}>
                    <ThemedText style={styles.badgeText}>
                      {parseFloat(cliente.saldo_pendiente || '0') > 0 ? 'Con saldo' : 'Al día'}
                    </ThemedText>
                  </View>
                </View>
              </View>
              
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <IconSymbol name="phone.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>{cliente.telefono || 'No disponible'}</ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="location.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText} numberOfLines={2}>{cliente.direccion || 'No disponible'}</ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="dollarsign.circle.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>Saldo: S/.{parseFloat(cliente.saldo_pendiente || '0').toFixed(2)}</ThemedText>
                </View>
              </View>
            </View>
          )}
          numColumns={1}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddCliente} 
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
  warningBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  successBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
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