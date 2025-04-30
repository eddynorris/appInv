import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  ActivityIndicator,
  Dimensions,
  Image
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Presentacion } from '@/models';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { API_CONFIG } from '@/services/api';  // Importar configuración de API para URLs de imágenes

const { width, height } = Dimensions.get('window');

interface ProductPickerProps {
  visible: boolean;
  presentaciones: Presentacion[];
  isLoading?: boolean;
  onClose: () => void;
  onSelectProduct: (presentacionId: string, cantidad: string, precio: string) => void;
}

export function ProductPicker({
  visible,
  presentaciones,
  isLoading = false,
  onClose,
  onSelectProduct
}: ProductPickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Estados para búsqueda y cantidad
  const [busqueda, setBusqueda] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<string>('');
  
  // Filtrar productos según la búsqueda
  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return presentaciones;
    
    const terminoBusqueda = busqueda.toLowerCase().trim();
    
    return presentaciones.filter(p => {
      // Buscar por nombre, tipo, o producto
      const matchNombre = p.nombre?.toLowerCase().includes(terminoBusqueda);
      const matchTipo = p.tipo?.toLowerCase().includes(terminoBusqueda);
      const matchProducto = p.producto?.nombre?.toLowerCase().includes(terminoBusqueda);
      
      return matchNombre || matchTipo || matchProducto;
    });
  }, [presentaciones, busqueda]);
  
  // Resetear el estado cuando se cierra el modal
  const handleClose = () => {
    setBusqueda('');
    setCantidad('1');
    setSelectedId(null);
    setCustomPrice('');
    onClose();
  };
  
  // Seleccionar un producto
  const handleSelect = (presentacion: Presentacion) => {
    const id = presentacion.id.toString();
    
    if (selectedId === id) {
      // Ya está seleccionado, confirmar selección
      const precio = customPrice || presentacion.precio_venta || '0';
      onSelectProduct(id, cantidad, precio);
      handleClose();
    } else {
      // Seleccionar para configurar cantidad
      setSelectedId(id);
      // Precargar precio actual
      setCustomPrice(presentacion.precio_venta || '');
    }
  };
  
  // Construir la URL completa de la imagen
  const getImageUrl = (urlFoto?: string) => {
    if (!urlFoto) return null;
    
    // Usar la función helper de API_CONFIG
    return API_CONFIG.getImageUrl(urlFoto);
  };
  
  // Renderizar cada elemento de la lista
  const renderItem = ({ item }: { item: Presentacion }) => {
    const isSelected = selectedId === item.id.toString();
    const imageUrl = getImageUrl(item.url_foto);
    const stock = parseInt(String(item.stock_disponible ?? '0'), 10);

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isSelected && styles.selectedItem,
          { backgroundColor: isDark ? '#2C2C2E' : '#F9F9F9' },
          stock <= 0 && !isSelected && styles.outOfStockItem
        ]}
        onPress={() => handleSelect(item)}
        disabled={stock <= 0 && !isSelected}
      >
        <View style={styles.productInfo}>
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.productImage} 
                resizeMode="contain"
              />
            ) : (
              <IconSymbol name="cube.fill" size={36} color="#0a7ea4" />
            )}
          </View>
          
          <View style={styles.textContainer}>
            <ThemedText style={styles.productName}>
              {item.nombre}
            </ThemedText>
            <ThemedText style={styles.productDetail}>
              {item.producto?.nombre || 'Sin producto'} • {item.capacidad_kg}kg
            </ThemedText>
            <ThemedText style={styles.productPrice}>
              ${parseFloat(item.precio_venta || '0').toFixed(2)}
            </ThemedText>
            <ThemedText style={[
                styles.stockText, 
                stock <= 0 ? styles.stockZero : styles.stockAvailable
            ]}>
              Stock: {stock}
            </ThemedText>
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.selectedOptions}>
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Cantidad:</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#FFFFFF' : '#000000' }
                ]}
                value={cantidad}
                onChangeText={(value) => {
                    const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 1;
                    const validQty = Math.min(numValue, stock > 0 ? stock : 1);
                    setCantidad(validQty.toString());
                }}
                keyboardType="numeric"
                selectTextOnFocus
                autoFocus
              />
            </View>
            
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Precio:</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#FFFFFF' : '#000000' }
                ]}
                value={customPrice}
                onChangeText={setCustomPrice}
                keyboardType="numeric"
                selectTextOnFocus
                placeholder={item.precio_venta}
                placeholderTextColor="#9E9E9E"
              />
            </View>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                const precio = customPrice || item.precio_venta || '0';
                onSelectProduct(item.id.toString(), cantidad, precio);
                handleClose();
              }}
            >
              <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
              <ThemedText style={styles.confirmText}>Confirmar</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.modalContainer}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.header}>
            <ThemedText type="title">Seleccionar Producto</ThemedText>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={24} color="#757575" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={20} color="#757575" />
            <TextInput
              style={[
                styles.searchInput,
                { color: isDark ? '#FFFFFF' : '#000000' }
              ]}
              placeholder="Buscar producto..."
              placeholderTextColor="#9E9E9E"
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda !== '' && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <IconSymbol name="xmark.circle.fill" size={20} color="#757575" />
              </TouchableOpacity>
            )}
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint} />
              <ThemedText style={styles.loadingText}>
                Cargando productos...
              </ThemedText>
            </View>
          ) : productosFiltrados.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="cube.box" size={60} color="#BDBDBD" />
              <ThemedText style={styles.emptyText}>
                No se encontraron productos
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Intenta con otros términos de búsqueda
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={productosFiltrados}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  itemContainer: {
    borderRadius: 8,
    marginVertical: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedItem: {
    borderColor: '#0a7ea4',
    borderWidth: 2,
  },
  outOfStockItem: {
    opacity: 0.5,
    backgroundColor: '#EEEEEE',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  productDetail: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0a7ea4',
  },
  stockText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  stockAvailable: {
    color: Colors.success,
  },
  stockZero: {
    color: Colors.danger,
  },
  selectedOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    width: 70,
    fontSize: 14,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  confirmButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
}); 