import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { API_CONFIG } from '@/services/api';
import { ProductoSimple, ProveedorSimple } from '@/models';
import { loteApi, productoApi, proveedorApi } from '@/services/api';

export default function CreateLoteScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productos, setProductos] = useState<ProductoSimple[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorSimple[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    producto_id: '',
    proveedor_id: '',
    peso_humedo_kg: '',
    peso_seco_kg: '',
    fecha_ingreso: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
  });

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar productos y proveedores
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);

        const response = await productoApi.getProductos(1, 100);
        const productosData = response.data; // Si la respuesta es { data: [...] }

        const response2 = await proveedorApi.getProveedores(1, 100);
        const proveedoresData = response2.data; // Si la respuesta es { data: [...] }

        setProductos(productosData);
        setProveedores(proveedoresData);
        
        // Preseleccionar el primer producto y proveedor si existen
        if (productosData.length > 0) {
          setFormData(prev => ({
            ...prev,
            producto_id: productosData[0].id.toString()
          }));
        }
        
        if (proveedoresData.length > 0) {
          setFormData(prev => ({
            ...prev,
            proveedor_id: proveedoresData[0].id.toString()
          }));
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        Alert.alert('Error', 'No se pudieron cargar los productos o proveedores');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.producto_id) {
      newErrors.producto_id = 'El producto es requerido';
    }
    
    if (!formData.peso_humedo_kg.trim()) {
      newErrors.peso_humedo_kg = 'El peso húmedo es requerido';
    } else if (isNaN(parseFloat(formData.peso_humedo_kg)) || parseFloat(formData.peso_humedo_kg) <= 0) {
      newErrors.peso_humedo_kg = 'Ingrese un peso válido';
    }
    
    // Validar peso seco solo si se ha ingresado
    if (formData.peso_seco_kg.trim() && (isNaN(parseFloat(formData.peso_seco_kg)) || parseFloat(formData.peso_seco_kg) <= 0)) {
      newErrors.peso_seco_kg = 'Ingrese un peso válido';
    }
    
    // Validar que el peso seco no sea mayor que el peso húmedo
    if (formData.peso_seco_kg.trim() && formData.peso_humedo_kg.trim() && 
        parseFloat(formData.peso_seco_kg) > parseFloat(formData.peso_humedo_kg)) {
      newErrors.peso_seco_kg = 'El peso seco no puede ser mayor que el peso húmedo';
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
      
      const loteData = {
        producto_id: parseInt(formData.producto_id),
        proveedor_id: formData.proveedor_id ? parseInt(formData.proveedor_id) : null,
        peso_humedo_kg: parseFloat(formData.peso_humedo_kg.replace(',', '.')),
        peso_seco_kg: formData.peso_seco_kg ? parseFloat(formData.peso_seco_kg.replace(',', '.')) : null,
        fecha_ingreso: `${formData.fecha_ingreso}T00:00:00Z`,
      };
      
      const response = await loteApi.createLote(loteData);
      
      if (response) {
        Alert.alert(
          'Lote Registrado',
          'El lote ha sido registrado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/lotes') 
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo registrar el lote');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al registrar el lote';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Registrar Lote',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Registrar Lote</ThemedText>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Producto *</ThemedText>
              {isLoadingData ? (
                <ThemedView style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
                  <ThemedText>Cargando productos...</ThemedText>
                </ThemedView>
             ) : (!productos || productos.length === 0) ? ( 
                <ThemedView style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>
                    No hay productos disponibles
                  </ThemedText>
                </ThemedView>
              ) : (
                <View style={[
                  styles.pickerContainer,
                  { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
                ]}>
                  <Picker
                    selectedValue={formData.producto_id}
                    onValueChange={(value) => handleChange('producto_id', value.toString())}
                    style={[
                      styles.picker,
                      { color: Colors[colorScheme].text }
                    ]}
                    dropdownIconColor={Colors[colorScheme].text}
                  >
                    {productos.map((producto) => (
                      <Picker.Item 
                        key={producto.id} 
                        label={producto.nombre} 
                        value={producto.id.toString()} 
                        color={isDark ? '#FFFFFF' : '#000000'}
                      />
                    ))}
                  </Picker>
                </View>
              )}
              {errors.producto_id && (
                <ThemedText style={styles.errorText}>{errors.producto_id}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Proveedor</ThemedText>
              {isLoadingData ? (
                <ThemedView style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
                  <ThemedText>Cargando proveedores...</ThemedText>
                </ThemedView>
              ) : (
                <View style={[
                  styles.pickerContainer,
                  { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
                ]}>
                  <Picker
                    selectedValue={formData.proveedor_id}
                    onValueChange={(value) => handleChange('proveedor_id', value.toString())}
                    style={[
                      styles.picker,
                      { color: Colors[colorScheme].text }
                    ]}
                    dropdownIconColor={Colors[colorScheme].text}
                  >
                    <Picker.Item 
                      label="(Sin proveedor)" 
                      value="" 
                      color={isDark ? '#FFFFFF' : '#000000'}
                    />
                    {proveedores.map((proveedor) => (
                      <Picker.Item 
                        key={proveedor.id} 
                        label={proveedor.nombre} 
                        value={proveedor.id.toString()} 
                        color={isDark ? '#FFFFFF' : '#000000'}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Peso Húmedo (kg) *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text },
                  errors.peso_humedo_kg && styles.inputError
                ]}
                value={formData.peso_humedo_kg}
                onChangeText={(value) => handleChange('peso_humedo_kg', value)}
                placeholder="0.00"
                placeholderTextColor="#9BA1A6"
                keyboardType="numeric"
              />
              {errors.peso_humedo_kg && (
                <ThemedText style={styles.errorText}>{errors.peso_humedo_kg}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Peso Seco (kg)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text },
                  errors.peso_seco_kg && styles.inputError
                ]}
                value={formData.peso_seco_kg}
                onChangeText={(value) => handleChange('peso_seco_kg', value)}
                placeholder="0.00 (opcional)"
                placeholderTextColor="#9BA1A6"
                keyboardType="numeric"
              />
              {errors.peso_seco_kg && (
                <ThemedText style={styles.errorText}>{errors.peso_seco_kg}</ThemedText>
              )}
              <ThemedText style={styles.helperText}>
                Puede dejar vacío si aún no se ha secado
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Fecha de Ingreso</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text }
                ]}
                value={formData.fecha_ingreso}
                onChangeText={(value) => handleChange('fecha_ingreso', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9BA1A6"
              />
              <ThemedText style={styles.helperText}>
                Formato: YYYY-MM-DD (ej. 2023-12-31)
              </ThemedText>
            </ThemedView>

            <TouchableOpacity 
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || productos.length === 0}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Registrar Lote</ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
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
  },
  helperText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#4CAF50', // Verde para lotes
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7', // Verde claro
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});