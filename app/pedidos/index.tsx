// app/pedidos/index.tsx - Refactorizado con tarjetas
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { StyleSheet, Alert, View, TextInput, Button, TouchableOpacity, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { usePedidosList } from '@/hooks/crud/usePedidosList';
import { Collapsible } from '@/components/Collapsible';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function PedidosScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { user } = useAuth(); // No necesitamos user aquí directamente ahora

  // Estados locales para la visibilidad de los DatePickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Obtener solo los elementos necesarios del hook
  const {
    pedidos,
    isLoading,
    error,
    columns,
    pagination,
    refresh,
    deletePedido,
    // Filtros de fecha
    dateFilters,
    handleDateFilterChange,
    applyDateFilters,
    clearDateFilters,
    // Ya no necesitamos isAdmin aquí directamente
    // isAdmin,
    // Ya no necesitamos las listas de filtros
    // clientesFiltro,
    // vendedoresFiltro,
    // almacenesFiltro,
  } = usePedidosList();

  // Ya no necesitamos cargar opciones de filtros
  // useEffect(() => { ... }, []);
  
  const handleAddPedido = () => {
    router.push('/pedidos/create');
  };

  const handleDelete = useCallback(async (id: string | number) => {
    const success = await deletePedido(Number(id));
    return success;
  }, [deletePedido]);

  const tableActions = useMemo(() => ({
    onView: true,
    onEdit: true,
    onDelete: true
  }), []);

  // Formatear fecha YYYY-MM-DD a DD/MM/YYYY para mostrar
  const formatDateDisplay = (dateString: string) => {
    if (!dateString || !/\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return 'Seleccionar fecha';
    }
    try {
        const [year, month, day] = dateString.split('-');
        // Validar que las partes sean números válidos si es necesario
        return `${day}/${month}/${year}`;
    } catch (e) {
        return 'Fecha inválida';
    }
  };

  // Función para crear el objeto Date inicial para el picker
  const getPickerDateValue = (dateString: string): Date => {
    if (dateString && /\d{4}-\d{2}-\d{2}/.test(dateString)) {
        try {
            const [year, month, day] = dateString.split('-').map(Number);
            // ¡Importante! month es 0-indexado en el constructor de Date
            return new Date(year, month - 1, day);
        } catch (e) {
            // Fallback a hoy si hay error
            return new Date();
        }
    } 
    // Default a hoy si no hay fecha válida
    return new Date(); 
  };

  // Manejador genérico para cambios en DateTimePicker
  const onDateChange = (event: DateTimePickerEvent, selectedDate: Date | undefined, filterKey: keyof typeof dateFilters) => {
    // Ocultar picker (en Android se oculta solo, en iOS no)
    if (Platform.OS === 'ios') {
       if (filterKey === 'fechaInicio') setShowStartDatePicker(false);
       else setShowEndDatePicker(false);
    } else {
       // En Android, ocultar siempre después de una acción (set o dismiss)
       setShowStartDatePicker(false);
       setShowEndDatePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      const year = selectedDate.getUTCFullYear();
      const month = (selectedDate.getUTCMonth() + 1).toString().padStart(2, '0'); 
      const day = selectedDate.getUTCDate().toString().padStart(2, '0'); 
      const formattedDate = `${year}-${month}-${day}`;

      handleDateFilterChange(filterKey, formattedDate);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Proyecciones',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <Collapsible title="Filtrar por Fecha">
          <ThemedView style={styles.filterContainer}>
            {/* Fecha Desde */}
            <View style={styles.filterRow}>
              <ThemedText style={styles.filterLabel}>Fecha Desde:</ThemedText>
              <TouchableOpacity
                style={[styles.input, styles.dateInput]}
                onPress={() => setShowStartDatePicker(true)}
              >
                <ThemedText style={{ color: isDark ? '#FFF' : '#000' }}>
                  {formatDateDisplay(dateFilters.fechaInicio)}
                </ThemedText>
                <IconSymbol name="calendar" size={20} color={Colors[colorScheme].icon} />
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={getPickerDateValue(dateFilters.fechaInicio)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => onDateChange(event, date, 'fechaInicio')}
                />
              )}
            </View>

            {/* Fecha Hasta */}
            <View style={styles.filterRow}>
              <ThemedText style={styles.filterLabel}>Fecha Hasta:</ThemedText>
              <TouchableOpacity
                style={[styles.input, styles.dateInput]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <ThemedText style={{ color: isDark ? '#FFF' : '#000' }}>
                  {formatDateDisplay(dateFilters.fechaFin)}
                </ThemedText>
                <IconSymbol name="calendar" size={20} color={Colors[colorScheme].icon} />
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={getPickerDateValue(dateFilters.fechaFin)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => onDateChange(event, date, 'fechaFin')}
                  minimumDate={dateFilters.fechaInicio ? getPickerDateValue(dateFilters.fechaInicio) : undefined}
                />
              )}
            </View>

            {/* Eliminar filtros de Vendedor, Almacén y Cliente */}

            {/* Botones de Acción de Filtros */}
            <View style={styles.filterActions}>
              <Button title="Limpiar" onPress={clearDateFilters} color={Colors.danger} />
              <Button title="Aplicar" onPress={applyDateFilters} color={Colors.primary} />
            </View>
          </ThemedView>
        </Collapsible>

        {/* Lista de tarjetas */}
        <EnhancedCardList
          data={pedidos}
          isLoading={isLoading}
          error={error}
          baseRoute="/pedidos"
          pagination={pagination}
          sorting={{
            sortColumn: pagination.sortColumn,
            sortOrder: pagination.sortOrder,
            onSort: pagination.onSort
          }}
          actions={tableActions}
          deleteOptions={{
            title: 'Eliminar Proyección',
            message: '¿Está seguro que desea eliminar esta proyección? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: handleDelete
          }}
          emptyMessage="No hay proyecciones disponibles"
          onRefresh={refresh}
          renderCard={(pedido) => (
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>Pedido #{pedido.id}</ThemedText>
                <View style={styles.badgeContainer}>
                  <ThemedView style={[styles.badge, 
                    pedido.estado === 'entregado' ? styles.entregadoBadge : 
                    pedido.estado === 'confirmado' ? styles.procesoBadge :
                    pedido.estado === 'cancelado'? styles.canceladoBadge :
                    styles.pendienteBadge]}>
                    <ThemedText style={styles.badgeText}>
                      {pedido.estado === 'entregado' ? 'Entregado' : 
                       pedido.estado === 'confirmado' ? 'Confirmado' :
                       pedido.estado === 'programado' ? 'Programado' : 'Cancelado'}
                    </ThemedText>
                  </ThemedView>
                </View>
              </View>
              
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <IconSymbol name="calendar" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Fecha de pedido: {pedido.fecha_creacion ? formatDate(pedido.fecha_creacion) : 'N/A'}
                  </ThemedText>
                </View>

                <View style={styles.detailRow}>
                  <IconSymbol name="calendar" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Fecha de entrega: {pedido.fecha_entrega ? formatDate(pedido.fecha_entrega) : 'N/A'}
                  </ThemedText>
                </View>

                <View style={styles.detailRow}>
                  <IconSymbol name="person.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Cliente: {pedido.cliente?.nombre || 'N/A'}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="tag.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Total: {pedido.total_estimado ? formatCurrency(parseFloat(pedido.total_estimado)) : '$0.00'}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="shippingbox.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText} numberOfLines={2}>
                    Productos: {pedido.detalles?.length || 0}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
          numColumns={1}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddPedido} 
        />
      </ThemedView>
    </>
  );
}

// Estilos (mantener los necesarios para filtros de fecha)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#495057',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  // Estilo específico para el botón de fecha
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10, // Ajustar padding si es necesario
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
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
  entregadoBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  procesoBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  pendienteBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
  canceladoBadge: {
    backgroundColor: 'rgba(209, 9, 9, 0.2)',
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