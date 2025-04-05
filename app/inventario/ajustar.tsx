// app/inventario/ajustar.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { useInventario } from '@/hooks/crud/useInventario';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Inventario } from '@/models';

export default function AjustarInventarioScreen() {
  const { id, accion = 'aumentar' } = useLocalSearchParams<{ 
    id: string; 
    accion: 'aumentar' | 'disminuir' 
  }>();
  
  const colorScheme = useColorScheme() ?? 'light';
  
  // Estados locales para esta pantalla
  const [inventario, setInventario] = useState<Inventario | null>(null);
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Hook de inventario
  const { 
    isLoading, 
    ajustarInventario,
    getItem,
    isSubmitting
  } = useInventario();
  
  // Cargar datos del inventario
  useEffect(() => {
    const loadInventario = async () => {
      if (!id) return;
      
      try {
        const data = await getItem(parseInt(id));
        if (data) {
          setInventario(data);
        } else {
          setError('No se pudo cargar el registro de inventario');
        }
      } catch (err) {
        console.error('Error al cargar inventario:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      }
    };
    
    loadInventario();
  }, [id, getItem]);
  
  // Validar el formulario
  const validate = () => {
    const errors = [];
    
    if (!cantidad || cantidad === '0') {
      errors.push('La cantidad debe ser mayor a cero');
    }
    
    if (isNaN(parseInt(cantidad))) {
      errors.push('La cantidad debe ser un número válido');
    }
    
    // Para disminuir, validar que no se reste más de lo disponible
    if (accion === 'disminuir' && inventario) {
      if (parseInt(cantidad) > inventario.cantidad) {
        errors.push(`No hay suficiente stock. Disponible: ${inventario.cantidad}`);
      }
    }
    
    if (!motivo.trim()) {
      errors.push('Debe ingresar un motivo para el ajuste');
    }
    
    if (errors.length > 0) {
      Alert.alert('Error de validación', errors.join('\n'));
      return false;
    }
    
    return true;
  };
  
  // Manejar el envío del formulario
  const handleSubmit = async () => {
    if (!id || !inventario) return;
    
    if (!validate()) return;
    
    // La cantidad ajustada (positiva para aumentar, negativa para disminuir)
    const cantidadAjustada = accion === 'aumentar' 
      ? parseInt(cantidad) 
      : -parseInt(cantidad);
    
    // Realizar el ajuste
    await ajustarInventario(parseInt(id), cantidadAjustada, motivo);
    
    // Volver a la pantalla anterior
    router.back();
  };
  
  // Cancelar ajuste
  const handleCancel = () => {
    router.back();
  };

  return (
    <ScreenContainer
      title={`${accion === 'aumentar' ? 'Aumentar' : 'Disminuir'} Inventario`}
      isLoading={isLoading}
      error={error}
      loadingMessage="Cargando datos..."
    >
      {inventario && (
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>
            {accion === 'aumentar' ? 'Aumentar' : 'Disminuir'} Stock
          </ThemedText>
          
          {/* Información del producto */}
          <ThemedView style={styles.infoCard}>
            <ThemedText type="subtitle">
              {inventario.presentacion?.nombre || 'Presentación'}
            </ThemedText>
            <ThemedText style={styles.productName}>
              {inventario.presentacion?.producto?.nombre || 'Producto'}
            </ThemedText>
            <ThemedView style={styles.stockInfo}>
              <ThemedText style={styles.label}>Stock actual:</ThemedText>
              <ThemedText style={styles.stockValue}>{inventario.cantidad}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.stockInfo}>
              <ThemedText style={styles.label}>Almacén:</ThemedText>
              <ThemedText style={styles.value}>
                {inventario.almacen?.nombre || 'No especificado'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          
          {/* Cantidad a ajustar */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>
              Cantidad a {accion === 'aumentar' ? 'agregar' : 'quitar'}:
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme].text }
              ]}
              value={cantidad}
              onChangeText={setCantidad}
              placeholder="0"
              placeholderTextColor="#9BA1A6"
              keyboardType="numeric"
            />
          </ThemedView>
          
          {/* Motivo del ajuste */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Motivo del ajuste:</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: Colors[colorScheme].text }
              ]}
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Ingrese el motivo del ajuste..."
              placeholderTextColor="#9BA1A6"
              multiline={true}
              numberOfLines={3}
            />
          </ThemedView>
          
          {/* Stock proyectado */}
          <ThemedView style={styles.resultCard}>
            <ThemedText style={styles.label}>Stock proyectado:</ThemedText>
            <ThemedText style={styles.resultValue}>
              {accion === 'aumentar'
                ? inventario.cantidad + (parseInt(cantidad) || 0)
                : inventario.cantidad - (parseInt(cantidad) || 0)}
            </ThemedText>
          </ThemedView>
          
          {/* Nota informativa */}
          <ThemedView style={styles.infoBox}>
            <ThemedText style={styles.infoText}>
              Este ajuste generará un movimiento de {accion === 'aumentar' ? 'entrada' : 'salida'} en el inventario.
            </ThemedText>
          </ThemedView>
          
          {/* Botones de acción */}
          <ActionButtons
            onSave={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            saveText={accion === 'aumentar' ? 'Agregar Stock' : 'Quitar Stock'}
          />
        </ThemedView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  heading: {
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  productName: {
    fontSize: 16,
    marginBottom: 12,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  formGroup: {
    gap: 4,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  resultCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#FF9800',
  }
});