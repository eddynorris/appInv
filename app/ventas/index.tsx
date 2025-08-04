// app/ventas/index.tsx - Refactorizado
import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, Button, TouchableOpacity, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { useVentasList } from '@/hooks/ventas'; // Hook refactorizado
import { Collapsible } from '@/components/Collapsible';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, CardStyles, BadgeStyles, SummaryStyles, FilterStyles } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function VentasScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Estados para visibilidad de date pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Usar el hook de lista refactorizado
  const {
    ventas,
    isLoading,
    error,
    columns,
    pagination,
    filters,
    handleFilterChange,
    applyFilters,
    clearFilters,
    refresh,
    deleteVenta,
    isAdmin,
  } = useVentasList();

  const handleAddVenta = () => {
    router.push('/ventas/create');
  };

  // Calcular estadísticas simples (pueden moverse al hook si son complejas)
  const totalMontoVentas = useMemo(() => {
    return ventas.reduce((sum, venta) => sum + parseFloat(venta.total || '0'), 0);
  }, [ventas]);

  // --- Lógica para Date Pickers (similar a Pedidos) ---
  const formatDateDisplay = (dateString: string) => {
    if (!dateString || !/\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return 'Seleccionar fecha';
    }
    return formatDate(dateString); // Usar formatter
  };

  const getPickerDateValue = (dateString: string): Date => {
    if (dateString && /\d{4}-\d{2}-\d{2}/.test(dateString)) {
      try {
          const [year, month, day] = dateString.split('-').map(Number);
          return new Date(year, month - 1, day);
      } catch (e) { return new Date(); }
    }
    return new Date();
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate: Date | undefined, filterKey: 'fecha_inicio' | 'fecha_fin') => {
    const setShowPicker = filterKey === 'fecha_inicio' ? setShowStartDatePicker : setShowEndDatePicker;
    if (Platform.OS === 'ios') {
      setShowPicker(false);
    } else {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleFilterChange(filterKey, formattedDate);
    }
  };
  // --- Fin Lógica Date Pickers ---

  return (
    <ScreenContainer 
      title="Ventas"
      scrollable={false}
      isLoading={isLoading && ventas.length === 0} // Mostrar carga inicial
      error={error}
    >
      <Stack.Screen options={{ title: 'Ventas', headerShown: true }} />

      <ThemedView style={styles.container}>
        {/* Filtros Colapsables */}
        <Collapsible title="Filtros de Búsqueda">
          <ThemedView style={FilterStyles.container}>
            {/* Filtro Fecha Desde */}
            <View style={FilterStyles.row}>
              <ThemedText style={FilterStyles.label}>Fecha Desde:</ThemedText>
              <TouchableOpacity
                style={FilterStyles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <ThemedText style={{ color: isDark ? '#FFF' : '#000' }}>
                  {formatDateDisplay(filters.fecha_inicio)}
                </ThemedText>
                <IconSymbol name="calendar" size={20} color={Colors[colorScheme].icon} />
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={getPickerDateValue(filters.fecha_inicio)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => onDateChange(e, d, 'fecha_inicio')}
                />
              )}
            </View>

            {/* Filtro Fecha Hasta */}
            <View style={FilterStyles.row}>
              <ThemedText style={FilterStyles.label}>Fecha Hasta:</ThemedText>
              <TouchableOpacity
                style={FilterStyles.dateInput}
                onPress={() => setShowEndDatePicker(true)}
              >
                 <ThemedText style={{ color: isDark ? '#FFF' : '#000' }}>
                   {formatDateDisplay(filters.fecha_fin)}
                 </ThemedText>
                <IconSymbol name="calendar" size={20} color={Colors[colorScheme].icon} />
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={getPickerDateValue(filters.fecha_fin)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => onDateChange(e, d, 'fecha_fin')}
                  minimumDate={filters.fecha_inicio ? getPickerDateValue(filters.fecha_inicio) : undefined}
                />
              )}
            </View>

            {/* Filtro Estado de Pago */}
            <View style={styles.filterRow}>
               <ThemedText style={styles.filterLabel}>Estado de Pago:</ThemedText>
               <View style={[styles.pickerContainer, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }]}>
                 <Picker
                   selectedValue={filters.estado_pago}
                   onValueChange={(itemValue) => handleFilterChange('estado_pago', itemValue)}
                   style={{ color: isDark ? '#FFF' : '#000' }}
                 >
                   <Picker.Item label="Todos" value="" />
                   <Picker.Item label="Pagado" value="pagado" />
                   <Picker.Item label="Parcial" value="parcial" />
                   <Picker.Item label="Pendiente" value="pendiente" />
                 </Picker>
               </View>
            </View>

            {/* Botones de Acción Filtros */}
            <View style={FilterStyles.actions}>
              <Button title="Limpiar" onPress={clearFilters} color={Colors.danger} disabled={isLoading}/>
              <Button title="Aplicar" onPress={applyFilters} color={Colors.primary} disabled={isLoading}/>
            </View>
          </ThemedView>
        </Collapsible>

        {/* Resumen */} 
        <ThemedView style={[SummaryStyles.container, SummaryStyles.primary]}>
          <ThemedView style={SummaryStyles.row}>
            <ThemedText style={SummaryStyles.label}>Total Ventas:</ThemedText>
            <ThemedText style={SummaryStyles.value}>
              {isLoading ? '...' : pagination.totalItems}
            </ThemedText>
          </ThemedView>
           <ThemedView style={SummaryStyles.row}>
            <ThemedText style={SummaryStyles.label}>Monto Total:</ThemedText>
            <ThemedText style={SummaryStyles.value}>
              {isLoading ? '...' : formatCurrency(totalMontoVentas)}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Lista de tarjetas */} 
        <EnhancedCardList
          data={ventas}
          isLoading={isLoading}
          error={error}
          baseRoute="/ventas"
          pagination={pagination} // Pasar pagination completo
          sorting={{
            sortColumn: pagination.sortColumn,
            sortOrder: pagination.sortOrder,
            onSort: pagination.onSort,
          }}
          // Searching prop no disponible directamente aquí, se maneja con filtro general
          actions={{ 
            onView: true, 
            onEdit: true, // O basado en permisos
            onDelete: true // O basado en permisos 
          }}
          deleteOptions={{
            title: 'Eliminar Venta',
            message: '¿Está seguro que desea eliminar esta venta? Los pagos asociados también podrían verse afectados.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteVenta(Number(id)),
          }}
          emptyMessage="No hay ventas disponibles" 
          onRefresh={refresh}
          renderCard={(venta) => (
            <View style={CardStyles.content}>
              <View style={CardStyles.header}>
                <ThemedText style={CardStyles.title}>Venta #{venta.id} por {venta.vendedor?.username} en {venta.almacen?.nombre}</ThemedText>
                <View style={styles.badgeContainer}>
                  <ThemedView style={[BadgeStyles.base, 
                    venta.estado_pago === 'pagado' ? BadgeStyles.pagado : 
                    venta.estado_pago === 'parcial' ? BadgeStyles.parcial : 
                    BadgeStyles.pendiente]}>
                    <ThemedText style={[BadgeStyles.text,
                      venta.estado_pago === 'pagado' ? BadgeStyles.pagadoText : 
                      venta.estado_pago === 'parcial' ? BadgeStyles.parcialText : 
                      BadgeStyles.pendienteText]}>
                      {venta.estado_pago === 'pagado' ? 'Pagado' : 
                       venta.estado_pago === 'parcial' ? 'Parcial' : 'Pendiente'}
                    </ThemedText>
                  </ThemedView>
                </View>
              </View>
              
              <View style={CardStyles.details}>
                <View style={CardStyles.detailRow}>
                  <IconSymbol name="calendar" size={16} color={Colors.primary} />
                  <ThemedText style={CardStyles.detailText}>
                    Fecha: {venta.fecha ? formatDate(venta.fecha) : 'N/A'}
                  </ThemedText>
                </View>
                
                <View style={CardStyles.detailRow}>
                  <IconSymbol name="person.fill" size={16} color={Colors.primary} />
                  <ThemedText style={CardStyles.detailText}>
                    Cliente: {venta.cliente?.nombre || 'N/A'}
                  </ThemedText>
                </View>
                
                <View style={CardStyles.detailRow}>
                  <IconSymbol name="tag.fill" size={16} color={Colors.primary} />
                  <ThemedText style={CardStyles.detailText}>
                    Total: {venta.total ? formatCurrency(parseFloat(venta.total)) : '$0.00'}
                  </ThemedText>
                </View>
                
                <View style={CardStyles.detailRow}>
                  <IconSymbol name="shippingbox.fill" size={16} color={Colors.primary} />
                  <ThemedText style={CardStyles.detailText} numberOfLines={2}>
                    Productos: {venta.detalles?.length || 0}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
          numColumns={1}
        />

        <FloatingActionButton
          icon="plus.circle.fill"
          onPress={handleAddVenta}
        />
      </ThemedView>
    </ScreenContainer>
  );
}

// Estilos simplificados - la mayoría migrados a Theme.ts centralizado
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    overflow: 'hidden',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
});