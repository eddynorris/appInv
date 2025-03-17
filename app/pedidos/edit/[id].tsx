// app/pedidos/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { pedidoApi, clienteApi, almacenApi } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Cliente, Almacen, Pedido } from '@/models';
import { useAuth } from '@/context/AuthContext';

export default function EditPedidoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth(); // Obtenemos el usuario actual
  
  // Estado para controlar los roles y permisos
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Estado para date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Data for dropdowns
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  
  enum PedidoEstado {
    Programado = 'programado',
    Confirmado = 'confirmado',
    Entregado = 'entregado',
    Cancelado = 'cancelado'
  }

  // Form state
  const [formData, setFormData] = useState<Partial<Pedido>>({
    cliente_id: 0,
    almacen_id: 0,
    fecha_entrega: new Date().toISOString().split('T')[0],
    estado: 'programado' as PedidoEstado,
    notas: ''
  });

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Establecer el rol del usuario al cargar el componente
  useEffect(() => {
    if (user) {
      console.log('Datos del usuario:', user);
      
      if (user.rol) {
        console.log('Rol del usuario:', user.rol);
        const isUserAdmin = user.rol.toLowerCase() === 'admin';
        console.log('¿Es administrador?:', isUserAdmin);
        setIsAdmin(isUserAdmin);
      } else {
        console.log('No se encontró rol en el usuario, estableciendo como no-admin');
        setIsAdmin(false);
      }
    } else {
      // Si no hay usuario, definitivamente no es admin
      setIsAdmin(false);
    }
  }, [user]);

  // Load data for form
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Cargar datos en paralelo
        const [pedidoData, clientesData, almacenesData] = await Promise.all([
          pedidoApi.getPedido(parseInt(id)),
          clienteApi.getClientes(),
          almacenApi.getAlmacenes()
        ]);
        
        // Cargar listas de clientes y almacenes
        setClientes(clientesData.data || []);
        setAlmacenes(almacenesData.data || []);
        
        // Cargar datos del pedido
        if (pedidoData) {
          setFormData({
            cliente_id: pedidoData.cliente_id,
            almacen_id: pedidoData.almacen_id,
            fecha_entrega: pedidoData.fecha_entrega.split('T')[0],
            estado: pedidoData.estado,
            notas: pedidoData.notas,
            // No podemos editar los detalles del pedido desde aquí
          });
          
          console.log('Pedido cargado:', pedidoData);
        } else {
          Alert.alert('Error', 'No se pudo cargar el pedido');
          router.back();
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      handleChange('fecha_entrega', formattedDate);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cliente_id) {
      newErrors.cliente_id = 'El cliente es requerido';
    }
    
    if (!formData.almacen_id) {
      newErrors.almacen_id = 'El almacén es requerido';
    }
    
    if (!formData.fecha_entrega) {
      newErrors.fecha_entrega = 'La fecha de entrega es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !id) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Preparar datos para actualizar
      // NOTA: Solo actualizamos campos básicos, no los detalles del pedido
      const fechaFormateada = `${formData.fecha_entrega}T00:00:00Z`;

      const updateData = {
        cliente_id: formData.cliente_id,
        almacen_id: formData.almacen_id,
        fecha_entrega: fechaFormateada,
        estado: formData.estado,
        notas: formData.notas
      };
      
      const response = await pedidoApi.updatePedido(parseInt(id), updateData);
      
      if (response) {
        Alert.alert(
          'Proyección Actualizada',
          'La proyección ha sido actualizada exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar la proyección');
      }
    } catch (err) {
      console.error('Error updating pedido:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error al actualizar la proyección';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Editar Proyección',
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos...</ThemedText>
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
        <ThemedText type="title" style={styles.heading}>Editar Proyección</ThemedText>
        
        <ThemedView style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            Nota: Solo puedes modificar información básica de la proyección. Los detalles de productos no se pueden editar.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          {/* Cliente Selector */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Cliente *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.cliente_id?.toString()}
                onValueChange={(value) => handleChange('cliente_id', value)}
                style={[
                  styles.picker,
                  { color: Colors[colorScheme].text }
                ]}
              >
                {clientes.map(cliente => (
                  <Picker.Item 
                    key={cliente.id} 
                    label={cliente.nombre} 
                    value={cliente.id.toString()} 
                  />
                ))}
              </Picker>
            </View>
            {errors.cliente_id && (
              <ThemedText style={styles.errorText}>{errors.cliente_id}</ThemedText>
            )}
          </ThemedView>

          {/* Almacén Selector */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Almacén *</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' },
              !isAdmin && styles.disabledContainer
            ]}>
              <Picker
                selectedValue={formData.almacen_id?.toString()}
                onValueChange={(value) => handleChange('almacen_id', value)}
                style={[
                  styles.picker,
                  { color: Colors[colorScheme].text }
                ]}
                enabled={isAdmin}
              >
                {almacenes.map(almacen => (
                  <Picker.Item 
                    key={almacen.id} 
                    label={almacen.nombre} 
                    value={almacen.id.toString()} 
                  />
                ))}
              </Picker>
            </View>
            {!isAdmin && (
              <ThemedText style={styles.infoText}>
                Solo administradores pueden cambiar el almacén
              </ThemedText>
            )}
            {errors.almacen_id && (
              <ThemedText style={styles.errorText}>{errors.almacen_id}</ThemedText>
            )}
          </ThemedView>

          {/* Estado del Pedido */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Estado</ThemedText>
            <View style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
            ]}>
              <Picker
                selectedValue={formData.estado}
                onValueChange={(value) => handleChange('estado', value)}
                style={[
                  styles.picker,
                  { color: Colors[colorScheme].text }
                ]}
              >
                <Picker.Item label="Programado" value="programado" />
                <Picker.Item label="Confirmado" value="confirmado" />
                <Picker.Item label="Entregado" value="entregado" />
                <Picker.Item label="Cancelado" value="cancelado" />
              </Picker>
            </View>
          </ThemedView>

          {/* Fecha de entrega */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Fecha de Entrega *</ThemedText>
            <TouchableOpacity 
              style={[
                styles.input,
                errors.fecha_entrega && styles.inputError,
                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText style={{ color: Colors[colorScheme].text }}>
                {formData.fecha_entrega ? new Date(formData.fecha_entrega).toLocaleDateString() : 'Seleccionar fecha'}
              </ThemedText>
              <IconSymbol name="calendar" size={20} color={Colors[colorScheme].text} />
            </TouchableOpacity>
            {errors.fecha_entrega && (
              <ThemedText style={styles.errorText}>{errors.fecha_entrega}</ThemedText>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={formData.fecha_entrega ? new Date(formData.fecha_entrega) : new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={formData.estado === 'programado' ? new Date() : undefined} // Solo restringir para pedidos programados
              />
            )}
          </ThemedView>

          {/* Notas */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Notas (opcional)</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: Colors[colorScheme].text }
              ]}
              value={formData.notas}
              onChangeText={(value) => handleChange('notas', value)}
              placeholder="Información adicional sobre la proyección"
              placeholderTextColor="#9BA1A6"
              multiline
              numberOfLines={3}
            />
          </ThemedView>

          <ThemedView style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Guardar Cambios</ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
  },
  form: {
    gap: 16,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
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
  inputError: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#88c8d8',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});