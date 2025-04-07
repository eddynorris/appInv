// app/inventarios/ajustar.tsx - Versión optimizada y simplificada
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import LotePickerDialog from '@/components/data/LotePickerDialog';
import { useInventarios } from '@/hooks/crud/useInventarios';
import { Colors } from '@/constants/Colors';
import { Lote } from '@/models';

export default function AjusteSimplificadoScreen() {
  const { id, accion = 'aumentar' } = useLocalSearchParams<{ 
    id: string; 
    accion?: 'aumentar' | 'disminuir';
  }>();
  
  // Estados
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [inventarioData, setInventarioData] = useState<any>(null);
  const [selectedLote, setSelectedLote] = useState<string | null>(null);
  const [selectedLoteInfo, setSelectedLoteInfo] = useState<Lote | null>(null);
  const [showLotePicker, setShowLotePicker] = useState(false);
  
  // Usar custom hook de inventarios
  const { 
    isLoading, 
    isSubmitting,
    error, 
    getItem,
    ajustarInventarioSimplificado,
    lotes,
    formatLoteForDisplay
  } = useInventarios();
  
  // Filtrar lotes compatibles con la presentación actual
  const lotesFiltrados = lotes.filter(lote => {
    if (!inventarioData?.presentacion?.producto_id) return true;
    return lote.producto_id === inventarioData.presentacion.producto_id;
  });
  
  // Cargar datos del inventario
  useEffect(() => {
    const loadInventario = async () => {
      if (!id) return;
      
      try {
        const data = await getItem(parseInt(id));
        if (data) {
          setInventarioData(data);
          // Si el inventario tiene un lote asociado, seleccionarlo por defecto
          if (data.lote_id) {
            setSelectedLote(data.lote_id.toString());
            
            // Buscar la información del lote
            const loteInfo = lotes.find(l => l.id === data.lote_id);
            if (loteInfo) {
              setSelectedLoteInfo(loteInfo);
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar inventario:', error);
        Alert.alert('Error', 'No se pudo cargar los datos del inventario');
      }
    };
    
    loadInventario();
  }, [id, getItem, lotes]);
  
  // Manejar selección de lote
  const handleLoteSelect = (lote: Lote) => {
    setSelectedLote(lote.id.toString());
    setSelectedLoteInfo(lote);
    setShowLotePicker(false);
  };
  
  // Manejar cambio de cantidad
  const handleCantidadChange = (value: string) => {
    // Solo permitir números
    if (/^\d*$/.test(value)) {
      setCantidad(value);
    }
  };
  
  // Incrementar cantidad
  const incrementCantidad = () => {
    const current = parseInt(cantidad) || 0;
    setCantidad((current + 1).toString());
  };
  
  // Decrementar cantidad
  const decrementCantidad = () => {
    const current = parseInt(cantidad) || 0;
    if (current > 1) {
      setCantidad((current - 1).toString());
    }
  };
  
  // Registrar ajuste
  const registrarAjuste = async () => {
    if (!id) return;
    
    // Validaciones
    if (!cantidad || parseInt(cantidad) <= 0) {
      Alert.alert('Error', 'Ingrese una cantidad válida.');
      return;
    }
    
    if (!motivo.trim()) {
      Alert.alert('Error', 'Ingrese un motivo para el ajuste.');
      return;
    }
    
    try {
      // Realizar el ajuste usando la función simplificada
      const success = await ajustarInventarioSimplificado({
        inventarioId: parseInt(id),
        accion,
        cantidad: parseInt(cantidad),
        motivo,
        // Usar el lote seleccionado si es diferente al actual
        ...(selectedLote && selectedLote !== inventarioData.lote_id?.toString() && 
            { loteId: parseInt(selectedLote) })
      });
      
      if (success) {
        Alert.alert(
          'Éxito', 
          `Stock ${accion === 'aumentar' ? 'aumentado' : 'disminuido'} correctamente.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error al registrar ajuste:', error);
      Alert.alert('Error', 'No se pudo realizar el ajuste.');
    }
  };

  // Pantalla de carga
  if (isLoading || !inventarioData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: accion === 'aumentar' ? 'Aumentar Stock' : 'Disminuir Stock',
          headerStyle: {
            backgroundColor: accion === 'aumentar' ? '#4CAF50' : '#F44336',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 10 }}
            >
              <IconSymbol name="arrow.left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView>
        {/* Info del producto */}
        <View style={styles.productCard}>
          <Text style={styles.productName}>
            {inventarioData.presentacion?.nombre || 'Producto'}
          </Text>
          <Text style={styles.productDescription}>
            {inventarioData.presentacion?.producto?.nombre || 'Sin descripción'}
          </Text>
          <Text style={styles.almacenText}>
            Almacén: {inventarioData.almacen?.nombre || 'No especificado'}
          </Text>
          
          {/* Lote actual */}
          {inventarioData.lote_id && (
            <View style={styles.loteActualContainer}>
              <Text style={styles.loteActualLabel}>Lote actual:</Text>
              <Text style={styles.loteActualValue}>
                #{inventarioData.lote_id}
              </Text>
            </View>
          )}
          
          {/* Stock actual */}
          <View style={styles.stockInfoContainer}>
            <View style={styles.stockInfoItem}>
              <Text style={styles.stockInfoLabel}>Stock actual:</Text>
              <Text style={styles.stockInfoValue}>{inventarioData.cantidad}</Text>
            </View>
            
            <View style={styles.stockInfoItem}>
              <Text style={styles.stockInfoLabel}>Stock mínimo:</Text>
              <Text style={styles.stockInfoValue}>{inventarioData.stock_minimo}</Text>
            </View>
          </View>
        </View>
        
        {/* Ajuste simplificado */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {accion === 'aumentar' ? 'Aumentar Stock' : 'Disminuir Stock'}
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cantidad a {accion === 'aumentar' ? 'agregar' : 'restar'}:</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={decrementCantidad}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.quantityInput}
                value={cantidad}
                onChangeText={handleCantidadChange}
                keyboardType="numeric"
              />
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={incrementCantidad}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Motivo:</Text>
            <TextInput
              style={styles.motivoInput}
              value={motivo}
              onChangeText={setMotivo}
              placeholder={accion === 'aumentar' ? 'Ej: Compra de inventario' : 'Ej: Consumo interno'}
              multiline
            />
          </View>
          
          {/* Selector de lote - Solo en operaciones de aumento */}
          {accion === 'aumentar' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Lote:</Text>
              <TouchableOpacity 
                style={styles.loteSelector}
                onPress={() => setShowLotePicker(true)}
              >
                <Text style={styles.loteSelectorText}>
                  {selectedLote 
                    ? `Lote #${selectedLote}${inventarioData?.lote_id?.toString() === selectedLote 
                        ? ' (Actual)' 
                        : ''}`
                    : 'Seleccionar lote (opcional)'}
                </Text>
                <IconSymbol name="chevron.down" size={20} color="#666666" />
              </TouchableOpacity>
              
              {/* Información del lote seleccionado */}
              {selectedLoteInfo && selectedLote !== inventarioData?.lote_id?.toString() && (
                <View style={styles.loteInfoCard}>
                  <View style={styles.loteInfoHeader}>
                    <Text style={styles.loteInfoTitle}>Lote seleccionado: #{selectedLoteInfo.id}</Text>
                  </View>
                  
                  <View style={styles.loteInfoRow}>
                    <Text style={styles.loteInfoLabel}>Fecha de Ingreso:</Text>
                    <Text style={styles.loteInfoValue}>
                      {new Date(selectedLoteInfo.fecha_ingreso).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  {selectedLoteInfo.proveedor && (
                    <View style={styles.loteInfoRow}>
                      <Text style={styles.loteInfoLabel}>Proveedor:</Text>
                      <Text style={styles.loteInfoValue}>{selectedLoteInfo.proveedor.nombre}</Text>
                    </View>
                  )}
                </View>
              )}
              
              <Text style={styles.helperText}>
                {inventarioData.lote_id 
                  ? 'Puedes seleccionar un lote diferente si estás agregando productos de otro lote'
                  : 'Selecciona el lote de donde provienen los productos'}
              </Text>
            </View>
          )}
          
          {/* Diálogo selector de lote */}
          <LotePickerDialog
            visible={showLotePicker}
            lotes={lotesFiltrados}
            selectedLote={selectedLote}
            onSelect={handleLoteSelect}
            onCancel={() => setShowLotePicker(false)}
          />
          
          {/* Resultado esperado */}
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Nuevo stock esperado:</Text>
            <Text style={styles.resultValue}>
              {accion === 'aumentar' 
                ? inventarioData.cantidad + parseInt(cantidad || '0')
                : inventarioData.cantidad - parseInt(cantidad || '0')}
            </Text>
          </View>
        </View>
        
        {/* Botones de acción */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              { backgroundColor: accion === 'aumentar' ? '#4CAF50' : '#F44336' },
              isSubmitting && styles.disabledButton
            ]}
            onPress={registrarAjuste}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>
                {accion === 'aumentar' ? 'Registrar Entrada' : 'Registrar Salida'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    margin: 12,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  almacenText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  loteActualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  loteActualLabel: {
    fontSize: 13,
    color: '#4CAF50',
    marginRight: 4,
  },
  loteActualValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  stockInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  stockInfoItem: {
    alignItems: 'center',
  },
  stockInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  stockInfoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    margin: 12,
    marginTop: 0,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityInput: {
    width: 80,
    height: 50,
    textAlign: 'center',
    fontSize: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginHorizontal: 12,
  },
  motivoInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  loteSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
  },
  loteSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  loteInfoCard: {
    marginTop: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  loteInfoHeader: {
    marginBottom: 8,
  },
  loteInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  loteInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  loteInfoLabel: {
    fontSize: 13,
    color: '#555555',
  },
  loteInfoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
  },
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: '#333',
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  buttonsContainer: {
    padding: 12,
    marginBottom: 24,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.7,
  },
});