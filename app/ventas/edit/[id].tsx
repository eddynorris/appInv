import React, { useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { useVentaItem } from '@/hooks/ventas';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ProductDetailsList from '@/components/ProductDetailsList';
import DateField from '@/components/form/DateField';
import { capitalize } from '@/utils/formatters';
import { FormStyles } from '@/styles/Theme';

export default function EditVentaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idNumerico = id ? parseInt(id as string) : 0;
  
  const hasLoadedRef = useRef(false);
  
  const {
    formData,
    errors,
    isLoading,
    error,
    clientes,
    almacenes,
    venta,
    loadVentaForEdit,
    updateVenta,
    handleChange,
  } = useVentaItem();

  useEffect(() => {
    if (!hasLoadedRef.current && idNumerico) {
      
      const fetchData = async () => {
        await loadVentaForEdit(idNumerico);
        hasLoadedRef.current = true;
      };
      
      fetchData();
    }
    
    return () => {
      hasLoadedRef.current = false;
    };
  }, [idNumerico]);

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

  const clienteOptions = clientes.map(cliente => ({
    label: cliente.nombre,
    value: cliente.id.toString(),
  }));
  
  const tipoPagoOptions = [
    { label: 'Contado', value: 'contado' },
    { label: 'Crédito', value: 'credito' },
  ];
  
  const nombreAlmacenActual = almacenes.find(a => 
    a.id.toString() === venta?.almacen_id?.toString()
  )?.nombre || 'N/A';

  const detallesParaLista = (venta?.detalles || []).map(detalle => ({
    id: detalle.id,
    presentacion_id: detalle.presentacion_id,
    cantidad: detalle.cantidad,
    precio_unitario: detalle.precio_unitario,
    presentacion: detalle.presentacion ? {
      id: detalle.presentacion.id,
      nombre: detalle.presentacion.nombre,
      url_foto: detalle.presentacion.url_foto || undefined,
      capacidad_kg: detalle.presentacion.capacidad_kg || undefined,
      producto: undefined,
    } : undefined,
  }));

  return (
    <>
      <Stack.Screen options={{ title: `Editar Venta #${id}` }} />
      
      <ScrollView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Editar Venta #{id}</ThemedText>
        
        <ThemedView style={styles.infoBox}>
          <IconSymbol name="info.circle.fill" size={24} color="#2196F3" />
          <ThemedText style={styles.infoText}>
            Los productos de la venta no se pueden modificar. Solo puedes cambiar la información general.
          </ThemedText>
        </ThemedView>
        
        <FormSelect
          label="Cliente"
          value={formData.cliente_id}
          options={clienteOptions}
          onChange={(value: string) => handleChange('cliente_id', value)}
          error={errors?.cliente_id}
          required
        />
        
        <View style={FormStyles.formGroup}>
           <ThemedText style={FormStyles.label}>Almacén</ThemedText>
           <ThemedText style={styles.readOnlyField}>{nombreAlmacenActual}</ThemedText>
        </View>
        
        <DateField
          label="Fecha"
          value={formData.fecha}
          onChange={(value) => handleChange('fecha', value)}
          error={errors?.fecha}
          required
        />
        
        <FormSelect
          label="Tipo de Pago"
          value={formData.tipo_pago}
          options={tipoPagoOptions}
          onChange={(value: string) => handleChange('tipo_pago', value)}
          error={errors?.tipo_pago}
          required
        />
        
        <View style={FormStyles.formGroup}>
           <ThemedText style={FormStyles.label}>Estado de Pago</ThemedText>
           <ThemedText style={styles.readOnlyField}>{capitalize(venta?.estado_pago || 'pendiente')}</ThemedText>
        </View>
        
        <FormField
          label="Consumo Diario (kg)"
          value={formData.consumo_diario_kg}
          onChangeText={(value) => handleChange('consumo_diario_kg', value)}
          keyboardType="numeric"
          error={errors?.consumo_diario_kg}
        />
        
        {detallesParaLista.length > 0 && (
          <ThemedView style={styles.detailsSection}>
            <ThemedText type="subtitle">Productos (solo lectura)</ThemedText>
            <ProductDetailsList 
              details={detallesParaLista} 
              title="" 
            />
          </ThemedView>
        )}
        
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
        
        <ActionButtons
          onSave={() => updateVenta(idNumerico)}
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
  readOnlyField: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    color: '#666',
    marginTop: 4,
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
    marginBottom: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  summaryInfoText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#E65100',
  },
});