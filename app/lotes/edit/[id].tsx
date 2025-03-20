// app/lotes/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  View
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { API_CONFIG } from '@/services/api';
import { Lote, ProductoSimple, ProveedorSimple } from '@/models';
import { loteApi } from '@/services/api';

// API para productos y proveedores
const getProductos = async (): Promise<ProductoSimple[]> => {
  return fetch(`${API_CONFIG.baseUrl}/productos?per_page=100`)
    .then(response => response.json())
    .then(data => data.data);
};

const getProveedores = async (): Promise<ProveedorSimple[]> => {
  return fetch(`${API_CONFIG.baseUrl}/proveedores?per_page=100`)
    .then(response => response.json())
    .then(data => data.data);
};

export default function EditLoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [productos, setProductos] = useState<ProductoSimple[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorSimple[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Lote>>({
    producto_id: '',
    proveedor_id: '',
    peso_humedo_kg: '',
    peso_seco_kg: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
  });

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load lote data & related data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Cargar datos relacionados y lote en paralelo
        const [productosData, proveedoresData, loteData] = await Promise.all([
          getProductos(),
          getProveedores(),
          loteApi.getLote(parseInt(id)),
        ]);
        
        setProductos(productosData);
        setProveedores(proveedoresData);
        
        if (loteData) {
          setFormData({
            producto_id: loteData.producto_id.toString(),
            proveedor_id: loteData.proveedor_id ? loteData.proveedor_id.toString() : '',
            peso_humedo_kg: loteData.peso_humedo_kg.toString(),
            peso_seco_kg: loteData.peso_seco_kg ? loteData.peso_seco_kg.toString() : '',
            fecha_ingreso: loteData.fecha_ingreso.split('T')[0],
          });
        } else {
          Alert.alert('Error', 'No se pudo cargar los datos del lote');
          router.back();
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        Alert.alert('Error', 'No se pudo cargar los datos necesarios');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (field: keyof Lote, value: string) => {
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
    
    if (!formData.peso_humedo_kg?.trim()) {
      newErrors.peso_humedo_kg = 'El peso húmedo es requerido';
    } else if (isNaN(parseFloat(formData.peso_humedo_kg)) || parseFloat(formData.peso_humedo_kg) <= 0) {
      newErrors.peso_humedo_kg = 'Ingrese un peso válido';
    }
    
    // Validar peso seco solo si se ha ingresado
    if (formData.peso_seco_kg?.trim() && (isNaN(parseFloat(formData.peso_seco_kg)) || parseFloat(formData.peso_seco_kg) <= 0)) {
      newErrors.peso_seco_kg = 'Ingrese un peso válido';
    }
    
    // Validar que el peso seco no sea mayor que el peso húmedo
    if (formData.peso_seco_kg?.trim() && formData.peso_humedo_kg?.trim() && 
        parseFloat(formData.peso_seco_kg) > parseFloat(formData.peso_humedo_kg)) {
      newErrors.peso_seco_kg = 'El peso seco no puede ser mayor que el peso húmedo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !id) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const loteData = {
        producto_id: parseInt(formData.producto_id!),
        proveedor_id: formData.proveedor_id ? parseInt(formData.proveedor_id) : null,
        peso_humedo_kg: parseFloat(formData.peso_humedo_kg!.replace(',', '.')),
        peso_seco_kg: formData.peso_seco_kg?.trim() 
          ? parseFloat(formData.peso_seco_kg.replace(',', '.')) 
          : null,
        fecha_ingreso: `${formData.fecha_ingreso}T00:00:00Z`,
      };
      
      const response = await loteApi.updateLote(parseInt(id), loteData);
      
      if (response) {
        Alert.alert(
          'Lote Actualizado',
          'El lote ha sido actualizado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar el lote');
      }
    } catch (err) {
      console.error('Error al actualizar lote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar el lote';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Lote',
          headerShown: true 
        }} />
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos del lote...</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Editar Lote',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Editar Lote</ThemedText>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Producto *</ThemedText>
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
              {errors.producto_id && (
                <ThemedText style={styles.errorText}>{errors.producto_id}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Proveedor</ThemedText>
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

            <ThemedView style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
              >
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>

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
                  <ThemedText style={styles.submitButtonText}>Guardar Cambios</ThemedText>
                )}
              </TouchableOpacity>
            </ThemedView>
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
  loadingContainer: {
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
  },
  helperText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#4CAF50', // Verde para lotes
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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