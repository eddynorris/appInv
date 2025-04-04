// app/pedidos/edit/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { usePedidos } from '@/hooks/crud/usePedidos';

export default function EditPedidoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idNumerico = id ? parseInt(id as string) : 0;
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
  // Estados locales
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Control para evitar múltiples cargas
  const isInitialMount = useRef(true);
  const pedidoCargado = useRef(false);
  
  // Usar el hook de pedidos
  const {
    pedido,
    form,
    clientes,
    isLoading,
    isLoadingOptions,
    error,
    loadPedidoForEdit,
    updatePedido
  } = usePedidos();
  
  // Cargar datos del pedido para edición - Solo una vez
  useEffect(() => {
    const cargarDatos = async () => {
      if (isInitialMount.current && idNumerico && !pedidoCargado.current) {
        console.log(`Cargando pedido ID ${idNumerico} para edición...`);
        await loadPedidoForEdit(idNumerico);
        isInitialMount.current = false;
        pedidoCargado.current = true;
      }
    };
    
    cargarDatos();
  }, [idNumerico, loadPedidoForEdit]);
  
  // Establecer el rol del usuario al cargar el componente
  useEffect(() => {
    if (user) {
      const isUserAdmin = user.rol?.toLowerCase() === 'admin';
      setIsAdmin(isUserAdmin);
    }
  }, [user]);
  
  // Manejar selección de fecha
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      form.handleChange('fecha_entrega', formattedDate);
    }
  };
  
  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (idNumerico) {
      const success = await updatePedido(idNumerico);
      if (success) {
        router.back();
      }
    }
  };
  
  if (isLoading || isLoadingOptions) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Proyección',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText>Cargando datos...</ThemedText>
        </ThemedView>
      </>
    );
  }
  
  if (error || !pedido) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Error',
          headerShown: true 
        }} />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>
            {error || 'No se pudo cargar la proyección para editar'}
          </ThemedText>
        </ThemedView>
      </>
    );
  }
  
  return (
    <>
      <Stack.Screen options={{ 
        title: 'Editar Proyección',
        headerShown: true 
      }} />
      
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>Editar Proyección #{idNumerico}</ThemedText>
        
        <ThemedView style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            Solo puedes modificar información básica de la proyección. Los detalles de productos no se pueden editar.
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.formContainer}>
          {/* Cliente Selector */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Cliente *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={form.formData.cliente_id}
                onValueChange={(value) => form.handleChange('cliente_id', value)}
                style={[styles.picker, { color: isDark ? Colors[colorScheme].text : Colors[colorScheme].text }]}
              >
                {clientes.map(cliente => (
                  <Picker.Item 
                    key={cliente.id.toString()} 
                    label={cliente.nombre || `Cliente ${cliente.id}`} 
                    value={cliente.id.toString()} 
                  />
                ))}
              </Picker>
            </View>
            {form.getError('cliente_id') && (
              <ThemedText style={styles.errorText}>{form.getError('cliente_id')}</ThemedText>
            )}
          </ThemedView>
          
          {/* Almacén Selector - Solo para administradores */}
          {pedido.almacen && (
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Almacén *</ThemedText>
              <View style={[
                styles.pickerContainer,
                { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
                !isAdmin && styles.disabledContainer
              ]}>
                <Picker
                  selectedValue={form.formData.almacen_id}
                  onValueChange={(value) => form.handleChange('almacen_id', value)}
                  style={[styles.picker, { color: isDark ? Colors[colorScheme].text : Colors[colorScheme].text }]}
                  enabled={isAdmin}
                >
                  <Picker.Item 
                    key={pedido.almacen.id.toString()} 
                    label={pedido.almacen.nombre || `Almacén ${pedido.almacen.id}`} 
                    value={pedido.almacen.id.toString()} 
                  />
                </Picker>
              </View>
              {!isAdmin && (
                <ThemedText style={styles.infoText}>
                  Solo administradores pueden cambiar el almacén
                </ThemedText>
              )}
            </ThemedView>
          )}
          
          {/* Fecha de Entrega */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Fecha de Entrega *</ThemedText>
            <TouchableOpacity
              style={[styles.input, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText>
                {form.formData.fecha_entrega ? new Date(form.formData.fecha_entrega).toLocaleDateString() : 'Seleccionar fecha'}
              </ThemedText>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.formData.fecha_entrega ? new Date(form.formData.fecha_entrega) : new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()} // Fecha mínima es hoy
              />
            )}
            {form.getError('fecha_entrega') && (
              <ThemedText style={styles.errorText}>{form.getError('fecha_entrega')}</ThemedText>
            )}
          </ThemedView>
          
          {/* Estado Selector */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Estado</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={form.formData.estado}
                onValueChange={(value) => form.handleChange('estado', value)}
                style={[styles.picker, { color: isDark ? Colors[colorScheme].text : Colors[colorScheme].text }]}
              >
                <Picker.Item label="Programado" value="programado" />
                <Picker.Item label="Confirmado" value="confirmado" />
                <Picker.Item label="Entregado" value="entregado" />
                <Picker.Item label="Cancelado" value="cancelado" />
              </Picker>
            </View>
          </ThemedView>
          
          {/* Notas */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Notas</ThemedText>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5', color: isDark ? Colors[colorScheme].text : Colors[colorScheme].text }
              ]}
              value={form.formData.notas}
              onChangeText={(text) => form.handleChange('notas', text)}
              placeholder="Notas adicionales sobre la proyección..."
              placeholderTextColor={isDark ? '#999' : '#777'}
              multiline
            />
          </ThemedView>
          
          {/* Información de Productos (solo lectura) */}
          <ThemedView style={styles.infoSection}>
            <ThemedText type="subtitle">Productos en la Proyección</ThemedText>
            <ThemedText style={styles.infoText}>
              Los productos asociados a esta proyección no pueden ser modificados desde esta pantalla.
              Para ver los detalles completos, vuelve a la vista de detalles.
            </ThemedText>
            <ThemedView style={styles.productSummary}>
              <ThemedText style={styles.productCount}>
                {pedido.detalles?.length || 0} productos incluidos
              </ThemedText>
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => router.replace(`/pedidos/${idNumerico}`)}
              >
                <ThemedText style={styles.viewButtonText}>Ver Detalles</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
          
          {/* Botones de acción */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <ThemedText style={styles.submitButtonText}>Guardar Cambios</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    color: Colors.danger,
  },
  infoBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    borderRadius: 8,
    marginBottom: 4,
    overflow: 'hidden',
  },
  disabledContainer: {
    opacity: 0.7,
    backgroundColor: '#F0F0F0',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  textArea: {
    height: 100,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  infoSection: {
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  productSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  productCount: {
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.danger,
    marginBottom: 40,
  },
  cancelButtonText: {
    color: Colors.danger,
    fontWeight: '500',
    fontSize: 16,
  },
});