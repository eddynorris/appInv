// app/pedidos/create.tsx - Versión optimizada con la nueva arquitectura
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ProductSelector from '@/components/ProductSelector';
import ProductGrid from '@/components/ProductGrid';
import { clienteApi, almacenApi } from '@/services/api';
import { Colors, FormStyles, SectionStyles, ButtonStyles, ScreenStyles } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { useProductos } from '@/hooks/useProductos';
import { usePedido } from '@/hooks/usePedido';

export default function CreatePedidoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
  // Estado para controlar los roles y permisos
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Estado para date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Estado para modal de productos
  const [showProductModal, setShowProductModal] = useState(false);
  
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
  
  // Estado para datos generales
  const [clientes, setClientes] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Establecer el rol y almacén del usuario
  useEffect(() => {
    if (user) {
      const isUserAdmin = user.rol?.toLowerCase() === 'admin';
      setIsAdmin(isUserAdmin);
      
      // Si el usuario tiene almacén asignado, usarlo automáticamente
      if (user.almacen_id && formData.almacen_id !== user.almacen_id.toString()) {
        handleAlmacenChange(user.almacen_id.toString());
      }
    }
  }, [user]);
  
 // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        
        console.log("Inicializando pantalla de pedidos...");
        
        // Paso 1: Cargar presentaciones primero 
        // Para pedidos no filtramos por almacén, así que aseguramos que todas las presentaciones estén cargadas
        await cargarPresentaciones();
        
        // Paso 2: Cargar clientes y almacenes
        const [clientesRes, almacenesRes] = await Promise.all([
          clienteApi.getClientes(),
          almacenApi.getAlmacenes()
        ]);
        
        // Establecer datos
        setClientes(clientesRes.data || []);
        setAlmacenes(almacenesRes.data || []);
        
        // Establecer cliente inicial
        if (clientesRes.data?.length > 0) {
          handleChange('cliente_id', clientesRes.data[0].id.toString());
        }
        
        // Determinar almacén inicial
        let almacenIdToUse = '';
        if (user?.almacen_id) {
          almacenIdToUse = user.almacen_id.toString();
        } else if (almacenesRes.data?.length > 0) {
          almacenIdToUse = almacenesRes.data[0].id.toString();
        }
        
        if (almacenIdToUse) {
          // Establecer almacén_id en el formulario
          handleChange('almacen_id', almacenIdToUse);
          
          // Para pedidos, no filtramos por almacén pero mantenemos la consistencia
          console.log("Configurando pedido con almacén:", almacenIdToUse);
          
          // En pedidos, como no filtramos por almacén, simplemente usamos todas las presentaciones
          // Pero aseguramos que el estado se actualice correctamente
          setTimeout(() => {
            if (presentacionesFiltradas.length === 0 && presentaciones.length > 0) {
              console.log("Actualizando presentaciones filtradas para pedidos");
              cargarPresentaciones();
            }
          }, 500);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Manejar cambio de almacén
  const handleAlmacenChange = async (almacenId: string) => {
    console.log("Cambiando almacén en pedidos:", almacenId);
    handleChange('almacen_id', almacenId);
    
    // En pedidos no filtramos por almacén, pero aseguramos que las presentaciones estén cargadas
    if (presentaciones.length === 0) {
      console.log("No hay presentaciones cargadas, cargando ahora...");
      await cargarPresentaciones();
    } else {
      console.log(`Ya hay ${presentaciones.length} presentaciones cargadas`);
    }
    
    // Para pedidos, esto no debería filtrar (porque filtrarPorAlmacen es false)
    // pero llamamos para mantener la consistencia
    await filtrarPorAlmacenId(almacenId);
  };
  
  // Manejar selección de producto
  const handleSelectProduct = (presentacionId: string) => {
    const presentacion = presentacionesFiltradas.find(p => p.id.toString() === presentacionId);
    if (presentacion) {
      agregarProducto(
        presentacionId,
        '1',
        presentacion.precio_venta
      );
    }
    setShowProductModal(false);
  };
  
  // Manejar envío del formulario
  const handleSubmit = async () => {
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
  
  if (isLoadingData) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Nueva Proyección',
          headerShown: true 
        }} />
        <ThemedView style={ScreenStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText>Cargando datos...</ThemedText>
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
        
        <ThemedView style={FormStyles.container}>
          {/* Primera fila: Almacén y Estado juntos */}
          <ThemedView style={FormStyles.rowContainer}>
            {/* Almacén Selector */}
            <ThemedView style={[FormStyles.formGroup, FormStyles.halfWidth]}>
              <ThemedText style={FormStyles.label}>Almacén {isAdmin ? '(Admin)' : ''}</ThemedText>
              <View style={[
                FormStyles.pickerContainer,
                { backgroundColor: isDark ? Colors.backgroundDark : Colors.lightGray1 },
                !isAdmin && FormStyles.disabledContainer
              ]}>
                <Picker
                  selectedValue={formData.almacen_id}
                  onValueChange={handleAlmacenChange}
                  style={[FormStyles.picker, { color: isDark ? Colors.white : Colors.textDark }]}
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
                <ThemedText style={FormStyles.infoText}>Asignado a tu usuario</ThemedText>
              )}
              {errors.almacen_id && (
                <ThemedText style={FormStyles.errorText}>{errors.almacen_id}</ThemedText>
              )}
            </ThemedView>

            {/* Estado del Pedido */}
            <ThemedView style={[FormStyles.formGroup, FormStyles.halfWidth]}>
              <ThemedText style={FormStyles.label}>Estado</ThemedText>
              <View style={[
                FormStyles.pickerContainer,
                { backgroundColor: isDark ? Colors.backgroundDark : Colors.lightGray1 }
              ]}>
                <Picker
                  selectedValue={formData.estado}
                  onValueChange={(value) => handleChange('estado', value)}
                  style={[FormStyles.picker, { color: isDark ? Colors.white : Colors.textDark }]}
                >
                  <Picker.Item label="Programado" value="programado" />
                  <Picker.Item label="Confirmado" value="confirmado" />
                </Picker>
              </View>
            </ThemedView>
          </ThemedView>

          {/* Fecha de Entrega */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Fecha de Entrega *</ThemedText>
            <TouchableOpacity 
              style={[
                FormStyles.input,
                errors.fecha_entrega && FormStyles.inputError,
                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText style={{ color: isDark ? Colors.white : Colors.textDark }}>
                {formData.fecha_entrega ? new Date(formData.fecha_entrega).toLocaleDateString() : 'Seleccionar fecha'}
              </ThemedText>
              <IconSymbol name="calendar" size={20} color={isDark ? Colors.white : Colors.textDark} />
            </TouchableOpacity>
            {errors.fecha_entrega && (
              <ThemedText style={FormStyles.errorText}>{errors.fecha_entrega}</ThemedText>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={formData.fecha_entrega ? new Date(formData.fecha_entrega) : new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
          </ThemedView>

          {/* Cliente Selector */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Cliente *</ThemedText>
            <View style={[
              FormStyles.pickerContainer,
              { backgroundColor: isDark ? Colors.backgroundDark : Colors.lightGray1 }
            ]}>
              <Picker
                selectedValue={formData.cliente_id}
                onValueChange={(value) => handleChange('cliente_id', value)}
                style={[FormStyles.picker, { color: isDark ? Colors.white : Colors.textDark }]}
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
              <ThemedText style={FormStyles.errorText}>{errors.cliente_id}</ThemedText>
            )}
          </ThemedView>

          {/* Notas */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Notas (opcional)</ThemedText>
            <TextInput
              style={[
                FormStyles.input,
                FormStyles.textArea,
                { color: isDark ? Colors.white : Colors.textDark }
              ]}
              value={formData.notas}
              onChangeText={(value) => handleChange('notas', value)}
              placeholder="Información adicional sobre la proyección"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />
          </ThemedView>

          {/* Lista de Productos */}
          <ThemedView style={styles.detallesSection}>
            <ThemedText type="subtitle" style={SectionStyles.subtitle}>Productos</ThemedText>
            
            {isLoadingPresentaciones ? (
              <ThemedView style={styles.loadingPresentaciones}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <ThemedText>Cargando productos disponibles...</ThemedText>
              </ThemedView>
            ) : presentacionesFiltradas.length === 0 ? (
              <ThemedView style={styles.noPresentaciones}>
                <ThemedText style={styles.noPresentacionesText}>
                  No hay productos disponibles para seleccionar
                </ThemedText>
              </ThemedView>
            ) : (
              <>
                <ProductGrid
                  detalles={detalles}
                  presentaciones={presentaciones}
                  onUpdate={actualizarProducto}
                  onRemove={eliminarProducto}
                  onAddProduct={() => setShowProductModal(true)}
                  isPedido={true}
                />
                
                {errors.detalles && (
                  <ThemedText style={FormStyles.errorText}>{errors.detalles}</ThemedText>
                )}
              </>
            )}
          </ThemedView>
          
          {/* Total */}
          <ThemedView style={SectionStyles.totalSection}>
            <ThemedText style={SectionStyles.totalLabel}>Total Estimado:</ThemedText>
            <ThemedText style={SectionStyles.totalValue}>${calcularTotal()}</ThemedText>
          </ThemedView>
          
          <TouchableOpacity 
            style={[
              ButtonStyles.button,
              ButtonStyles.primary,
              (isSubmitting || detalles.length === 0) && ButtonStyles.disabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || detalles.length === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <ThemedText style={ButtonStyles.buttonText}>Registrar Proyección</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
      
      {/* Modal Selector de Productos */}
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

// Estilos específicos de esta pantalla (mínimos gracias al sistema de estilos)
const styles = StyleSheet.create({
  detallesSection: {
    marginTop: 16,
    gap: 12,
  },
  loadingPresentaciones: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
  },
  noPresentaciones: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    gap: 12,
  },
  noPresentacionesText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});