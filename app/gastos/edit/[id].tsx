// app/gastos/edit/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGastos } from '@/hooks/crud/useGastos';

export default function EditGastoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  
  const { 
    form,
    isLoading,
    error,
    updateGasto,
    validationRules,
    categorias,
    showDatePicker,
    setShowDatePicker,
    handleDateSelection,
    loadGastoForEdit
  } = useGastos();
  
  const { formData, errors, isSubmitting, handleChange, handleSubmit } = form;
  
  // Cargar datos del gasto una sola vez al montar
  useEffect(() => {
    if (!id) return;
    
    // Función para cargar los datos
    const fetchData = async () => {
      try {
        console.log(`Cargando datos para gasto ID: ${id}`);
        await loadGastoForEdit(parseInt(id));
        setIsLoadingInitial(false);
      } catch (error) {
        console.error('Error cargando gasto:', error);
        setIsLoadingInitial(false);
      }
    };
    
    fetchData();
    // Sin dependencias para que solo se ejecute al montar
  }, []);

  return (
    <ScreenContainer 
      title="Editar Gasto"
      isLoading={isLoading || isLoadingInitial}
      error={error}
      loadingMessage="Cargando datos del gasto..."
    >
      <ThemedText type="title" style={{ marginBottom: 20 }}>Editar Gasto</ThemedText>

      <FormField
        label="Descripción"
        value={formData.descripcion}
        onChangeText={(value) => handleChange('descripcion', value)}
        placeholder="Ingresa la descripción del gasto"
        error={errors.descripcion}
        required
      />

      <FormField
        label="Monto"
        value={formData.monto}
        onChangeText={(value) => handleChange('monto', value)}
        placeholder="0.00"
        error={errors.monto}
        keyboardType="numeric"
        required
      />

      <ThemedView style={{ marginBottom: 16 }}>
        <ThemedText style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>
          Categoría
        </ThemedText>
        <View style={{
          borderWidth: 1,
          borderColor: '#E1E3E5',
          borderRadius: 8,
          backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'
        }}>
          <Picker
            selectedValue={formData.categoria}
            onValueChange={(value) => handleChange('categoria', value)}
            style={{ color: Colors[colorScheme].text }}
            dropdownIconColor={Colors[colorScheme].text}
          >
            {categorias.map((categoria) => (
              <Picker.Item 
                key={categoria} 
                label={categoria} 
                value={categoria} 
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            ))}
          </Picker>
        </View>
      </ThemedView>

      <ThemedView style={{ marginBottom: 16 }}>
        <ThemedText style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>
          Fecha
        </ThemedText>
        <TouchableOpacity 
          style={{
            borderWidth: 1,
            borderColor: '#E1E3E5',
            borderRadius: 8,
            backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5',
            padding: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
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
            onChange={(event, date) => handleDateSelection(date)}
          />
        )}
      </ThemedView>

      <ActionButtons
        onSave={() => id && handleSubmit(() => updateGasto(parseInt(id)), validationRules)}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
        saveText="Guardar Cambios"
      />
    </ScreenContainer>
  );
}