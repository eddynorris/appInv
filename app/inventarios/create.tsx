// app/inventario/create.tsx - Versión mejorada
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { IconSymbol } from '@/components/ui/IconSymbol';
import LotePickerDialog from '@/components/data/LotePickerDialog';
import { useInventarios } from '@/hooks/crud/useInventarios';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Lote } from '@/models';

export default function CreateInventarioScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  
  const [showLotePicker, setShowLotePicker] = useState(false);
  const [selectedLoteInfo, setSelectedLoteInfo] = useState<Lote | null>(null);
  
  // Usar hook de inventario
  const {
    formData,
    errors,
    isSubmitting,
    isLoadingOptions,
    almacenes,
    presentaciones,
    lotes,
    handleChange,
    createInventario,
    loadOptions,
    formatLoteForDisplay
  } = useInventarios();
  
  // Obtener lotes filtrados según el producto seleccionado
  const lotesFiltrados = lotes.filter(lote => {
    // Si no hay producto seleccionado, mostrar todos los lotes
    if (!formData.presentacion_id) return true;
    
    // Encontrar la presentación seleccionada
    const presentacion = presentaciones.find(p => p.id.toString() === formData.presentacion_id);
    if (!presentacion || !presentacion.producto_id) return true;
    
    // Filtrar lotes por producto_id
    return lote.producto_id === presentacion.producto_id;
  });
  
  // Cargar opciones al iniciar
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);
  
  // Actualizar la información del lote seleccionado cuando cambia
  useEffect(() => {
    if (formData.lote_id && lotes.length > 0) {
      const lote = lotes.find(l => l.id.toString() === formData.lote_id);
      if (lote) {
        setSelectedLoteInfo(lote);
      } else {
        setSelectedLoteInfo(null);
      }
    } else {
      setSelectedLoteInfo(null);
    }
  }, [formData.lote_id, lotes]);
  
  // Abrir el selector de lote
  const openLotePicker = () => {
    // Verificar si se ha seleccionado un producto
    if (!formData.presentacion_id) {
      Alert.alert(
        'Selecciona un Producto',
        'Debes seleccionar una presentación antes de elegir un lote para asegurar la compatibilidad.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (lotesFiltrados.length === 0) {
      Alert.alert(
        'No hay lotes disponibles',
        'No se encontraron lotes compatibles con el producto seleccionado.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setShowLotePicker(true);
  };

  // Seleccionar un lote
  const handleLoteSelect = (lote: Lote) => {
    handleChange('lote_id', lote.id.toString());
    setSelectedLoteInfo(lote);
    setShowLotePicker(false);
  };
  
  // Limpiar la selección de lote
  const clearLoteSelection = () => {
    handleChange('lote_id', '');
    setSelectedLoteInfo(null);
  };
  
  // Manejar cambio de presentación
  const handlePresentacionChange = (value: string) => {
    handleChange('presentacion_id', value);
    
    // Si cambia la presentación, limpiar el lote seleccionado
    if (formData.lote_id) {
      clearLoteSelection();
    }
  };
  
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
                { color: isDark ? Colors[colorScheme].text : Colors[colorScheme].text }
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
              onValueChange={handlePresentacionChange}
              style={[
                styles.picker,
                { color: isDark ? Colors[colorScheme].text : Colors[colorScheme].text }
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

        {/* Lote Selector Mejorado */}
        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Lote (opcional)</ThemedText>
          
          {/* Botón para abrir selector de lote */}
          <TouchableOpacity 
            style={styles.loteSelector}
            onPress={openLotePicker}
          >
            <Text style={[
              styles.loteSelectorText,
              !selectedLoteInfo && styles.lotePlaceholder
            ]}>
              {selectedLoteInfo 
                ? `Lote #${selectedLoteInfo.id} - ${new Date(selectedLoteInfo.fecha_ingreso).toLocaleDateString()}`
                : 'Seleccionar lote'
              }
            </Text>
            <IconSymbol name="chevron.down" size={20} color="#666666" />
          </TouchableOpacity>
          
          {/* Información del lote seleccionado */}
          {selectedLoteInfo && (
            <View style={styles.loteInfoCard}>
              <View style={styles.loteInfoHeader}>
                <Text style={styles.loteInfoTitle}>Información del Lote #{selectedLoteInfo.id}</Text>
                <TouchableOpacity 
                  style={styles.clearLoteButton}
                  onPress={clearLoteSelection}
                >
                  <IconSymbol name="xmark.circle.fill" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.loteInfoRow}>
                <Text style={styles.loteInfoLabel}>Fecha de Ingreso:</Text>
                <Text style={styles.loteInfoValue}>
                  {new Date(selectedLoteInfo.fecha_ingreso).toLocaleDateString()}
                </Text>
              </View>
              {selectedLoteInfo.proveedor && (
                <View style={styles.loteInfoRow}>
                  <Text style={styles.loteInfoLabel}>Proveedor:</Text>
                  <Text style={styles.loteInfoValue}>{selectedLoteInfo.proveedor.nombre}</Text>
                </View>
              )}

              <View style={styles.loteInfoRow}>
                <Text style={styles.loteInfoLabel}>Cantidad disponible:</Text>
                <Text style={styles.loteInfoValue}>{selectedLoteInfo.cantidad_disponible_kg} kg</Text>
              </View>
            </View>
          )}
          
          {errors.lote_id && (
            <ThemedText style={styles.errorText}>{errors.lote_id}</ThemedText>
          )}
        </ThemedView>

        {/* Diálogo selector de lotes */}
        <LotePickerDialog
          visible={showLotePicker}
          lotes={lotesFiltrados}
          selectedLote={formData.lote_id}
          onSelect={handleLoteSelect}
          onCancel={() => setShowLotePicker(false)}
        />

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
  },
  loteSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 12,
  },
  loteSelectorText: {
    fontSize: 16,
    color: '#333333',
  },
  lotePlaceholder: {
    color: '#9BA1A6',
  },
  loteInfoCard: {
    marginTop: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  loteInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loteInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  clearLoteButton: {
    padding: 4,
  },
  loteInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  loteInfoLabel: {
    fontSize: 13,
    color: '#555555',
  },
  loteInfoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
  }
});