import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, View, Switch, Image } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { presentacionApi, productoApi, API_CONFIG } from '@/services/api';
import { Producto, Presentacion } from '@/models';
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

export default function EditPresentacionScreen() {
  const params = useLocalSearchParams();
  const presentacionId = Number(params.id);
  
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Datos de productos para selector
  const [productos, setProductos] = useState<Producto[]>([]);
  
  // Estado para la imagen seleccionada
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Estado para indicar si se está eliminando la imagen existente
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Presentacion>>({
    producto_id: 0,
    nombre: '',
    capacidad_kg: '',
    tipo: 'bruto',
    precio_venta: '',
    activo: true,
  });

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar productos y datos de la presentación
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar productos
        const productosResponse = await productoApi.getProductos(1, 100);
        
        if (productosResponse && productosResponse.data) {
          setProductos(productosResponse.data);
        }
        
        // Cargar datos de la presentación
        const presentacionResponse = await presentacionApi.getPresentacion(presentacionId);
        
        if (presentacionResponse) {
          setFormData({
            producto_id: presentacionResponse.producto_id,
            nombre: presentacionResponse.nombre,
            capacidad_kg: presentacionResponse.capacidad_kg,
            tipo: presentacionResponse.tipo,
            precio_venta: presentacionResponse.precio_venta,
            activo: presentacionResponse.activo,
          });
          
          // Si la presentación tiene una imagen, establecer la URL
          if (presentacionResponse.url_foto) {
            setSelectedImage(`${API_CONFIG.baseUrl}/uploads/${presentacionResponse.url_foto}`);
          }
        } else {
          Alert.alert('Error', 'No se pudo cargar la información de la presentación');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [presentacionId]);

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

  const handleChange = (field: string, value: string | boolean | number) => {
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

  // Función para seleccionar una imagen desde la galería
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setRemoveExistingImage(false); // Si seleccionamos una nueva imagen, no estamos eliminando
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para tomar una foto con la cámara
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setRemoveExistingImage(false); // Si tomamos una nueva foto, no estamos eliminando
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Función para eliminar la imagen
  const removeImage = () => {
    setSelectedImage(null);
    setRemoveExistingImage(true); // Marcamos que queremos eliminar la imagen existente
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.producto_id) {
      newErrors.producto_id = 'El producto es requerido';
    }
    
    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.capacidad_kg?.trim()) {
      newErrors.capacidad_kg = 'La capacidad es requerida';
    } else if (isNaN(parseFloat(formData.capacidad_kg)) || parseFloat(formData.capacidad_kg) <= 0) {
      newErrors.capacidad_kg = 'Ingrese una capacidad válida';
    }
    
    if (!formData.precio_venta?.trim()) {
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
        capacidad_kg: formData.capacidad_kg?.replace(',', '.'),
        precio_venta: formData.precio_venta?.replace(',', '.')
      };
      
      // Si estamos eliminando la imagen existente, agregar el parámetro
      if (removeExistingImage) {
        presentacionData.eliminar_foto = true;
      }
      
      // Usar diferentes métodos dependiendo de si hay una nueva imagen
      let response;
      
      if (selectedImage && !selectedImage.startsWith(API_CONFIG.baseUrl)) {
        // Es una nueva imagen local seleccionada
        response = await presentacionApi.updatePresentacionWithImage(
          presentacionId,
          presentacionData,
          selectedImage
        );
      } else {
        // No hay nueva imagen o la imagen es la URL del servidor (no cambió)
        response = await presentacionApi.updatePresentacion(
          presentacionId,
          presentacionData
        );
      }
      
      if (response) {
        Alert.alert(
          'Presentación Actualizada',
          'La presentación ha sido actualizada exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar la presentación');
      }
    } catch (err) {
      console.error('Error updating presentacion:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar la presentación';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Presentación',
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
        title: 'Editar Presentación',
        headerShown: true 
      }} />
      
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>Editar Presentación</ThemedText>

        <ThemedView style={styles.form}>
          {/* Imagen de la presentación */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Foto de la presentación</ThemedText>
            <ThemedView style={styles.imageContainer}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              ) : (
                <ThemedView style={styles.imagePlaceholder}>
                  <ThemedText style={styles.placeholderText}>Sin imagen</ThemedText>
                </ThemedView>
              )}
            </ThemedView>
            <ThemedView style={styles.imageButtons}>
              <TouchableOpacity 
                style={[styles.imageButton, { backgroundColor: '#0a7ea4' }]}
                onPress={pickImage}
              >
                <ThemedText style={styles.buttonText}>Galería</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.imageButton, { backgroundColor: '#4CAF50' }]}
                onPress={takePhoto}
              >
                <ThemedText style={styles.buttonText}>Cámara</ThemedText>
              </TouchableOpacity>
              {selectedImage && (
                <TouchableOpacity 
                  style={[styles.imageButton, { backgroundColor: '#F44336' }]}
                  onPress={removeImage}
                >
                  <ThemedText style={styles.buttonText}>Eliminar</ThemedText>
                </TouchableOpacity>
              )}
            </ThemedView>
          </ThemedView>

          {/* Producto Selector */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Producto *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.producto_id?.toString()}
                onValueChange={(value) => handleChange('producto_id', parseInt(value))}
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
              <ThemedText style={styles.submitButtonText}>Actualizar Presentación</ThemedText>
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
  // Nuevos estilos para la sección de imagen
  imageContainer: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  placeholderText: {
    color: '#9BA1A6',
    fontSize: 16,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  imageButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});