// components/form/PaymentForm.tsx - Versión optimizada
import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { API_CONFIG } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FormStyles } from '@/styles/Theme';
import { FileInfo } from '@/hooks/useImageUploader';

// Payment method options
const PAYMENT_METHODS = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Transferencia', value: 'transferencia' },
  { label: 'Tarjeta', value: 'tarjeta' }
];

interface VentaOption {
  id: string;
  label: string;
  saldoPendiente: string;
}

interface PaymentFormProps {
  formData: {
    venta_id: string;
    monto: string;
    fecha: string;
    metodo_pago: string;
    referencia: string;
  };
  errors: Record<string, string>;
  isSubmitting: boolean;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  comprobante: FileInfo | null;
  setComprobante: (file: FileInfo | null) => void;
  existingComprobante: string | null;
  setExistingComprobante: (value: string | null) => void;
  ventaOptions?: VentaOption[];
  ventaInfo?: { total: string; cliente: string; saldoPendiente: string } | null;
  isEdit?: boolean;
  isVentaSelectionDisabled?: boolean;
  pickImage?: () => Promise<void>;
  takePhoto?: () => Promise<void>;
  pickDocument?: () => Promise<void>;
}

// Componente memoizado que muestra información de venta
const VentaInfo = memo(({ ventaInfo }: { ventaInfo: { total: string; cliente: string; saldoPendiente: string } | null }) => {
  if (!ventaInfo) return null;
  
  return (
    <ThemedView style={styles.ventaInfoContainer}>
      <ThemedView style={styles.ventaInfoRow}>
        <ThemedText style={styles.ventaInfoLabel}>Cliente:</ThemedText>
        <ThemedText style={styles.ventaInfoValue}>{ventaInfo.cliente}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.ventaInfoRow}>
        <ThemedText style={styles.ventaInfoLabel}>Total Venta:</ThemedText>
        <ThemedText style={styles.ventaInfoValue}>${ventaInfo.total}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.ventaInfoRow}>
        <ThemedText style={styles.ventaInfoLabel}>Saldo Pendiente:</ThemedText>
        <ThemedText style={styles.ventaInfoValue}>${ventaInfo.saldoPendiente}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
});

// Componente para seleccionar fecha
const DateField = memo(({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (date: string) => void;
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      onChange(formattedDate);
    }
  }, [onChange]);

  return (
    <ThemedView style={FormStyles.formGroup}>
      <ThemedText style={FormStyles.label}>Fecha</ThemedText>
      <TouchableOpacity 
        style={[
          FormStyles.input,
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
        ]}
        onPress={() => setShowDatePicker(true)}
      >
        <ThemedText>
          {value ? new Date(value).toLocaleDateString() : 'Seleccionar fecha'}
        </ThemedText>
        <IconSymbol name="calendar" size={20} color="#666666" />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </ThemedView>
  );
});

// Componente para gestionar el comprobante
const FileUploadSection = memo(({
  metodo_pago,
  comprobante,
  existingComprobante,
  setComprobante,
  setExistingComprobante,
  error,
  pickImage,
  takePhoto,
  pickDocument
}: {
  metodo_pago: string;
  comprobante: FileInfo | null;
  existingComprobante: string | null;
  setComprobante: (file: FileInfo | null) => void;
  setExistingComprobante: (value: string | null) => void;
  error?: string;
  pickImage?: () => Promise<void>;
  takePhoto?: () => Promise<void>;
  pickDocument?: () => Promise<void>;
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  
  // Solo mostrar para transferencias
  if (metodo_pago !== 'transferencia') {
    return null;
  }

  // Ver comprobante existente
  const viewExistingComprobante = () => {
    if (existingComprobante) {
      const comprobanteUrl = API_CONFIG.getImageUrl(existingComprobante);
      if (comprobanteUrl) {
        alert(`URL del comprobante: ${comprobanteUrl}`);
      } else {
        console.warn('No se pudo obtener una URL válida para el comprobante existente:', existingComprobante);
        alert('No se pudo obtener la URL del comprobante.');
      }
    }
  };

  // Eliminar comprobante existente
  const removeExistingComprobante = () => {
    setExistingComprobante(null);
    setComprobante(null);
  };

  return (
    <ThemedView style={styles.formGroup}>
      <ThemedText style={styles.label}>Comprobante *</ThemedText>
      
      {existingComprobante && (
        <ThemedView style={styles.existingComprobante}>
          <IconSymbol name="doc.fill" size={24} color="#4CAF50" />
          <ThemedText style={styles.existingComprobanteText}>Comprobante ya cargado</ThemedText>
          <View style={styles.existingComprobanteButtons}>
            <TouchableOpacity 
              style={[styles.smallButton, { backgroundColor: '#2196F3' }]}
              onPress={viewExistingComprobante}
            >
              <IconSymbol name="eye.fill" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.smallButton, { backgroundColor: '#F44336' }]}
              onPress={removeExistingComprobante}
            >
              <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ThemedView>
      )}
      
      {comprobante && (
        <ThemedView style={styles.comprobantePreview}>
          <IconSymbol 
            name={comprobante.type.includes('pdf') ? "doc.fill" : "photo.fill"} 
            size={24} 
            color="#0a7ea4" 
          />
          <ThemedText style={styles.comprobanteText}>
            {comprobante.name}
          </ThemedText>
          <TouchableOpacity 
            style={[styles.smallButton, { backgroundColor: '#F44336' }]}
            onPress={() => setComprobante(null)}
          >
            <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </ThemedView>
      )}
      
      <ThemedView style={styles.comprobanteButtons}>
        <TouchableOpacity 
          style={[styles.comprobanteButton, { backgroundColor: '#2196F3' }]}
          onPress={pickImage}
        >
          <IconSymbol name="photo" size={20} color="#FFFFFF" />
          <ThemedText style={styles.comprobanteButtonText}>
            Galería
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.comprobanteButton, { backgroundColor: '#4CAF50' }]}
          onPress={takePhoto}
        >
          <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
          <ThemedText style={styles.comprobanteButtonText}>
            Cámara
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.comprobanteButton, { backgroundColor: '#9C27B0' }]}
          onPress={pickDocument}
        >
          <IconSymbol name="doc.fill" size={20} color="#FFFFFF" />
          <ThemedText style={styles.comprobanteButtonText}>
            PDF
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      {error && (
        <ThemedText style={FormStyles.errorText}>{error}</ThemedText>
      )}
      
      <ThemedText style={FormStyles.infoText}>
        Formatos aceptados: JPG, PNG, PDF (máx. 5MB)
      </ThemedText>
    </ThemedView>
  );
});

// Componente principal del formulario
export const PaymentForm = memo(({
  formData,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
  comprobante,
  setComprobante,
  existingComprobante,
  setExistingComprobante,
  ventaOptions = [],
  ventaInfo,
  isEdit = false,
  isVentaSelectionDisabled = false,
  pickImage,
  takePhoto,
  pickDocument
}: PaymentFormProps) => {
  
  return (
    <ThemedView style={styles.form}>
      {/* Selector de Venta */}
      <FormSelect
        label="Venta a la que pertenece el pago"
        value={formData.venta_id}
        onChange={(value: string) => onChange('venta_id', value)}
        options={[
          { label: "Seleccione una venta", value: "" },
          ...ventaOptions.map(v => ({ label: v.label, value: v.id }))
        ]}
        error={errors.venta_id}
        required
        disabled={isSubmitting || isVentaSelectionDisabled}
      />
      
      {/* Mostrar información de la venta seleccionada */}
      {ventaInfo && <VentaInfo ventaInfo={ventaInfo} />}
      
      {/* Monto del Pago */}
      <FormField
        label="Monto del Pago"
        value={formData.monto}
        onChangeText={(value) => onChange('monto', value)}
        placeholder="0.00"
        keyboardType="numeric"
        error={errors.monto}
        required
        disabled={isSubmitting}
      />
      
      {/* Fecha */}
      <DateField 
        value={formData.fecha}
        onChange={(date) => onChange('fecha', date)} 
      />
      
      {/* Método de Pago */}
      <FormSelect
        label="Método de Pago"
        value={formData.metodo_pago}
        onChange={(value: string) => onChange('metodo_pago', value)}
        options={PAYMENT_METHODS}
        error={errors.metodo_pago}
        disabled={isSubmitting}
      />
      
      {/* Campo Referencia */}
      {formData.metodo_pago === 'transferencia' && (
        <FormField
          label="Referencia"
          value={formData.referencia}
          onChangeText={(value) => onChange('referencia', value)}
          placeholder="Referencia de la transferencia"
          error={errors.referencia}
          required
          disabled={isSubmitting}
        />
      )}
      
      {/* Sección de carga de comprobante */}
      <FileUploadSection
        metodo_pago={formData.metodo_pago}
        comprobante={comprobante}
        existingComprobante={existingComprobante}
        setComprobante={setComprobante}
        setExistingComprobante={setExistingComprobante}
        error={errors.comprobante}
        pickImage={pickImage}
        takePhoto={takePhoto}
        pickDocument={pickDocument}
      />
      
      {/* Botones de Acción */}
      <ActionButtons
        onSave={onSubmit}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        saveText={isEdit ? "Actualizar Pago" : "Registrar Pago"}
      />
    </ThemedView>
  );
});

const styles = StyleSheet.create({
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
  ventaInfoContainer: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  ventaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ventaInfoLabel: {
    fontWeight: '500',
  },
  ventaInfoValue: {
    fontWeight: '600',
  },
  existingComprobante: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  existingComprobanteText: {
    flex: 1,
    marginLeft: 8,
    fontWeight: '500',
  },
  existingComprobanteButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  comprobantePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  comprobanteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  comprobanteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  comprobanteButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  comprobanteText: {
    flex: 1,
    color: '#0a7ea4',
    fontWeight: '500',
  },
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});