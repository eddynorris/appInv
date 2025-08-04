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
import { Colors, CardStyles, BadgeStyles, SummaryStyles, FilterStyles } from '@/styles/Theme';
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
        <ThemedView style={FilterStyles.container}>
            <ThemedText style={FilterStyles.label}>Filtrar por Ciudad:</ThemedText>
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
            <View style={CardStyles.content}>
              <View style={CardStyles.header}>
                <ThemedText style={CardStyles.title}>{cliente.nombre}</ThemedText>
                <View style={styles.badgeContainer}>
                  <View style={[BadgeStyles.base, parseFloat(cliente.saldo_pendiente || '0') > 0 ? BadgeStyles.warning : BadgeStyles.success]}>
                    <ThemedText style={[BadgeStyles.text, parseFloat(cliente.saldo_pendiente || '0') > 0 ? BadgeStyles.warningText : BadgeStyles.successText]}>
                      {parseFloat(cliente.saldo_pendiente || '0') > 0 ? 'Con saldo' : 'Al día'}
                    </ThemedText>
                  </View>
                </View>
              </View>
              
              <View style={CardStyles.details}>
                <View style={CardStyles.detailRow}>
                  <IconSymbol name="phone.fill" size={16} color={Colors.primary} />
                  <ThemedText style={CardStyles.detailText}>{cliente.telefono || 'No disponible'}</ThemedText>
                </View>
                
                <View style={CardStyles.detailRow}>
                  <IconSymbol name="location.fill" size={16} color={Colors.primary} />
                  <ThemedText style={CardStyles.detailText} numberOfLines={2}>{cliente.direccion || 'No disponible'}</ThemedText>
                </View>
                
                <View style={CardStyles.detailRow}>
                  <IconSymbol name="map.fill" size={16} color={Colors.primary} />
                  <ThemedText style={CardStyles.detailText}>Ciudad: {cliente.ciudad || '-'}</ThemedText>
                </View>
                
                <View style={CardStyles.detailRow}>
                  <IconSymbol name="dollarsign.circle.fill" size={16} color={Colors.primary} />
                  <ThemedText style={CardStyles.detailText}>Saldo: ${parseFloat(cliente.saldo_pendiente || '0').toFixed(2)}</ThemedText>
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
  filterInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8, 
      fontSize: 16,
      marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
});