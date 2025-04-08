// app/pedidos/create.tsx - Versión corregida
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// Componentes
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ProductSelector from '@/components/ProductSelector';
import ProductGrid from '@/components/ProductGrid';

// Hooks, servicios y estilos
import { useAuth } from '@/context/AuthContext';
import { useProductos } from '@/hooks/useProductos';
import { usePedido } from '@/hooks/usePedido';
import { clienteApi, almacenApi } from '@/services/api';
import { Colors, ScreenStyles, FormStyles } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function CreatePedidoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const isAdmin = user?.rol?.toLowerCase() === 'admin';
  
  // Estados para modales y selección
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Estado para datos
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  
  // Ref para controlar inicialización
  const isInitialized = React.useRef(false);
  
  // Hooks personalizados
  const {
    presentaciones,
    presentacionesFiltradas,
    isLoading: isLoadingPresentaciones,
    filtrarPorAlmacenId,
    cargarPresentaciones
  } = useProductos({ 
    filtrarPorAlmacen: false,  // Mostrar todas las presentaciones para pedidos
    cargarAlInicio: true 
  });
  
  const {
    formData,
    detalles,
    errors,
    isSubmitting,
    handleChange,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    calcularTotal,
    crearPedido
  } = usePedido();
  
  // Cargar datos de clientes y almacenes
  const loadClientesYAlmacenes = useCallback(async () => {
    try {
      // Cargar clientes y almacenes en paralelo
      const [clientesRes, almacenesRes] = await Promise.all([
        clienteApi.getClientes(),
        almacenApi.getAlmacenes()
      ]);
      
      setClientes(clientesRes.data || []);
      setAlmacenes(almacenesRes.data || []);
      
      // Establecer cliente inicial si hay datos
      if (clientesRes.data?.length > 0) {
        handleChange('cliente_id', clientesRes.data[0].id.toString());
      }
      
      // Determinar almacén inicial
      if (user?.almacen_id) {
        handleChange('almacen_id', user.almacen_id.toString());
      } else if (almacenesRes.data?.length > 0) {
        handleChange('almacen_id', almacenesRes.data[0].id.toString());
      }
      
      return {
        clientes: clientesRes.data || [],
        almacenes: almacenesRes.data || []
      };
    } catch (error) {
      console.error('Error al cargar clientes y almacenes:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de clientes y almacenes');
      return { clientes: [], almacenes: [] };
    }
  }, [handleChange, user?.almacen_id]);
  
  // Cargar datos iniciales
  useEffect(() => {
    if (!isInitialized.current) {
      const initializeData = async () => {
        try {
          setIsLoadingData(true);
          console.log("Inicializando pantalla de pedidos...");
          
          // Paso 1: Cargar presentaciones
          await cargarPresentaciones();
          
          // Paso 2: Cargar clientes y almacenes
          const { almacenes } = await loadClientesYAlmacenes();
          
          // Paso 3: Configurar fecha de entrega por defecto (hoy + 1 día)
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          handleChange('fecha_entrega', tomorrow.toISOString().split('T')[0]);
          
          // Paso 4: Configurar almacén si existe 
          if (user?.almacen_id) {
            const almacenIdStr = user.almacen_id.toString();
            await handleAlmacenChange(almacenIdStr);
          } else if (almacenes?.length > 0) {
            await handleAlmacenChange(almacenes[0].id.toString());
          }
          
          isInitialized.current = true;
        } catch (error) {
          console.error('Error loading data:', error);
          Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
        } finally {
          setIsLoadingData(false);
        }
      };
      
      initializeData();
    }
  }, []);
  
  // Manejar cambio de almacén
  const handleAlmacenChange = useCallback(async (almacenId: string) => {
    if (!almacenId) return;
    
    // Actualizar el formulario con el nuevo almacén
    handleChange('almacen_id', almacenId);
    
    // En pedidos no filtramos por stock disponible
    console.log("Configurando pedido con almacén:", almacenId);
    
    // Solo asegurar que las presentaciones están cargadas
    if (presentaciones.length === 0) {
      await cargarPresentaciones();
    }
  }, [handleChange, cargarPresentaciones, presentaciones.length]);
  
  // Manejar selección de producto
  const handleSelectProduct = useCallback((presentacionId: string) => {
    const presentacion = presentacionesFiltradas.find(p => p.id.toString() === presentacionId);
    if (presentacion) {
      agregarProducto(
        presentacionId,
        '1',
        presentacion.precio_venta || '0'
      );
      
      // Mostrar mini-notificación de éxito
      Alert.alert(
        "Producto agregado",
        `${presentacion.nombre} se agregó a la proyección`,
        [{ text: "OK", style: "default" }],
        { cancelable: true }
      );
    }
    setShowProductModal(false);
  }, [presentacionesFiltradas, agregarProducto]);
  
  // Manejar selección de fecha
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleChange('fecha_entrega', formattedDate);
    }
  };
  
  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!formData.cliente_id) {
      Alert.alert('Error', 'Debe seleccionar un cliente');
      return;
    }
    
    if (!formData.fecha_entrega) {
      Alert.alert('Error', 'Debe seleccionar una fecha de entrega');
      return;
    }
    
    if (detalles.length === 0) {
      Alert.alert('Error', 'Debe agregar al menos un producto');
      return;
    }
    
    const response = await crearPedido();
    if (response) {
      Alert.alert(
        'Proyección Creada',
        'La proyección ha sido registrada exitosamente',
        [{ text: 'OK', onPress: () => router.replace('/pedidos') }]
      );
    } else {
      Alert.alert('Error', 'No se pudo registrar la proyección');
    }
  };
  
  // Mostrar pantalla de carga mientras se inicializan los datos
  if (isLoadingData) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Nueva Proyección',
          headerShown: true 
        }} />
        <ThemedView style={ScreenStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText>Cargando datos necesarios...</ThemedText>
        </ThemedView>
      </>
    );
  }
  
  return (
    <>
      <Stack.Screen options={{ 
        title: 'Nueva Proyección',
        headerShown: true 
      }} />
      
      <ScrollView style={ScreenStyles.container}>
        <ThemedText type="title" style={ScreenStyles.heading}>Registrar Proyección de Pedido</ThemedText>
        
        {/* Contenedor principal en forma de card */}
        <ThemedView style={styles.formCard}>
          {/* Sección general */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Información General</ThemedText>
            
            {/* Primera fila: Almacén y Estado */}
            <ThemedView style={styles.rowContainer}>
              {/* Almacén */}
              <ThemedView style={styles.halfWidth}>
                <ThemedText style={styles.label}>
                  Almacén {isAdmin ? '(Admin)' : ''} *
                </ThemedText>
                <View style={[
                  styles.pickerContainer,
                  { backgroundColor: isDark ? Colors.backgroundDark : Colors.lightGray1 },
                  !isAdmin && styles.disabledContainer
                ]}>
                  <Picker
                    selectedValue={formData.almacen_id}
                    onValueChange={handleAlmacenChange}
                    style={styles.picker}
                    enabled={isAdmin}
                  >
                    {almacenes.map(almacen => (
                      <Picker.Item 
                        key={almacen.id} 
                        label={almacen.nombre} 
                        value={almacen.id.toString()} 
                      />
                    ))}
                  </Picker>
                </View>
                {!isAdmin && (
                  <ThemedText style={styles.helperText}>Asignado a tu usuario</ThemedText>
                )}
                {errors.almacen_id && (
                  <ThemedText style={styles.errorText}>{errors.almacen_id}</ThemedText>
                )}
              </ThemedView>
              
              {/* Estado */}
              <ThemedView style={styles.halfWidth}>
                <ThemedText style={styles.label}>Estado</ThemedText>
                <View style={[
                  styles.pickerContainer,
                  { backgroundColor: isDark ? Colors.backgroundDark : Colors.lightGray1 }
                ]}>
                  <Picker
                    selectedValue={formData.estado}
                    onValueChange={(value) => handleChange('estado', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Programado" value="programado" />
                    <Picker.Item label="Confirmado" value="confirmado" />
                  </Picker>
                </View>
              </ThemedView>
            </ThemedView>
            
            {/* Segunda fila: Fecha y Cliente */}
            <ThemedView style={styles.rowContainer}>
              {/* Fecha de Entrega */}
              <ThemedView style={styles.halfWidth}>
                <ThemedText style={styles.label}>Fecha de Entrega *</ThemedText>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <ThemedText>
                    {formData.fecha_entrega ? new Date(formData.fecha_entrega).toLocaleDateString() : 'Seleccionar fecha'}
                  </ThemedText>
                  <IconSymbol name="calendar" size={20} color={isDark ? Colors.white : "#666666"} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.fecha_entrega ? new Date(formData.fecha_entrega) : new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
                {errors.fecha_entrega && (
                  <ThemedText style={styles.errorText}>{errors.fecha_entrega}</ThemedText>
                )}
              </ThemedView>
              
              {/* Cliente */}
              <ThemedView style={styles.halfWidth}>
                <ThemedText style={styles.label}>Cliente *</ThemedText>
                <View style={[
                  styles.pickerContainer,
                  { backgroundColor: isDark ? Colors.backgroundDark : Colors.lightGray1 }
                ]}>
                  <Picker
                    selectedValue={formData.cliente_id}
                    onValueChange={(value) => handleChange('cliente_id', value)}
                    style={styles.picker}
                  >
                    {clientes.map(cliente => (
                      <Picker.Item 
                        key={cliente.id} 
                        label={cliente.nombre} 
                        value={cliente.id.toString()} 
                      />
                    ))}
                  </Picker>
                </View>
                {errors.cliente_id && (
                  <ThemedText style={styles.errorText}>{errors.cliente_id}</ThemedText>
                )}
              </ThemedView>
            </ThemedView>
            
            {/* Notas */}
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Notas (opcional)</ThemedText>
              <TextInput
                style={styles.textArea}
                value={formData.notas}
                onChangeText={(value) => handleChange('notas', value)}
                placeholder="Información adicional sobre la proyección"
                placeholderTextColor="#9BA1A6"
                multiline
                numberOfLines={3}
              />
            </ThemedView>
          </ThemedView>
          
          {/* Sección de Productos */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Productos</ThemedText>
              <TouchableOpacity 
                style={styles.addProductButton}
                onPress={() => setShowProductModal(true)}
              >
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <ThemedText style={styles.addProductButtonText}>Agregar Producto</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            
            {isLoadingPresentaciones ? (
              <ThemedView style={styles.loadingProducts}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <ThemedText>Cargando productos disponibles...</ThemedText>
              </ThemedView>
            ) : presentacionesFiltradas.length === 0 ? (
              <ThemedView style={styles.emptyProducts}>
                <IconSymbol name="exclamationmark.triangle" size={40} color="#FFC107" />
                <ThemedText style={styles.emptyText}>
                  No hay productos disponibles para seleccionar
                </ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Por favor, asegúrese de que existan productos en el sistema.
                </ThemedText>
              </ThemedView>
            ) : (
              <>
                {detalles.length === 0 ? (
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
                  <ProductGrid
                    detalles={detalles}
                    presentaciones={presentaciones}
                    onUpdate={actualizarProducto}
                    onRemove={eliminarProducto}
                    onAddProduct={() => setShowProductModal(true)}
                    isPedido={true}
                  />
                )}
                
                {errors.detalles && (
                  <ThemedText style={styles.errorText}>{errors.detalles}</ThemedText>
                )}
              </>
            )}
          </ThemedView>
          
          {/* Resumen y Total */}
          <ThemedView style={styles.totalSection}>
            <ThemedText type="subtitle">Resumen</ThemedText>
            <ThemedView style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Total Estimado:</ThemedText>
              <ThemedText style={styles.totalValue}>${calcularTotal()}</ThemedText>
            </ThemedView>
          </ThemedView>
          
          {/* Botones de acción */}
          <ThemedView style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton,
                detalles.length === 0 && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={detalles.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText style={styles.saveButtonText}>Registrar Proyección</ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ScrollView>
      
      {/* Modal para seleccionar productos */}
      <ProductSelector
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={handleSelectProduct}
        presentaciones={presentacionesFiltradas}
        detallesActuales={detalles}
        title="Seleccionar Producto para Proyección"
      />
    </>
  );
}

// Necesitamos importar TextInput al inicio del archivo
import { TextInput } from 'react-native';

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 16,
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.lightGray2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  disabledContainer: {
    opacity: 0.7,
    backgroundColor: Colors.lightGray1,
  },
  helperText: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray2,
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.lightGray2,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addProductButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.lightGray1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.darkGray,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: Colors.success,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});