import React, { memo, useMemo } from 'react';
import { View, Image, TextInput, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { API_CONFIG } from '@/services/api';
import { Presentacion } from '@/models';
import { ProductCardStyles as styles } from '@/styles/Theme';

interface ProductCardProps {
  presentacion: Presentacion;
  cantidad: string;
  precio: string;
  onCantidadChange: (cantidad: string) => void;
  onPrecioChange: (precio: string) => void;
  onRemove: () => void;
  precioLabel?: string;
  readOnly?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  presentacion,
  cantidad,
  precio,
  onCantidadChange,
  onPrecioChange,
  onRemove,
  precioLabel = 'Precio:',
  readOnly = false
}) => {
  // Asegurar que tenemos datos completos de presentación
  if (!presentacion) {
    console.warn("ProductCard: presentación no definida");
    return null;
  }

  const nombreProductoBase = presentacion?.producto?.nombre || '';
  
  // Usar useMemo para calcular la URL de la imagen solo si url_foto cambia
  const imageUrl = useMemo(() => {
    const url = API_CONFIG.getImageUrl(presentacion.url_foto);
    return url || undefined;
  }, [presentacion.url_foto]); // Dependencia: url_foto
  
  // Renderizado de la imagen de producto
  const renderImage = () => {
    // Usar la URL memoizada
    if (imageUrl) {
      return (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.productoImage}
          resizeMode="contain"
        />
      );
    } 
    
    // Mostrar un placeholder si no hay imagen
    return (
      <ThemedView style={styles.productoImagePlaceholder}>
        <IconSymbol name="photo" size={32} color="#9BA1A6" />
      </ThemedView>
    );
  };
  
  return (
    <ThemedView style={styles.productoCard}>
      {!readOnly && (
        <TouchableOpacity
          style={styles.removeProductButton}
          onPress={onRemove}
        >
          <ThemedText style={styles.removeProductButtonText}>×</ThemedText>
        </TouchableOpacity>
      )}
      
      {/* Cabecera con nombre */}
      <ThemedView style={styles.productoHeader}>
        <ThemedText style={styles.productoNombre} numberOfLines={1}>
          {presentacion?.nombre || 'Producto'}
        </ThemedText>
        <ThemedText style={styles.productoDescripcion} numberOfLines={1}>
          {nombreProductoBase}
        </ThemedText>
      </ThemedView>

      {/* Imagen del producto */}
      <ThemedView style={styles.productoImageContainer}>
        {renderImage()}
      </ThemedView>
      
      {/* Controles inferiores */}
      {!readOnly && (
        <ThemedView style={styles.productoControles}>
          {/* Precio editable */}
          <ThemedView style={styles.precioContainer}>
            <ThemedText style={styles.precioLabel}>{precioLabel}</ThemedText>
            <TextInput
              style={styles.precioInput}
              value={precio}
              onChangeText={onPrecioChange}
              keyboardType="numeric"
              placeholder="0.00"
              editable={!readOnly}
            />
          </ThemedView>
          
          {/* Control de cantidad */}
          <ThemedView style={styles.cantidadContainer}>
            <ThemedText style={styles.cantidadLabel}>Cantidad:</ThemedText>
            <ThemedView style={styles.cantidadControles}>
              <TouchableOpacity 
                style={styles.cantidadButton}
                onPress={() => {
                  const currentQty = parseInt(cantidad) || 0;
                  if (currentQty > 1) {
                    onCantidadChange((currentQty - 1).toString());
                  }
                }}
                disabled={parseInt(cantidad) <= 1 || readOnly}
              >
                <ThemedText style={[
                  styles.cantidadButtonText,
                  parseInt(cantidad) <= 1 && styles.cantidadButtonDisabled
                ]}>−</ThemedText>
              </TouchableOpacity>
              
              <TextInput
                style={styles.cantidadInput}
                value={cantidad}
                onChangeText={(value) => {
                  // Solo permitir números positivos
                  const numValue = value.replace(/[^0-9]/g, '');
                  const finalValue = numValue === '' ? '1' : numValue;
                  onCantidadChange(finalValue);
                }}
                keyboardType="numeric"
                editable={!readOnly}
              />
              
              <TouchableOpacity 
                style={styles.cantidadButton}
                onPress={() => {
                  const currentQty = parseInt(cantidad) || 0;
                  onCantidadChange((currentQty + 1).toString());
                }}
                disabled={readOnly}
              >
                <ThemedText style={styles.cantidadButtonText}>+</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}
      
      {/* Vista de solo lectura */}
      {readOnly && (
        <ThemedView style={styles.readOnlyContainer}>
          <ThemedView style={styles.readOnlyRow}>
            <ThemedText style={styles.readOnlyLabel}>{precioLabel}</ThemedText>
            <ThemedText style={styles.readOnlyValue}>${parseFloat(precio).toFixed(2)}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.readOnlyRow}>
            <ThemedText style={styles.readOnlyLabel}>Cantidad:</ThemedText>
            <ThemedText style={styles.readOnlyValue}>{cantidad}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.readOnlyRow}>
            <ThemedText style={styles.readOnlyLabel}>Total:</ThemedText>
            <ThemedText style={styles.readOnlyTotal}>
              ${(parseFloat(precio) * parseInt(cantidad)).toFixed(2)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
};

// Memoizar el componente para evitar renderizados innecesarios
export default memo(ProductCard);