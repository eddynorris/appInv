// app/pedidos/create.tsx - Refactorizado
import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePedidoItem } from '@/hooks/crud/usePedidoItem';
import { ESTADOS_PEDIDO } from '@/models';
import { ClienteSearchModal } from '@/components/ClienteSearchModal';
import { ProductPicker } from '@/components/ProductPicker';
import ProductGrid from '@/components/ProductGrid';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ClienteSimple } from '@/models'; // Importar ClienteSimple
import { FormStyles, Spacing, Shadows } from '@/styles/Theme'; // Importar todo desde Theme

export default function CreatePedidoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const {
    isLoading,
    isLoadingOptions,
    error,
    form,
    detalles,
    validationRules,
    clientes, // Lista de clientes para el modal de búsqueda
    almacenes,
    presentaciones,
    showDatePicker,
    setShowDatePicker,
    showClienteModal,
    setShowClienteModal,
    showProductModal,
    setShowProductModal,
    prepareForCreate,
    createPedido,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    calcularTotal,
    handleDateSelection,
    handleSelectCliente,
    handleClienteCreated,
    isAdmin // Para control de almacén
  } = usePedidoItem();

  const { formData, errors, setErrors, isSubmitting, handleChange } = form;

  // Preparar el formulario al montar
  useEffect(() => {
    prepareForCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Encontrar el cliente seleccionado para mostrar su nombre
  const selectedCliente = useMemo(() => {
    if (!formData.cliente_id) return null;
    return clientes.find(c => c.id.toString() === formData.cliente_id);
  }, [formData.cliente_id, clientes]);

  // Calcular total estimado
  const totalEstimado = useMemo(() => calcularTotal(), [calcularTotal]);

  // Renombrar la función local para evitar confusión con form.handleSubmit
  const submitPedido = async () => {
    // La validación se delega a form.handleSubmit
    // Ya no se necesita la validación manual aquí:
    // const newErrors: Record<string, string> = {};
    // if (!formData.cliente_id) newErrors.cliente_id = 'El cliente es requerido';
    // ... (resto de validaciones manuales eliminadas)
    // if (Object.keys(newErrors).length > 0) { ... }

    // Simplemente llama a la función del hook que envía a la API
    // createPedido ya maneja las alertas de éxito/error internamente
    await createPedido();
    // No necesitamos devolver nada aquí, createPedido maneja la lógica post-submit
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'Nueva Proyección',
        headerShown: true
      }} />

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Sección Cliente */}
        <ThemedView style={styles.cardContainer}>
          <ThemedText style={FormStyles.label}>Cliente *</ThemedText>
          <TouchableOpacity
            style={styles.clienteSelectorContainer}
            onPress={() => setShowClienteModal(true)}
          >
            <ThemedText style={styles.clienteSelectorText}>
              {selectedCliente ? selectedCliente.nombre : 'Seleccionar Cliente'}
            </ThemedText>
            <IconSymbol name="chevron.right" size={20} color={Colors[colorScheme].icon} />
          </TouchableOpacity>
          {errors.cliente_id && (
            <ThemedText style={FormStyles.errorText}>{errors.cliente_id}</ThemedText>
          )}
          <TouchableOpacity style={styles.inlineButton} onPress={() => setShowClienteModal(true)}>
             <IconSymbol name="magnifyingglass" size={16} color={Colors.primary} />
             <ThemedText style={styles.inlineButtonText}>Buscar Cliente</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Sección Detalles Proyección */}
        <ThemedView style={styles.cardContainer}>
          {/* Almacén Selector (Solo visible/editable para admin si se necesita) */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Almacén *</ThemedText>
            <View style={[
              FormStyles.pickerContainer,
              { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground },
              !isAdmin && FormStyles.disabledContainer // Deshabilitar si no es admin
            ]}>
              <Picker
                selectedValue={formData.almacen_id}
                // Permitir cambio solo si es admin, sino usar el del usuario por defecto
                onValueChange={(value) => isAdmin && handleChange('almacen_id', value)}
                style={[FormStyles.picker, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                enabled={isAdmin} // Habilitar solo para admin
              >
                {/* Mostrar almacén del usuario o lista si es admin */}
                {isAdmin ? (
                  almacenes.map(almacen => (
                    <Picker.Item
                      key={almacen.id.toString()}
                      label={almacen.nombre}
                      value={almacen.id.toString()}
                    />
                  ))
                ) : (
                  // Si no es admin, mostrar solo el almacén asignado (si existe)
                  almacenes.filter(a => a.id.toString() === formData.almacen_id).map(almacen => (
                     <Picker.Item
                      key={almacen.id.toString()}
                      label={almacen.nombre}
                      value={almacen.id.toString()}
                    />
                  ))
                )}
              </Picker>
            </View>
             {errors.almacen_id && (
                <ThemedText style={FormStyles.errorText}>{errors.almacen_id}</ThemedText>
             )}
          </ThemedView>

          {/* Fecha de Entrega */}
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Fecha de Entrega *</ThemedText>
            <TouchableOpacity
              style={[FormStyles.input, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => setShowDatePicker(true)}
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
              { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }
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
              style={[FormStyles.textArea, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground, color: isDark ? Colors.dark.text : Colors.light.text }]}
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

        {/* Sección Productos */}
        <ThemedView style={styles.cardContainer}>
            <ThemedText type="subtitle">Productos</ThemedText>
            {errors.detalles && (
                <ThemedText style={[FormStyles.errorText, {marginTop: 8, marginBottom: 8}]}>{errors.detalles}</ThemedText>
             )}
             {isLoadingOptions ? (
                <ActivityIndicator />
             ) : (
                <ProductGrid
                    detalles={detalles}
                    presentaciones={presentaciones}
                    onUpdate={actualizarProducto}
                    onRemove={eliminarProducto}
                    onAddProduct={() => setShowProductModal(true)}
                    isPedido={true}
                    readOnly={isSubmitting}
                />
             )}
        </ThemedView>

         {/* Sección Total */}
        <ThemedView style={[styles.cardContainer, styles.totalContainer]}>
            <ThemedText style={styles.totalLabel}>Total Estimado:</ThemedText>
            <ThemedText style={styles.totalValue}>${totalEstimado.toFixed(2)}</ThemedText>
        </ThemedView>

        {/* Botones de Acción */}
        <ActionButtons
          onSave={() => form.handleSubmit(submitPedido, validationRules)}
          onCancel={() => router.back()}
          isSubmitting={form.isSubmitting || isLoading || isLoadingOptions}
          saveText="Registrar Proyección"
        />

      </ScrollView>

      {/* Modal para buscar cliente */}
      <ClienteSearchModal
        visible={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSelectCliente={handleSelectCliente}
        onClienteCreated={handleClienteCreated}
        initialClientes={clientes}
      />

      {/* Modal para seleccionar producto */}
      <ProductPicker
        visible={showProductModal}
        presentaciones={presentaciones}
        isLoading={isLoadingOptions}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={agregarProducto}
      />
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
  clienteSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border, // Ajustar para dark mode
    marginBottom: 8,
  },
  clienteSelectorText: {
    fontSize: 16,
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  inlineButtonText: {
    marginLeft: 6,
    color: Colors.primary,
    fontWeight: '500',
  },
  totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
  },
  totalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
  },
  totalValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors.primary, // O el color que prefieras para el total
  },
  cardContainer: { // Nuevo estilo para reemplazar formCard
    backgroundColor: Colors.light.background, // Usar background de light theme como base
    borderRadius: FormStyles.input.borderRadius, // Usar mismo borde que inputs
    padding: Spacing.lg, // Usar espaciado consistente
    marginBottom: Spacing.lg,
    ...Shadows.small, // Aplicar sombra si se desea
  },
  // ... otros estilos si son necesarios
});