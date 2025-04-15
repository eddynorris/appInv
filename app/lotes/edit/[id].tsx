// app/lotes/edit/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
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

export default function EditLoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const initialLoadDone = useRef(false);
  
  // Usar el hook refactorizado
  const {
    form,
    validationRules,
    isLoading,
    isLoadingOptions,
    error,
    updateLote,
    loadLoteForEdit,
    productos,
    proveedores
  } = useLoteItem();
  
  const { formData, errors, isSubmitting, handleChange, handleSubmit } = form;
  
  // Cargar datos del lote una sola vez
  useEffect(() => {
    const fetchData = async () => {
      if (!id || initialLoadDone.current) return;
      
      try {
        initialLoadDone.current = true; // Marcar que ya iniciamos la carga
        await loadLoteForEdit(parseInt(id));
        setIsDataLoaded(true);
      } catch (error) {
        console.error('Error cargando datos del lote:', error);
        Alert.alert(
          'Error',
          'No se pudieron cargar los datos del lote',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    };
    
    fetchData();
  }, [id]); // No incluir loadLoteForEdit como dependencia
  
  // Función para manejar el envío del formulario
  const submitForm = async () => {
    if (!id) return false;
    
    const response = await updateLote(parseInt(id), formData);
    
    if (response) {
      Alert.alert(
        'Lote Actualizado',
        'El lote ha sido actualizado exitosamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return true;
    } else {
      Alert.alert('Error', error || 'No se pudo actualizar el lote');
      return false;
    }
  };
  
  return (
    <ScreenContainer 
      title="Editar Lote"
      isLoading={(isLoading || isLoadingOptions) && !isDataLoaded}
      error={error}
      loadingMessage="Cargando datos del lote..."
    >
      <ThemedText type="title" style={{ marginBottom: 20 }}>Editar Lote</ThemedText>
      
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
          Proveedor
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
      </ThemedView>
      
      <FormField
        label="Descripción"
        value={formData.descripcion}
        onChangeText={(value) => handleChange('descripcion', value)}
        placeholder="Descripción del lote"
        error={errors.descripcion}
        multiline
        disabled={isSubmitting}
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
      
      <FormField
        label="Cantidad disponible (kg)"
        value={formData.cantidad_disponible_kg}
        onChangeText={(value) => handleChange('cantidad_disponible_kg', value)}
        placeholder="0.00"
        error={errors.cantidad_disponible_kg}
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
        onSave={() => id && handleSubmit(submitForm, validationRules)}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
        saveText="Guardar Cambios"
      />
    </ScreenContainer>
  );
}