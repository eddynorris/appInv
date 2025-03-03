// app/gastos/edit/[id].tsx
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
import { gastoApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Gasto } from '@/models';

// Categorías de gastos predefinidas
const CATEGORIAS = [
  'Servicios',
  'Personal',
  'Alquiler',
  'Marketing',
  'Logística',
  'Otros'
];

export default function EditGastoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Gasto>>({
    descripcion: '',
    monto: '',
    categoria: CATEGORIAS[0],
    fecha: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
  });

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load gasto data
  useEffect(() => {
    const fetchGasto = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await gastoApi.getGasto(parseInt(id));
        
        if (response) {
          setFormData({
            descripcion: response.descripcion || '',
            monto: response.monto || '',
            categoria: response.categoria || CATEGORIAS[0],
            fecha: response.fecha ? response.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
          });
        } else {
          Alert.alert('Error', 'No se pudo cargar los datos del gasto');
          router.back();
        }
      } catch (error) {
        console.error('Error al cargar gasto:', error);
        Alert.alert('Error', 'No se pudo cargar los datos del gasto');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchGasto();
  }, [id]);

  const handleChange = (field: keyof Gasto, value: string) => {
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
    
    if (!formData.descripcion?.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }
    
    if (!formData.monto?.trim()) {
      newErrors.monto = 'El monto es requerido';
    } else if (isNaN(parseFloat(formData.monto)) || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'Ingrese un monto válido';
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
      
      const gastoData = {
        ...formData,
        monto: formData.monto?.replace(',', '.') // Asegurar formato decimal correcto
      };
      
      const response = await gastoApi.updateGasto(parseInt(id), gastoData);
      
      if (response) {
        Alert.alert(
          'Gasto Actualizado',
          'El gasto ha sido actualizado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar el gasto');
      }
    } catch (err) {
      console.error('Error al actualizar gasto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar el gasto';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Gasto',
          headerShown: true 
        }} />
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos del gasto...</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Editar Gasto',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Editar Gasto</ThemedText>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Descripción *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text },
                  errors.descripcion && styles.inputError
                ]}
                value={formData.descripcion}
                onChangeText={(value) => handleChange('descripcion', value)}
                placeholder="Ingresa la descripción del gasto"
                placeholderTextColor="#9BA1A6"
              />
              {errors.descripcion && (
                <ThemedText style={styles.errorText}>{errors.descripcion}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Monto *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text },
                  errors.monto && styles.inputError
                ]}
                value={formData.monto}
                onChangeText={(value) => handleChange('monto', value)}
                placeholder="0.00"
                placeholderTextColor="#9BA1A6"
                keyboardType="numeric"
              />
              {errors.monto && (
                <ThemedText style={styles.errorText}>{errors.monto}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Categoría</ThemedText>
              <View style={[
                styles.pickerContainer,
                { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
              ]}>
                <Picker
                  selectedValue={formData.categoria}
                  onValueChange={(value) => handleChange('categoria', value)}
                  style={[
                    styles.picker,
                    { color: Colors[colorScheme].text }
                  ]}
                  dropdownIconColor={Colors[colorScheme].text}
                >
                  {CATEGORIAS.map((categoria) => (
                    <Picker.Item 
                      key={categoria} 
                      label={categoria} 
                      value={categoria} 
                      color={isDark ? '#FFFFFF' : '#000000'}
                    />
                  ))}
                </Picker>
              </View>
            </ThemedView>

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
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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