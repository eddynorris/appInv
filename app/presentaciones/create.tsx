import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, View, Switch } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { presentacionApi, productoApi } from '@/services/api';
import { Producto } from '@/models';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Tipos de presentación disponibles
const TIPOS_PRESENTACION = [
  'bruto', 
  'procesado', 
  'merma', 
  'briqueta', 
  'detalle'
];

export default function CreatePresentacionScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProductos, setIsLoadingProductos] = useState(true);
  
  // Datos de productos para selector
  const [productos, setProductos] = useState<Producto[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    producto_id: '',
    nombre: '',
    capacidad_kg: '',
    tipo: TIPOS_PRESENTACION[0],
    precio_venta: '',
    activo: true,
  });

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar productos para selector
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setIsLoadingProductos(true);
        const response = await productoApi.getProductos(1, 100); // Cargar hasta 100 productos
        
        if (response && response.data && response.data.length > 0) {
          setProductos(response.data);
          setFormData(prev => ({
            ...prev,
            producto_id: response.data[0].id.toString()
          }));
        } else {
          Alert.alert('Error', 'No hay productos disponibles para crear una presentación');
        }
      } catch (error) {
        console.error('Error fetching productos:', error);
        Alert.alert('Error', 'No se pudieron cargar los productos');
      } finally {
        setIsLoadingProductos(false);
      }
    };

    fetchProductos();
  }, []);

  const handleChange = (field: string, value: string | boolean) => {
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.producto_id) {
      newErrors.producto_id = 'El producto es requerido';
    }
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.capacidad_kg.trim()) {
      newErrors.capacidad_kg = 'La capacidad es requerida';
    } else if (isNaN(parseFloat(formData.capacidad_kg)) || parseFloat(formData.capacidad_kg) <= 0) {
      newErrors.capacidad_kg = 'Ingrese una capacidad válida';
    }
    
    if (!formData.precio_venta.trim()) {
      newErrors.precio_venta = 'El precio es requerido';
    } else if (isNaN(parseFloat(formData.precio_venta)) || parseFloat(formData.precio_venta) < 0) {
      newErrors.precio_venta = 'Ingrese un precio válido';
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
      
      const presentacionData = {
        ...formData,
        producto_id: parseInt(formData.producto_id),
        capacidad_kg: formData.capacidad_kg.replace(',', '.'),
        precio_venta: formData.precio_venta.replace(',', '.')
      };
      
      const response = await presentacionApi.createPresentacion(presentacionData);
      
      if (response) {
        Alert.alert(
          'Presentación Creada',
          'La presentación ha sido creada exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/presentaciones') 
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo crear la presentación');
      }
    } catch (err) {
      console.error('Error creating presentacion:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al crear la presentación';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProductos) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Nueva Presentación',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando productos...</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Nueva Presentación',
        headerShown: true 
      }} />
      
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>Crear Presentación</ThemedText>

        <ThemedView style={styles.form}>
          {/* Producto Selector */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Producto *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.producto_id}
                onValueChange={(value) => handleChange('producto_id', value)}
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
            {errors.producto_id && (
              <ThemedText style={styles.errorText}>{errors.producto_id}</ThemedText>
            )}
          </ThemedView>

          {/* Nombre */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Nombre *</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme].text },
                errors.nombre && styles.inputError
              ]}
              value={formData.nombre}
              onChangeText={(value) => handleChange('nombre', value)}
              placeholder="Ingresa el nombre de la presentación"
              placeholderTextColor="#9BA1A6"
            />
            {errors.nombre && (
              <ThemedText style={styles.errorText}>{errors.nombre}</ThemedText>
            )}
          </ThemedView>

          {/* Tipo de Presentación */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Tipo de Presentación *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.tipo}
                onValueChange={(value) => handleChange('tipo', value)}
                style={[
                  styles.picker,
                  { color: Colors[colorScheme].text }
                ]}
              >
                {TIPOS_PRESENTACION.map(tipo => (
                  <Picker.Item 
                    key={tipo} 
                    label={tipo.charAt(0).toUpperCase() + tipo.slice(1)} 
                    value={tipo} 
                  />
                ))}
              </Picker>
            </View>
          </ThemedView>

          {/* Capacidad KG */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Capacidad (KG) *</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme].text },
                errors.capacidad_kg && styles.inputError
              ]}
              value={formData.capacidad_kg}
              onChangeText={(value) => handleChange('capacidad_kg', value)}
              placeholder="0.00"
              placeholderTextColor="#9BA1A6"
              keyboardType="numeric"
            />
            {errors.capacidad_kg && (
              <ThemedText style={styles.errorText}>{errors.capacidad_kg}</ThemedText>
            )}
          </ThemedView>

          {/* Precio de Venta */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Precio de Venta *</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme].text },
                errors.precio_venta && styles.inputError
              ]}
              value={formData.precio_venta}
              onChangeText={(value) => handleChange('precio_venta', value)}
              placeholder="0.00"
              placeholderTextColor="#9BA1A6"
              keyboardType="numeric"
            />
            {errors.precio_venta && (
              <ThemedText style={styles.errorText}>{errors.precio_venta}</ThemedText>
            )}
          </ThemedView>

          {/* Estado (Activo/Inactivo) */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Estado</ThemedText>
            <View style={styles.switchContainer}>
              <ThemedText>{formData.activo ? 'Activo' : 'Inactivo'}</ThemedText>
              <Switch
                value={formData.activo}
                onValueChange={(value) => handleChange('activo', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={formData.activo ? '#0a7ea4' : '#f4f3f4'}
              />
            </View>
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
              <ThemedText style={styles.submitButtonText}>Crear Presentación</ThemedText>
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
  inputError: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
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