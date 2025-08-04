// app/presentaciones/edit/[id].tsx - Versión refactorizada
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Image, Switch } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { usePresentacionItem, TIPOS_PRESENTACION } from '@/hooks/crud/usePresentacionItem';
import { API_CONFIG } from '@/services';
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FormField } from '@/components/form/FormField';
import { FormStyles } from '@/styles/Theme';

export default function EditPresentacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idNumerico = id ? parseInt(id as string) : 0;
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  
  const {
    isLoading,
    isLoadingOptions,
    error,
    form,
    validationRules,
    productos,
    tiposPresentacion: TIPOS_PRESENTACION,
    imageUploader,
    existingImageUrl,
    loadPresentacionForEdit,
    updatePresentacion,
  } = usePresentacionItem();

  const { formData, errors, isSubmitting, handleChange, handleSubmit } = form;
  const { file, pickImage, takePhoto, clearFile } = imageUploader;
  
  // Cargar datos para edición
  useEffect(() => {
    if (idNumerico) {
      loadPresentacionForEdit(idNumerico);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idNumerico]);
  
  // Solicitar permisos para cámara y galería
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    };
    
    requestPermissions();
  }, []);
  
  // Manejar envío
  const submitForm = async () => {
    if (!idNumerico) return;
    await updatePresentacion(idNumerico, formData);
  };
  
  // Determinar la URL de la imagen a mostrar (nueva o existente)
  const displayImageUrl = file ? file.uri : existingImageUrl;

  return (
    <ScreenContainer
      title="Editar Presentación"
      isLoading={isLoading || (isLoadingOptions && productos.length === 0)}
      error={error}
    >
      <Stack.Screen options={{ 
        title: 'Editar Presentación',
        headerShown: true 
      }} />

      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>Editar Presentación</ThemedText>

        <ThemedView style={styles.form}>
          {/* Selector de Producto Base (Solo lectura en edición) */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Producto Base</ThemedText>
            <TextInput
              style={[FormStyles.input, FormStyles.disabledContainer, { color: isDark ? Colors.dark.text : Colors.light.text }]}
              value={productos.find(p => p.id.toString() === formData.producto_id)?.nombre || 'Cargando...'}
              editable={false}
            />
          </ThemedView>

          {/* Nombre de la Presentación */}
          <FormField
            label="Nombre Presentación *"
            value={formData.nombre}
            onChangeText={(value) => handleChange('nombre', value)}
            placeholder="Ej: Bolsa 1kg, Caja 10kg"
            error={errors.nombre}
            required
            disabled={isSubmitting}
          />

          {/* Capacidad */}
          <FormField
            label="Capacidad (kg) *"
            value={formData.capacidad_kg}
            onChangeText={(value) => handleChange('capacidad_kg', value)}
            placeholder="Ej: 1, 10, 0.5"
            keyboardType="numeric"
            error={errors.capacidad_kg}
            required
            disabled={isSubmitting}
          />

          {/* Precio de Venta */}
          <FormField
            label="Precio Venta *"
            value={formData.precio_venta}
            onChangeText={(value) => handleChange('precio_venta', value)}
            placeholder="0.00"
            keyboardType="numeric"
            error={errors.precio_venta}
            required
            disabled={isSubmitting}
          />

          {/* Tipo de Presentación */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Tipo *</ThemedText>
            <View style={[FormStyles.pickerContainer, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }]}>
              <Picker
                selectedValue={formData.tipo}
                onValueChange={(value) => handleChange('tipo', value)}
                style={[FormStyles.picker, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                enabled={!isSubmitting}
              >
                {TIPOS_PRESENTACION.map(tipo => (
                  <Picker.Item key={tipo} label={tipo.charAt(0).toUpperCase() + tipo.slice(1)} value={tipo} />
                ))}
              </Picker>
            </View>
            {errors.tipo && <ThemedText style={FormStyles.errorText}>{errors.tipo}</ThemedText>}
          </ThemedView>

          {/* Estado Activo/Inactivo */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Estado</ThemedText>
            <View style={[FormStyles.pickerContainer, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }]}>
              <Picker
                selectedValue={formData.activo}
                onValueChange={(value) => handleChange('activo', value)}
                style={[FormStyles.picker, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                enabled={!isSubmitting}
              >
                <Picker.Item label="Activo" value={true} />
                <Picker.Item label="Inactivo" value={false} />
              </Picker>
            </View>
          </ThemedView>

          {/* Carga/Actualización de Imagen */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Imagen</ThemedText>
            <View style={styles.imagePreviewContainer}>
              {displayImageUrl ? (
                <Image source={{ uri: displayImageUrl }} style={styles.imagePreview} resizeMode="contain" />
              ) : (
                <View style={styles.imagePlaceholder}>
                   <IconSymbol name="photo" size={48} color="#ccc" />
                   <ThemedText style={{marginTop: 8, color: '#aaa'}}>Sin imagen</ThemedText>
                </View>
              )}
              {/* Botón para quitar/cambiar imagen */} 
              {(file || existingImageUrl) && (
                <TouchableOpacity onPress={clearFile} style={styles.removeImageButton}>
                  <IconSymbol name="xmark.circle.fill" size={24} color={Colors.danger} />
                </TouchableOpacity>
               )}
            </View>
            
            {/* Botones para seleccionar nueva imagen */} 
            {!file && (
              <View style={styles.imageButtonsContainer}>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage} disabled={isSubmitting}>
                  <IconSymbol name="photo.on.rectangle" size={24} color={Colors.primary} />
                  <ThemedText style={styles.imageButtonText}>Galería</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} onPress={takePhoto} disabled={isSubmitting}>
                   <IconSymbol name="camera.fill" size={24} color={Colors.primary} />
                   <ThemedText style={styles.imageButtonText}>Cámara</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ThemedView>

        </ThemedView>
      </ScrollView>

      {/* Botones de Acción */}
      <ActionButtons
        onSave={() => handleSubmit(submitForm, validationRules)} 
        onCancel={() => router.back()}
        isSubmitting={isSubmitting || isLoading}
        saveText="Guardar Cambios"
      />

    </ScreenContainer>
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
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9f9f9' // Placeholder background
  },
  imagePreview: {
    width: '100%',
    height: '100%', // Llenar el contenedor
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 2,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  imageButtonText: {
    marginTop: 4,
    color: Colors.primary,
    fontSize: 14,
  },
});