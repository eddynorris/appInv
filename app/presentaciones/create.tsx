// app/presentaciones/create.tsx - Versión refactorizada
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Image, Switch } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { usePresentaciones } from '@/hooks/crud/usePresentaciones';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FormStyles } from '@/styles/Theme';

export default function CreatePresentacionScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  
  // Usar el hook personalizado para presentaciones
  const {
    formData,
    errors,
    isSubmitting,
    isLoading,
    isLoadingProductos,
    productos,
    TIPOS_PRESENTACION,
    selectedImage,
    handleChange,
    setSelectedImage,
    loadProductos,
    createPresentacion
  } = usePresentaciones();
  
  // Solicitar permisos de cámara y galería al montar el componente
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        console.log('Permisos no concedidos para cámara o galería');
      }
    };
    
    requestPermissions();
  }, []);
  
  // Cargar productos al iniciar
  useEffect(() => {
    loadProductos();
  }, [loadProductos]);
  
  // Seleccionar imagen de la galería
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
    }
  };
  
  // Tomar foto con la cámara
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
    }
  };
  
  // Cancelar la creación
  const handleCancel = () => {
    router.back();
  };
  
  // Renderizar pantalla de carga mientras se cargan los productos
  if (isLoadingProductos) {
    return (
      <ScreenContainer 
        title="Nueva Presentación"
        isLoading={true}
        loadingMessage="Cargando datos..."
      />
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
                  onPress={() => setSelectedImage(null)}
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

          {/* Botones de acción */}
          <ActionButtons
            onSave={createPresentacion}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            saveText="Crear Presentación"
          />
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
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  // Estilos para la sección de imagen
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