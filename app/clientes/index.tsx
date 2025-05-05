// app/clientes/index.tsx
import React, { useMemo } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
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
import { useColorScheme } from '@/hooks/useColorScheme';
import { ActionButtons } from '@/components/buttons/ActionButtons';

export default function ClientesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const {
    clientes,
    isLoading,
    error,
    pagination,
    refresh,
    deleteCliente,
    filters,
    handleFilterChange,
    applyFilters,
    clearFilters,
  } = useClientesList();
 
  const handleAddCliente = () => {
    router.push('/clientes/create');
  };

  return (
    <ScreenContainer 
      title="Clientes"
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.filterContainer}>
            <ThemedText style={styles.filterLabel}>Filtrar por Ciudad:</ThemedText>
            <TextInput
                style={[styles.filterInput, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }]}
                placeholder="Escriba una ciudad..."
                placeholderTextColor={Colors[colorScheme].textSecondary}
                value={filters.ciudad}
                onChangeText={(value) => handleFilterChange('ciudad', value)}
            />
            <ActionButtons
                onSave={applyFilters}
                onCancel={clearFilters}
                saveText="Filtrar"
                cancelText="Limpiar"
                isSubmitting={isLoading}
            />
        </ThemedView>
        
        <EnhancedCardList
          data={clientes}
          isLoading={isLoading}
          error={error}
          baseRoute="/clientes"
          pagination={pagination}
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
          emptyMessage="No hay clientes disponibles o que coincidan con el filtro"
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
                  <IconSymbol name="map.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>Ciudad: {cliente.ciudad || '-'}</ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="dollarsign.circle.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>Saldo: ${parseFloat(cliente.saldo_pendiente || '0').toFixed(2)}</ThemedText>
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
  filterContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      gap: 8,
  },
  filterLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
  },
  filterInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8, 
      fontSize: 16,
      marginBottom: 8,
  },
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