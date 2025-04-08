// app/ventas/create.tsx - Versión optimizada para reducir peticiones API
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, TextInput as RNTextInput, Alert, ActivityIndicator, Platform, Modal, Image, FlatList, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ClienteFormModal } from '@/components/ClienteModal';
import { Cliente } from '@/models';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useVentas } from '@/hooks/crud/useVentas';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ProductPicker } from '@/components/ProductPicker';
import { DetalleVentaRow } from '@/components/DetalleVentaRow';

export default function CreateVentaScreen() {
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const themeColors = Colors[colorScheme as 'light' | 'dark'];
  const { user } = useAuth();
  
  // Estados locales para controlar visibilidad y búsqueda
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);
  const [showClienteFormModal, setShowClienteFormModal] = useState(false);
  
  // Referencias para prevenir cargas duplicadas
  const optionsLoaded = useRef(false);
  const almacenIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  
  // Usar el hook de ventas
  const {
    form,
    validationRules,
    isLoading,
    isLoadingOptions,
    isLoadingProductos,
    clientes,
    almacenes,
    presentacionesFiltradas,
    loadOptions,
    createVenta,
    calcularTotal,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    handleAlmacenChange,
    setClientes,
  } = useVentas();
  
  // Manejar cuando se crea un nuevo cliente
  const handleClienteCreated = useCallback((cliente: Cliente) => {
    // Verificar si clientes y setClientes existen
    if (!setClientes) {
      // Fallback: actualizar solo clientesFiltrados y seleccionar el cliente
      setClientesFiltrados(prev => [cliente, ...prev]);
      form.handleChange('cliente_id', cliente.id.toString());
      setClienteSearch(cliente.nombre);
      setShowClientesDropdown(false);
      return;
    }
    
    // Actualizar la lista de clientes con el nuevo cliente al inicio
    if (Array.isArray(clientes)) {
      setClientes([cliente, ...clientes]);
    } else {
      setClientes([cliente]);
    }
    
    // Seleccionar automáticamente el cliente recién creado
    form.handleChange('cliente_id', cliente.id.toString());
    setClienteSearch(cliente.nombre);
    setShowClientesDropdown(false);
  }, [clientes, form, setClientes]);

  // Efecto para cargar datos iniciales (optimizado)
  useEffect(() => {
    // Evitar cargas duplicadas usando una referencia
    if (optionsLoaded.current || isLoadingRef.current) {
      return;
    }
  
    // Marcar como cargando para evitar llamadas duplicadas
    isLoadingRef.current = true;
    
    // Cargar opciones y configurar almacén inicial
    const initializeData = async () => {
      try {
        // Cargar opciones
        const { almacenes } = await loadOptions();
        
        // Verificar si el usuario tiene un almacén asignado
        if (user?.almacen_id) {
          const userAlmacenIdStr = user.almacen_id.toString();
          
          // Verificar si el almacén existe en la lista de almacenes
          const userAlmacen = almacenes.find(a => a.id.toString() === userAlmacenIdStr);
          
          if (userAlmacen) {
            // Actualizar el formulario directamente
            form.handleChange('almacen_id', userAlmacenIdStr);
            
            // Cargar presentaciones para este almacén
            await handleAlmacenChange(userAlmacenIdStr);
          } else if (almacenes.length > 0) {
            // Si no hay coincidencia, usar el primer almacén disponible
            const firstAlmacenId = almacenes[0].id.toString();
            form.handleChange('almacen_id', firstAlmacenId);
            await handleAlmacenChange(firstAlmacenId);
          }
        } else if (almacenes.length > 0) {
          // Si el usuario no tiene almacén, usar el primer almacén disponible
          const firstAlmacenId = almacenes[0].id.toString();
          form.handleChange('almacen_id', firstAlmacenId);
          await handleAlmacenChange(firstAlmacenId);
        }
        
        // Marcar como cargado
        optionsLoaded.current = true;
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos iniciales');
      } finally {
        isLoadingRef.current = false;
      }
    };
  
    initializeData();
  }, [loadOptions, handleAlmacenChange, form, user]);
  
  // Manejar cambio de almacén (interceptado para evitar cargas innecesarias)
  const handleAlmacenChangeOptimized = useCallback((almacenId: string) => {
    // Evitar llamadas duplicadas si es el mismo almacén
    if (almacenIdRef.current === almacenId) {
      return;
    }
    
    // Actualizar la referencia
    almacenIdRef.current = almacenId;
    
    // Llamar al handleAlmacenChange original
    handleAlmacenChange(almacenId);
  }, [handleAlmacenChange]);
  
  // Filtrar clientes basado en el texto de búsqueda (memoizado)
  const filtrarClientes = useCallback((texto: string) => {
    setClienteSearch(texto);
    if (!texto.trim()) {
      setClientesFiltrados([]);
      setShowClientesDropdown(false);
      return;
    }
    
    const filtrados = clientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(texto.toLowerCase())
    );
    
    setClientesFiltrados(filtrados);
    setShowClientesDropdown(true);
  }, [clientes]);

  // Seleccionar cliente desde los resultados de búsqueda
  const seleccionarCliente = useCallback((cliente: any) => {
    form.handleChange('cliente_id', cliente.id.toString());
    setClienteSearch(cliente.nombre);
    setShowClientesDropdown(false);
  }, [form]);
  
  // Manejar el cambio de fecha
  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      form.handleChange('fecha', formattedDate);
    }
  }, [form]);
  
  // Manejar la selección de producto
  const handleProductSelect = useCallback((presentacionId: string, cantidad: string, precio: string) => {
    agregarProducto(presentacionId, cantidad, precio);
    setShowProductModal(false);
  }, [agregarProducto]);
  
  // Actualizar clienteSearch cuando cambia el cliente seleccionado
  useEffect(() => {
    // Si el cliente está seleccionado pero no hay texto de búsqueda, actualizar el texto
    if (form.formData.cliente_id && !clienteSearch) {
      const clienteSeleccionado = clientes.find(c => c.id.toString() === form.formData.cliente_id);
      if (clienteSeleccionado) {
        setClienteSearch(clienteSeleccionado.nombre);
      }
    }
  }, [form.formData.cliente_id, clientes, clienteSearch]);
  
  // Verificar estado de carga
  if (isLoadingOptions) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Nueva Venta',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors?.tint} />
          <ThemedText style={styles.loadingText}>Cargando datos...</ThemedText>
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
        title: 'Nueva Venta',
        headerShown: true 
      }} />
      
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Registrar Nueva Venta</ThemedText>
        
        {/* Sección de datos secundarios (compacta) */}
        <ThemedView style={styles.secondarySection}>
          <ThemedView style={styles.compactRow}>
            {/* Fecha de Venta - Compacto */}
            <ThemedView style={[styles.compactField, styles.dateField]}>
              <ThemedText style={styles.smallLabel}>Fecha</ThemedText>
              <TouchableOpacity
                style={[
                  styles.dateSelector,
                  { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
                  form.errors.fecha && styles.inputError
                ]}
                onPress={() => setShowDatePicker(true)}
                disabled={isLoading}
              >
                <ThemedText style={styles.smallText}>{currentDate}</ThemedText>
                <IconSymbol name="calendar" size={16} color={isDark ? '#FFFFFF' : '#666666'} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={form.formData.fecha ? new Date(form.formData.fecha) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </ThemedView>
            {/* Consumo Diario - Compacto */}
            <ThemedView style={[styles.compactField]}>
              <ThemedText style={styles.smallLabel}>Consumo/Dia (KG)</ThemedText>
              <RNTextInput
                style={[
                  styles.uniformInput,
                  { color: themeColors?.text },
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
          </ThemedView>
          
          <ThemedView style={styles.compactRow}>
            {/* Almacén - Compacto y Preseleccionado */}
            <ThemedView style={[styles.compactField, { flex: 1 }]}>
              <ThemedText>Almacén</ThemedText>
              <View style={[
                styles.uniformField,
                { backgroundColor: isDark ? '#2C2C2E' : '#F9F9F9' },
                form.errors.almacen_id && styles.inputError
              ]}>
                <Picker
                  selectedValue={form.formData.almacen_id}
                  onValueChange={handleAlmacenChangeOptimized}  // Usar la versión optimizada
                  style={[styles.uniformPicker, { color: themeColors?.text }]}
                  enabled={!isLoading && user?.rol === 'admin'} // Solo editable para administradores
                  dropdownIconColor={isDark ? '#FFFFFF' : '#666666'}
                >
                  {Array.isArray(almacenes) && almacenes.length > 0 ? almacenes.map(almacen => (
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
            
            {/* Tipo de Pago - Compacto */}
            <ThemedView style={[styles.tipoField]}>
              <ThemedText>Tipo de Pago</ThemedText>
              <View style={[
                styles.uniformField,
                { backgroundColor: isDark ? '#2C2C2E' : '#F9F9F9' }
              ]}>
                <Picker
                  selectedValue={form.formData.tipo_pago}
                  onValueChange={(value) => form.handleChange('tipo_pago', value)}
                  style={[styles.uniformPicker, { color: themeColors?.text }]}
                  enabled={!isLoading}
                  dropdownIconColor={isDark ? '#FFFFFF' : '#666666'}
                >
                  <Picker.Item label="Contado" value="contado" />
                  <Picker.Item label="Crédito" value="credito" />
                </Picker>
              </View>
            </ThemedView>
            
          </ThemedView>
        </ThemedView>
        {/* Sección de cliente con buscador */}
        <ThemedView style={styles.clienteSection}>
          <ThemedView style={styles.clienteSectionHeader}>
            <ThemedText type="subtitle" style={styles.primaryLabel}>
              Cliente
            </ThemedText>
            <TouchableOpacity
              style={styles.newClienteButton}
              onPress={() => setShowClienteFormModal(true)}
            >
              <IconSymbol name="plus.circle" size={16} color="#FFFFFF" />
              <ThemedText style={styles.newClienteButtonText}>Nuevo Cliente</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          {form.formData.cliente_id && clienteSearch ? (
            <View style={styles.selectedClienteContainer}>
              <View style={styles.selectedClienteInfo}>
                <ThemedText style={styles.selectedClienteNombre}>
                  {clienteSearch}
                </ThemedText>
                <ThemedText style={styles.selectedClienteId}>
                  ID: {form.formData.cliente_id}
                </ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.changeClienteButton}
                onPress={() => {
                  setShowClientesDropdown(true);
                }}
              >
                <ThemedText style={styles.changeClienteText}>Cambiar</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                  form.errors.cliente_id && styles.inputError
                ]}
                placeholder="Buscar cliente por nombre..."
                placeholderTextColor="#9BA1A6"
                value={clienteSearch}
                onChangeText={filtrarClientes}
                onFocus={() => {
                  if (clienteSearch.length > 0) {
                    filtrarClientes(clienteSearch);
                  }
                }}
                editable={!isLoading}
              />
              {clienteSearch.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={() => {
                    setClienteSearch('');
                    form.handleChange('cliente_id', '');
                    setShowClientesDropdown(false);
                  }}
                >
                  <IconSymbol name="xmark.circle.fill" size={20} color="#9BA1A6" />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {showClientesDropdown && clientesFiltrados.length > 0 && (
            <View style={[
              styles.dropdownContainer, 
              { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }
            ]}>
              <ScrollView style={styles.clientesList} nestedScrollEnabled={true}>
                {clientesFiltrados.map(cliente => (
                  <TouchableOpacity
                    key={cliente.id}
                    style={[
                      styles.clienteItem,
                      { backgroundColor: form.formData.cliente_id === cliente.id.toString() ? '#e6f7ff' : 'transparent' }
                    ]}
                    onPress={() => seleccionarCliente(cliente)}
                  >
                    <ThemedText style={styles.clienteNombre}>{cliente.nombre}</ThemedText>
                    {cliente.telefono && (
                      <ThemedText style={styles.clienteInfo}>{cliente.telefono}</ThemedText>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {showClientesDropdown && clientesFiltrados.length === 0 && clienteSearch.length > 0 && (
            <View style={[
              styles.dropdownContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }
            ]}>
              <ThemedView style={styles.noResultsContainer}>
                <ThemedText style={styles.emptyResults}>
                  No se encontraron clientes con "{clienteSearch}"
                </ThemedText>
                <TouchableOpacity
                  style={styles.createFromSearchButton}
                  onPress={() => {
                    setShowClientesDropdown(false);
                    setShowClienteFormModal(true);
                  }}
                >
                  <IconSymbol name="plus.circle" size={14} color="#FFFFFF" />
                  <ThemedText style={styles.createFromSearchText}>Crear nuevo cliente</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </View>
          )}
          
          {form.errors.cliente_id && (
            <ThemedText style={styles.errorText}>{form.errors.cliente_id}</ThemedText>
          )}
        </ThemedView>

        {/* Sección de productos (destacada) */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeaderRow}>
            <ThemedText type="subtitle" style={styles.primaryLabel}>Productos</ThemedText>
          </ThemedView>
          
          {/* Botón Agregar centrado */}
          <ThemedView style={styles.centeredButtonContainer}>
            <TouchableOpacity 
              style={[
                styles.addButton,
                (!form.formData.almacen_id || isLoading) && styles.disabledButton
              ]}
              onPress={() => {
                if (!form.formData.almacen_id) {
                  Alert.alert('Error', 'Selecciona un almacén antes de agregar productos');
                  return;
                }
                
                // Verificar si hay presentaciones filtradas
                if (presentacionesFiltradas.length === 0) {
                  Alert.alert(
                    'Sin productos disponibles', 
                    'No hay productos disponibles en este almacén. ¿Desea intentar cargar productos nuevamente?',
                    [
                      {
                        text: "Cancelar",
                        style: "cancel"
                      },
                      {
                        text: "Reintentar",
                        onPress: () => {
                          if (form.formData.almacen_id) {
                            handleAlmacenChange(form.formData.almacen_id);
                            setTimeout(() => {
                              if (presentacionesFiltradas.length > 0) {
                                setShowProductModal(true);
                              } else {
                                Alert.alert('Sin productos', 'No se encontraron productos para este almacén');
                              }
                            }, 500);
                          }
                        }
                      }
                    ]
                  );
                  return;
                }
                
                setShowProductModal(true);
              }}
              disabled={isLoading || !form.formData.almacen_id}
            >
              <IconSymbol name="plus.circle" size={16} color="#FFFFFF" />
              <ThemedText style={styles.addButtonText}>Agregar Productos</ThemedText>
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
                Agrega productos usando el botón "Agregar Productos"
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
        
        {/* Botón para crear venta */}
        <TouchableOpacity
          style={[
            styles.submitButton, 
            isLoading && styles.submitButtonDisabled
          ]}
          onPress={() => createVenta()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <IconSymbol name="checkmark.circle" size={20} color="#FFFFFF" />
              <ThemedText style={styles.submitButtonText}>Crear Venta</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Modal para crear cliente */}
      <ClienteFormModal
        visible={showClienteFormModal}
        onClose={() => setShowClienteFormModal(false)}
        onClienteCreated={handleClienteCreated}
      />
      
      {/* Modal para seleccionar productos */}
      {showProductModal && (
        <ProductPicker
          visible={showProductModal}
          onClose={() => setShowProductModal(false)}
          onSelectProduct={handleProductSelect}
          presentaciones={presentacionesFiltradas}
          isLoading={isLoadingProductos}
        />
      )}
    </>
  );
}

// Los estilos se mantienen igual que en el archivo original
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
  secondarySection: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  compactField: {
    marginBottom: 8,
    flex: 1,
  },
  dateField: {
    flex: 1,
  },
  tipoField: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
    color: '#666666',
  },
  smallText: {
    fontSize: 14,
  },
  uniformField: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: '#FFFFFF',
  },
  uniformPicker: {
    marginTop: Platform.OS === 'ios' ? 0 : -6,
    marginBottom: Platform.OS === 'ios' ? 0 : -6,
  },
  uniformInput: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    height: 40,
  },
  smallPickerContainer: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  smallPicker: {
    height: 40,
    fontSize: 14,
  },
  smallInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  clienteSection: {
    marginBottom: 24,
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e6f0',
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: '500',
  },
  centeredButtonContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerContainer: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 40,
    fontSize: 14,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  inputError: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 6,
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
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  noImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  almacenInfo: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    padding: 5,
  },
  dropdownContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  clientesList: {
    padding: 8,
  },
  clienteItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  clienteNombre: {
    fontSize: 14,
    fontWeight: '500',
  },
  clienteInfo: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  emptyResults: {
    padding: 16,
    textAlign: 'center',
    color: '#999999',
  },
  selectedClienteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f8ff',
  },
  selectedClienteInfo: {
    flex: 1,
  },
  selectedClienteNombre: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedClienteId: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },
  changeClienteButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  changeClienteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  clienteSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newClienteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  newClienteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noResultsContainer: {
    padding: 12,
    alignItems: 'center',
  },
  createFromSearchButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  createFromSearchText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});              