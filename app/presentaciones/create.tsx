// app/presentaciones/create.tsx - Refactorizado
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { usePresentacionItem, TIPOS_PRESENTACION } from '@/hooks/crud/usePresentacionItem'; // Importar hook de item
import { useColorScheme } from '@/hooks/useColorScheme';
 import { Colors } from '@/styles/Theme';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormStyles } from '@/styles/Theme';

export default function CreatePresentacionScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Usar el hook de item de presentación
  const {
    isLoading,
    isLoadingOptions,
    error,
    form,
    validationRules,
    productos,
    tiposPresentacion: TIPOS_PRESENTACION, // Renombrado localmente para claridad
    imageUploader,
    prepareForCreate,
    createPresentacion,
  } = usePresentacionItem();

  const { formData, errors, isSubmitting, handleChange, handleSubmit } = form;
  const { file, pickImage, takePhoto, clearFile } = imageUploader;

  // Preparar formulario al montar
  useEffect(() => {
    prepareForCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para manejar el envío
  const submitForm = async () => {
    // La validación y envío se manejan dentro del hook `createPresentacion`
    // a través de `form.handleSubmit`
    await createPresentacion(formData);
  };

  return (
    <ScreenContainer 
      title="Nueva Presentación"
      isLoading={isLoadingOptions && productos.length === 0} // Mostrar carga mientras se cargan productos
      error={error}
    >
      <Stack.Screen options={{ 
        title: 'Nueva Presentación',
        headerShown: true 
      }} />

      <ScrollView keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.formContainer}>
          {/* Selector de Producto Base */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Producto Base *</ThemedText>
            <View style={[FormStyles.pickerContainer, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }]}>
              <Picker
                selectedValue={formData.producto_id}
                onValueChange={(value) => handleChange('producto_id', value)}
                style={[FormStyles.picker, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                enabled={!isSubmitting && !isLoadingOptions}
              >
                <Picker.Item label="Seleccione un producto..." value="" />
                {productos.map(producto => (
                  <Picker.Item key={producto.id} label={producto.nombre} value={producto.id.toString()} />
                ))}
              </Picker>
            </View>
            {errors.producto_id && <ThemedText style={FormStyles.errorText}>{errors.producto_id}</ThemedText>}
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

          {/* Carga de Imagen */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Imagen (Opcional)</ThemedText>
            {file ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: file.uri }} style={styles.imagePreview} resizeMode="contain" />
                <TouchableOpacity onPress={clearFile} style={styles.removeImageButton}>
                  <IconSymbol name="xmark.circle.fill" size={24} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
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
        onSave={() => handleSubmit(submitForm, validationRules)} // Usar form.handleSubmit
        onCancel={() => router.back()}
        isSubmitting={isSubmitting || isLoading} // Considerar ambos loadings
        saveText="Crear Presentación"
      />

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
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
  imageButton: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    minWidth: 120,
  },
  imageButtonText: {
    marginTop: 4,
    color: Colors.primary,
    fontSize: 14,
  },
});