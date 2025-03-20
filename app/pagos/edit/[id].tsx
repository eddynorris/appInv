// app/pagos/edit/[id].tsx
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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { pagoApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Pago } from '@/models';

// Métodos de pago disponibles
const METODOS_PAGO = [
  'efectivo',
  'transferencia',
  'tarjeta'
];

export default function EditPagoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Pago>>({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: METODOS_PAGO[0],
    referencia: '',
  });

  // Comprobante file state
  const [comprobante, setComprobante] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // Comprobante existente
  const [existingComprobante, setExistingComprobante] = useState<string | null>(null);

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load pago data
  useEffect(() => {
    const fetchPago = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await pagoApi.getPago(parseInt(id));
        
        if (response) {
          setFormData({
            venta_id: response.venta_id.toString(),
            monto: response.monto || '',
            fecha: response.fecha ? response.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
            metodo_pago: response.metodo_pago || METODOS_PAGO[0],
            referencia: response.referencia || '',
          });
          
          if (response.url_comprobante) {
            setExistingComprobante(response.url_comprobante);
          }
        } else {
          Alert.alert('Error', 'No se pudo cargar los datos del pago');
          router.back();
        }
      } catch (error) {
        console.error('Error al cargar pago:', error);
        Alert.alert('Error', 'No se pudo cargar los datos del pago');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchPago();
  }, [id]);

  const handleChange = (field: keyof Pago, value: string) => {
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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validar el tamaño del archivo (máximo 5MB)
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert('Error', 'El archivo es demasiado grande. El tamaño máximo es 5MB.');
          return;
        }
        
        setComprobante({
          uri: asset.uri,
          name: asset.name || 'comprobante',
          type: asset.mimeType || (asset.name?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
        });
        
        // Limpiar el error de comprobante si existe
        if (errors.comprobante) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.comprobante;
            return newErrors;
          });
        }
      }
    } catch (error) {
      console.error('Error al seleccionar documento:', error);
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.monto?.trim()) {
      newErrors.monto = 'El monto es requerido';
    } else if (isNaN(parseFloat(formData.monto)) || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'Ingrese un monto válido';
    }
    
    // Si el método de pago es transferencia, se requiere referencia
    if (formData.metodo_pago === 'transferencia') {
      if (!formData.referencia?.trim()) {
        newErrors.referencia = 'La referencia es requerida para transferencias';
      }
      
      // Si no hay comprobante existente y tampoco se ha seleccionado uno nuevo
      if (!existingComprobante && !comprobante) {
        newErrors.comprobante = 'El comprobante es requerido para transferencias';
      }
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
      
      const pagoData = {
        monto: formData.monto?.replace(',', '.'),
        fecha: formData.fecha,
        metodo_pago: formData.metodo_pago,
        referencia: formData.referencia
      };
      
      let response;
      
      // Si hay un nuevo comprobante, usar el método con comprobante
      if (comprobante) {
        response = await pagoApi.updatePagoWithComprobante(parseInt(id), pagoData, comprobante.uri);
      } else {
        response = await pagoApi.updatePago(parseInt(id), pagoData);
      }
      
      if (response) {
        Alert.alert(
          'Pago Actualizado',
          'El pago ha sido actualizado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar el pago');
      }
    } catch (err) {
      console.error('Error al actualizar pago:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar el pago';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Pago',
          headerShown: true 
        }} />
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos del pago...</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Editar Pago',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Editar Pago</ThemedText>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Venta ID</ThemedText>
              <ThemedView style={styles.disabledInput}>
                <ThemedText>{formData.venta_id}</ThemedText>
              </ThemedView>
              <ThemedText style={styles.helperText}>
                El ID de venta no se puede modificar
              </ThemedText>
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
              <ThemedText style={styles.label}>Método de Pago</ThemedText>
              <View style={[
                styles.pickerContainer,
                { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
              ]}>
                <Picker
                  selectedValue={formData.metodo_pago}
                  onValueChange={(value) => handleChange('metodo_pago', value)}
                  style={[
                    styles.picker,
                    { color: Colors[colorScheme].text }
                  ]}
                  dropdownIconColor={Colors[colorScheme].text}
                >
                  <Picker.Item 
                    label="Efectivo" 
                    value="efectivo" 
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
                  <Picker.Item 
                    label="Transferencia" 
                    value="transferencia" 
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
                  <Picker.Item 
                    label="Tarjeta" 
                    value="tarjeta" 
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
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

            {(formData.metodo_pago === 'transferencia' || formData.metodo_pago === 'tarjeta') && (
              <ThemedView style={styles.formGroup}>
                <ThemedText style={styles.label}>Referencia {formData.metodo_pago === 'transferencia' ? '*' : ''}</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { color: Colors[colorScheme].text },
                    errors.referencia && styles.inputError
                  ]}
                  value={formData.referencia}
                  onChangeText={(value) => handleChange('referencia', value)}
                  placeholder="Número de referencia"
                  placeholderTextColor="#9BA1A6"
                />
                {errors.referencia && (
                  <ThemedText style={styles.errorText}>{errors.referencia}</ThemedText>
                )}
              </ThemedView>
            )}

            {formData.metodo_pago === 'transferencia' && (
              <ThemedView style={styles.formGroup}>
                <ThemedText style={styles.label}>Comprobante {!existingComprobante ? '*' : ''}</ThemedText>
                
                {existingComprobante && (
                  <ThemedView style={styles.existingComprobante}>
                    <IconSymbol name="doc.fill" size={24} color="#4CAF50" />
                    <ThemedText>Comprobante ya cargado</ThemedText>
                  </ThemedView>
                )}
                
                <TouchableOpacity 
                  style={[
                    styles.fileSelector,
                    comprobante ? styles.fileSelectorSuccess : null,
                    errors.comprobante && styles.inputError
                  ]}
                  onPress={pickDocument}
                >
                  <IconSymbol 
                    name={comprobante ? "doc.fill" : "paperplane.fill"} 
                    size={24} 
                    color="#757575" 
                  />
                  <ThemedText style={styles.fileSelectorText}>
                    {comprobante 
                      ? comprobante.name 
                      : existingComprobante 
                        ? 'Cambiar comprobante' 
                        : 'Seleccionar comprobante'
                    }
                  </ThemedText>
                </TouchableOpacity>
                
                {errors.comprobante && (
                  <ThemedText style={styles.errorText}>{errors.comprobante}</ThemedText>
                )}
                
                <ThemedText style={styles.helperText}>
                  Formatos aceptados: JPG, PNG, PDF (máx. 5MB)
                </ThemedText>
              </ThemedView>
            )}

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
  disabledInput: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F5F5F7',
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
  existingComprobante: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
  },
  fileSelectorSuccess: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  fileSelectorText: {
    color: '#757575',
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