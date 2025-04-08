// app/ventas/create.tsx - Versión mejorada con UI/UX optimizada
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Stack, router } from 'expo-router';

// Componentes
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ClienteFormModal } from '@/components/ClienteModal';
import { ProductPicker } from '@/components/ProductPicker';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import DateField from '@/components/form/DateField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { DetalleVentaRow } from '@/components/DetalleVentaRow';

// Hooks y servicios
import { useVentas } from '@/hooks/crud/useVentas';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatters';
import { Colors, ScreenStyles, FormStyles, SectionStyles } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Cliente } from '@/models';

export default function CreateVentaScreen() {
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  
  // Estados locales
  const [showProductModal, setShowProductModal] = useState(false);
  const [showClienteFormModal, setShowClienteFormModal] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  
  // Referencias
  const optionsLoaded = React.useRef(false);
  
  // Hook de ventas
  const {
    form,
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
  
  // Cargar datos iniciales
  useEffect(() => {
    if (!optionsLoaded.current) {
      const initializeData = async () => {
        try {
          // Cargar opciones
          const { almacenes } = await loadOptions();
          
          // Preseleccionar almacén del usuario
          if (user?.almacen_id) {
            const userAlmacenIdStr = user.almacen_id.toString();
            form.handleChange('almacen_id', userAlmacenIdStr);
            await handleAlmacenChange(userAlmacenIdStr);
          } else if (almacenes.length > 0) {
            const firstAlmacenId = almacenes[0].id.toString();
            form.handleChange('almacen_id', firstAlmacenId);
            await handleAlmacenChange(firstAlmacenId);
          }
          
          optionsLoaded.current = true;
        } catch (error) {
          console.error('Error al cargar datos iniciales:', error);
          Alert.alert('Error', 'No se pudieron cargar los datos iniciales');
        }
      };
    
      initializeData();
    }
  }, [loadOptions, handleAlmacenChange, form, user]);
  
  // Manejar la creación de un nuevo cliente
  const handleClienteCreated = useCallback((cliente: Cliente) => {
    if (setClientes) {
      setClientes([cliente, ...clientes]);
    }
    
    form.handleChange('cliente_id', cliente.id.toString());
    setClienteSearch(cliente.nombre);
    setShowClienteSelector(false);
  }, [clientes, form, setClientes]);

  // Filtrar clientes
  const filtrarClientes = useCallback((texto: string) => {
    setClienteSearch(texto);
    if (!texto.trim()) {
      setClientesFiltrados([]);
      setShowClienteSelector(false);
      return;
    }
    
    const filtrados = clientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(texto.toLowerCase())
    );
    
    setClientesFiltrados(filtrados);
    setShowClienteSelector(true);
  }, [clientes]);

  // Seleccionar cliente
  const seleccionarCliente = useCallback((cliente: any) => {
    form.handleChange('cliente_id', cliente.id.toString());
    setClienteSearch(cliente.nombre);
    setShowClienteSelector(false);
  }, [form]);
  
  // Manejar la selección de producto
  const handleProductSelect = useCallback((presentacionId: string, cantidad: string, precio: string) => {
    agregarProducto(presentacionId, cantidad, precio);
    setShowProductModal(false);
  }, [agregarProducto]);
  
  // Actualizar clienteSearch cuando cambia el cliente seleccionado
  useEffect(() => {
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
        <Stack.Screen options={{ title: 'Nueva Venta', headerShown: true }} />
        <ThemedView style={ScreenStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText style={ScreenStyles.loadingText}>Cargando datos...</ThemedText>
        </ThemedView>
      </>
    );
  }
  
  // Calcular el total de la venta
  const total = calcularTotal();
  
  return (
    <>
      <Stack.Screen options={{ title: 'Nueva Venta', headerShown: true }} />
      
      <ScrollView style={ScreenStyles.container}>
        <ThemedText type="title" style={ScreenStyles.heading}>Registrar Nueva Venta</ThemedText>
        
        {/* Card principal */}
        <ThemedView style={styles.formCard}>
          {/* Sección de Cliente */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText type="subtitle">Cliente</ThemedText>
              <TouchableOpacity
                style={styles.newClienteButton}
                onPress={() => setShowClienteFormModal(true)}
              >
                <IconSymbol name="plus.circle" size={16} color="#FFFFFF" />
                <ThemedText style={styles.newClienteButtonText}>Nuevo Cliente</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            
            {form.formData.cliente_id ? (
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
                    form.handleChange('cliente_id', '');
                    setClienteSearch('');
                  }}
                >
                  <ThemedText style={styles.changeClienteText}>Cambiar</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <ThemedView style={styles.clienteSearchContainer}>
                <FormField
                  label="Buscar Cliente *"
                  value={clienteSearch}
                  onChangeText={filtrarClientes}
                  placeholder="Ingrese nombre del cliente"
                  error={form.errors.cliente_id}
                  required
                />
                
                {showClienteSelector && clientesFiltrados.length > 0 && (
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
                
                {showClienteSelector && clientesFiltrados.length === 0 && clienteSearch.length > 0 && (
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
                          setShowClienteSelector(false);
                          setShowClienteFormModal(true);
                        }}
                      >
                        <IconSymbol name="plus.circle" size={14} color="#FFFFFF" />
                        <ThemedText style={styles.createFromSearchText}>Crear nuevo cliente</ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  </View>
                )}
              </ThemedView>
            )}
          </ThemedView>
          
          {/* Configuración de Venta */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Detalles</ThemedText>
            
            <ThemedView style={FormStyles.rowContainer}>
              {/* Almacén */}
              <ThemedView style={FormStyles.halfWidth}>
                <FormSelect
                  label="Almacén"
                  value={form.formData.almacen_id}
                  options={almacenes.map(a => ({ label: a.nombre, value: a.id.toString() }))}
                  onChange={handleAlmacenChange}
                  error={form.errors.almacen_id}
                  disabled={!isAdmin}
                  required
                  helperText={!isAdmin ? "Asignado a tu usuario" : undefined}
                />
              </ThemedView>
              
              {/* Tipo de Pago */}
              <ThemedView style={FormStyles.halfWidth}>
                <FormSelect
                  label="Tipo de Pago"
                  value={form.formData.tipo_pago}
                  options={[
                    { label: "Contado", value: "contado" },
                    { label: "Crédito", value: "credito" }
                  ]}
                  onChange={(value) => form.handleChange('tipo_pago', value)}
                  required
                />
              </ThemedView>
            </ThemedView>
            
            <ThemedView style={FormStyles.rowContainer}>
              {/* Fecha */}
              <ThemedView style={FormStyles.halfWidth}>
                <DateField
                  label="Fecha"
                  value={form.formData.fecha}
                  onChange={(value) => form.handleChange('fecha', value)}
                  error={form.errors.fecha}
                  required
                />
              </ThemedView>
              
              {/* Consumo Diario */}
              <ThemedView style={FormStyles.halfWidth}>
                <FormField
                  label="Consumo Diario (kg)"
                  value={form.formData.consumo_diario_kg}
                  onChangeText={(value) => form.handleChange('consumo_diario_kg', value)}
                  placeholder="Ej.: 25"
                  keyboardType="numeric"
                  error={form.errors.consumo_diario_kg}
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>
          
          {/* Productos */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText type="subtitle">Productos</ThemedText>
              <TouchableOpacity 
                style={[
                  styles.addProductButton,
                  (!form.formData.almacen_id || isLoading) && styles.disabledButton
                ]}
                onPress={() => {
                  if (!form.formData.almacen_id) {
                    Alert.alert('Error', 'Selecciona un almacén antes de agregar productos');
                    return;
                  }
                  
                  if (presentacionesFiltradas.length === 0) {
                    Alert.alert(
                      'Sin productos disponibles', 
                      'No hay productos disponibles en este almacén. ¿Desea intentar cargar productos nuevamente?',
                      [
                        { text: "Cancelar", style: "cancel" },
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
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <ThemedText style={styles.addProductButtonText}>Agregar Producto</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            
            {isLoadingProductos ? (
              <ThemedView style={styles.loadingProducts}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <ThemedText>Cargando productos disponibles...</ThemedText>
              </ThemedView>
            ) : (
              <>
                {form.formData.detalles.length === 0 ? (
                  <ThemedView style={styles.emptyProducts}>
                    <IconSymbol name="cart" size={40} color="#9BA1A6" />
                    <ThemedText style={styles.emptyText}>
                      No hay productos agregados
                    </ThemedText>
                    <ThemedText style={styles.emptySubtext}>
                      Agrega productos usando el botón "Agregar Producto"
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
                  </ThemedView>
                )}
                
                {form.errors.detalles && (
                  <ThemedText style={FormStyles.errorText}>{form.errors.detalles}</ThemedText>
                )}
              </>
            )}
          </ThemedView>
          
          {/* Resumen y Total */}
          <ThemedView style={styles.totalSection}>
            <ThemedText type="subtitle">Resumen</ThemedText>
            <ThemedView style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Total:</ThemedText>
              <ThemedText style={styles.totalValue}>{formatCurrency(total)}</ThemedText>
            </ThemedView>
          </ThemedView>
          
          {/* Botones de acción */}
          <ActionButtons
            onSave={() => createVenta()}
            onCancel={() => router.back()}
            isSubmitting={isLoading}
            saveDisabled={form.formData.detalles.length === 0}
            saveText="Crear Venta"
          />
        </ThemedView>
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

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray2,
  },
  clienteSearchContainer: {
    position: 'relative',
  },
  dropdownContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.lightGray2,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  clientesList: {
    padding: 8,
    maxHeight: 150,
  },
  clienteItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray2,
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
    textAlign: 'center',
    color: '#999999',
    paddingVertical: 8,
  },
  noResultsContainer: {
    padding: 12,
    alignItems: 'center',
  },
  createFromSearchButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
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
  selectedClienteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.primary + '30', // 30% opacity
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary + '08', // 8% opacity
  },
  selectedClienteInfo: {
    flex: 1,
  },
  selectedClienteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  selectedClienteId: {
    fontSize: 13,
    color: '#777777',
    marginTop: 2,
  },
  changeClienteButton: {
    backgroundColor: Colors.danger,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  changeClienteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  newClienteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  newClienteButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  addProductButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  productsList: {
    gap: 12,
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
    marginTop: 10,
  },
  loadingProducts: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    marginTop: 10,
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
  totalSection: {
    backgroundColor: Colors.lightGray1,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});