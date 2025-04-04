// app/ventas/edit/[id].tsx - Versión optimizada
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useVentas } from '@/hooks/crud/useVentas';
import { formatCurrency } from '@/utils/formatters';
import { Venta } from '@/models';
import { ProductPicker } from '@/components/ProductPicker';
import { DetalleVentaRow } from '@/components/DetalleVentaRow';

export default function EditVentaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Estados locales para controlar visibilidad
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Usar el hook de ventas
  const {
    form,
    validationRules,
    isLoading,
    venta,
    clientes,
    almacenes,
    presentacionesFiltradas,
    loadVentaForEdit,
    updateVenta,
    calcularTotal,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    handleAlmacenChange,
  } = useVentas();
  
  // Control para cargar la venta una sola vez
  const ventaCargada = useRef(false);
  
  // Cargar datos de la venta al iniciar (una sola vez)
  useEffect(() => {
    // Función para cargar la venta
    const cargarVenta = async () => {
      // Evitar múltiples cargas
      if (!id || ventaCargada.current) return;
      
      console.log(`Iniciando carga de venta #${id} para edición...`);
      
      // Establecer flag para evitar cargas duplicadas
      ventaCargada.current = true;
      
      try {
        const ventaData = await loadVentaForEdit(parseInt(id));
        if (ventaData) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error al cargar venta:', error);
        Alert.alert(
          'Error', 
          'No se pudo cargar los datos de la venta. Intente nuevamente.'
        );
      }
    };
    
    cargarVenta();
    
    // Limpieza al desmontar el componente
    return () => {
      ventaCargada.current = false;
    };
  }, [id]); // Solo id como dependencia
  
  // Manejar el cambio de fecha
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      form.handleChange('fecha', formattedDate);
    }
  };
  
  // Manejar la selección de producto
  const handleProductSelect = (presentacionId: string, cantidad: string, precio: string) => {
    agregarProducto(presentacionId, cantidad, precio);
    setShowProductModal(false);
  };
  
  // Manejar la actualización de la venta
  const handleUpdate = async () => {
    if (!id) return;
    await updateVenta();
  };
  
  // Verificar estado de carga inicial
  if (!isInitialized) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Venta',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? Colors.dark.tint : Colors.light.tint} />
          <ThemedText style={styles.loadingText}>Cargando datos de la venta...</ThemedText>
        </ThemedView>
      </>
    );
  }
  
  // Fecha actual formateada para mostrar
  const currentDate = form.formData.fecha 
    ? new Date(form.formData.fecha).toLocaleDateString() 
    : new Date().toLocaleDateString();
  
  // Calcular el total de la venta
  const total = calcularTotal();
  
  return (
    <>
      <Stack.Screen options={{ 
        title: `Editar Venta #${id}`,
        headerShown: true 
      }} />
      
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Editar Venta #{id}</ThemedText>
        
        {/* Sección de datos generales */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Datos Generales</ThemedText>
          
          {/* Selector de Cliente */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Cliente *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
              form.errors.cliente_id && styles.inputError
            ]}>
              <Picker
                selectedValue={form.formData.cliente_id}
                onValueChange={(value) => form.handleChange('cliente_id', value)}
                style={[styles.picker, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                enabled={!isLoading}
              >
                <Picker.Item label="Seleccionar cliente..." value="" />
                {Array.isArray(clientes) ? clientes.map(cliente => (
                  <Picker.Item 
                    key={cliente.id} 
                    label={cliente.nombre} 
                    value={cliente.id.toString()} 
                  />
                )) : (
                  <Picker.Item label="Cargando clientes..." value="" />
                )}
              </Picker>
            </View>
            {form.errors.cliente_id && (
              <ThemedText style={styles.errorText}>{form.errors.cliente_id}</ThemedText>
            )}
          </ThemedView>
          
          {/* Selector de Almacén */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Almacén *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
              form.errors.almacen_id && styles.inputError
            ]}>
              <Picker
                selectedValue={form.formData.almacen_id}
                onValueChange={(value) => handleAlmacenChange(value)}
                style={[styles.picker, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                enabled={!isLoading}
              >
                <Picker.Item label="Seleccionar almacén..." value="" />
                {Array.isArray(almacenes) ? almacenes.map(almacen => (
                  <Picker.Item 
                    key={almacen.id} 
                    label={almacen.nombre} 
                    value={almacen.id.toString()} 
                  />
                )) : (
                  <Picker.Item label="Cargando almacenes..." value="" />
                )}
              </Picker>
            </View>
            {form.errors.almacen_id && (
              <ThemedText style={styles.errorText}>{form.errors.almacen_id}</ThemedText>
            )}
          </ThemedView>
          
          {/* Fecha de Venta */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Fecha *</ThemedText>
            <TouchableOpacity
              style={[
                styles.dateSelector,
                { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
                form.errors.fecha && styles.inputError
              ]}
              onPress={() => setShowDatePicker(true)}
              disabled={isLoading}
            >
              <ThemedText>{currentDate}</ThemedText>
              <IconSymbol name="calendar" size={20} color={isDark ? '#FFFFFF' : '#666666'} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.formData.fecha ? new Date(form.formData.fecha) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            {form.errors.fecha && (
              <ThemedText style={styles.errorText}>{form.errors.fecha}</ThemedText>
            )}
          </ThemedView>
          
          {/* Tipo de Pago */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Tipo de Pago *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={form.formData.tipo_pago}
                onValueChange={(value) => form.handleChange('tipo_pago', value)}
                style={[styles.picker, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                enabled={!isLoading}
              >
                <Picker.Item label="Contado" value="contado" />
                <Picker.Item label="Crédito" value="credito" />
              </Picker>
            </View>
          </ThemedView>
          
          {/* Consumo Diario */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Consumo Diario (KG)</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: isDark ? Colors.dark.text : Colors.light.text },
                form.errors.consumo_diario_kg && styles.inputError
              ]}
              placeholder="Ej.: 25"
              placeholderTextColor="#9BA1A6"
              keyboardType="decimal-pad"
              value={form.formData.consumo_diario_kg}
              onChangeText={(value) => form.handleChange('consumo_diario_kg', value)}
              editable={!isLoading}
            />
            {form.errors.consumo_diario_kg && (
              <ThemedText style={styles.errorText}>{form.errors.consumo_diario_kg}</ThemedText>
            )}
          </ThemedView>
          
          {/* Estado de Pago (solo mostrar, no editar) */}
          {venta && (
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Estado de Pago</ThemedText>
              <ThemedView style={[
                styles.estadoContainer,
                { backgroundColor: getEstadoColor(venta.estado_pago, 0.1) }
              ]}>
                <ThemedText style={[
                  styles.estadoText,
                  { color: getEstadoColor(venta.estado_pago, 1) }
                ]}>
                  {getEstadoText(venta.estado_pago)}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>
        
        {/* Sección de productos */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeaderRow}>
            <ThemedText type="subtitle">Productos</ThemedText>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                if (!form.formData.almacen_id) {
                  Alert.alert('Error', 'Selecciona un almacén antes de agregar productos');
                  return;
                }
                setShowProductModal(true);
              }}
              disabled={isLoading || !form.formData.almacen_id}
            >
              <IconSymbol name="plus.circle" size={16} color="#FFFFFF" />
              <ThemedText style={styles.addButtonText}>Agregar</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          {/* Lista de productos agregados */}
          {form.formData.detalles.length === 0 ? (
            <ThemedView style={styles.emptyProducts}>
              <IconSymbol name="cart" size={40} color="#9BA1A6" />
              <ThemedText style={styles.emptyText}>
                No hay productos agregados
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Agrega productos usando el botón "Agregar"
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={styles.productsList}>
              {form.formData.detalles.map((detalle, index) => (
                <DetalleVentaRow
                  key={`${detalle.presentacion_id}_${index}`}
                  detalle={detalle}
                  index={index}
                  presentaciones={presentacionesFiltradas}
                  onUpdate={actualizarProducto}
                  onDelete={eliminarProducto}
                  disabled={isLoading}
                />
              ))}
              
              <ThemedView style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Total:</ThemedText>
                <ThemedText style={styles.totalValue}>{formatCurrency(total)}</ThemedText>
              </ThemedView>
            </ThemedView>
          )}
          
          {form.errors.detalles && (
            <ThemedText style={styles.errorText}>{form.errors.detalles}</ThemedText>
          )}
        </ThemedView>
        
        {/* Botones de acción */}
        <ThemedView style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.buttonCancel
            ]}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <ThemedText style={styles.buttonCancelText}>Cancelar</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.buttonSave, 
              isLoading && styles.buttonDisabled
            ]}
            onPress={handleUpdate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <IconSymbol name="checkmark.circle" size={20} color="#FFFFFF" />
                <ThemedText style={styles.buttonSaveText}>Actualizar</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
      
      {/* Modal para seleccionar productos */}
      {showProductModal && (
        <ProductPicker
          visible={showProductModal}
          onClose={() => setShowProductModal(false)}
          onSelectProduct={handleProductSelect}
          presentaciones={presentacionesFiltradas}
      isLoading={isLoading}
        />
      )}
    </>
  );
}

// Función para obtener el color según el estado de pago
const getEstadoColor = (estado: string, opacity: number = 1): string => {
  const colors = {
    'pagado': `rgba(76, 175, 80, ${opacity})`,
    'parcial': `rgba(255, 193, 7, ${opacity})`,
    'pendiente': `rgba(244, 67, 54, ${opacity})`
  };
  
  return colors[estado as keyof typeof colors] || `rgba(117, 117, 117, ${opacity})`;
};

// Función para obtener el texto del estado de pago
const getEstadoText = (estado: string): string => {
  switch (estado) {
    case 'pagado': return 'Pagado';
    case 'parcial': return 'Pago Parcial';
    case 'pendiente': return 'Pendiente';
    default: return estado.charAt(0).toUpperCase() + estado.slice(1);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  title: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 12,
  },
  inputError: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 4,
  },
  estadoContainer: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  estadoText: {
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#0a7ea4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9BA1A6',
    marginTop: 4,
    textAlign: 'center',
  },
  productsList: {
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
    paddingTop: 12,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginVertical: 16,
  },
  buttonCancel: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  buttonCancelText: {
    color: '#424242',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSave: {
    flex: 2,
    backgroundColor: '#0a7ea4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  buttonSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
});