import React, { useState, useMemo } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { formatCurrency } from '@/utils/formatters';
import { Presentacion } from '@/models';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface DetalleVenta {
  id?: number;
  presentacion_id: number | string;
  cantidad: number | string;
  precio_unitario: number | string;
}

interface DetalleVentaRowProps {
  detalle: DetalleVenta;
  index: number;
  presentaciones: Presentacion[];
  onUpdate: (index: number, cantidad: string, precio: string) => void;
  onDelete: (index: number) => void;
  disabled?: boolean;
}

export function DetalleVentaRow({
  detalle,
  index,
  presentaciones,
  onUpdate,
  onDelete,
  disabled = false
}: DetalleVentaRowProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Estados locales para edición
  const [cantidad, setCantidad] = useState(detalle.cantidad.toString());
  const [precio, setPrecio] = useState(detalle.precio_unitario.toString());
  
  // Encontrar la presentación correspondiente
  const presentacion = useMemo(() => {
    return presentaciones.find(p => p.id.toString() === detalle.presentacion_id.toString());
  }, [presentaciones, detalle.presentacion_id]);
  
  // Calcular subtotal
  const subtotal = parseFloat(cantidad) * parseFloat(precio);
  
  // Manejar cambio en cantidad
  const handleQuantityChange = (value: string) => {
    // Validar que sea un número positivo
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCantidad(value);
      
      if (value !== '') {
        onUpdate(index, value, precio);
      }
    }
  };
  
  // Manejar cambio en precio
  const handlePriceChange = (value: string) => {
    // Validar que sea un número positivo
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPrecio(value);
      
      if (value !== '') {
        onUpdate(index, cantidad, value);
      }
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <View style={styles.productInfo}>
        <ThemedText style={styles.productName}>
          {presentacion?.nombre || 'Producto'}
        </ThemedText>
        
        <ThemedText style={styles.productDetail}>
          {presentacion?.producto?.nombre || 'Sin producto'} • {presentacion?.capacidad_kg || '0'}kg
        </ThemedText>
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.inputs}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Cantidad</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: isDark ? '#FFFFFF' : '#000000', borderColor: isDark ? '#555555' : '#E0E0E0' }
              ]}
              value={cantidad}
              onChangeText={handleQuantityChange}
              keyboardType="numeric"
              selectTextOnFocus
              editable={!disabled}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Precio</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: isDark ? '#FFFFFF' : '#000000', borderColor: isDark ? '#555555' : '#E0E0E0' }
              ]}
              value={precio}
              onChangeText={handlePriceChange}
              keyboardType="numeric"
              selectTextOnFocus
              editable={!disabled}
            />
          </View>
        </View>
        
        <View style={styles.subtotalContainer}>
          <ThemedText style={styles.subtotalLabel}>Subtotal:</ThemedText>
          <ThemedText style={styles.subtotalValue}>
            {isNaN(subtotal) ? '$0.00' : formatCurrency(subtotal)}
          </ThemedText>
        </View>
      </View>
      
      {!disabled && (
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => onDelete(index)}
        >
          <IconSymbol name="trash" size={20} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  productInfo: {
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productDetail: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  detailsContainer: {
    marginTop: 8,
  },
  inputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputGroup: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 4,
    color: '#757575',
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
  },
  subtotalLabel: {
    fontSize: 14,
    marginRight: 6,
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
}); 