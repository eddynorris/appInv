// app/ventas/create.tsx - Refactorizado
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useVentaItem } from '@/hooks/crud/useVentaItem'; // Importar hook refactorizado
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormStyles, Spacing, Shadows } from '@/styles/Theme';
import { ClienteSearchModal } from '@/components/ClienteSearchModal';
import { ProductPicker } from '@/components/ProductPicker';
import ProductGrid from '@/components/ProductGrid';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { formatCurrency, formatDate } from '@/utils/formatters';


export default function CreateVentaScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Usar el hook de item de venta
  const {
    isLoading,
    isLoadingOptions,
    error,
    form,
    validationRules,
    clientes,
    almacenes,
    presentaciones,
    showDatePicker,
    setShowDatePicker,
    showClienteModal,
    setShowClienteModal,
    showProductModal,
    setShowProductModal,
    loadInitialData,
    createVenta,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    calcularTotal,
    handleDateSelection,
    handleSelectCliente,
    handleClienteCreated,
    handleAlmacenChange,
    isAdmin
  } = useVentaItem();

  const { formData, errors, isSubmitting, handleChange, handleSubmit } = form;

  // Cargar datos iniciales al montar la pantalla
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Encontrar cliente seleccionado para mostrar nombre
  const selectedCliente = useMemo(() => {
    if (!formData.cliente_id) return null;
    return clientes.find(c => c.id.toString() === formData.cliente_id);
  }, [formData.cliente_id, clientes]);

  // Calcular total (ya es un número)
  const totalVenta = useMemo(() => calcularTotal(), [calcularTotal]);

  // Función de envío (ya no necesita lógica propia, usa handleSubmit)
  const submitVenta = async () => {
    await form.handleSubmit(createVenta, validationRules);
  };

  // --- Renderizado Condicional ---
  if (isLoadingOptions) { // Mostrar carga mientras se obtienen datos iniciales
    return (
       <>
        <Stack.Screen options={{ title: 'Nueva Venta', headerShown: true }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText>Cargando datos...</ThemedText>
        </ThemedView>
      </>
    );
  }
  
  if (error && !isLoading) { // Mostrar error si falló la carga inicial
     return (
       <>
        <Stack.Screen options={{ title: 'Error', headerShown: true }} />
        <ThemedView style={styles.errorContainer}>
           <IconSymbol name="exclamationmark.triangle" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>
             Error cargando datos: {error}
          </ThemedText>
           <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
             <ThemedText style={styles.backButtonText}>Volver</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </>
    );
  }

  // --- Renderizado del Formulario ---
  return (
    <ScreenContainer 
      title="Registrar Venta"
      isLoading={isLoadingOptions && clientes.length === 0} // Carga inicial de opciones
      error={error}
    >
      <Stack.Screen options={{ title: 'Nueva Venta', headerShown: true }} />

      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Sección Cliente */}
        <ThemedView style={styles.cardContainer}>
          <ThemedText style={FormStyles.label}>Cliente *</ThemedText>
          <TouchableOpacity
            style={[styles.selectorContainer, {backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground}]}
            onPress={() => setShowClienteModal(true)}
            disabled={isSubmitting}
          >
            <ThemedText style={styles.selectorText}>
              {selectedCliente ? selectedCliente.nombre : 'Seleccionar Cliente'}
            </ThemedText>
            <IconSymbol name="chevron.right" size={20} color={Colors[colorScheme].icon} />
          </TouchableOpacity>
          {errors.cliente_id && (
            <ThemedText style={FormStyles.errorText}>{errors.cliente_id}</ThemedText>
          )}
          <TouchableOpacity style={styles.inlineButton} onPress={() => setShowClienteModal(true)} disabled={isSubmitting}>
             <IconSymbol name="magnifyingglass" size={16} color={Colors.primary} />
             <ThemedText style={styles.inlineButtonText}>Buscar/Crear Cliente</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Sección Detalles Venta */}
        <ThemedView style={styles.cardContainer}>
           {/* Almacén */} 
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Almacén *</ThemedText>
            <View style={[FormStyles.pickerContainer, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }]}>
              <Picker
                selectedValue={formData.almacen_id}
                onValueChange={(value) => handleAlmacenChange(value)}
                style={[FormStyles.picker, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                enabled={isAdmin && !isSubmitting && !isLoadingOptions} // Solo admin puede cambiar si hay > 1
              >
                <Picker.Item label={isLoadingOptions ? "Cargando..." : "Seleccione un almacén..."} value="" />
                {almacenes.map(almacen => (
                  <Picker.Item
                    key={almacen.id.toString()}
                    label={almacen.nombre}
                    value={almacen.id.toString()}
                  />
                ))}
              </Picker>
            </View>
             {errors.almacen_id && (
                <ThemedText style={FormStyles.errorText}>{errors.almacen_id}</ThemedText>
             )}
             {!isAdmin && formData.almacen_id && (
                <ThemedText style={FormStyles.infoText}>Almacén asignado a tu usuario.</ThemedText>
             )}
          </ThemedView>

          {/* Fecha */} 
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Fecha *</ThemedText>
            <TouchableOpacity
              style={[FormStyles.input, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, isSubmitting && FormStyles.disabledContainer]}
              onPress={() => !isSubmitting && setShowDatePicker(true)}
              disabled={isSubmitting}
            >
              <ThemedText>
                {formData.fecha ? formatDate(formData.fecha) : 'Seleccionar fecha'}
              </ThemedText>
               <IconSymbol name="calendar" size={20} color={Colors[colorScheme].icon} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.fecha ? new Date(formData.fecha) : new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => handleDateSelection(date)}
              />
            )}
             {errors.fecha && (
                <ThemedText style={FormStyles.errorText}>{errors.fecha}</ThemedText>
             )}
          </ThemedView>

          {/* Tipo Pago */} 
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Tipo de Pago *</ThemedText>
            <View style={[FormStyles.pickerContainer, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }]}>
              <Picker
                selectedValue={formData.tipo_pago}
                onValueChange={(value) => handleChange('tipo_pago', value)}
                style={[FormStyles.picker, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                enabled={!isSubmitting}
              >
                <Picker.Item label="Contado" value="contado" />
                <Picker.Item label="Crédito" value="credito" />
              </Picker>
            </View>
            {errors.tipo_pago && <ThemedText style={FormStyles.errorText}>{errors.tipo_pago}</ThemedText>}
          </ThemedView>
          
           {/* Consumo Diario */} 
          <ThemedView style={FormStyles.formGroup}>
            <ThemedText style={FormStyles.label}>Consumo Diario (kg)</ThemedText>
            <TextInput
              style={[FormStyles.input, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground, color: isDark ? Colors.dark.text : Colors.light.text }, errors.consumo_diario_kg && FormStyles.inputError, isSubmitting && FormStyles.disabledContainer]}
              value={formData.consumo_diario_kg}
              onChangeText={(text) => handleChange('consumo_diario_kg', text)}
              placeholder="Opcional: Kg consumidos por día"
              placeholderTextColor={Colors[colorScheme].placeholder}
              keyboardType="numeric"
              editable={!isSubmitting}
            />
            {errors.consumo_diario_kg && (
                <ThemedText style={FormStyles.errorText}>{errors.consumo_diario_kg}</ThemedText>
             )}
          </ThemedView>
        </ThemedView>

        {/* Sección Productos */} 
        <ThemedView style={styles.cardContainer}>
            <ThemedText type="subtitle">Productos</ThemedText>
            {errors.detalles && (
                <ThemedText style={[FormStyles.errorText, {marginTop: 8, marginBottom: 8}]}>{errors.detalles}</ThemedText>
             )}
             {(isLoadingOptions && !presentaciones.length && formData.almacen_id) ? (
                <ThemedText style={FormStyles.infoText}>Cargando productos para almacén...</ThemedText>
             ) : !formData.almacen_id ? (
                <ThemedText style={FormStyles.infoText}>Seleccione un almacén para ver productos.</ThemedText>
             ) : ( 
                <ProductGrid
                    detalles={formData.detalles.map(d => ({ // Adaptar a la interfaz de ProductGrid
                      ...d,
                      presentacion_id: d.presentacion_id.toString(), // Convertir id a string
                      cantidad: d.cantidad.toString(), // Convertir cantidad a string
                      precio_unitario: d.precio_unitario.toString() // Convertir precio a string
                    }))}
                    presentaciones={presentaciones} // Pasar presentaciones filtradas
                    onUpdate={(index, field, value) => {
                        // Convertir valor de vuelta si es necesario antes de llamar a actualizarProducto
                        actualizarProducto(index, field as any, value);
                    }}
                    onRemove={eliminarProducto}
                    onAddProduct={() => setShowProductModal(true)}
                    isPedido={false} // Indicar que es Venta (precio unitario)
                    readOnly={isSubmitting || !formData.almacen_id}
                />
             )}
        </ThemedView>

         {/* Sección Total */} 
        <ThemedView style={[styles.cardContainer, styles.totalContainer]}>
            <ThemedText style={styles.totalLabel}>Total Venta:</ThemedText>
            <ThemedText style={styles.totalValue}>{formatCurrency(totalVenta)}</ThemedText>
        </ThemedView>

      </ScrollView>

      {/* Botones de Acción */} 
      <ActionButtons
        onSave={submitVenta}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting || isLoading}
        saveText="Registrar Venta"
      />

      {/* Modales */} 
      <ClienteSearchModal
        visible={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSelectCliente={handleSelectCliente}
        onClienteCreated={handleClienteCreated}
        initialClientes={clientes}
      />

      <ProductPicker
        visible={showProductModal}
        presentaciones={presentaciones} // Pasar presentaciones filtradas por almacén
        isLoading={isLoadingOptions}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={agregarProducto} // Pasar función de agregar
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: { 
    backgroundColor: Colors.light.background, 
    borderRadius: FormStyles.input.borderRadius, 
    padding: Spacing.lg, 
    marginBottom: Spacing.lg,
    ...Shadows.small, 
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border, 
    marginBottom: 8,
  },
  selectorText: {
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
      color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl, // Usar constante de espaciado
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl, // Usar constante de espaciado
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 14,
    textAlign: 'center',
    color: Colors.danger,
  },
  backButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: FormStyles.input.borderRadius, // Usar borde consistente
  },
  backButtonText: {
     color: 'white', // Mantener blanco
     fontWeight: 'bold',
  },
});