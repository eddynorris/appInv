// Actualización para el componente ProductGrid
import React, { memo, useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ProductCard from './ProductCard';
import { Presentacion } from '@/models';
import { ProductCardStyles as styles } from '@/styles/Theme';

// Interfaz para el detalle que maneja este grid (podría ser genérico)
interface DetalleGridItem {
  presentacion_id: string;
  cantidad: string;
  precio_estimado?: string;
  precio_unitario?: string;
}

// Hacer UpdateFieldKey más genérico para incluir campos de venta
type UpdateFieldKey = 'cantidad' | 'precio_estimado' | 'precio_unitario';

interface ProductGridProps {
  detalles: Array<DetalleGridItem>; // Usar interfaz genérica
  presentaciones: Presentacion[];
  // Usar el tipo específico para field
  onUpdate: (index: number, field: UpdateFieldKey, value: string) => void;
  onRemove: (index: number) => void;
  onAddProduct: () => void;
  isPedido?: boolean;
  readOnly?: boolean;
}

// Componente individualizado para el botón de Agregar Producto
const AddProductButton = memo(({ onAddProduct }: { onAddProduct: () => void }) => (
  <TouchableOpacity 
    style={styles.addProductCard}
    onPress={onAddProduct}
  >
    <ThemedText style={styles.addProductText}>+</ThemedText>
    <ThemedText style={styles.addProductLabel}>Agregar Producto</ThemedText>
  </TouchableOpacity>
));

const ProductGrid: React.FC<ProductGridProps> = ({
  detalles,
  presentaciones,
  onUpdate,
  onRemove,
  onAddProduct,
  isPedido = true,
  readOnly = false
}) => {
  // Determinar el campo de precio según el tipo (pedido o venta)
  const getPrecioField = (index: number) => {
    return isPedido ? 'precio_estimado' : 'precio_unitario';
  };
  
  // Crear un mapa de búsqueda rápida para presentaciones
  const presentacionesMap = useMemo(() => {
    // Usar un Map para búsqueda optimizada por ID
    const map = new Map<string, Presentacion>();
    presentaciones.forEach(p => map.set(p.id.toString(), p));
    return map;
  }, [presentaciones]);
  
  // Renderizar cada producto
  const renderProductos = useMemo(() => {
    return detalles.map((detalle, index) => {
      // Obtener presentación del mapa (más eficiente que filter/find)
      const presentacion = presentacionesMap.get(detalle.presentacion_id);
      
      // Si no existe la presentación, no renderizar nada
      if (!presentacion) {
        console.warn(`No se encontró presentación con ID: ${detalle.presentacion_id}`);
        return null;
      }
      
      // Obtener el precio según el tipo
      const precio = isPedido 
        ? detalle.precio_estimado || '0'
        : detalle.precio_unitario || '0';
      
      return (
        <ProductCard
          key={`${presentacion.id}-${index}`}
          presentacion={presentacion}
          cantidad={detalle.cantidad}
          precio={precio}
          onCantidadChange={(value) => onUpdate(index, 'cantidad', value)}
          onPrecioChange={(value) => onUpdate(index, getPrecioField(index), value)}
          onRemove={() => onRemove(index)}
          precioLabel={isPedido ? 'Precio:' : 'Precio:'}
          readOnly={readOnly}
        />
      );
    });
  }, [detalles, presentacionesMap, isPedido, onUpdate, onRemove, readOnly]);
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.grid, gridStyles.fixedGrid]}>
        {/* Renderizar productos */}
        {renderProductos}
        
        {/* Renderizar botón de agregar producto si no es de solo lectura */}
        {!readOnly && <AddProductButton onAddProduct={onAddProduct} />}
      </ThemedView>
    </ThemedView>
  );
};

// Estilos adicionales para corregir la distribución en la grilla
const gridStyles = StyleSheet.create({
  fixedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2, // Un pequeño padding para evitar problemas en algunos dispositivos
  }
});

// Usar memo para evitar renderizados innecesarios
export default memo(ProductGrid);