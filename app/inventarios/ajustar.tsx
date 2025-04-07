// app/inventario/ajustar.tsx - Versión optimizada usando useInventarios
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import LotePickerDialog from '@/components/data/LotePickerDialog';
import { useInventarios } from '@/hooks/crud/useInventarios';
import { Colors } from '@/constants/Colors';
import { Lote } from '@/models';

export default function AjusteStockScreen() {
  const { id, accion = 'aumentar' } = useLocalSearchParams<{ 
    id: string; 
    accion?: 'aumentar' | 'disminuir';
  }>();
  
  // Estados
  const [currentStock, setCurrentStock] = useState(0);
  const [minStock, setMinStock] = useState(0);
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [selectedLote, setSelectedLote] = useState<string | null>(null);
  const [selectedLoteText, setSelectedLoteText] = useState('');
  const [inventarioData, setInventarioData] = useState<any>(null);
  const [showLotePicker, setShowLotePicker] = useState(false);
  
  // Usar custom hook de inventarios
  const { 
    isLoading, 
    isSubmitting,
    error, 
    lotes,
    getItem,
    ajustarInventario
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
          setCurrentStock(data.cantidad);
          setMinStock(data.stock_minimo);
          
          // Si ya tiene un lote asociado, seleccionarlo
          if (data.lote_id) {
            setSelectedLote(data.lote_id.toString());
            
            // Buscar el texto del lote
            const lote = lotes.find(l => l.id === data.lote_id);
            if (lote) {
              setSelectedLoteText(`Lote #${lote.id} (${lote.fecha_ingreso.split('T')[0]})`);
            } else {
              setSelectedLoteText(`Lote #${data.lote_id}`);
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar inventario:', error);
      }
    };
    
    loadInventario();
  }, [id, getItem, lotes]);
  
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
  
  // Registrar movimiento
  const registrarMovimiento = async () => {
    if (!id) return;
    
    // Validaciones
    if (!cantidad || parseInt(cantidad) <= 0) {
      alert('Ingrese una cantidad válida.');
      return;
    }
    
    if (!motivo.trim()) {
      alert('Ingrese un motivo para el movimiento.');
      return;
    }
    
    try {
      // Realizar el ajuste usando la función del hook
      const success = await ajustarInventario(
        parseInt(id),
        accion,
        parseInt(cantidad),
        motivo,
        selectedLote ? parseInt(selectedLote) : undefined
      );
      
      if (success) {
        alert(`Stock ${accion === 'aumentar' ? 'aumentado' : 'disminuido'} correctamente.`);
        router.back();
      }
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      alert('Error al registrar el movimiento.');
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
          title: 'Ajuste de Stock',
          headerStyle: {
            backgroundColor: '#4CAF50',
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
        </View>
        
        {/* Ajuste manual */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ajuste manual</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Stock actual:</Text>
            <TextInput
              style={styles.stockInput}
              value={currentStock.toString()}
              editable={false}
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Stock mínimo:</Text>
            <TextInput
              style={styles.stockInput}
              value={minStock.toString()}
              editable={false}
            />
          </View>
        </View>
        
        {/* Registrar movimiento */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Registrar movimiento</Text>
          
          <Text style={styles.inputLabel}>Tipo:</Text>
          <View style={styles.toggleContainer}>
            <View style={[
              styles.toggleButton, 
              {backgroundColor: accion === 'aumentar' ? '#4CAF50' : '#E0E0E0'}
            ]}>
              <Text style={[
                styles.toggleText,
                {color: accion === 'aumentar' ? '#FFFFFF' : '#666666'}
              ]}>
                Entrada
              </Text>
            </View>
            
            <View style={[
              styles.toggleButton, 
              {backgroundColor: accion === 'disminuir' ? '#F44336' : '#E0E0E0'}
            ]}>
              <Text style={[
                styles.toggleText,
                {color: accion === 'disminuir' ? '#FFFFFF' : '#666666'}
              ]}>
                Salida
              </Text>
            </View>
          </View>
          
          <Text style={styles.inputLabel}>Actualizar stock:</Text>
          <View style={styles.stockAdjustRow}>
            <TouchableOpacity 
              style={styles.stockButton}
              onPress={decrementCantidad}
            >
              <Text style={styles.stockButtonText}>-</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.newStockInput}
              value={cantidad}
              onChangeText={handleCantidadChange}
              keyboardType="numeric"
            />
            
            <TouchableOpacity 
              style={styles.stockButton}
              onPress={incrementCantidad}
            >
              <Text style={styles.stockButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Motivo:</Text>
            <TextInput
              style={styles.motivoInput}
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Ej: Ingreso de nuevo lote"
            />
          </View>
          
          {/* Solo mostrar selector de lote si hay lotes disponibles */}
          {lotesFiltrados.length > 0 && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Lote:</Text>
              <TouchableOpacity 
                style={styles.loteInputContainer}
                onPress={() => setShowLotePicker(true)}
              >
                <Text style={[styles.loteInput, !selectedLoteText && styles.placeholderText]}>
                  {selectedLoteText || "Seleccionar lote"}
                </Text>
                <IconSymbol name="chevron.down" size={20} color="#666666" style={styles.loteIcon} />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Diálogo selector de lote */}
          <LotePickerDialog
            visible={showLotePicker}
            lotes={lotesFiltrados}
            selectedLote={selectedLote}
            onSelect={(lote) => {
              setSelectedLote(lote.id.toString());
              setSelectedLoteText(`Lote #${lote.id} (${lote.fecha_ingreso.split('T')[0]})`);
              setShowLotePicker(false);
            }}
            onCancel={() => setShowLotePicker(false)}
          />
        </View>
        
        {/* Opciones de actualización */}
        <View style={styles.sectionCard}>
          <TouchableOpacity 
            style={[
              styles.movimientoButton,
              isSubmitting && styles.disabledButton
            ]}
            onPress={registrarMovimiento}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.movimientoButtonText}>
                {accion === 'aumentar' ? 'Registrar Entrada' : 'Registrar Salida'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>
              Cancelar
            </Text>
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
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  stockInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
    width: '50%',
    textAlign: 'center',
  },
  stockAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  stockButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  newStockInput: {
    width: 100,
    textAlign: 'center',
    fontSize: 18,
    paddingVertical: 8,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontWeight: '500',
  },
  motivoInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
  },
  loteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  loteInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    color: '#9E9E9E',
  },
  loteIcon: {
    padding: 4,
  },
  lotePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
  },
  lotePickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  lotePickerScrollView: {
    maxHeight: 200,
  },
  lotePickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  lotePickerItemSelected: {
    backgroundColor: '#E8F5E9',
  },
  lotePickerItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lotePickerItemSubtext: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  lotePickerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  lotePickerCancelButton: {
    flex: 1,
    padding: 10,
    marginRight: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    alignItems: 'center',
  },
  lotePickerCancelText: {
    color: '#424242',
    fontWeight: '500',
  },
  lotePickerConfirmButton: {
    flex: 1,
    padding: 10,
    marginLeft: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    alignItems: 'center',
  },
  lotePickerConfirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#424242',
    fontWeight: 'bold',
    fontSize: 16,
  },
  movimientoButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  movimientoButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
});