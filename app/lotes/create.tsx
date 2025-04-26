// app/lotes/create.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import DateField from '@/components/form/DateField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLoteItem } from '@/hooks/crud/useLoteItem';

export default function CreateLoteScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [initialLoading, setInitialLoading] = useState(true);
  const initialLoadDone = useRef(false);
  
  // Usar el hook refactorizado
  const { 
    form,
    validationRules,
    isLoading,
    isLoadingOptions,
    error,
    createLote,
    prepareForCreate,
    productos,
    proveedores,
    loadOptions
  } = useLoteItem();
  
  const { formData, errors, isSubmitting, handleChange, handleSubmit } = form;

  // Cargar opciones al montar el componente una sola vez
  useEffect(() => {
    const prepare = async () => {
      if (initialLoadDone.current) return;
      
      initialLoadDone.current = true;
      try {
        // Cargar opciones y resetear el formulario
        await loadOptions();
        form.resetForm();
      } finally {
        setInitialLoading(false);
      }
    };
    
    prepare();
  }, []); // Sin dependencias para evitar bucles

  // Función para manejar el envío del formulario
  const submitForm = async () => {
    const response = await createLote(formData);
    
    if (response) {
      Alert.alert(
        'Lote Creado',
        'El lote ha sido creado exitosamente',
        [{ text: 'OK', onPress: () => router.replace('/lotes') }]
      );
      return true;
    } else {
      Alert.alert('Error', error || 'No se pudo crear el lote');
      return false;
    }
  };

  return (
    <ScreenContainer 
      title="Crear Lote" 
      isLoading={(isLoading || isLoadingOptions || initialLoading) && !isSubmitting}
      error={error}
      loadingMessage="Cargando datos..."
    >
      <ThemedText type="title" style={{ marginBottom: 20 }}>Registrar Nuevo Lote</ThemedText>

      {/* Selección de Producto */}
      <ThemedView style={{ marginBottom: 16 }}>
        <ThemedText style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>
          Producto *
        </ThemedText>
        <View style={{
          borderWidth: 1,
          borderColor: '#E1E3E5',
          borderRadius: 8,
          backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'
        }}>
          <Picker
            selectedValue={formData.producto_id}
            onValueChange={(value) => handleChange('producto_id', value.toString())}
            style={{ color: Colors[colorScheme].text }}
            dropdownIconColor={Colors[colorScheme].text}
            enabled={!isSubmitting}
          >
            <Picker.Item 
              label="Seleccionar producto" 
              value="" 
              color={isDark ? '#FFFFFF' : '#000000'}
            />
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
          <ThemedText style={{ color: '#E53935', fontSize: 14 }}>{errors.producto_id}</ThemedText>
        )}
      </ThemedView>

      {/* Selección de Proveedor */}
      <ThemedView style={{ marginBottom: 16 }}>
        <ThemedText style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>
          Proveedor *
        </ThemedText>
        <View style={{
          borderWidth: 1,
          borderColor: '#E1E3E5',
          borderRadius: 8,
          backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'
        }}>
          <Picker
            selectedValue={formData.proveedor_id}
            onValueChange={(value) => handleChange('proveedor_id', value.toString())}
            style={{ color: Colors[colorScheme].text }}
            dropdownIconColor={Colors[colorScheme].text}
            enabled={!isSubmitting}
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
        {errors.proveedor_id && (
          <ThemedText style={{ color: '#E53935', fontSize: 14 }}>{errors.proveedor_id}</ThemedText>
        )}
      </ThemedView>

      <FormField
        label="Descripción *"
        value={formData.descripcion}
        onChangeText={(value) => handleChange('descripcion', value)}
        placeholder="Descripción del lote"
        error={errors.descripcion}
        multiline
        disabled={isSubmitting}
        required
      />

      <FormField
        label="Peso Húmedo (kg)"
        value={formData.peso_humedo_kg}
        onChangeText={(value) => handleChange('peso_humedo_kg', value)}
        placeholder="0.00"
        error={errors.peso_humedo_kg}
        keyboardType="numeric"
        required
        disabled={isSubmitting}
      />

      <FormField
        label="Peso Seco (kg)"
        value={formData.peso_seco_kg}
        onChangeText={(value) => handleChange('peso_seco_kg', value)}
        placeholder="0.00"
        error={errors.peso_seco_kg}
        keyboardType="numeric"
        disabled={isSubmitting}
      />

      <DateField
        label="Fecha de Ingreso"
        value={formData.fecha_ingreso}
        onChange={(value) => handleChange('fecha_ingreso', value)}
        error={errors.fecha_ingreso}
        disabled={isSubmitting}
      />

      <ActionButtons
        onSave={() => handleSubmit(submitForm, validationRules)}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
        saveText="Crear Lote"
      />
    </ScreenContainer>
  );
}