// components/form/PaymentForm.tsx
import React, { useState, useEffect, memo } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

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
  comprobante: { uri: string; name: string; type: string } | null;
  setComprobante: (file: { uri: string; name: string; type: string } | null) => void;
  existingComprobante: string | null;
  setExistingComprobante: (value: string | null) => void;
  ventaOptions?: VentaOption[];
  ventaInfo?: { total: string; cliente: string; saldoPendiente: string } | null;
  isEdit?: boolean;
}

// Memoized components for file handling
const FileUploadSection = memo(({
  metodo_pago,
  comprobante,
  existingComprobante,
  setComprobante,
  setExistingComprobante,
  error
}: {
  metodo_pago: string;
  comprobante: { uri: string; name: string; type: string } | null;
  existingComprobante: string | null;
  setComprobante: (file: { uri: string; name: string; type: string } | null) => void;
  setExistingComprobante: (value: string | null) => void;
  error?: string;
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  
  // Only show for transfers
  if (metodo_pago !== 'transferencia') {
    return null;
  }

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert('Permisos necesarios', 'Se requieren permisos de cámara y galería para subir fotos.');
      }
    })();
  }, []);

  // Image picker function
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validate file size (max 5MB)
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert('Error', 'El archivo es demasiado grande. El tamaño máximo es 5MB.');
          return;
        }
        
        // Determine MIME type
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const mimeType = fileType === 'pdf' ? 'application/pdf' : `image/${fileType}`;
        
        setComprobante({
          uri: asset.uri,
          name: asset.fileName || `comprobante.${fileType}`,
          type: mimeType
        });
        
        // Clear existing comprobante
        setExistingComprobante(null);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Camera function
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validate file size (max 5MB)
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert('Error', 'El archivo es demasiado grande. El tamaño máximo es 5MB.');
          return;
        }
        
        // Determine MIME type
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const mimeType = fileType === 'pdf' ? 'application/pdf' : `image/${fileType}`;
        
        setComprobante({
          uri: asset.uri,
          name: asset.fileName || `comprobante.${fileType}`,
          type: mimeType
        });
        
        // Clear existing comprobante
        setExistingComprobante(null);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Document picker function
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validate file size (max 5MB)
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert('Error', 'El archivo es demasiado grande. El tamaño máximo es 5MB.');
          return;
        }
        
        setComprobante({
          uri: asset.uri,
          name: asset.name || 'comprobante',
          type: asset.mimeType || (asset.name?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
        });
        
        // Clear existing comprobante
        setExistingComprobante(null);
      }
    } catch (error) {
      console.error('Error al seleccionar documento:', error);
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  // View existing comprobante
  const viewExistingComprobante = () => {
    if (existingComprobante) {
      const comprobanteUrl = `${API_CONFIG.baseUrl}/uploads/${existingComprobante}`;
      Alert.alert('Comprobante', `URL: ${comprobanteUrl}`);
    }
  };

  // Remove existing comprobante
  const removeExistingComprobante = () => {
    Alert.alert(
      'Eliminar Comprobante',
      '¿Está seguro que desea eliminar el comprobante actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: () => {
            setExistingComprobante(null);
            setComprobante(null);
          } 
        }
      ]
    );
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

// VentaInfo displays information about the selected sale
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

// Main PaymentForm component
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
  isEdit = false
}: PaymentFormProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  return (
    <ThemedView style={styles.form}>
      {/* Sale selection - only if not in edit mode */}
      {!isEdit && (
        <FormSelect
          label="Venta"
          value={formData.venta_id}
          options={ventaOptions.map(v => ({ label: v.label, value: v.id }))}
          onChange={(value) => onChange('venta_id', value)}
          error={errors.venta_id}
          required
        />
      )}
      
      {/* Sale info if available */}
      {ventaInfo && <VentaInfo ventaInfo={ventaInfo} />}
      
      {/* Amount */}
      <FormField
        label="Monto"
        value={formData.monto}
        onChangeText={(value) => onChange('monto', value)}
        placeholder="0.00"
        keyboardType="numeric"
        error={errors.monto}
        required
      />
      
      {/* Payment method */}
      <FormSelect
        label="Método de Pago"
        value={formData.metodo_pago}
        options={PAYMENT_METHODS}
        onChange={(value) => onChange('metodo_pago', value)}
      />
      
      {/* Date */}
      <FormField
        label="Fecha"
        value={new Date(formData.fecha).toLocaleDateString()}
        onChangeText={() => {}} // Handled by date picker
        placeholder="Seleccionar fecha"
        disabled={true}
      />
      
      {/* Reference - Only for transfers or cards */}
      {(formData.metodo_pago === 'transferencia' || formData.metodo_pago === 'tarjeta') && (
        <FormField
          label="Referencia"
          value={formData.referencia}
          onChangeText={(value) => onChange('referencia', value)}
          placeholder="Número de referencia"
          error={errors.referencia}
          required={formData.metodo_pago === 'transferencia'}
        />
      )}
      
      {/* File upload section for transfers */}
      <FileUploadSection
        metodo_pago={formData.metodo_pago}
        comprobante={comprobante}
        existingComprobante={existingComprobante}
        setComprobante={setComprobante}
        setExistingComprobante={setExistingComprobante}
        error={errors.comprobante}
      />
      
      {/* Action buttons */}
      <ActionButtons
        onSave={onSubmit}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        saveText={isEdit ? "Guardar Cambios" : "Registrar Pago"}
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