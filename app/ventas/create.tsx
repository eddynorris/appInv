// app/ventas/create.tsx - Versión corregida
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ProductSelector from '@/components/ProductSelector';
import ProductGrid from '@/components/ProductGrid';
import { clienteApi, almacenApi, inventarioApi } from '@/services/api';
import { Colors, FormStyles, SectionStyles, ButtonStyles, ScreenStyles } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { useProductos } from '@/hooks/useProductos';
import { useVenta } from '@/hooks/useVenta';

export default function CreateVentaScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
  // Estado para controlar los roles y permisos
  const [isAdmin, setIsAdmin] = useState(false);
  
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
    filtrarPorAlmacen: true, 
    soloConStock: true,  // Solo mostrar productos con stock para ventas
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
    crearVenta,
    setDetalles
  } = useVenta();
  
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
  
    // Cargar datos iniciales - versión optimizada
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        
        // Paso 1: Cargar todo en paralelo para mayor eficiencia
        const [
          presentacionesResult,
          clientesRes, 
          almacenesRes
        ] = await Promise.all([
          cargarPresentaciones(),
          clienteApi.getClientes(),
          almacenApi.getAlmacenes()
        ]);
        
        // Paso 2: Configurar datos del formulario
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
          
          // Paso 3: Filtrar presentaciones por almacén - en un solo paso
          await filtrarPorAlmacenId(almacenIdToUse);
        }
        
        // Paso 4: Detalles vacíos - el usuario agregará productos manualmente
        setDetalles([]);
        
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
      } finally {
        // Todo listo, quitar la pantalla de carga
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, []);
  // Cargar inventario por almacén y actualizar detalles
  const cargarInventarioPorAlmacen = async (almacenId: string) => {
    // Control para prevenir múltiples cargas
    if (isLoadingData) return;
    
    try {
      // Mostrar pantalla de carga mientras ocurre todo el proceso
      setIsLoadingData(true);
      
      // 1. Asegurar que tenemos presentaciones
      if (presentaciones.length === 0) {
        await cargarPresentaciones();
      }
      
      // 2. Filtrar presentaciones por almacén - sin timeouts
      const presentacionesFiltradas = await filtrarPorAlmacenId(almacenId);
      
      // 3. Inicializar detalles vacíos - ahora el usuario deberá agregar productos manualmente
      setDetalles([]);
      
      // 4. Todo listo, quitar la pantalla de carga
      setIsLoadingData(false);
      
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      setIsLoadingData(false);
    }
  };


  // Manejar cambio de almacén
  const handleAlmacenChange = async (almacenId: string) => {
    handleChange('almacen_id', almacenId);
    await cargarInventarioPorAlmacen(almacenId);
  };
  
  // Manejar selección de producto
  const handleSelectProduct = (presentacionId: string) => {
    const presentacion = presentacionesFiltradas.find(p => p.id.toString() === presentacionId);
    if (presentacion) {
      agregarProducto(
        presentacionId,
        '1',
        presentacion.precio_venta || '0'
      );
    }
    setShowProductModal(false);
  };
  
  // Manejar envío del formulario
  const handleSubmit = async () => {
    const response = await crearVenta();
    if (response) {
      Alert.alert(
        'Venta Creada',
        'La venta ha sido registrada exitosamente',
        [{ text: 'OK', onPress: () => router.replace('/ventas') }]
      );
    } else {
      Alert.alert('Error', 'No se pudo registrar la venta. Verifique los datos e intente nuevamente.');
    }
  };
  
  if (isLoadingData) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Nueva Venta',
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
        title: 'Nueva Venta',
        headerShown: true 
      }} />
      
      <ScrollView style={ScreenStyles.container}>
        <ThemedText type="title" style={ScreenStyles.heading}>Registrar Venta</ThemedText>
        
        <ThemedView style={FormStyles.container}>
          {/* Primera fila: Almacén y Tipo de Pago */}
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

            {/* Tipo de Pago */}
            <ThemedView style={[FormStyles.formGroup, FormStyles.halfWidth]}>
              <ThemedText style={FormStyles.label}>Tipo de Pago</ThemedText>
              <View style={[
                FormStyles.pickerContainer,
                { backgroundColor: isDark ? Colors.backgroundDark : Colors.lightGray1 }
              ]}>
                <Picker
                  selectedValue={formData.tipo_pago}
                  onValueChange={(value) => handleChange('tipo_pago', value)}
                  style={[FormStyles.picker, { color: isDark ? Colors.white : Colors.textDark }]}
                >
                  <Picker.Item label="Contado" value="contado" />
                  <Picker.Item label="Crédito" value="credito" />
                </Picker>
              </View>
            </ThemedView>
          </ThemedView>

          {/* Segunda fila: Fecha y Consumo Diario */}
          <ThemedView style={FormStyles.rowContainer}>
            {/* Fecha */}
            <ThemedView style={[FormStyles.formGroup, FormStyles.halfWidth]}>
              <ThemedText style={FormStyles.label}>Fecha</ThemedText>
              <TextInput
                style={[
                  FormStyles.input,
                  { color: isDark ? Colors.white : Colors.textDark }
                ]}
                value={formData.fecha}
                onChangeText={(value) => handleChange('fecha', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textLight}
              />
            </ThemedView>

            {/* Consumo diario (opcional) */}
            <ThemedView style={[FormStyles.formGroup, FormStyles.halfWidth]}>
              <ThemedText style={FormStyles.label}>Consumo Diario (kg)</ThemedText>
              <TextInput
                style={[
                  FormStyles.input,
                  { color: isDark ? Colors.white : Colors.textDark }
                ]}
                value={formData.consumo_diario_kg}
                onChangeText={(value) => handleChange('consumo_diario_kg', value)}
                placeholder="0.00"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
            </ThemedView>
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

          {/* Lista de Productos */}
          <ThemedView style={styles.detallesSection}>
            <ThemedText type="subtitle" style={SectionStyles.subtitle}>Productos</ThemedText>
            
            {isLoadingData || isLoadingPresentaciones ? (
              // Mostrar un indicador de carga único mientras se preparan los datos
              <ThemedView style={styles.loadingPresentaciones}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <ThemedText>Cargando productos disponibles...</ThemedText>
              </ThemedView>
            ) : presentacionesFiltradas.length === 0 ? (
              // Mensaje cuando no hay presentaciones disponibles
              <ThemedView style={styles.noPresentaciones}>
                <ThemedText style={styles.noPresentacionesText}>
                  No hay productos disponibles en este almacén
                </ThemedText>
                <ThemedText style={styles.noPresentacionesInfo}>
                  Almacén: {almacenes.find(a => a.id.toString() === formData.almacen_id)?.nombre || 'No seleccionado'}
                </ThemedText>
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.noPresentacionesButton}
                    onPress={() => router.push({
                      pathname: '/presentaciones/create',
                      params: { almacen_id: formData.almacen_id }
                    })}
                  >
                    <ThemedText style={styles.noPresentacionesButtonText}>
                      Agregar Productos a este Almacén
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>
            ) : (
              // Mostrar grid para agregar productos o ver los existentes
              <ProductGrid
                detalles={detalles}
                presentaciones={presentaciones}
                onUpdate={actualizarProducto}
                onRemove={eliminarProducto}
                onAddProduct={() => setShowProductModal(true)}
                isPedido={false}
              />
            )}
            
            {errors.detalles && (
              <ThemedText style={FormStyles.errorText}>{errors.detalles}</ThemedText>
            )}
          </ThemedView>
          
          {/* Total */}
          <ThemedView style={SectionStyles.totalSection}>
            <ThemedText style={SectionStyles.totalLabel}>Total:</ThemedText>
            <ThemedText style={SectionStyles.totalValue}>${calcularTotal()}</ThemedText>
          </ThemedView>
          
          <TouchableOpacity 
            style={[
              ButtonStyles.button,
              ButtonStyles.primary,
              (isSubmitting || detalles.length === 0 || presentacionesFiltradas.length === 0) && ButtonStyles.disabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || detalles.length === 0 || presentacionesFiltradas.length === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <ThemedText style={ButtonStyles.buttonText}>Registrar Venta</ThemedText>
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
        title="Seleccionar Producto para Venta"
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
  noPresentacionesInfo: {
    textAlign: 'center',
    fontSize: 13,
    color: '#FF5722',
  },
  noPresentacionesButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  noPresentacionesButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});