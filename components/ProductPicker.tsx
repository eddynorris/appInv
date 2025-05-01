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
  allowZeroStockSelection?: boolean;
  isPedidoMode?: boolean;
}

export function ProductPicker({
  visible,
  presentaciones,
  isLoading = false,
  onClose,
  onSelectProduct,
  allowZeroStockSelection = false,
  isPedidoMode = false
}: ProductPickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Estados para búsqueda y cantidad
  const [busqueda, setBusqueda] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [precioEstimado, setPrecioEstimado] = useState<string>('0');
  
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
    setPrecioEstimado('0');
    onClose();
  };
  
  // Manejar selección de producto - SOLO SELECCIONA, NO AGREGA
  const handleSelect = (item: Presentacion) => {
    setSelectedId(item.id.toString());
    if (isPedidoMode) {
      setPrecioEstimado(item.precio_venta ?? '0');
    }
    setCantidad('1'); // Resetear cantidad al seleccionar
    // NO LLAMAR a onSelectProduct aquí
  };
  
  // Botón "Agregar Producto" - LLAMA a onSelectProduct
  const handleAddProductButtonClick = () => {
    if (selectedId) {
      let precioParaPasar = '0';
      if (isPedidoMode) {
        precioParaPasar = precioEstimado;
      } else {
        // CORRECCIÓN: Buscar la presentación seleccionada y obtener su precio_venta
        const selectedPresentacion = presentaciones.find(p => p.id.toString() === selectedId);
        precioParaPasar = selectedPresentacion?.precio_venta ?? '0';
      }
      // Llamar a onSelectProduct con el precio correcto
      onSelectProduct(selectedId, cantidad, precioParaPasar);
      handleClose(); // Cerrar modal después de agregar
    }
  };
  
  // Construir la URL completa de la imagen
  const getImageUrl = (urlFoto?: string | null) => {
    if (!urlFoto) return null;
    
    // Usar la función helper de API_CONFIG
    return API_CONFIG.getImageUrl(urlFoto);
  };
  
  // Renderizar cada elemento de la lista
  const renderItem = ({ item }: { item: Presentacion }) => {
    const isSelected = selectedId === item.id.toString();
    const imageUrl = getImageUrl(item.url_foto);
    const stock = parseInt(String(item.stock_disponible ?? '0'), 10);
    const hasStock = stock > 0;
    const isDisabled = !isPedidoMode && !allowZeroStockSelection && !hasStock && !isSelected;

    const containerStyle = [
      styles.itemContainer,
      isSelected && styles.selectedItem,
      isDisabled && styles.outOfStockItem,
      { backgroundColor: isDark ? '#2C2C2E' : '#F9F9F9' },
    ];

    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={() => !isDisabled && handleSelect(item)}
        disabled={isDisabled}
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
          
          <View style={styles.productNameContainer}>
            <ThemedText style={styles.productName}>{item.nombre}</ThemedText>
            <ThemedText style={styles.productSubDetail}>
              Cap: {item.capacidad_kg ?? 'N/A'}kg
              | P.Venta: ${item.precio_venta ?? 'N/A'}
            </ThemedText>
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.inputsContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Cantidad:</ThemedText>
              <TextInput
                style={styles.input}
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
            
            {isPedidoMode && (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Precio Est.:</ThemedText>
                <TextInput
                  style={styles.input}
                  value={precioEstimado}
                  onChangeText={setPrecioEstimado}
                  keyboardType="numeric"
                  selectTextOnFocus
                  placeholder={item.precio_venta ?? '0'}
                  placeholderTextColor="#9E9E9E"
                />
              </View>
            )}
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
              extraData={{ selectedId, cantidad, precioEstimado }}
            />
          )}
          
          {selectedId && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddProductButtonClick}>
              <ThemedText style={styles.addButtonText}>Agregar Producto</ThemedText>
            </TouchableOpacity>
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
  productNameContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  productSubDetail: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 2,
  },
  inputsContainer: {
    marginTop: 10,
    paddingHorizontal: 5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: 80,
    fontSize: 14,
    marginRight: 5,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  addButtonText: {
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