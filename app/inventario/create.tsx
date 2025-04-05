// app/inventario/create.tsx
import React, { useEffect } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { useInventario } from '@/hooks/crud/useInventario';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function CreateInventarioScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  
  // Usar hook de inventario
  const {
    formData,
    errors,
    isSubmitting,
    isLoadingOptions,
    almacenes,
    presentaciones,
    handleChange,
    createInventario,
    loadOptions
  } = useInventario();
  
  // Cargar opciones al iniciar
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);
  
  // Cancelar creación
  const handleCancel = () => {
    router.back();
  };

  return (
    <ScreenContainer
      title="Nuevo Registro de Inventario"
      isLoading={isLoadingOptions}
      loadingMessage="Cargando datos..."
    >
      <ThemedText type="title" style={styles.heading}>
        Registrar Inventario
      </ThemedText>

      <ThemedView style={styles.form}>
        {/* Almacén Selector */}
        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Almacén *</ThemedText>
          <View style={[
            styles.pickerContainer,
            { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
            errors.almacen_id && styles.inputError
          ]}>
            <Picker
              selectedValue={formData.almacen_id}
              onValueChange={(value) => handleChange('almacen_id', value)}
              style={[
                styles.picker,
                { color: Colors[colorScheme].text }
              ]}
            >
              <Picker.Item label="Seleccionar almacén" value="" />
              {almacenes.map(almacen => (
                <Picker.Item 
                  key={almacen.id} 
                  label={almacen.nombre} 
                  value={almacen.id.toString()} 
                />
              ))}
            </Picker>
          </View>
          {errors.almacen_id && (
            <ThemedText style={styles.errorText}>{errors.almacen_id}</ThemedText>
          )}
        </ThemedView>

        {/* Presentación Selector */}
        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Presentación *</ThemedText>
          <View style={[
            styles.pickerContainer,
            { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
            errors.presentacion_id && styles.inputError
          ]}>
            <Picker
              selectedValue={formData.presentacion_id}
              onValueChange={(value) => handleChange('presentacion_id', value)}
              style={[
                styles.picker,
                { color: Colors[colorScheme].text }
              ]}
            >
              <Picker.Item label="Seleccionar presentación" value="" />
              {presentaciones.map(presentacion => (
                <Picker.Item 
                  key={presentacion.id} 
                  label={`${presentacion.nombre} - ${presentacion.producto?.nombre || ''}`} 
                  value={presentacion.id.toString()} 
                />
              ))}
            </Picker>
          </View>
          {errors.presentacion_id && (
            <ThemedText style={styles.errorText}>{errors.presentacion_id}</ThemedText>
          )}
        </ThemedView>

        {/* Cantidad */}
        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Cantidad *</ThemedText>
          <TextInput
            style={[
              styles.input,
              { color: Colors[colorScheme].text },
              errors.cantidad && styles.inputError
            ]}
            value={formData.cantidad}
            onChangeText={(value) => handleChange('cantidad', value)}
            placeholder="0"
            placeholderTextColor="#9BA1A6"
            keyboardType="numeric"
          />
          {errors.cantidad && (
            <ThemedText style={styles.errorText}>{errors.cantidad}</ThemedText>
          )}
        </ThemedView>

        {/* Stock Mínimo */}
        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Stock Mínimo *</ThemedText>
          <TextInput
            style={[
              styles.input,
              { color: Colors[colorScheme].text },
              errors.stock_minimo && styles.inputError
            ]}
            value={formData.stock_minimo}
            onChangeText={(value) => handleChange('stock_minimo', value)}
            placeholder="0"
            placeholderTextColor="#9BA1A6"
            keyboardType="numeric"
          />
          {errors.stock_minimo && (
            <ThemedText style={styles.errorText}>{errors.stock_minimo}</ThemedText>
          )}
          <ThemedText style={styles.helperText}>
            Cantidad mínima recomendada para alertas de reposición
          </ThemedText>
        </ThemedView>

        {/* Lote ID (opcional) */}
        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>ID de Lote (opcional)</ThemedText>
          <TextInput
            style={[
              styles.input,
              { color: Colors[colorScheme].text },
              errors.lote_id && styles.inputError
            ]}
            value={formData.lote_id}
            onChangeText={(value) => handleChange('lote_id', value)}
            placeholder="ID del lote de producción (opcional)"
            placeholderTextColor="#9BA1A6"
            keyboardType="numeric"
          />
          {errors.lote_id && (
            <ThemedText style={styles.errorText}>{errors.lote_id}</ThemedText>
          )}
        </ThemedView>

        {/* Nota informativa */}
        <ThemedView style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            Al registrar inventario, se creará un movimiento de entrada para la cantidad especificada.
          </ThemedText>
        </ThemedView>

        {/* Botones de acción */}
        <ActionButtons
          onSave={createInventario}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          saveText="Registrar Inventario"
        />
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginBottom: 20,
  },
  form: {
    gap: 16,
    paddingHorizontal: 16,
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
  helperText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0a7ea4',
  }
});