// Add this to app/ventas/create.tsx if it doesn't exist already

import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ventaApi, clienteApi, productoApi, almacenApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Cliente, Producto, Almacen } from '@/models';

export default function CreateVentaScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data for dropdowns
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    cliente_id: '',
    almacen_id: '',
    fecha: new Date().toISOString(), // Format YYYY-MM-DD
    tipo_pago: 'contado',
    estado_pago: 'pagado',
    total: '',
  });

  // Detalles de venta
  const [detalles, setDetalles] = useState([
    { producto_id: '', cantidad: '1' }
  ]);

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Load clientes, productos, almacenes in parallel
        const [clientesRes, productosRes, almacenesRes] = await Promise.all([
          clienteApi.getClientes(),
          productoApi.getProductos(),
          almacenApi.getAlmacenes()
        ]);
        
        setClientes(clientesRes.data || []);
        setProductos(productosRes.data || []);
        setAlmacenes(almacenesRes.data || []);
        
        // Set initial form values if data is available
        if (clientesRes.data?.length > 0) {
          setFormData(prev => ({ ...prev, cliente_id: clientesRes.data[0].id.toString() }));
        }
        
        if (productosRes.data?.length > 0) {
          setDetalles([{ producto_id: productosRes.data[0].id.toString(), cantidad: '1' }]);
        }
        
        if (almacenesRes.data?.length > 0) {
          setFormData(prev => ({ ...prev, almacen_id: almacenesRes.data[0].id.toString() }));
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

  const handleDetalleChange = (index: number, field: string, value: string) => {
    const newDetalles = [...detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setDetalles(newDetalles);
  };

  const addDetalle = () => {
    if (productos.length > 0) {
      setDetalles([...detalles, { producto_id: productos[0].id.toString(), cantidad: '1' }]);
    } else {
      Alert.alert('Error', 'No hay productos disponibles para agregar');
    }
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
      const producto = productos.find(p => p.id.toString() === detalle.producto_id);
      if (producto) {
        total += parseFloat(producto.precio_compra) * parseInt(detalle.cantidad);
      }
    });
    
    // Update form data with the calculated total
    setFormData(prev => ({
      ...prev,
      total: total.toFixed(2)
    }));
    
    return total.toFixed(2);
  };

  // Recalculate total when detalles change
  useEffect(() => {
    if (productos.length > 0) {
      calculateTotal();
    }
  }, [detalles, productos]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cliente_id) {
      newErrors.cliente_id = 'El cliente es requerido';
    }
    
    if (!formData.almacen_id) {
      newErrors.almacen_id = 'El almacén es requerido';
    }
    
    if (!formData.total || parseFloat(formData.total) <= 0) {
      newErrors.total = 'El total debe ser mayor a 0';
    }
    
    // Validate at least one detalle
    if (detalles.length === 0) {
      newErrors.detalles = 'Debe agregar al menos un producto';
    }
    
    // Validate each detalle
    detalles.forEach((detalle, index) => {
      if (!detalle.producto_id) {
        newErrors[`detalle_${index}_producto`] = 'El producto es requerido';
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
    
    try {
      setIsSubmitting(true);
      
      // Prepare data for API
      const ventaData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id),
        fecha: formData.fecha,
        tipo_pago: formData.tipo_pago,
        estado_pago: formData.estado_pago,
        total: formData.total,
        detalles: detalles.map(d => ({
          producto_id: parseInt(d.producto_id),
          cantidad: parseInt(d.cantidad)
        }))
      };
      
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

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Nueva Venta',
        headerShown: true 
      }} />
      
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>Registrar Venta</ThemedText>

        <ThemedView style={styles.form}>
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

          {/* Almacén Selector */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Almacén *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.almacen_id}
                onValueChange={(value) => handleChange('almacen_id', value)}
                style={[
                  styles.picker,
                  { color: Colors[colorScheme].text }
                ]}
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
            {errors.almacen_id && (
              <ThemedText style={styles.errorText}>{errors.almacen_id}</ThemedText>
            )}
          </ThemedView>

          {/* Tipo de Pago */}
          <ThemedView style={styles.formGroup}>
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

          {/* Estado de Pago */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Estado de Pago</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.estado_pago}
                onValueChange={(value) => handleChange('estado_pago', value)}
                style={[
                  styles.picker,
                  { color: Colors[colorScheme].text }
                ]}
              >
                <Picker.Item label="Pagado" value="pagado" />
                <Picker.Item label="Pendiente" value="pendiente" />
                <Picker.Item label="Pago Parcial" value="parcial" />
              </Picker>
            </View>
          </ThemedView>

          {/* Fecha */}
          <ThemedView style={styles.formGroup}>
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

          {/* Detalles de la Venta */}
          <ThemedView style={styles.detallesSection}>
            <ThemedText type="subtitle" style={styles.subheading}>Detalles de la Venta</ThemedText>
            
            {detalles.map((detalle, index) => (
              <ThemedView key={index} style={styles.detalleItem}>
                <ThemedText style={styles.detalleHeader}>Producto {index + 1}</ThemedText>
                
                <ThemedView style={styles.detalleRow}>
                  <ThemedView style={styles.detalleField}>
                    <ThemedText style={styles.label}>Producto</ThemedText>
                    <View style={[
                      styles.pickerContainer,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
                    ]}>
                      <Picker
                        selectedValue={detalle.producto_id}
                        onValueChange={(value) => handleDetalleChange(index, 'producto_id', value)}
                        style={[
                          styles.picker,
                          { color: Colors[colorScheme].text }
                        ]}
                      >
                        {productos.map(producto => (
                          <Picker.Item 
                            key={producto.id} 
                            label={producto.nombre} 
                            value={producto.id.toString()} 
                          />
                        ))}
                      </Picker>
                    </View>
                    {errors[`detalle_${index}_producto`] && (
                      <ThemedText style={styles.errorText}>{errors[`detalle_${index}_producto`]}</ThemedText>
                    )}
                  </ThemedView>
                  
                  <ThemedView style={styles.cantidadField}>
                    <ThemedText style={styles.label}>Cantidad</ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        { color: Colors[colorScheme].text }
                      ]}
                      value={detalle.cantidad}
                      onChangeText={(value) => handleDetalleChange(index, 'cantidad', value)}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor="#9BA1A6"
                    />
                    {errors[`detalle_${index}_cantidad`] && (
                      <ThemedText style={styles.errorText}>{errors[`detalle_${index}_cantidad`]}</ThemedText>
                    )}
                  </ThemedView>
                  
                  {detalles.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeDetalle(index)}
                    >
                      <ThemedText style={styles.removeButtonText}>X</ThemedText>
                    </TouchableOpacity>
                  )}
                </ThemedView>
              </ThemedView>
            ))}
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addDetalle}
            >
              <ThemedText style={styles.addButtonText}>+ Agregar Producto</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Total */}
          <ThemedView style={styles.totalSection}>
            <ThemedText style={styles.totalLabel}>Total:</ThemedText>
            <ThemedText style={styles.totalValue}>${formData.total}</ThemedText>
          </ThemedView>

          <TouchableOpacity 
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
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
  formGroup: {
    gap: 4,
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
  picker: {
    height: 50,
    width: '100%',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 4,
  },
  detallesSection: {
    marginTop: 16,
    gap: 12,
  },
  subheading: {
    marginBottom: 8,
  },
  detalleItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  detalleHeader: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detalleRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  detalleField: {
    flex: 3,
    gap: 4,
  },
  cantidadField: {
    flex: 1,
    gap: 4,
  },
  removeButton: {
    backgroundColor: '#E53935',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButton: {
    borderWidth: 1,
    borderColor: '#0a7ea4',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#0a7ea4',
    fontSize: 16,
    fontWeight: '500',
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