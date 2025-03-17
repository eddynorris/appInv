// app/pedidos/create.tsx (simplificado con el nuevo componente)
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ProductSelector from '@/components/ProductSelector';
import { pedidoApi, clienteApi, presentacionApi, almacenApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Cliente, Almacen, Presentacion } from '@/models';
import { useAuth } from '@/context/AuthContext';

// Definir tipos de estado de pedido
enum PedidoEstado {
  Programado = 'programado',
  Confirmado = 'confirmado',
  Entregado = 'entregado',
  Cancelado = 'cancelado'
}

export default function CreatePedidoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); // Obtenemos el usuario actual
  
  // Estado para controlar los roles y permisos
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data for dropdowns
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingPresentaciones, setIsLoadingPresentaciones] = useState(false);
  
  // Estado para date picker
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    cliente_id: '',
    almacen_id: '',
    vendedor_id: user?.id?.toString() || '',
    fecha_entrega: new Date().toISOString().split('T')[0],
    estado: 'programado' as PedidoEstado,
    notas: ''
  });

  // Detalles del pedido utilizando el nuevo formato requerido por ProductSelector
  const [detalles, setDetalles] = useState<
    Array<{
      presentacion_id: string;
      cantidad: string;
      precio_estimado: string;
    }>
  >([]);

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Establecer el rol y almacén del usuario al cargar el componente
  useEffect(() => {
    if (user) {
      console.log('Datos del usuario:', user);
      
      if (user.rol) {
        console.log('Rol del usuario:', user.rol);
        const isUserAdmin = user.rol.toLowerCase() === 'admin';
        console.log('¿Es administrador?:', isUserAdmin);
        setIsAdmin(isUserAdmin);
      } else {
        console.log('No se encontró rol en el usuario, estableciendo como no-admin');
        setIsAdmin(false);
      }
      
      // Si el usuario tiene almacén asignado, usarlo automáticamente
      if (user.almacen_id && formData.almacen_id !== user.almacen_id.toString()) {
        console.log('Estableciendo almacén del usuario:', user.almacen_id);
        handleAlmacenChange(user.almacen_id.toString());
      }
    } else {
      // Si no hay usuario, definitivamente no es admin
      setIsAdmin(false);
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
  
  const handleAlmacenChange = async (almacenId: string) => {
    setFormData(prev => ({ ...prev, almacen_id: almacenId }));
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      handleChange('fecha_entrega', formattedDate);
    }
  };

  const handleProductsChange = (products: Array<{
    presentacion_id: string;
    cantidad: string;
    precio_estimado: string;
  }>) => {
    setDetalles(products);
  };

  const calculateTotal = () => {
    let total = 0;
    
    detalles.forEach(detalle => {
      const cantidad = parseInt(detalle.cantidad || '0');
      const precio = parseFloat(detalle.precio_estimado || '0');
      total += cantidad * precio;
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
    
    if (!formData.fecha_entrega) {
      newErrors.fecha_entrega = 'La fecha de entrega es requerida';
    }
    
    // Validate at least one detalle
    if (detalles.length === 0) {
      newErrors.detalles = 'Debe agregar al menos un producto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Obtener la fecha y formatearla correctamente
      const fechaFormateada = `${formData.fecha_entrega}T00:00:00Z`;
      
      // Preparar datos para la API
      const pedidoData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id),
        vendedor_id: parseInt(formData.vendedor_id || user?.id?.toString() || '1'),
        fecha_entrega: fechaFormateada,
        estado: formData.estado,
        notas: formData.notas || "Ninguna",  // Valor predeterminado
        detalles: detalles.map(d => ({
          presentacion_id: parseInt(d.presentacion_id),
          cantidad: parseInt(d.cantidad || '1'),
          precio_estimado: d.precio_estimado
        }))
      };
      
      console.log('Submitting pedido data:', pedidoData);
      
      try {
        const response = await pedidoApi.createPedido(pedidoData);
        
        if (response) {
          console.log('Pedido creado exitosamente:', response);
          
          Alert.alert(
            'Proyección Creada',
            'La proyección ha sido registrada exitosamente',
            [
              { 
                text: 'OK', 
                onPress: () => {
                  router.replace('/pedidos');
                }
              }
            ]
          );
        } else {
          throw new Error('No se pudo registrar la proyección');
        }
      } catch (apiError) {
        console.error('Error from API:', apiError);
        Alert.alert(
          'Error',
          apiError instanceof Error ? apiError.message : 'Error al comunicarse con el servidor'
        );
      }
    } catch (err) {
      console.error('Error creating pedido:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al registrar la proyección';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Nueva Proyección',
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
        title: 'Nueva Proyección',
        headerShown: true 
      }} />
      
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>Registrar Proyección de Pedido</ThemedText>

        <ThemedView style={styles.form}>
          {/* Primera fila: Almacén y Estado juntos */}
          <ThemedView style={styles.rowContainer}>
            {/* Almacén Selector */}
            <ThemedView style={[styles.formGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Almacén {isAdmin ? '(Admin)' : ''}</ThemedText>
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

            {/* Estado del Pedido */}
            <ThemedView style={[styles.formGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Estado</ThemedText>
              <View style={[
                styles.pickerContainer,
                { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
              ]}>
                <Picker
                  selectedValue={formData.estado}
                  onValueChange={(value) => handleChange('estado', value)}
                  style={[
                    styles.picker,
                    { color: Colors[colorScheme].text }
                  ]}
                >
                  <Picker.Item label="Programado" value="programado" />
                  <Picker.Item label="Confirmado" value="confirmado" />
                </Picker>
              </View>
            </ThemedView>
          </ThemedView>

          {/* Segunda fila: Fecha de entrega */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Fecha de Entrega *</ThemedText>
            <TouchableOpacity 
              style={[
                styles.input,
                errors.fecha_entrega && styles.inputError,
                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText style={{ color: Colors[colorScheme].text }}>
                {formData.fecha_entrega ? new Date(formData.fecha_entrega).toLocaleDateString() : 'Seleccionar fecha'}
              </ThemedText>
              <IconSymbol name="calendar" size={20} color={Colors[colorScheme].text} />
            </TouchableOpacity>
            {errors.fecha_entrega && (
              <ThemedText style={styles.errorText}>{errors.fecha_entrega}</ThemedText>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={formData.fecha_entrega ? new Date(formData.fecha_entrega) : new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()} // No permitir fechas pasadas
              />
            )}
          </ThemedView>

          {/* Cliente Selector */}
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

          {/* Notas */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Notas (opcional)</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: Colors[colorScheme].text }
              ]}
              value={formData.notas}
              onChangeText={(value) => handleChange('notas', value)}
              placeholder="Información adicional sobre la proyección"
              placeholderTextColor="#9BA1A6"
              multiline
              numberOfLines={3}
            />
          </ThemedView>

          {/* Detalles del Pedido - Usando el nuevo ProductSelector */}
          <ThemedView style={styles.detallesSection}>
            <ThemedText type="subtitle" style={styles.subheading}>Productos</ThemedText>
            
            <ProductSelector
              presentaciones={presentaciones}
              selectedProducts={detalles}
              onProductsChange={handleProductsChange}
              isLoading={isLoadingPresentaciones}
              showPriceField={true}
            />
            
            {errors.detalles && (
              <ThemedText style={styles.errorText}>{errors.detalles}</ThemedText>
            )}
          </ThemedView>

          {/* Total */}
          <ThemedView style={styles.totalSection}>
            <ThemedText style={styles.totalLabel}>Total Estimado:</ThemedText>
            <ThemedText style={styles.totalValue}>${total}</ThemedText>
          </ThemedView>

          <TouchableOpacity 
            style={[
              styles.submitButton,
              (isSubmitting || detalles.length === 0) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || detalles.length === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Registrar Proyección</ThemedText>
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  inputError: {
    borderColor: '#E53935',
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