// app/pagos/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  View,
  Image
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { pagoApi, API_CONFIG } from '@/services/api';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  
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
          // Asegurar que la fecha sea correcta
          const fechaFormateada = response.fecha 
            ? new Date(response.fecha).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0];
            
          setFormData({
            venta_id: response.venta_id.toString(),
            monto: response.monto || '',
            fecha: fechaFormateada,
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

  // Solicitar permisos para acceder a la cámara y galería
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert('Permisos necesarios', 'Se requieren permisos de cámara y galería para subir fotos.');
      }
    })();
  }, []);

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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validar el tamaño del archivo (máximo 5MB)
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert('Error', 'El archivo es demasiado grande. El tamaño máximo es 5MB.');
          return;
        }
        
        // Determinar el tipo MIME
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const mimeType = fileType === 'pdf' ? 'application/pdf' : `image/${fileType}`;
        
        setComprobante({
          uri: asset.uri,
          name: asset.fileName || `comprobante.${fileType}`,
          type: mimeType
        });
        
        // Ya no necesitamos mostrar el comprobante existente
        setExistingComprobante(null);
        
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
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validar el tamaño del archivo (máximo 5MB)
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert('Error', 'El archivo es demasiado grande. El tamaño máximo es 5MB.');
          return;
        }
        
        // Determinar el tipo MIME
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const mimeType = fileType === 'pdf' ? 'application/pdf' : `image/${fileType}`;
        
        setComprobante({
          uri: asset.uri,
          name: asset.fileName || `comprobante.${fileType}`,
          type: mimeType
        });
        
        // Ya no necesitamos mostrar el comprobante existente
        setExistingComprobante(null);
        
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
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
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
        
        // Ya no necesitamos mostrar el comprobante existente
        setExistingComprobante(null);
        
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      handleChange('fecha', formattedDate);
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
      
      // Asegurar que la fecha está en el formato correcto para la API
      let fechaFormateada = formData.fecha;
      if (fechaFormateada && !fechaFormateada.includes('T')) {
        fechaFormateada = `${fechaFormateada}T00:00:00Z`;
      }
      
      const pagoData = {
        monto: formData.monto?.replace(',', '.'),
        fecha: fechaFormateada,
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

  // Función para ver el comprobante existente
  const viewExistingComprobante = () => {
    if (existingComprobante) {
      const comprobanteUrl = `${API_CONFIG.baseUrl}/uploads/${existingComprobante}`;
      // Abrir el comprobante (esto depende de la capacidad del dispositivo)
      // Por ahora mostrar la URL
      Alert.alert('Comprobante', `URL: ${comprobanteUrl}`);
    }
  };

  // Función para eliminar el comprobante existente
  const removeExistingComprobante = () => {
    Alert.alert(
      'Eliminar Comprobante',
      '¿Está seguro que desea eliminar el comprobante actual?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setExistingComprobante(null);
            setComprobante(null);
          }
        }
      ]
    );
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
              <TouchableOpacity 
                style={[
                  styles.input,
                  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText style={{ color: Colors[colorScheme].text }}>
                  {formData.fecha ? new Date(formData.fecha).toLocaleDateString() : 'Seleccionar fecha'}
                </ThemedText>
                <IconSymbol name="calendar" size={20} color={Colors[colorScheme].text} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.fecha ? new Date(formData.fecha) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
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
                <ThemedText style={styles.label}>Comprobante {!existingComprobante && !comprobante ? '*' : ''}</ThemedText>
                
                {existingComprobante && (
                  <ThemedView style={styles.existingComprobante}>
                    <IconSymbol name="doc.fill" size={24} color="#4CAF50" />
                    <ThemedText style={styles.existingComprobanteText}>Comprobante ya cargado</ThemedText>
                    <View style={styles.existingComprobanteButtons}>
                      <TouchableOpacity 
                        style={[styles.smallButton, { backgroundColor: '#2196F3' }]}
                        onPress={viewExistingComprobante}
                      >
                        <IconSymbol name="eye.fill" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.smallButton, { backgroundColor: '#F44336' }]}
                        onPress={removeExistingComprobante}
                      >
                        <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </ThemedView>
                )}
                
                {comprobante && (
                  <ThemedView style={styles.comprobantePreview}>
                    <IconSymbol 
                      name={comprobante.type.includes('pdf') ? "doc.fill" : "photo.fill"} 
                      size={24} 
                      color="#0a7ea4" 
                    />
                    <ThemedText style={styles.comprobanteText}>
                      {comprobante.name}
                    </ThemedText>
                    <TouchableOpacity 
                      style={[styles.smallButton, { backgroundColor: '#F44336' }]}
                      onPress={() => setComprobante(null)}
                    >
                      <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </ThemedView>
                )}
                
                <ThemedView style={styles.comprobanteButtons}>
                  <TouchableOpacity 
                    style={[styles.comprobanteButton, { backgroundColor: '#2196F3' }]}
                    onPress={pickImage}
                  >
                    <IconSymbol name="photo" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.comprobanteButtonText}>
                      Galería
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.comprobanteButton, { backgroundColor: '#4CAF50' }]}
                    onPress={takePhoto}
                  >
                    <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.comprobanteButtonText}>
                      Cámara
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.comprobanteButton, { backgroundColor: '#9C27B0' }]}
                    onPress={pickDocument}
                  >
                    <IconSymbol name="doc.fill" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.comprobanteButtonText}>
                      PDF
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
                
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
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  existingComprobanteText: {
    flex: 1,
    marginLeft: 8,
    fontWeight: '500',
  },
  existingComprobanteButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  comprobantePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  comprobanteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  comprobanteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  comprobanteButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  comprobanteText: {
    flex: 1,
    color: '#0a7ea4',
    fontWeight: '500',
  },
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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