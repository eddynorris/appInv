import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, View, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { pagoApi, ventaApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Venta } from '@/models';

// Métodos de pago disponibles
const METODOS_PAGO = [
  'efectivo',
  'transferencia',
  'tarjeta'
];

export default function CreatePagoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoadingVentas, setIsLoadingVentas] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    venta_id: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    metodo_pago: METODOS_PAGO[0],
    referencia: '',
  });

  // Comprobante file state
  const [comprobante, setComprobante] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar ventas disponibles para asignar pagos
  useEffect(() => {
    const loadVentas = async () => {
      try {
        setIsLoadingVentas(true);
        const response = await ventaApi.getVentas(1, 100);
        
        if (response && response.data) {
          // Filtrar solo ventas con pagos pendientes
          const ventasConPendientes = response.data.filter(venta => 
            venta.estado_pago === 'pendiente' || venta.estado_pago === 'parcial'
          );
          setVentas(ventasConPendientes);
          
          // Si hay ventas, preseleccionar la primera
          if (ventasConPendientes.length > 0) {
            setFormData(prev => ({
              ...prev,
              venta_id: ventasConPendientes[0].id.toString()
            }));
          }
        }
      } catch (error) {
        console.error('Error al cargar ventas:', error);
        Alert.alert('Error', 'No se pudieron cargar las ventas disponibles');
      } finally {
        setIsLoadingVentas(false);
      }
    };
    
    loadVentas();
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
    
    if (!formData.venta_id) {
      newErrors.venta_id = 'La venta es requerida';
    }
    
    if (!formData.monto.trim()) {
      newErrors.monto = 'El monto es requerido';
    } else if (isNaN(parseFloat(formData.monto)) || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'Ingrese un monto válido';
    } else if (ventaInfo && parseFloat(formData.monto) > parseFloat(ventaInfo.saldoPendiente)) {
      newErrors.monto = `El monto supera el saldo pendiente ($${ventaInfo.saldoPendiente})`;
    }
    
    // Solo para transferencias exigimos referencia y comprobante
    if (formData.metodo_pago === 'transferencia') {
      if (!formData.referencia?.trim()) {
        newErrors.referencia = 'La referencia es requerida para transferencias';
      }
      
      if (!comprobante) {
        newErrors.comprobante = 'El comprobante es requerido para transferencias';
      }
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
      
      // Crear el objeto base de datos del pago
      const pagoData = {
        venta_id: parseInt(formData.venta_id),
        monto: formData.monto.replace(',', '.'),
        fecha: formData.fecha,
        metodo_pago: formData.metodo_pago,
        referencia: formData.referencia || null // Asegurar que siempre enviamos un valor, aunque sea vacío
      };
      
      let response;
      
      // Si hay un comprobante, usar el método con comprobante
      if (comprobante) {
        console.log('Enviando pago con comprobante');
        response = await pagoApi.createPagoWithComprobante(pagoData, comprobante.uri);
      } else {
        // Si no hay comprobante, usar el método JSON estándar
        console.log('Enviando pago sin comprobante');
        response = await pagoApi.createPago(pagoData);
      }
      
      if (response) {
        Alert.alert(
          'Pago Registrado',
          'El pago ha sido registrado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/pagos') 
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo registrar el pago');
      }
    } catch (err) {
      console.error('Error detallado:', err);
      
      // Intentar obtener un mensaje de error más específico
      let errorMessage = 'Ocurrió un error al registrar el pago';
      
      // Intentar extraer el mensaje de error de diferentes formatos posibles de respuesta
      if (err.response) {
        console.error('Respuesta del servidor:', JSON.stringify(err.response));
        if (err.response.data) {
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message;
          }
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
          setIsSubmitting(false);
        }
      };

  // Obtener información de la venta seleccionada
  const getVentaInfo = () => {
    if (!formData.venta_id) return null;
    
    const ventaSeleccionada = ventas.find(v => v.id.toString() === formData.venta_id);
    if (!ventaSeleccionada) return null;
    
    return {
      total: parseFloat(ventaSeleccionada.total).toFixed(2),
      cliente: ventaSeleccionada.cliente?.nombre || 'Cliente no disponible',
      saldoPendiente: ventaSeleccionada.saldo_pendiente 
        ? parseFloat(ventaSeleccionada.saldo_pendiente).toFixed(2)
        : parseFloat(ventaSeleccionada.total).toFixed(2)
    };
  };

  const ventaInfo = getVentaInfo();

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Registrar Pago',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Registrar Pago</ThemedText>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Venta *</ThemedText>
              {isLoadingVentas ? (
                <ThemedView style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
                  <ThemedText>Cargando ventas...</ThemedText>
                </ThemedView>
              ) : ventas.length === 0 ? (
                <ThemedView style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>
                    No hay ventas con pagos pendientes
                  </ThemedText>
                </ThemedView>
              ) : (
                <View style={[
                  styles.pickerContainer,
                  { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
                ]}>
                  <Picker
                    selectedValue={formData.venta_id}
                    onValueChange={(value) => handleChange('venta_id', value.toString())}
                    style={[
                      styles.picker,
                      { color: Colors[colorScheme].text }
                    ]}
                    dropdownIconColor={Colors[colorScheme].text}
                  >
                    {ventas.map((venta) => (
                      <Picker.Item 
                        key={venta.id} 
                        label={`Venta #${venta.id} - ${venta.cliente?.nombre || 'Cliente'} - ${parseFloat(venta.total).toFixed(2)}`} 
                        value={venta.id.toString()} 
                        color={isDark ? '#FFFFFF' : '#000000'}
                      />
                    ))}
                  </Picker>
                </View>
              )}
              {errors.venta_id && (
                <ThemedText style={styles.errorText}>{errors.venta_id}</ThemedText>
              )}
            </ThemedView>

            {ventaInfo && (
              <ThemedView style={styles.ventaInfoContainer}>
                <ThemedView style={styles.ventaInfoRow}>
                  <ThemedText style={styles.ventaInfoLabel}>Cliente:</ThemedText>
                  <ThemedText style={styles.ventaInfoValue}>{ventaInfo.cliente}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.ventaInfoRow}>
                  <ThemedText style={styles.ventaInfoLabel}>Total Venta:</ThemedText>
                  <ThemedText style={styles.ventaInfoValue}>${ventaInfo.total}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.ventaInfoRow}>
                  <ThemedText style={styles.ventaInfoLabel}>Saldo Pendiente:</ThemedText>
                  <ThemedText style={styles.ventaInfoValue}>${ventaInfo.saldoPendiente}</ThemedText>
                </ThemedView>
              </ThemedView>
            )}

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
                <ThemedText style={styles.label}>Comprobante *</ThemedText>
                <TouchableOpacity 
                  style={[
                    styles.fileSelector,
                    comprobante ? styles.fileSelectorSuccess : null,
                    errors.comprobante && styles.inputError
                  ]}
                  onPress={pickDocument}
                >
                  <IconSymbol name={comprobante ? "doc.fill" : "paperplane.fill"} size={24} color="#757575" />
                  <ThemedText style={styles.fileSelectorText}>
                    {comprobante ? comprobante.name : 'Seleccionar comprobante'}
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

            <TouchableOpacity 
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || ventas.length === 0}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Registrar Pago</ThemedText>
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
  ventaInfoContainer: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  ventaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ventaInfoLabel: {
    fontWeight: '500',
  },
  ventaInfoValue: {
    fontWeight: '600',
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