// app/lotes/edit/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
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
import { useLotes } from '@/hooks/crud/useLotes';

export default function EditLoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const dataLoaded = useRef(false);
  
  const { 
    form,
    isLoading,
    isLoadingOptions,
    error,
    updateLote,
    validationRules,
    productos,
    proveedores,
    loadLoteForEdit
  } = useLotes();
  
  const { formData, errors, isSubmitting, handleChange, handleSubmit } = form;
  
  // Cargar datos del lote una sola vez al montar
  useEffect(() => {
    if (!id || dataLoaded.current) return;
    
    const fetchData = async () => {
      try {
        console.log(`Cargando datos para lote ID: ${id}`);
        await loadLoteForEdit(parseInt(id));
        dataLoaded.current = true;
        setIsLoadingInitial(false);
      } catch (error) {
        console.error('Error cargando lote:', error);
        setIsLoadingInitial(false);
      }
    };
    
    fetchData();
  }, [id]);  // Quitamos loadLoteForEdit de las dependencias para evitar el bucle

  return (
    <ScreenContainer 
      title="Editar Lote" 
      isLoading={isLoading || isLoadingOptions || isLoadingInitial}
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
        label="Descripcion"
        value={formData.descripcion}
        onChangeText={(value) => handleChange('descripcion', value)}
        placeholder="Descripción del lote"
        error={errors.descripcion}
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
      />

      <FormField
        label="Peso Seco (kg)"
        value={formData.peso_seco_kg}
        onChangeText={(value) => handleChange('peso_seco_kg', value)}
        placeholder="0.00"
        error={errors.peso_seco_kg}
        keyboardType="numeric"
      />

      {/* Reemplazamos el FormField por DateField */}
      <DateField
        label="Fecha de Ingreso"
        value={formData.fecha_ingreso}
        onChange={(value) => handleChange('fecha_ingreso', value)}
        error={errors.fecha_ingreso}
      />

      <ActionButtons
        onSave={() => id && handleSubmit(() => updateLote(parseInt(id)), validationRules)}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
        saveText="Guardar Cambios"
      />
    </ScreenContainer>
  );
}