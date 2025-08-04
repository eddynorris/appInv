import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Divider } from '@/components/layout/Divider';
import { Pago } from '@/models';
import { formatCurrency, formatDate } from '@/utils/formatters';
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';

interface PagosListProps {
  pagos: Pago[];
  isLoading?: boolean;
  ventaTotal: number;
  onAddPago: () => void;
}

const PagosList: React.FC<PagosListProps> = ({ 
  pagos, 
  isLoading = false, 
  ventaTotal, 
  onAddPago 
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const totalPagado = useMemo(() => {
    return pagos.reduce((sum, pago) => sum + parseFloat(pago.monto || '0'), 0);
  }, [pagos]);

  const saldoPendiente = useMemo(() => {
    return ventaTotal - totalPagado;
  }, [ventaTotal, totalPagado]);

  const renderPagoItem = ({ item }: { item: Pago }) => {
    let metodoColor = isDark ? Colors.dark.textSecondary : Colors.light.textSecondary;
    switch (item.metodo_pago) {
      case 'efectivo': metodoColor = Colors.success; break;
      case 'transferencia': metodoColor = Colors.info; break;
      case 'tarjeta': metodoColor = Colors.warning; break;
    }
    
    return (
      <TouchableOpacity onPress={() => router.push(`/pagos/${item.id}`)}>
        <ThemedView style={styles.itemContainer}>
          <View style={styles.itemRow}>
            <ThemedText style={styles.itemDate}>{formatDate(item.fecha)}</ThemedText>
            <ThemedText style={[styles.itemMetodo, { color: metodoColor }]}>
              {item.metodo_pago?.charAt(0).toUpperCase() + item.metodo_pago?.slice(1)}
            </ThemedText>
          </View>
          <View style={styles.itemRow}>
            <ThemedText style={styles.itemMonto}>{formatCurrency(item.monto)}</ThemedText>
            <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme].icon} />
          </View>
        </ThemedView>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Resumen Financiero */}
      <ThemedView style={styles.summaryContainer}>
        <ThemedView style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Total Pagado:</ThemedText>
          <ThemedText style={[styles.summaryValue, styles.paidValue]}>
            {formatCurrency(totalPagado)}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Saldo Pendiente:</ThemedText>
          <ThemedText style={[styles.summaryValue, saldoPendiente > 0 ? styles.pendingValue : styles.zeroValue]}>
            {formatCurrency(saldoPendiente)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <Divider style={styles.divider} />

      {/* Lista de Pagos */}
      {isLoading ? (
        <ThemedText style={styles.loadingText}>Cargando pagos...</ThemedText>
      ) : pagos.length === 0 ? (
        <ThemedText style={styles.emptyText}>No hay pagos registrados para esta venta.</ThemedText>
      ) : (
        <FlatList
          data={pagos}
          renderItem={renderPagoItem}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <Divider style={styles.itemSeparator} />}
          scrollEnabled={false} // Deshabilitar scroll si está dentro de otro ScrollView
        />
      )}

      {/* Botón para Añadir Pago (solo si hay saldo pendiente o no hay pagos) */}
      {(saldoPendiente > 0 || pagos.length === 0) && (
        <TouchableOpacity style={styles.addButton} onPress={onAddPago}>
          <IconSymbol name="plus.circle.fill" size={20} color={Colors.primary} />
          <ThemedText style={styles.addButtonText}>Registrar Pago</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8, // Espacio antes del componente
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paidValue: {
    color: Colors.success,
  },
  pendingValue: {
    color: Colors.danger,
  },
   zeroValue: {
    color: Colors.light.textSecondary, // O un gris neutro
  },
  divider: {
    marginVertical: 16,
  },
  itemContainer: {
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  itemMetodo: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  itemMonto: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSeparator: {
    marginVertical: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: Colors.light.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
});

export default PagosList; 