import React, { useEffect, useRef } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { useVentas } from '@/hooks/crud/useVentas';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ProductDetailsList from '@/components/ProductDetailsList';
import DateField from '@/components/form/DateField';

export default function EditVentaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Referencia para controlar la carga inicial
  const hasLoadedRef = useRef(false);
  
  // Usar el hook de ventas
  const {
    form,
    isLoading,
    error,
    clientes,
    almacenes,
    venta,
    loadVentaForEdit,
    updateVenta,
    loadOptions
  } = useVentas();

  // Cargar datos de la venta SOLO UNA VEZ
  useEffect(() => {
    // Solo ejecutar si no se ha cargado ya
    if (!hasLoadedRef.current && id) {
      console.log(`⭐ Cargando datos para edición de venta ID: ${id}`);
      
      const fetchData = async () => {
        // Primero cargar las opciones (una sola vez)
        await loadOptions();
        
        // Luego cargar la venta específica
        await loadVentaForEdit(parseInt(id));
        
        // Marcar como cargado para evitar múltiples cargas
        hasLoadedRef.current = true;
      };
      
      fetchData();
    }
    
    // Limpieza cuando el componente se desmonta
    return () => {
      console.log("Limpiando componente de edición");
      hasLoadedRef.current = false;
    };
  }, [id]); // Solo dependemos del ID, ninguna función que cambie en cada renderizado

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error' }} />
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <ActionButtons 
            onCancel={() => router.back()}
            cancelText="Volver"
          />
        </ThemedView>
      </>
    );
  }

  // Crear opciones para los selectores
  const clienteOptions = clientes.map(cliente => ({
    label: cliente.nombre,
    value: cliente.id.toString(),
  }));

  const almacenOptions = almacenes.map(almacen => ({
    label: almacen.nombre,
    value: almacen.id.toString(),
  }));
  
  // Opciones para estado de pago
  const estadoPagoOptions = [
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Parcial', value: 'parcial' },
    { label: 'Pagado', value: 'pagado' },
  ];
  
  // Opciones para tipo de pago
  const tipoPagoOptions = [
    { label: 'Contado', value: 'contado' },
    { label: 'Crédito', value: 'credito' },
  ];

  return (
    <>
      <Stack.Screen options={{ title: `Editar Venta #${id}` }} />
      
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Editar Venta #{id}</ThemedText>
        
        {/* Notificación de inmutabilidad de detalles */}
        <ThemedView style={styles.infoBox}>
          <IconSymbol name="info.circle.fill" size={24} color="#2196F3" />
          <ThemedText style={styles.infoText}>
            Los productos de la venta no se pueden modificar. Solo puedes cambiar la información general.
          </ThemedText>
        </ThemedView>
        
        {/* Formulario de edición */}
        <FormSelect
          label="Cliente"
          value={form.formData.cliente_id}
          options={clienteOptions}
          onChange={(value) => form.handleChange('cliente_id', value)}
          error={form.errors.cliente_id}
          required
        />
        
        <FormSelect
          label="Almacén"
          value={form.formData.almacen_id}
          options={almacenOptions}
          onChange={(value) => form.handleChange('almacen_id', value)}
          error={form.errors.almacen_id}
          required
        />
        
        <DateField
          label="Fecha"
          value={form.formData.fecha}
          onChange={(value) => form.handleChange('fecha', value)}
          error={form.errors.fecha}
          required
        />
        
        <FormSelect
          label="Tipo de Pago"
          value={form.formData.tipo_pago}
          options={tipoPagoOptions}
          onChange={(value) => form.handleChange('tipo_pago', value)}
          error={form.errors.tipo_pago}
          required
        />
        
        <FormSelect
          label="Estado de Pago"
          value={form.formData.estado_pago || 'pendiente'}
          options={estadoPagoOptions}
          onChange={(value) => form.handleChange('estado_pago', value)}
          error={form.errors.estado_pago}
        />
        
        <FormField
          label="Consumo Diario (kg)"
          value={form.formData.consumo_diario_kg}
          onChangeText={(value) => form.handleChange('consumo_diario_kg', value)}
          keyboardType="numeric"
          error={form.errors.consumo_diario_kg}
        />
        
        {/* Sección de detalles (sólo lectura) */}
        {venta?.detalles && venta.detalles.length > 0 && (
          <ThemedView style={styles.detailsSection}>
            <ThemedText type="subtitle">Productos (solo lectura)</ThemedText>
            <ProductDetailsList 
              details={venta.detalles} 
              title="" 
            />
          </ThemedView>
        )}
        
        {/* Resumen financiero */}
        <ThemedView style={styles.summarySection}>
          <ThemedText type="subtitle">Resumen Financiero</ThemedText>
          
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              ${parseFloat(venta?.total || '0').toFixed(2)}
            </ThemedText>
          </ThemedView>
          
          {venta?.estado_pago !== 'pagado' && (
            <ThemedView style={styles.summaryInfo}>
              <IconSymbol name="info.circle.fill" size={16} color="#FF9800" />
              <ThemedText style={styles.summaryInfoText}>
                Puedes registrar nuevos pagos desde la vista de detalle de venta.
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
        
        {/* Botones de acción */}
        <ActionButtons
          onSave={updateVenta}
          onCancel={() => router.back()}
          isSubmitting={isLoading}
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
  title: {
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginVertical: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  detailsSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  summarySection: {
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 16,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  summaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 4,
  },
  summaryInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF9800',
  },
});