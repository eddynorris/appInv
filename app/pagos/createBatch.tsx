import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedText } from '@/components/ThemedText';
import DateField from '@/components/form/DateField';
import { FormField } from '@/components/form/FormField';
import { ImageUploader, FileInfo } from '@/components/form/ImageUploader';
import { Venta } from '@/models/venta';
// Importar el hook consolidado y la interfaz para los items del JSON
import { usePagosBatchProcess, PagoJsonDataItem } from '@/hooks/crud/usePagosBatchProcess'; // Ajustar la ruta si es necesario
import { Picker } from '@react-native-picker/picker';
import { formatCurrency } from '@/utils/formatters';
 import { Colors } from '@/styles/Theme';

// Interfaz para el estado local de las ventas en la pantalla (para UI)
interface PagoSeleccionadoParaUI extends Venta {
  montoAPagar: string;
  seleccionada: boolean;
}

export default function CreatePagoBatchScreen() {
  // Usar el hook consolidado para obtener datos y funciones de envío
  const { 
    ventasPendientes: ventasPendientesOriginal, // Datos de ventas desde el hook
    isLoadingVentas, 
    errorVentas, 
    refetchVentasPendientes, // Función para recargar ventas
    createPagoBatch,         // Función para crear el batch de pagos
    isSubmitting,            // Estado de envío
    submissionError          // Error durante el envío
  } = usePagosBatchProcess();
  
  // Estado local para manejar la UI de selección y montos
  const [ventasParaSeleccionUI, setVentasParaSeleccionUI] = useState<PagoSeleccionadoParaUI[]>([]);
  
  // Estados locales para los campos del formulario
  const [fechaDeposito, setFechaDeposito] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState('transferencia');
  const [referencia, setReferencia] = useState('');
  const [comprobante, setComprobante] = useState<FileInfo | null>(null);
  
  // Efecto para transformar los datos del hook al estado local de la UI
  useEffect(() => {
    if (ventasPendientesOriginal) {
      setVentasParaSeleccionUI(
        ventasPendientesOriginal.map(venta => ({
          ...venta,
          montoAPagar: venta.saldo_pendiente?.toString().replace(',', '') || '0',
          seleccionada: false,
        }))
      );
    }
  }, [ventasPendientesOriginal]);

  // Efecto para mostrar errores de envío provenientes del hook
  useEffect(() => {
    if (submissionError) {
      Alert.alert("Error al Registrar Pagos", submissionError);
    }
  }, [submissionError]);

  // Manejadores de UI
  const handleToggleSeleccionVenta = (ventaId: number) => {
    setVentasParaSeleccionUI(prevVentas =>
      prevVentas.map(venta =>
        venta.id === ventaId ? { ...venta, seleccionada: !venta.seleccionada } : venta
      )
    );
  };

  const handleMontoChange = (ventaId: number, monto: string) => {
    const sanitizedMonto = monto.replace(/[^0-9.]/g, '');
    setVentasParaSeleccionUI(prevVentas =>
      prevVentas.map(venta =>
        venta.id === ventaId ? { ...venta, montoAPagar: sanitizedMonto } : venta
      )
    );
  };

  // Lógica de envío del formulario
  const handleSubmit = async () => {
    const pagosDataList: PagoJsonDataItem[] = ventasParaSeleccionUI
      .filter(v => v.seleccionada)
      .map(v => ({
        venta_id: v.id,
        monto: v.montoAPagar,
      }));

    // Validaciones de UI
    if (pagosDataList.length === 0) {
      Alert.alert("Validación", "Debe seleccionar al menos una venta.");
      return;
    }
    if (!comprobante) {
      Alert.alert("Validación", "Debe adjuntar un archivo de comprobante.");
      return;
    }
    for (const pago of pagosDataList) {
      const montoNum = parseFloat(pago.monto);
      const ventaOriginal = ventasPendientesOriginal.find(v => v.id === pago.venta_id); // Usar datos del hook para validación
      const saldoPendienteNum = parseFloat(ventaOriginal?.saldo_pendiente?.toString().replace(',', '') || '0');

      if (isNaN(montoNum) || montoNum <= 0) {
        Alert.alert("Validación", `El monto para la Venta #${pago.venta_id} debe ser un número positivo.`);
        return;
      }
      if (montoNum > saldoPendienteNum + 0.001) { 
        Alert.alert("Validación", `El monto ${formatCurrency(montoNum)} para la Venta #${pago.venta_id} no puede exceder el saldo pendiente de ${formatCurrency(saldoPendienteNum)}.`);
        return;
      }
    }
    
    // Construir FormData
    const formData = new FormData();
    formData.append('pagos_json_data', JSON.stringify(pagosDataList));
    // FIX: Convertir la fecha al formato ISO 8601 completo que espera el backend
    const fechaParaApi = `${fechaDeposito}T00:00:00`;
    formData.append('fecha', fechaParaApi);
    formData.append('metodo_pago', metodoPago);
    if (referencia) {
      formData.append('referencia', referencia);
    }
    if (comprobante && typeof comprobante.uri === 'string') {
        const uriParts = comprobante.uri.split('.');
        const fileTypeExtension = uriParts[uriParts.length - 1];
        formData.append('comprobante', {
            uri: comprobante.uri,
            name: comprobante.name || `comprobante.${fileTypeExtension}`,
            type: comprobante.type || `image/${fileTypeExtension}`,
        } as any);
    } else {
        Alert.alert("Error de Comprobante", "El archivo de comprobante no es válido.");
        return;
    }

    // Llamar a la función de creación del hook
    const success = await createPagoBatch(formData); 
    if (success) {
      Alert.alert("Éxito", "Pagos registrados en lote exitosamente.");
      router.replace('/pagos'); 
    }
    // El manejo de errores de envío (submissionError) ya se hace con el useEffect
  };
  
  const metodoPagoOptions = [
    { label: 'Transferencia Bancaria', value: 'transferencia' },
    { label: 'Depósito en Cuenta', value: 'deposito' },
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Tarjeta', value: 'tarjeta' },
    { label: 'Yape/Plin', value: 'yape/plin' },
    { label: 'Otros', value: 'otro' },
  ];

  // Renderizado condicional basado en el estado de carga del hook
  if (isLoadingVentas) {
    return (
      <ScreenContainer title="Registrar Pagos en Lote">
        <ActivityIndicator size="large" color={Colors.light.tint} style={styles.centered} />
        <ThemedText style={styles.loadingText}>Cargando ventas pendientes...</ThemedText>
      </ScreenContainer>
    );
  }

  // Renderizado condicional basado en el estado de error del hook
  if (errorVentas) {
    return (
      <ScreenContainer title="Registrar Pagos en Lote">
        <ThemedText style={styles.errorText}>Error al cargar ventas: {errorVentas}</ThemedText>
        <TouchableOpacity onPress={refetchVentasPendientes} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar Carga</Text>
        </TouchableOpacity>
        <ActionButtons onCancel={() => router.back()} /> 
      </ScreenContainer>
    );
  }
  
  const ventasSeleccionadasUI = ventasParaSeleccionUI.filter(v => v.seleccionada);

  return (
    <ScreenContainer title="Registrar Pagos en Lote" scrollable>
      <Stack.Screen options={{ title: 'Registrar Pagos en Lote' }} />
      
      <ThemedText type="subtitle" style={styles.sectionTitle}>1. Seleccione Ventas a Pagar</ThemedText>
      {ventasPendientesOriginal.length === 0 && !isLoadingVentas && (
        <ThemedText style={styles.noDataText}>No hay ventas con saldo pendiente.</ThemedText>
      )}
      {ventasParaSeleccionUI.map((venta) => (
        <TouchableOpacity 
          key={venta.id} 
          style={styles.ventaItemContainer} 
          onPress={() => handleToggleSeleccionVenta(venta.id)}
        >
          <View style={[styles.checkbox, venta.seleccionada && styles.checkboxSelected]}>
            {venta.seleccionada && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
          <View style={styles.ventaInfo}>
            <ThemedText style={styles.ventaText}>Venta #{venta.id} - {venta.cliente?.nombre || 'N/A'}</ThemedText>
            <ThemedText style={styles.ventaSaldo}>Saldo: {formatCurrency(parseFloat(venta.saldo_pendiente?.toString().replace(',','') || '0'))}</ThemedText>
          </View>
        </TouchableOpacity>
      ))}

      {ventasSeleccionadasUI.length > 0 && (
        <>
          <ThemedText type="subtitle" style={styles.sectionTitle}>2. Ingrese Montos a Pagar</ThemedText>
          {ventasSeleccionadasUI.map((venta) => (
            <FormField key={`monto-${venta.id}`} label={`Monto Venta #${venta.id} (Saldo: ${formatCurrency(parseFloat(venta.saldo_pendiente?.toString().replace(',','') || '0'))})`}>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={venta.montoAPagar}
                onChangeText={text => handleMontoChange(venta.id, text)}
                placeholder="0.00"
                editable={venta.seleccionada}
              />
            </FormField>
          ))}
        </>
      )}
      
      <ThemedText type="subtitle" style={styles.sectionTitle}>3. Datos del Comprobante General</ThemedText>
      <DateField label="Fecha del Depósito/Pago" value={fechaDeposito} onChange={setFechaDeposito} />
      
      <FormField label="Método de Pago">
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={metodoPago}
            onValueChange={(itemValue) => setMetodoPago(itemValue)}
            style={styles.picker}
            prompt="Seleccione un método de pago"
          >
            {metodoPagoOptions.map(opt => (
              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </Picker>
        </View>
      </FormField>

      <FormField label="Referencia (Opcional)">
        <TextInput
          style={styles.textInput}
          value={referencia}
          onChangeText={setReferencia}
          placeholder="Ej: Nro. Operación, Código Yape"
        />
      </FormField>
      
      <ImageUploader 
        label="Adjuntar Comprobante (Obligatorio)" 
        value={comprobante} 
        onChange={setComprobante} 
      />

      <View style={styles.spacer} /> 

      <ActionButtons
        onSave={handleSubmit}
        saveText="Registrar Pagos"
        isSubmitting={isSubmitting} // Proviene del hook usePagosBatchProcess
        onCancel={() => router.back()}
      />
       <View style={styles.spacerLarge} /> 
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  ventaItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border || '#eee',
    backgroundColor: Colors.light.card || '#fff',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.light.tint, 
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.light.tint, 
  },
  checkboxCheck: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ventaInfo: {
    flex: 1,
  },
  ventaText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  ventaSaldo: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.light.border || '#ccc',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.inputBackground || '#fff',
    fontSize: 16,
    color: Colors.light.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.light.border || '#ccc',
    borderRadius: 5,
    backgroundColor: Colors.light.inputBackground || '#fff',
    justifyContent: 'center',
    minHeight: 50,
  },
  picker: {
    width: '100%',
    color: Colors.light.text,
    ...(Platform.OS === 'ios' && { height: 150 }), 
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spacer: {
    height: 20,
  },
  spacerLarge: {
    height: 40,
  }
});
