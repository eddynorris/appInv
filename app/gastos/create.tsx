// app/gastos/create.tsx
import React, { useEffect } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGastoItem } from '@/hooks/crud/useGastoItem';

export default function CreateGastoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  
  // Usar el hook refactorizado para el item
  const { 
    form,
    createGasto,
    validationRules,
    categorias,
    almacenes,
    showDatePicker,
    setShowDatePicker,
    handleDateSelection,
    isLoading,
    error,
    isAdmin,
    prepareForCreate
  } = useGastoItem();
  
  const { formData, errors, isSubmitting, handleChange, handleSubmit } = form;

  // Cargar almacenes solo si el usuario es admin
  useEffect(() => {
    prepareForCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para manejar el envío del formulario
  const submitForm = async () => {
    const response = await createGasto(formData);
    
    if (response) {
      Alert.alert(
        'Gasto Creado',
        'El gasto ha sido creado exitosamente',
        [{ text: 'OK', onPress: () => router.replace('/gastos') }]
      );
      return true;
    } else {
      Alert.alert('Error', error || 'No se pudo crear el gasto');
      return false;
    }
  };

  return (
    <ScreenContainer 
      title="Registrar Gasto"
      isLoading={isLoading && !isSubmitting}
      error={error}
    >
      <ThemedText type="title" style={{ marginBottom: 20 }}>Registrar Gasto</ThemedText>

      <FormField
        label="Descripción"
        value={formData.descripcion}
        onChangeText={(value) => handleChange('descripcion', value)}
        placeholder="Ingresa la descripción del gasto"
        error={errors.descripcion}
        required
        disabled={isSubmitting}
      />

      <FormField
        label="Monto"
        value={formData.monto}
        onChangeText={(value) => handleChange('monto', value)}
        placeholder="0.00"
        error={errors.monto}
        keyboardType="numeric"
        required
        disabled={isSubmitting}
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
            enabled={!isSubmitting}
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

      {/* Selector de almacén solo para administradores */}
      {isAdmin && almacenes.length > 0 && (
        <ThemedView style={{ marginBottom: 16 }}>
          <ThemedText style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>
            Almacén
          </ThemedText>
          <View style={{
            borderWidth: 1,
            borderColor: '#E1E3E5',
            borderRadius: 8,
            backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'
          }}>
            <Picker
              selectedValue={formData.almacen_id}
              onValueChange={(value) => handleChange('almacen_id', value)}
              style={{ color: Colors[colorScheme].text }}
              dropdownIconColor={Colors[colorScheme].text}
              enabled={!isSubmitting}
            >
              <Picker.Item 
                label="Seleccionar almacén" 
                value={undefined} 
                color={isDark ? '#FFFFFF' : '#000000'}
              />
              {almacenes.map((almacen) => (
                <Picker.Item 
                  key={almacen.id} 
                  label={almacen.nombre}
                  value={almacen.id}
                  color={isDark ? '#FFFFFF' : '#000000'}
                />
              ))}
            </Picker>
          </View>
        </ThemedView>
      )}

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
          onPress={() => !isSubmitting && setShowDatePicker(true)}
          disabled={isSubmitting}
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
        onSave={() => handleSubmit(submitForm, validationRules)}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
        saveText="Registrar Gasto"
      />
    </ScreenContainer>
  );
}