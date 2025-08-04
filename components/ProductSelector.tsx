import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { Modal, FlatList, TouchableOpacity, Image } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { API_CONFIG } from '@/services';
import { Presentacion } from '@/models';
import { ModalStyles as styles } from '@/styles/Theme';

interface ProductSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (presentacionId: string) => void;
  presentaciones: Presentacion[];
  detallesActuales: Array<{ presentacion_id: string }>;
  title?: string;
}

// Obtener la URL correcta de la imagen
const getImageUrl = (urlFoto?: string | null): string | undefined => {
  const url = API_CONFIG.getImageUrl(urlFoto); // Obtiene la URL procesada o ''
  return url || undefined; // Devuelve la URL si no es vacía, sino undefined
};

const ProductItem = memo(({ item, onSelect }: { 
  item: Presentacion, 
  onSelect: (id: string) => void 
}) => {
  // Optimizar el renderizado de cada item para mejorar rendimiento
  const handlePress = useCallback(() => {
    onSelect(item.id.toString());
  }, [item.id, onSelect]);

  return (
    <TouchableOpacity 
      style={styles.productItem}
      onPress={handlePress}
    >
      <ThemedView style={styles.productItemImageContainer}>
        {item.url_foto ? (
          <Image 
            source={{ uri: getImageUrl(item.url_foto) }} 
            style={styles.productItemImage} 
            resizeMode="contain"
          />
        ) : (
          <ThemedView style={styles.productItemImagePlaceholder}>
            <IconSymbol name="photo" size={28} color="#9BA1A6" />
          </ThemedView>
        )}
      </ThemedView>
      
      <ThemedView style={styles.productDetails}>
        <ThemedText style={styles.productName}>{item.nombre || `Producto ${item.id}`}</ThemedText>
        <ThemedText style={styles.productInfo}>
          {item.producto?.nombre || 'Producto'} - {parseFloat(item.capacidad_kg || '0').toFixed(2)} KG
        </ThemedText>
        <ThemedText style={styles.productPrice}>
          ${parseFloat(item.precio_venta || '0').toFixed(2)}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.productAction}>
        <ThemedText style={styles.addButtonText}>+</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
});

const EmptyListComponent = memo(() => (
  <ThemedView style={styles.emptyListContainer}>
    <ThemedText style={styles.emptyListText}>
      No hay más productos disponibles para agregar
    </ThemedText>
  </ThemedView>
));

const ProductSelector: React.FC<ProductSelectorProps> = ({
  visible,
  onClose,
  onSelectProduct,
  presentaciones,
  detallesActuales,
  title = 'Seleccionar Producto'
}) => {
  const [presentacionesDisponibles, setPresentacionesDisponibles] = useState<Presentacion[]>([]);
  
  useEffect(() => {
    if (visible) {
      // Solo recalcular cuando el modal esté visible para optimizar rendimiento
      const disponibles = presentaciones.filter(p => {
        const presentacionId = p.id.toString();
        return !detallesActuales.some(d => d.presentacion_id === presentacionId);
      });

      setPresentacionesDisponibles(disponibles);
    }
  }, [presentaciones, detallesActuales, visible]);
  
  // Memoizar funciones de renderizado para FlatList
  const renderItem = useCallback(({ item }: { item: Presentacion }) => (
    <ProductItem item={item} onSelect={onSelectProduct} />
  ), [onSelectProduct]);

  const keyExtractor = useCallback((item: Presentacion) => 
    item.id.toString(), []);
  
  // Usar memoización para evitar re-renderizados innecesarios
  const memoizedEmptyComponent = useMemo(() => <EmptyListComponent />, []);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalOverlay}>
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText style={styles.headerTitle}>{title}</ThemedText>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <ThemedText style={styles.closeButtonText}>×</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          <FlatList
            data={presentacionesDisponibles}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            ListEmptyComponent={memoizedEmptyComponent}
            style={styles.flatList}
          />
        </ThemedView>
      </ThemedView>
    </Modal>
  );
};

export default memo(ProductSelector);