// app/gastos/edit/[id].tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
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
import { useGastoItem } from '@/hooks/crud/useGastoItem';
import { useAuth } from '@/context/AuthContext';

export default function EditGastoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);
  const { user } = useAuth();
  
  // Usar el hook refactorizado para el item
  const { 
    form,
    isLoading,
    error,
    updateGasto,
    validationRules,
    categorias,
    almacenes,
    showDatePicker,
    setShowDatePicker,
    handleDateSelection,
    loadGastoForEdit,
    getGasto,
    isAdmin
  } = useGastoItem();
  
  const { formData, errors, isSubmitting, handleChange, handleSubmit } = form;
  
  // Cargar datos del gasto una sola vez al montar
  // Usamos useCallback para evitar recrear la función en cada render
  const fetchData = useCallback(async () => {
    if (!id || isInitialFetchDone) return;
    
    try {
      setIsInitialFetchDone(true); // Marcar que ya se hizo la carga inicial
      
      // Primero verificamos si el usuario tiene permiso para editar este gasto
      const gastoData = await getGasto(parseInt(id));
      
      if (gastoData) {
        // Si el usuario no es admin, verificar si el gasto le pertenece
        if (user?.rol !== 'admin' && gastoData.usuario_id !== user?.id) {
          Alert.alert(
            'Acceso denegado',
            'No tienes permiso para editar este gasto',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }
        
        // Ahora cargamos el gasto en el formulario
        await loadGastoForEdit(parseInt(id));
        setIsDataLoaded(true);
      } else {
        Alert.alert(
          'Error',
          'No se pudo cargar la información del gasto',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error cargando gasto:', error);
      Alert.alert(
        'Error',
        'Ocurrió un error al cargar el gasto',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [id, isInitialFetchDone, getGasto, loadGastoForEdit, user]);

  // Ejecutar la carga inicial solo una vez
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Función para manejar la actualización del gasto
  const submitForm = async () => {
    if (!id) return false;
    
    const response = await updateGasto(parseInt(id), formData);
    
    if (response) {
      Alert.alert(
        'Gasto Actualizado',
        'El gasto ha sido actualizado exitosamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return true;
    } else {
      Alert.alert('Error', error || 'No se pudo actualizar el gasto');
      return false;
    }
  };

  // Si el usuario no tiene permiso de edición (no es admin), redirigir
  useEffect(() => {
    if (user && user.rol !== 'admin') {
      // Verificamos si ya se intentó cargar y se tiene el ID
      if (isInitialFetchDone && !isDataLoaded) {
        router.back();
      }
    }
  }, [user, isInitialFetchDone, isDataLoaded]);

  return (
    <ScreenContainer 
      title="Editar Gasto"
      isLoading={(isLoading && !isDataLoaded) || (isLoading && !isSubmitting)}
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
      {isAdmin && (
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
        saveText="Guardar Cambios"
      />
    </ScreenContainer>
  );
}