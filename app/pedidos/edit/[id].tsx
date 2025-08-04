// app/pedidos/edit/[id].tsx - Refactorizado
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePedidoItem } from '@/hooks/pedidos';
import { ESTADOS_PEDIDO } from '@/models';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { FormStyles, Spacing, Shadows } from '@/styles/Theme';

export default function EditPedidoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idNumerico = id ? parseInt(id as string) : 0;
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Usar el hook de item de pedido
  const {
    pedido,       // Pedido actual cargado
    formData,
    errors,
    isSubmitting,
    clientes,     // Necesario para mostrar el nombre del cliente
    almacenes,    // Necesario para el selector de almacén (si es admin)
    isLoading,
    isLoadingOptions,
    error,
    loadPedidoForEdit,
    updatePedido,
    isAdmin,      // Para control de edición de almacén
    showDatePicker,
    setShowDatePicker,
    handleDateSelection,
    handleChange
  } = usePedidoItem();

  // Cargar datos del pedido para edición al montar
  useEffect(() => {
    if (idNumerico) {
      loadPedidoForEdit(idNumerico);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idNumerico]); // No incluir loadPedidoForEdit para evitar bucles

  // Encontrar el cliente seleccionado para mostrar su nombre
  const selectedCliente = useMemo(() => {
    if (!formData.cliente_id) return null;
    return clientes.find((c: any) => c.id.toString() === formData.cliente_id);
  }, [formData.cliente_id, clientes]);

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (idNumerico) {
      // updatePedido maneja la validación internamente
      await updatePedido(idNumerico);
    }
  };

  // Renderizado condicional: Cargando datos
  if (isLoading || isLoadingOptions) {
    return (
      <>
        <Stack.Screen options={{ title: 'Editar Proyección', headerShown: true }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText>Cargando datos...</ThemedText>
        </ThemedView>
      </>
    );
  }

  // Renderizado condicional: Error o Pedido no encontrado
  if (error || !pedido) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error', headerShown: true }} />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>
            {error || 'No se pudo cargar la proyección para editar'}
          </ThemedText>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
             <ThemedText style={styles.backButtonText}>Volver</ThemedText>
          </TouchableOpacity>
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

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.infoBoxContainer}>
          <ThemedText style={FormStyles.infoText}>
            Solo puedes modificar información básica. Los detalles de productos no se pueden editar aquí.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.cardContainer}>
          {/* Cliente (solo lectura en edición) */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Cliente</ThemedText>
            <TextInput
               style={[FormStyles.input, FormStyles.disabledContainer, {color: isDark ? Colors.dark.text : Colors.light.text}]}
               value={selectedCliente?.nombre || 'Cargando...'}
               editable={false}
            />
             {/* Opcional: botón para ver cliente si se necesita */}
          </ThemedView>

          {/* Almacén Selector */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Almacén *</ThemedText>
            <View style={[
              FormStyles.pickerContainer,
              { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground },
              !isAdmin && FormStyles.disabledContainer
            ]}>
              <Picker
                selectedValue={formData.almacen_id}
                onValueChange={(value) => isAdmin && handleChange('almacen_id', value)}
                style={[FormStyles.picker, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                enabled={isAdmin && !isSubmitting}
              >
                 {almacenes.map(almacen => (
                    <Picker.Item
                      key={almacen.id.toString()}
                      label={almacen.nombre}
                      value={almacen.id.toString()}
                    />
                  ))}
              </Picker>
            </View>
            {!isAdmin && (
               <ThemedText style={FormStyles.infoText}>Solo admins pueden cambiar el almacén</ThemedText>
            )}
             {errors.almacen_id && (
               <ThemedText style={FormStyles.errorText}>{errors.almacen_id}</ThemedText>
             )}
          </ThemedView>

          {/* Fecha de Entrega */}
           <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Fecha de Entrega *</ThemedText>
            <TouchableOpacity
              style={[FormStyles.input, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, isSubmitting && FormStyles.disabledContainer]}
              onPress={() => !isSubmitting && setShowDatePicker(true)}
              disabled={isSubmitting}
            >
              <ThemedText>
                {formData.fecha_entrega ? new Date(formData.fecha_entrega).toLocaleDateString() : 'Seleccionar fecha'}
              </ThemedText>
               <IconSymbol name="calendar" size={20} color={Colors[colorScheme].icon} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.fecha_entrega ? new Date(formData.fecha_entrega) : new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => handleDateSelection(date)}
                minimumDate={new Date()} // No permitir fechas pasadas
              />
            )}
             {errors.fecha_entrega && (
                <ThemedText style={FormStyles.errorText}>{errors.fecha_entrega}</ThemedText>
             )}
          </ThemedView>

          {/* Estado Selector */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Estado</ThemedText>
            <View style={[
              FormStyles.pickerContainer,
              { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground },
              isSubmitting && FormStyles.disabledContainer
            ]}>
              <Picker
                selectedValue={formData.estado}
                onValueChange={(value) => handleChange('estado', value)}
                style={[FormStyles.picker, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                enabled={!isSubmitting}
              >
                 {ESTADOS_PEDIDO.map(estado => (
                    <Picker.Item key={estado} label={estado.charAt(0).toUpperCase() + estado.slice(1)} value={estado} />
                ))}
              </Picker>
            </View>
          </ThemedView>

          {/* Notas */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Notas</ThemedText>
            <TextInput
              style={[FormStyles.textArea, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground, color: isDark ? Colors.dark.text : Colors.light.text }, isSubmitting && FormStyles.disabledContainer]}
              value={formData.notas}
              onChangeText={(text) => handleChange('notas', text)}
              placeholder="Notas adicionales sobre la proyección..."
              placeholderTextColor={Colors[colorScheme].placeholder}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />
          </ThemedView>
        </ThemedView>

        {/* Sección de Productos (solo lectura) */}
        <ThemedView style={styles.infoSection}>
          <ThemedText type="subtitle">Productos en la Proyección</ThemedText>
          <ThemedText style={FormStyles.infoText}>
            Los productos asociados no pueden ser modificados desde aquí.
          </ThemedText>
          <View style={styles.productSummary}>
            <ThemedText style={styles.productCount}>
              {pedido.detalles?.length || 0} productos incluidos
            </ThemedText>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => router.replace(`/pedidos/${idNumerico}`)} // Volver a detalles
            >
              <ThemedText style={styles.viewButtonText}>Ver Detalles</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Botones de acción */}
        <ActionButtons
          onSave={handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting}
          saveText="Guardar Cambios"
        />
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
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    color: Colors.danger,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
     color: 'white',
     fontWeight: 'bold',
  },
  infoSection: {
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)', // Ajustar color según tema
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
    backgroundColor: Colors.secondary, // Usar color secundario
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  infoBoxContainer: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: FormStyles.input.borderRadius,
    backgroundColor: Colors.info + '1A',
  },
  cardContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: FormStyles.input.borderRadius,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
});