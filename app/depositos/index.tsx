import React from 'react';
import { StyleSheet, View, TouchableOpacity, Linking, Alert } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { useDepositosList } from '@/hooks/crud/useDepositosList';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function DepositosScreen() {
  const {
    depositos,
    isLoading,
    error,
    pagination,
    filters,
    handleFilterChange,
    applyFilters,
    clearFilters,
    refresh,
    deleteDeposito,
    isAdmin,
  } = useDepositosList();

  const handleAddDeposito = () => {
    router.push('/depositos/create');
  };

  const handleViewComprobante = (url?: string | null) => {
    if (!url) {
        Alert.alert("Info", "Este depósito no tiene comprobante.");
        return;
    }
    Linking.openURL(url).catch(err => {
        console.error('Error al abrir el comprobante:', err);
        Alert.alert("Error", "No se pudo abrir el enlace. Asegúrate de tener una aplicación compatible instalada.");
    });
  };

  // TODO: Añadir UI para filtros (fecha, almacén, usuario si es admin)

  return (
    <ScreenContainer
      title="Depósitos Bancarios"
      scrollable={false}
    >
      <Stack.Screen options={{
        title: 'Depósitos',
        headerShown: true
      }} />

      <ThemedView style={styles.container}>
        <EnhancedCardList
          data={depositos}
          isLoading={isLoading}
          error={error}
          baseRoute="/depositos"
          pagination={pagination}
          sorting={{
            sortColumn: pagination.sortColumn,
            sortOrder: pagination.sortOrder,
            onSort: pagination.onSort
          }}
          actions={{ // Definir acciones disponibles
            onView: true,
            onEdit: isAdmin, // Solo admin puede editar
            onDelete: isAdmin // Solo admin puede borrar
          }}
          deleteOptions={{
            title: 'Eliminar Depósito',
            message: '¿Está seguro que desea eliminar este depósito?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteDeposito(Number(id))
          }}
          emptyMessage="No hay depósitos registrados"
          onRefresh={refresh}
          renderCard={(deposito) => (
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>{formatCurrency(deposito.monto_depositado)}</ThemedText>
                {deposito.url_comprobante_deposito && (
                  <TouchableOpacity onPress={() => handleViewComprobante(deposito.url_comprobante_deposito)}>
                    <IconSymbol name="doc.text.image.fill" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <IconSymbol name="calendar" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>{formatDate(deposito.fecha_deposito)}</ThemedText>
                </View>
                 <View style={styles.detailRow}>
                   <IconSymbol name="building.2.fill" size={16} color={Colors.primary} />
                   <ThemedText style={styles.detailText}>{deposito.almacen?.nombre || 'N/A'}</ThemedText>
                 </View>
                 <View style={styles.detailRow}>
                  <IconSymbol name="person.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>{deposito.usuario?.username || 'N/A'}</ThemedText>
                 </View>
                 {deposito.referencia_bancaria && (
                     <View style={styles.detailRow}>
                         <IconSymbol name="number" size={16} color={Colors.primary} />
                         <ThemedText style={styles.detailText}>Ref: {deposito.referencia_bancaria}</ThemedText>
                     </View>
                 )}
                 {deposito.notas && (
                     <View style={styles.detailRow}>
                         <IconSymbol name="text.bubble" size={16} color={Colors.primary} />
                         <ThemedText style={styles.detailText} numberOfLines={1}>Notas: {deposito.notas}</ThemedText>
                     </View>
                 )}
              </View>
            </View>
          )}
          numColumns={1}
        />

        <FloatingActionButton
          icon="plus.circle.fill"
          onPress={handleAddDeposito}
        />
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Estilos para las tarjetas (puedes copiar de pagos/index o crear nuevos)
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
    fontSize: 20,
    fontWeight: 'bold',
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
    flex: 1, // Para que el texto se ajuste si es largo
  },
}); 