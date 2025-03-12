// app/ventas/create.tsx - Versión mejorada
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ventaApi, clienteApi, presentacionApi, almacenApi, inventarioApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Cliente, Almacen, Presentacion } from '@/models';
import { useAuth } from '@/context/AuthContext';

export default function CreateVentaScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); // Obtenemos el usuario actual
  
  // Estado para controlar los roles y permisos
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data for dropdowns
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [presentacionesFiltradas, setPresentacionesFiltradas] = useState<Presentacion[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingPresentaciones, setIsLoadingPresentaciones] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    cliente_id: '',
    almacen_id: '',
    fecha: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    tipo_pago: 'contado',
    consumo_diario_kg: ''
  });

  // Detalles de venta
  const [detalles, setDetalles] = useState([
    { presentacion_id: '', cantidad: '1' }
  ]);

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Establecer el rol y almacén del usuario al cargar el componente
  useEffect(() => {
    if (user) {
      // Comprobar si el usuario es administrador
      // Verificando con console.log para depuración
      console.log('Datos del usuario:', user);
      console.log('Rol del usuario:', user.rol);
      
      // Establecemos isAdmin, con comprobación más permisiva para evitar problemas de mayúsculas/minúsculas
      const isUserAdmin = user.rol && user.rol.toLowerCase() === 'admin';
      console.log('¿Es administrador?:', isUserAdmin);
      setIsAdmin(isUserAdmin);
    }
  }, [user]);

  // Load data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        console.log('Iniciando carga de datos iniciales...');
        
        // Load clientes, presentaciones, almacenes in parallel
        const [clientesRes, presentacionesRes, almacenesRes] = await Promise.all([
          clienteApi.getClientes(),
          presentacionApi.getPresentaciones(),
          almacenApi.getAlmacenes()
        ]);
        
        console.log('Datos obtenidos:', {
          clientes: clientesRes?.data?.length || 0,
          presentaciones: presentacionesRes?.data?.length || 0,
          almacenes: almacenesRes?.data?.length || 0
        });
        
        // Set data from responses
        setClientes(clientesRes.data || []);
        setPresentaciones(presentacionesRes.data || []);
        setAlmacenes(almacenesRes.data || []);
        
        // Set initial cliente_id if available
        if (clientesRes.data?.length > 0) {
          setFormData(prev => ({ ...prev, cliente_id: clientesRes.data[0].id.toString() }));
        }
        
        // Determinar qué almacén usar inicialmente
        let almacenIdToUse = '';
        const isUserAdmin = user?.rol?.toLowerCase() === 'admin';
        
        console.log('Usuario actual:', user);
        console.log('¿Es administrador?:', isUserAdmin);
        
        if (user?.almacen_id) {
          // Si el usuario tiene un almacén asignado (sea admin o no), lo usamos inicialmente
          almacenIdToUse = user.almacen_id.toString();
          console.log('Usando almacén asignado al usuario:', almacenIdToUse);
        } else if (almacenesRes.data?.length > 0) {
          // Si no tiene almacén asignado, usar el primer almacén
          almacenIdToUse = almacenesRes.data[0].id.toString();
          console.log('Usando primer almacén disponible:', almacenIdToUse);
        }
        
        if (almacenIdToUse) {
          setFormData(prev => ({ ...prev, almacen_id: almacenIdToUse }));
          
          // Cargar inventarios para este almacén
          await cargarPresentacionesPorAlmacen(almacenIdToUse);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
      } finally {
        setIsLoadingData(false);
      }
    };
  
    fetchData();
  }, [user]);

  const cargarPresentacionesPorAlmacen = async (almacenId: string) => {
    try {
      setIsLoadingPresentaciones(true);
      console.log('Cargando presentaciones para almacén ID:', almacenId);
      
      // Cargar inventarios para este almacén
      const inventariosRes = await inventarioApi.getInventarios(1, 100, parseInt(almacenId));
      console.log('Respuesta de inventarios:', inventariosRes);
      
      // Si no hay respuesta o no hay datos, no cargaremos presentaciones
      if (!inventariosRes || !inventariosRes.data || inventariosRes.data.length === 0) {
        console.log('No se encontraron inventarios para este almacén');
        setPresentacionesFiltradas([]);
        setDetalles([{ presentacion_id: '', cantidad: '1' }]);
        return;
      }
      
      // Filtrar los inventarios por almacén que tengan stock disponible
      const inventariosDelAlmacen = inventariosRes.data.filter(
        inv => inv.almacen_id.toString() === almacenId && inv.cantidad > 0
      );
      
      console.log(`Encontrados ${inventariosDelAlmacen.length} inventarios con stock para el almacén ${almacenId}`);
      
      // Obtener las presentaciones disponibles en este almacén
      const presentacionesIdsDisponibles = inventariosDelAlmacen.map(inv => inv.presentacion_id);
      console.log('IDs de presentaciones disponibles:', presentacionesIdsDisponibles);
      
      // Si no tenemos presentaciones cargadas, intentar cargarlas
      if (presentaciones.length === 0) {
        console.log('Cargando presentaciones porque no teníamos ninguna');
        const presentacionesRes = await presentacionApi.getPresentaciones();
        if (presentacionesRes && presentacionesRes.data) {
          setPresentaciones(presentacionesRes.data);
          
          // Filtrar las presentaciones que están disponibles en el inventario
          const presentacionesDisponibles = presentacionesRes.data.filter(
            p => presentacionesIdsDisponibles.includes(p.id)
          );
          
          console.log(`Encontradas ${presentacionesDisponibles.length} presentaciones disponibles`);
          setPresentacionesFiltradas(presentacionesDisponibles);
          
          // Si hay presentaciones disponibles, actualiza el primer detalle
          if (presentacionesDisponibles.length > 0) {
            setDetalles([{ 
              presentacion_id: presentacionesDisponibles[0].id.toString(), 
              cantidad: '1' 
            }]);
          } else {
            setDetalles([{ presentacion_id: '', cantidad: '1' }]);
          }
        }
      } else {
        // Filtrar las presentaciones que están disponibles en el inventario
        const presentacionesDisponibles = presentaciones.filter(
          p => presentacionesIdsDisponibles.includes(p.id)
        );
        
        console.log(`Encontradas ${presentacionesDisponibles.length} presentaciones disponibles de ${presentaciones.length} totales`);
        setPresentacionesFiltradas(presentacionesDisponibles);
        
        // Si hay presentaciones disponibles, actualiza el primer detalle
        if (presentacionesDisponibles.length > 0) {
          setDetalles([{ 
            presentacion_id: presentacionesDisponibles[0].id.toString(), 
            cantidad: '1' 
          }]);
        } else {
          setDetalles([{ presentacion_id: '', cantidad: '1' }]);
        }
      }
    } catch (error) {
      console.error('Error al cargar presentaciones por almacén:', error);
      setPresentacionesFiltradas([]);
      setDetalles([{ presentacion_id: '', cantidad: '1' }]);
    } finally {
      setIsLoadingPresentaciones(false);
    }
  };
  
  const handleAlmacenChange = async (almacenId: string) => {
    setFormData(prev => ({ ...prev, almacen_id: almacenId }));
    await cargarPresentacionesPorAlmacen(almacenId);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

    // Handle adding new products to the list
  const handleDetalleChange = (index: number, field: string, value: string) => {
    const newDetalles = [...detalles];
    
    // Si estamos cambiando la presentación_id, verificamos que no sea una presentación duplicada
    if (field === 'presentacion_id') {
      // Verificar si esta presentación ya está en la lista en un índice diferente
      const isDuplicate = detalles.some((detalle, i) => 
        i !== index && detalle.presentacion_id === value
      );
      
      if (isDuplicate) {
        Alert.alert(
          'Producto Duplicado',
          'Este producto ya está en la lista. Si deseas más unidades, aumenta la cantidad.',
          [{ text: 'Entendido' }]
        );
        return; // No permitir el cambio
      }
    }
    
    // Si no es un duplicado o es cambio de cantidad, proceder normalmente
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setDetalles(newDetalles);
  };

  // Función para agregar un nuevo detalle (producto)
  const addDetalle = () => {
    if (presentacionesFiltradas.length === 0) {
      return Alert.alert('Error', 'No hay productos disponibles para agregar');
    }
    
    // Obtener las presentaciones que no están ya en los detalles
    const presentacionesDisponibles = presentacionesFiltradas.filter(
      p => !detalles.some(d => d.presentacion_id === p.id.toString())
    );
    
    if (presentacionesDisponibles.length === 0) {
      return Alert.alert(
        'Productos Duplicados', 
        'Ya has agregado todos los productos disponibles. Si deseas más unidades, aumenta la cantidad de un producto ya agregado.',
        [{ text: 'Entendido' }]
      );
    }
    
    // Agregar el primer producto disponible que no esté ya en la lista
    setDetalles([
      ...detalles, 
      { 
        presentacion_id: presentacionesDisponibles[0].id.toString(), 
        cantidad: '1' 
      }
    ]);
  };

  const removeDetalle = (index: number) => {
    if (detalles.length > 1) {
      const newDetalles = [...detalles];
      newDetalles.splice(index, 1);
      setDetalles(newDetalles);
    } else {
      Alert.alert('Error', 'Debe haber al menos un producto');
    }
  };

  const calculateTotal = () => {
    let total = 0;
    
    detalles.forEach(detalle => {
      const presentacion = presentacionesFiltradas.find(p => p.id.toString() === detalle.presentacion_id);
      if (presentacion) {
        total += parseFloat(presentacion.precio_venta) * parseInt(detalle.cantidad || '0');
      }
    });
    
    return total.toFixed(2);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cliente_id) {
      newErrors.cliente_id = 'El cliente es requerido';
    }
    
    if (!formData.almacen_id) {
      newErrors.almacen_id = 'El almacén es requerido';
    }
    
    // Validate at least one detalle
    if (detalles.length === 0) {
      newErrors.detalles = 'Debe agregar al menos un producto';
    }
    
    // Validate each detalle
    detalles.forEach((detalle, index) => {
      if (!detalle.presentacion_id) {
        newErrors[`detalle_${index}_presentacion`] = 'La presentación es requerida';
      }
      
      if (!detalle.cantidad || parseInt(detalle.cantidad) <= 0) {
        newErrors[`detalle_${index}_cantidad`] = 'La cantidad debe ser mayor a 0';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }
     
    // Verificar que haya presentaciones disponibles
    if (presentacionesFiltradas.length === 0) {
      Alert.alert(
        'Error',
        'No hay presentaciones disponibles en el almacén seleccionado',
        [{ text: 'OK' }]
      );
      return;
    }

    // Verificar que todas las presentaciones seleccionadas estén disponibles
    for (const detalle of detalles) {
      const presentacionExiste = presentacionesFiltradas.some(
        p => p.id.toString() === detalle.presentacion_id
      );
      
      if (!presentacionExiste) {
        Alert.alert(
          'Error',
          'Alguna de las presentaciones seleccionadas no está disponible en este almacén',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      // Prepare data for API
      const ventaData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id),
        tipo_pago: formData.tipo_pago,
        detalles: detalles.map(d => ({
          presentacion_id: parseInt(d.presentacion_id),
          cantidad: parseInt(d.cantidad)
        }))
      };
      
      // Solo añadir campos opcionales si tienen valor
      if (formData.fecha && formData.fecha !== new Date().toISOString().split('T')[0]) {
        ventaData.fecha = formData.fecha;
      }
      
      if (formData.consumo_diario_kg && parseFloat(formData.consumo_diario_kg) > 0) {
        ventaData.consumo_diario_kg = formData.consumo_diario_kg;
      }
      
      console.log('Submitting venta data:', ventaData);
      
      const response = await ventaApi.createVenta(ventaData);
      
      if (response) {
        Alert.alert(
          'Venta Creada',
          'La venta ha sido registrada exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/ventas') 
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo registrar la venta');
      }
    } catch (err) {
      console.error('Error creating venta:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al registrar la venta';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Nueva Venta',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos...</ThemedText>
        </ThemedView>
      </>
    );
  }

  const total = calculateTotal();

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Nueva Venta',
        headerShown: true 
      }} />
      
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>Registrar Venta</ThemedText>

        <ThemedView style={styles.form}>
          {/* Primera fila: Almacén y Tipo de Pago juntos */}
          <ThemedView style={styles.rowContainer}>
            {/* Almacén Selector */}
            <ThemedView style={[styles.formGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Almacén * {isAdmin ? '(Admin)' : ''}</ThemedText>
              <View style={[
                styles.pickerContainer,
                { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
                !isAdmin && styles.disabledContainer
              ]}>
                <Picker
                  selectedValue={formData.almacen_id}
                  onValueChange={(value) => handleAlmacenChange(value)}
                  style={[
                    styles.picker,
                    { color: Colors[colorScheme].text }
                  ]}
                  enabled={isAdmin} // Solo habilitado para admins
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
                <ThemedText style={styles.infoText}>
                  Asignado a tu usuario
                </ThemedText>
              )}
              {errors.almacen_id && (
                <ThemedText style={styles.errorText}>{errors.almacen_id}</ThemedText>
              )}
            </ThemedView>

            {/* Tipo de Pago */}
            <ThemedView style={[styles.formGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Tipo de Pago</ThemedText>
              <View style={[
                styles.pickerContainer,
                { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
              ]}>
                <Picker
                  selectedValue={formData.tipo_pago}
                  onValueChange={(value) => handleChange('tipo_pago', value)}
                  style={[
                    styles.picker,
                    { color: Colors[colorScheme].text }
                  ]}
                >
                  <Picker.Item label="Contado" value="contado" />
                  <Picker.Item label="Crédito" value="credito" />
                </Picker>
              </View>
            </ThemedView>
          </ThemedView>

          {/* Segunda fila: Fecha y Consumo Diario */}
          <ThemedView style={styles.rowContainer}>
            {/* Fecha */}
            <ThemedView style={[styles.formGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Fecha</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text }
                ]}
                value={formData.fecha}
                onChangeText={(value) => handleChange('fecha', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9BA1A6"
              />
            </ThemedView>

            {/* Consumo diario (opcional) */}
            <ThemedView style={[styles.formGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Consumo Diario (kg)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text }
                ]}
                value={formData.consumo_diario_kg}
                onChangeText={(value) => handleChange('consumo_diario_kg', value)}
                placeholder="0.00"
                placeholderTextColor="#9BA1A6"
                keyboardType="numeric"
              />
            </ThemedView>
          </ThemedView>

          {/* Cliente Selector - Solo en tercera fila */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Cliente *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.cliente_id}
                onValueChange={(value) => handleChange('cliente_id', value)}
                style={[
                  styles.picker,
                  { color: Colors[colorScheme].text }
                ]}
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

          {/* Detalles de la Venta */}
          <ThemedView style={styles.detallesSection}>
            <ThemedText type="subtitle" style={styles.subheading}>Productos</ThemedText>
            
            {isLoadingPresentaciones ? (
              <ThemedView style={styles.loadingPresentaciones}>
                <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
                <ThemedText>Cargando productos disponibles...</ThemedText>
              </ThemedView>
            ) : presentacionesFiltradas.length === 0 ? (
              <ThemedView style={styles.noPresentaciones}>
                <ThemedText style={styles.noPresentacionesText}>
                  No hay productos disponibles en este almacén
                </ThemedText>
                <ThemedText style={styles.noPresentacionesInfo}>
                  Almacén: {almacenes.find(a => a.id.toString() === formData.almacen_id)?.nombre || 'No seleccionado'}
                </ThemedText>
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
              </ThemedView>
            ) : (
              <ThemedView style={styles.productosContainer}>
                {/* Grid de Productos */}
                <ThemedView style={styles.productosGrid}>
                  {detalles.map((detalle, index) => (
                    <ThemedView key={index} style={styles.productoCard}>
                      <TouchableOpacity
                        style={styles.removeProductButton}
                        onPress={() => removeDetalle(index)}
                        disabled={detalles.length <= 1}
                      >
                        <ThemedText style={styles.removeProductButtonText}>×</ThemedText>
                      </TouchableOpacity>
                      
                      {/* Info del Producto */}
                      <ThemedView style={styles.productoInfo}>
                        {/* Nombre del producto (estático en vez de selector) */}
                        <ThemedText style={styles.productoNombre}>
                          {presentacionesFiltradas.find(p => p.id.toString() === detalle.presentacion_id)?.nombre || 'Producto'}
                        </ThemedText>
                        
                        {/* Descripción o nombre del producto base */}
                        <ThemedText style={styles.productoDescripcion}>
                          {presentacionesFiltradas.find(p => p.id.toString() === detalle.presentacion_id)?.producto?.nombre || ''}
                        </ThemedText>
                        
                        {/* Precio centrado */}
                        <ThemedText style={styles.productoPrecio}>
                          ${parseFloat(presentacionesFiltradas.find(
                            p => p.id.toString() === detalle.presentacion_id
                          )?.precio_venta || '0').toFixed(2)}
                        </ThemedText>
                        
                        {/* Input de Cantidad simplificado */}
                        <TextInput
                          style={styles.cantidadInput}
                          value={detalle.cantidad}
                          onChangeText={(value) => handleDetalleChange(index, 'cantidad', value)}
                          keyboardType="numeric"
                          placeholder="1"
                        />
                      </ThemedView>
                      
                      {errors[`detalle_${index}_presentacion`] && (
                        <ThemedText style={styles.errorText}>{errors[`detalle_${index}_presentacion`]}</ThemedText>
                      )}
                      {errors[`detalle_${index}_cantidad`] && (
                        <ThemedText style={styles.errorText}>{errors[`detalle_${index}_cantidad`]}</ThemedText>
                      )}
                    </ThemedView>
                  ))}
                  
                  {/* Botón para agregar producto - usando un card similar */}
                  <TouchableOpacity 
                    style={styles.addProductCard}
                    onPress={addDetalle}
                  >
                    <ThemedText style={styles.addProductText}>+</ThemedText>
                    <ThemedText style={styles.addProductLabel}>Agregar Producto</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            )}
          </ThemedView>

          {/* Total */}
          <ThemedView style={styles.totalSection}>
            <ThemedText style={styles.totalLabel}>Total:</ThemedText>
            <ThemedText style={styles.totalValue}>${total}</ThemedText>
          </ThemedView>

          <TouchableOpacity 
            style={[
              styles.submitButton,
              (isSubmitting || presentacionesFiltradas.length === 0) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || presentacionesFiltradas.length === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Registrar Venta</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </>
  );
}

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
  heading: {
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  // Contenedor de fila para colocar elementos horizontalmente
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  // Para campos que ocupan la mitad del ancho
  halfWidth: {
    flex: 1,
  },
  formGroup: {
    gap: 4,
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  disabledContainer: {
    opacity: 0.7,
    backgroundColor: '#F0F0F0',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 4,
  },
  infoText: {
    color: '#0a7ea4',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  detallesSection: {
    marginTop: 16,
    gap: 12,
  },
  subheading: {
    marginBottom: 8,
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
  // Estilos para el nuevo sistema de cards
  productosContainer: {
    marginTop: 8,
  },
  productosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productoCard: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 12,
    padding: 14,
    width: '48%', // Casi mitad del ancho para que quepan 2 por fila
    minHeight: 160,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(10, 126, 164, 0.3)',
    justifyContent: 'space-between',
  },
  removeProductButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(229, 57, 53, 0.8)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  removeProductButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2, // Ajuste fino para el símbolo ×
  },
  productoInfo: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  productoDescripcion: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  productoPrecio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  cantidadInput: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 8,
    width: 70,
    textAlign: 'center',
    backgroundColor: 'white',
    fontSize: 16,
  },
  addProductCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 20,
    width: '48%', // Casi mitad del ancho para que quepan 2 por fila
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    borderStyle: 'dashed',
  },
  addProductText: {
    fontSize: 40,
    color: '#4CAF50',
    marginBottom: 8,
  },
  addProductLabel: {
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#E1E3E5',
    paddingTop: 16,
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
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#88c8d8',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});