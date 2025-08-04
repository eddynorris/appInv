// components/form/VentaForm.tsx
import React, { memo, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import DateField from '@/components/form/DateField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import ProductGrid from '@/components/ProductGrid';
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Cliente, Almacen, Presentacion } from '@/models';
// Tipos movidos a hooks/ventas/useVentaForm.ts
interface DetalleVentaForm {
  id?: number;
  presentacion_id: number;
  cantidad: number;
  precio_unitario: string;
}

interface VentaFormType {
  cliente_id: string;
  almacen_id: string;
  fecha: string;
  tipo_pago: 'contado' | 'credito';
  consumo_diario_kg: string;
  detalles: DetalleVentaForm[];
}
import { FormStyles } from '@/styles/Theme';

interface VentaFormProps {
  formData: VentaFormType;
  detalles: DetalleVentaForm[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  clientes: Cliente[];
  almacenes: Almacen[];
  presentaciones: Presentacion[];
  presentacionesFiltradas: Presentacion[];
  isAdmin: boolean;
  isEditing: boolean;
  isLoadingPresentaciones?: boolean;
  onChange: (field: string, value: string) => void;
  onAlmacenChange?: (almacenId: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onAddProduct: () => void;
  onUpdateProduct: (index: number, field: string, value: string) => void;
  onRemoveProduct: (index: number) => void;
  calcularTotal: () => string;
}

// Componente para mostrar un mensaje cuando no hay presentaciones disponibles
const NoPresentacionesMessage = memo(({ 
  almacenNombre, 
  isAdmin, 
  onAddProductoAlmacen 
}: { 
  almacenNombre: string; 
  isAdmin: boolean;
  onAddProductoAlmacen: () => void;
}) => (
  <ThemedView style={styles.noPresentaciones}>
    <ThemedText style={styles.noPresentacionesText}>
      No hay productos disponibles en este almacén
    </ThemedText>
    <ThemedText style={styles.noPresentacionesInfo}>
      Almacén: {almacenNombre || 'No seleccionado'}
    </ThemedText>
    {isAdmin && (
      <TouchableOpacity
        style={styles.noPresentacionesButton}
        onPress={onAddProductoAlmacen}
      >
        <ThemedText style={styles.noPresentacionesButtonText}>
          Agregar Productos a este Almacén
        </ThemedText>
      </TouchableOpacity>
    )}
  </ThemedView>
));

const VentaForm = ({
  formData,
  detalles,
  errors,
  isSubmitting,
  clientes,
  almacenes,
  presentaciones,
  presentacionesFiltradas,
  isAdmin,
  isEditing,
  isLoadingPresentaciones = false,
  onChange,
  onAlmacenChange,
  onSubmit,
  onCancel,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
  calcularTotal
}: VentaFormProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  
  // Opciones para selectores en formato adecuado para FormSelect
  const clienteOptions = useMemo(() => 
    clientes.map(cliente => ({
      label: cliente.nombre,
      value: cliente.id.toString()
    })), [clientes]);
  
  const almacenOptions = useMemo(() => 
    almacenes.map(almacen => ({
      label: almacen.nombre,
      value: almacen.id.toString()
    })), [almacenes]);
    
  // Obtener nombre del almacén seleccionado
  const almacenSeleccionado = useMemo(() => 
    almacenes.find(a => a.id.toString() === formData.almacen_id)?.nombre || 'No seleccionado',
    [almacenes, formData.almacen_id]);

  // Función para navegar a crear presentación en el almacén seleccionado
  const handleAddProductoAlmacen = () => {
    // Implementación para navegar a la pantalla de crear presentación
    router.push({
      pathname: '/presentaciones/create',
      params: { almacen_id: formData.almacen_id }
    });
  };
  
  // Manejar cambio de almacén (con manejador especial si existe)
  const handleAlmacenChange = (value: string) => {
    if (onAlmacenChange) {
      onAlmacenChange(value);
    } else {
      onChange('almacen_id', value);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <ThemedText type="title" style={styles.heading}>
          {isEditing ? 'Editar Venta' : 'Registrar Venta'}
        </ThemedText>
        
        {isEditing && (
          <ThemedView style={styles.infoBox}>
            <ThemedText style={styles.infoText}>
              Nota: Solo puedes modificar información básica de la venta. Los detalles de productos no se pueden editar.
            </ThemedText>
          </ThemedView>
        )}
        
        <ThemedView style={FormStyles.container}>
          {/* Primera fila: Almacén y Tipo de Pago */}
          <ThemedView style={FormStyles.rowContainer}>
            {/* Almacén Selector */}
            <ThemedView style={[FormStyles.formGroup, FormStyles.halfWidth]}>
              <ThemedText style={FormStyles.label}>
                Almacén {isAdmin ? '(Admin)' : ''}
              </ThemedText>
              <View style={[
                FormStyles.pickerContainer,
                { backgroundColor: isDark ? Colors.backgroundDark : Colors.lightGray1 },
                !isAdmin && FormStyles.disabledContainer
              ]}>
                <Picker
                  selectedValue={formData.almacen_id}
                  onValueChange={handleAlmacenChange}
                  style={[FormStyles.picker, { color: isDark ? Colors.white : Colors.textDark }]}
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
                <ThemedText style={FormStyles.infoText}>Asignado a tu usuario</ThemedText>
              )}
              {errors.almacen_id && (
                <ThemedText style={FormStyles.errorText}>{errors.almacen_id}</ThemedText>
              )}
            </ThemedView>

            {/* Tipo de Pago */}
            <ThemedView style={[FormStyles.formGroup, FormStyles.halfWidth]}>
              <ThemedText style={FormStyles.label}>Tipo de Pago</ThemedText>
              <View style={[
                FormStyles.pickerContainer,
                { backgroundColor: isDark ? Colors.backgroundDark : Colors.lightGray1 }
              ]}>
                <Picker
                  selectedValue={formData.tipo_pago}
                  onValueChange={(value) => onChange('tipo_pago', value)}
                  style={[FormStyles.picker, { color: isDark ? Colors.white : Colors.textDark }]}
                >
                  <Picker.Item label="Contado" value="contado" />
                  <Picker.Item label="Crédito" value="credito" />
                </Picker>
              </View>
            </ThemedView>
          </ThemedView>

          {/* Segunda fila: Fecha y Consumo Diario */}
          <ThemedView style={FormStyles.rowContainer}>
            {/* Fecha - Usando el nuevo componente DateField */}
            <ThemedView style={[FormStyles.halfWidth]}>
              <DateField
                label="Fecha"
                value={formData.fecha}
                onChange={(value) => onChange('fecha', value)}
                error={errors.fecha}
                required
              />
            </ThemedView>

            {/* Consumo diario (opcional) */}
            <ThemedView style={[FormStyles.formGroup, FormStyles.halfWidth]}>
              <ThemedText style={FormStyles.label}>Consumo Diario (kg)</ThemedText>
              <TextInput
                style={[
                  FormStyles.input,
                  { color: isDark ? Colors.white : Colors.textDark }
                ]}
                value={formData.consumo_diario_kg}
                onChangeText={(value) => onChange('consumo_diario_kg', value)}
                placeholder="0.00"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
            </ThemedView>
          </ThemedView>
          
          {/* Estado de pago (solo en edición) */}
          {isEditing && (
            <ThemedView style={FormStyles.formGroup}>
              <ThemedText style={FormStyles.label}>Estado de Pago</ThemedText>
              <View style={[
                FormStyles.pickerContainer,
                { backgroundColor: isDark ? Colors.backgroundDark : Colors.lightGray1 }
              ]}>
                <Picker
                  selectedValue={formData.estado_pago || 'pendiente'}
                  onValueChange={(value) => onChange('estado_pago', value)}
                  style={[FormStyles.picker, { color: isDark ? Colors.white : Colors.textDark }]}
                >
                  <Picker.Item label="Pagado" value="pagado" />
                  <Picker.Item label="Pendiente" value="pendiente" />
                  <Picker.Item label="Pago Parcial" value="parcial" />
                </Picker>
              </View>
            </ThemedView>
          )}
          
          {/* Cliente Selector */}
          <FormSelect
            label="Cliente *"
            value={formData.cliente_id}
            options={clienteOptions}
            onChange={(value) => onChange('cliente_id', value)}
            error={errors.cliente_id}
            required
          />
          
          {/* Lista de Productos - Solo visible si no es edición */}
          {!isEditing && (
            <ThemedView style={styles.detallesSection}>
              <ThemedText type="subtitle" style={styles.subtitle}>Productos</ThemedText>
              
              {isLoadingPresentaciones ? (
                <ThemedView style={styles.loadingPresentaciones}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <ThemedText>Cargando productos disponibles...</ThemedText>
                </ThemedView>
              ) : presentacionesFiltradas.length === 0 ? (
                <NoPresentacionesMessage 
                  almacenNombre={almacenSeleccionado}
                  isAdmin={isAdmin}
                  onAddProductoAlmacen={handleAddProductoAlmacen}
                />
              ) : (
                <ProductGrid
                  detalles={detalles}
                  presentaciones={presentaciones}
                  onUpdate={onUpdateProduct}
                  onRemove={onRemoveProduct}
                  onAddProduct={onAddProduct}
                  isPedido={false}
                />
              )}
              
              {errors.detalles && (
                <ThemedText style={FormStyles.errorText}>{errors.detalles}</ThemedText>
              )}
            </ThemedView>
          )}
          
          {/* Total */}
          <ThemedView style={styles.totalSection}>
            <ThemedText style={styles.totalLabel}>Total:</ThemedText>
            <ThemedText style={styles.totalValue}>${calcularTotal()}</ThemedText>
          </ThemedView>
          
          {/* Botones de acción */}
          <ActionButtons
            onSave={onSubmit}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            saveDisabled={isEditing ? false : (detalles.length === 0 || presentacionesFiltradas.length === 0)}
            saveText={isEditing ? "Guardar Cambios" : "Registrar Venta"}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  detallesSection: {
    marginTop: 16,
    gap: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingPresentaciones: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
  },
  noPresentaciones: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    gap: 12,
  },
  noPresentacionesText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  noPresentacionesInfo: {
    textAlign: 'center',
    fontSize: 13,
    color: '#FF5722',
  },
  noPresentacionesButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  noPresentacionesButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
});

export default memo(VentaForm);