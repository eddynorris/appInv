import React, { useState } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  View, 
  TextInput, 
  Modal,
  ActivityIndicator
} from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Presentacion } from '@/models';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { API_CONFIG } from '@/services/api';

interface ProductSelectorProps {
  presentaciones: Presentacion[];
  selectedProducts: Array<{
    presentacion_id: string;
    cantidad: string;
    precio_estimado?: string;
  }>;
  onProductsChange: (products: Array<{
    presentacion_id: string;
    cantidad: string;
    precio_estimado?: string;
  }>) => void;
  isLoading?: boolean;
  showPriceField?: boolean;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  presentaciones,
  selectedProducts,
  onProductsChange,
  isLoading = false,
  showPriceField = true
}) => {
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  
  // Filtrar presentaciones por búsqueda
  const filteredPresentaciones = presentaciones.filter(p => 
    p.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
    (p.producto?.nombre || '').toLowerCase().includes(searchText.toLowerCase())
  );

  // Filtrar presentaciones que ya están seleccionadas
  const availablePresentaciones = filteredPresentaciones.filter(p => 
    !selectedProducts.some(sp => sp.presentacion_id === p.id.toString())
  );

  const handleAddProduct = (presentacion: Presentacion) => {
    const newProducts = [
      ...selectedProducts,
      {
        presentacion_id: presentacion.id.toString(),
        cantidad: '1',
        precio_estimado: presentacion.precio_venta
      }
    ];
    onProductsChange(newProducts);
    setShowModal(false);
  };

  const handleRemoveProduct = (index: number) => {
    const newProducts = [...selectedProducts];
    newProducts.splice(index, 1);
    onProductsChange(newProducts);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const newProducts = [...selectedProducts];
    // Evitar valores no numéricos o negativos
    const cantidad = value.replace(/[^0-9]/g, '');
    if (cantidad === '' || parseInt(cantidad) > 0) {
      newProducts[index] = { ...newProducts[index], cantidad };
      onProductsChange(newProducts);
    }
  };

  const handlePriceChange = (index: number, value: string) => {
    if (!showPriceField) return;
    
    const newProducts = [...selectedProducts];
    // Permitir solo números y un punto decimal
    const precio = value.replace(/[^0-9.]/g, '');
    // Verificar que no haya más de un punto decimal
    if (precio.split('.').length > 2) return;
    
    newProducts[index] = { ...newProducts[index], precio_estimado: precio };
    onProductsChange(newProducts);
  };

  // Encontrar datos completos de presentación para un producto seleccionado
  const getPresentacionDetails = (presentacionId: string) => {
    return presentaciones.find(p => p.id.toString() === presentacionId);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        <ThemedText>Cargando productos...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header with search and add button */}
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">Productos Seleccionados ({selectedProducts.length})</ThemedText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
          disabled={availablePresentaciones.length === 0}
        >
          <IconSymbol name="plus" size={18} color="#fff" />
          <ThemedText style={styles.addButtonText}>Agregar Producto</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Selected Products List */}
      {selectedProducts.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <IconSymbol name="cart" size={40} color={Colors[colorScheme].text} />
          <ThemedText style={styles.emptyStateText}>
            No hay productos seleccionados
          </ThemedText>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setShowModal(true)}
          >
            <ThemedText style={styles.emptyStateButtonText}>
              Agregar Productos
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : (
        <ThemedView style={styles.selectedProductsContainer}>
          {selectedProducts.map((product, index) => {
            const presentacion = getPresentacionDetails(product.presentacion_id);
            if (!presentacion) return null;
            
            return (
              <ThemedView key={`${presentacion.id}-${index}`} style={styles.productCard}>
                {/* Remove button */}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveProduct(index)}
                >
                  <ThemedText style={styles.removeButtonText}>×</ThemedText>
                </TouchableOpacity>

                {/* Product image and details */}
                <ThemedView style={styles.productInfo}>
                  {/* Product Image */}
                  <View style={styles.productImageContainer}>
                    {presentacion.url_foto ? (
                      <Image 
                        source={{ uri: `${API_CONFIG.baseUrl}/uploads/${presentacion.url_foto}` }} 
                        style={styles.productImage} 
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <IconSymbol name="photo" size={24} color="#9BA1A6" />
                      </View>
                    )}
                  </View>

                  {/* Product details */}
                  <ThemedView style={styles.productDetails}>
                    <ThemedText style={styles.productName} numberOfLines={1}>
                      {presentacion.nombre}
                    </ThemedText>
                    
                    <ThemedText style={styles.productDescription} numberOfLines={1}>
                      {presentacion.producto?.nombre || 'Producto'} - {parseFloat(presentacion.capacidad_kg || '0').toFixed(2)} kg
                    </ThemedText>
                    
                    <ThemedView style={styles.productControls}>
                      {/* Quantity input */}
                      <ThemedView style={styles.quantityContainer}>
                        <ThemedText style={styles.controlLabel}>Cantidad:</ThemedText>
                        <TextInput
                          style={styles.quantityInput}
                          value={product.cantidad}
                          onChangeText={(value) => handleQuantityChange(index, value)}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />
                      </ThemedView>
                      
                      {/* Price input - only if showPriceField is true */}
                      {showPriceField && (
                        <ThemedView style={styles.priceContainer}>
                          <ThemedText style={styles.controlLabel}>Precio:</ThemedText>
                          <TextInput
                            style={styles.priceInput}
                            value={product.precio_estimado}
                            onChangeText={(value) => handlePriceChange(index, value)}
                            keyboardType="numeric"
                            selectTextOnFocus
                            placeholder="0.00"
                          />
                        </ThemedView>
                      )}
                    </ThemedView>

                    {/* Subtotal - only if showPriceField is true */}
                    {showPriceField && (
                      <ThemedView style={styles.subtotalContainer}>
                        <ThemedText style={styles.subtotalLabel}>Subtotal:</ThemedText>
                        <ThemedText style={styles.subtotalValue}>
                          ${(parseFloat(product.precio_estimado || '0') * parseInt(product.cantidad || '0')).toFixed(2)}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            );
          })}
        </ThemedView>
      )}

      {/* Product Selection Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContainer}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Seleccionar Producto</ThemedText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <ThemedText style={styles.closeButtonText}>×</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {/* Search input */}
            <ThemedView style={styles.searchContainer}>
              <IconSymbol name="magnifyingglass" size={20} color="#9BA1A6" />
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Buscar productos..."
                placeholderTextColor="#9BA1A6"
              />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <IconSymbol name="xmark.circle.fill" size={20} color="#9BA1A6" />
                </TouchableOpacity>
              ) : null}
            </ThemedView>

            {/* Products list */}
            {availablePresentaciones.length === 0 ? (
              <ThemedView style={styles.emptySearchResults}>
                <IconSymbol name="exclamationmark.circle" size={40} color="#9BA1A6" />
                <ThemedText style={styles.emptySearchText}>
                  {searchText
                    ? 'No se encontraron productos con ese nombre'
                    : 'No hay más productos disponibles para agregar'}
                </ThemedText>
              </ThemedView>
            ) : (
              <FlatList
                data={availablePresentaciones}
                keyExtractor={(item) => item.id.toString()}
                style={styles.productsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productListItem}
                    onPress={() => handleAddProduct(item)}
                  >
                    {/* Product image */}
                    <View style={styles.listItemImage}>
                      {item.url_foto ? (
                        <Image 
                          source={{ uri: `${API_CONFIG.baseUrl}/uploads/${item.url_foto}` }} 
                          style={styles.listItemImageContent} 
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.listItemPlaceholder}>
                          <IconSymbol name="photo" size={20} color="#9BA1A6" />
                        </View>
                      )}
                    </View>

                    {/* Product info */}
                    <ThemedView style={styles.listItemInfo}>
                      <ThemedText style={styles.listItemName} numberOfLines={1}>
                        {item.nombre}
                      </ThemedText>
                      <ThemedText style={styles.listItemDescription} numberOfLines={2}>
                        {item.producto?.nombre || 'Producto'} - {parseFloat(item.capacidad_kg || '0').toFixed(2)} kg
                      </ThemedText>
                      <ThemedText style={styles.listItemPrice}>
                        ${parseFloat(item.precio_venta || '0').toFixed(2)}
                      </ThemedText>
                    </ThemedView>

                    {/* Add button */}
                    <ThemedView style={styles.listItemAddButton}>
                      <IconSymbol name="plus" size={20} color="#fff" />
                    </ThemedView>
                  </TouchableOpacity>
                )}
              />
            )}
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  loadingContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    marginBottom: 15,
  },
  emptyStateText: {
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 4,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedProductsContainer: {
    width: '100%',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 57, 53, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  productInfo: {
    flexDirection: 'row',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  productDescription: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 5,
  },
  productControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    flexWrap: 'wrap',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  controlLabel: {
    fontSize: 14,
    marginRight: 5,
  },
  quantityInput: {
    width: 50,
    height: 35,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 4,
    textAlign: 'center',
    backgroundColor: '#F9F9F9',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  priceInput: {
    width: 80,
    height: 35,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 4,
    textAlign: 'right',
    paddingRight: 8,
    backgroundColor: '#F9F9F9',
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 5,
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    fontSize: 16,
  },
  productsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  productListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
  },
  listItemImage: {
    width: 60,
    height: 60,
    marginRight: 12,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  listItemImageContent: {
    width: '100%',
    height: '100%',
  },
  listItemPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  listItemDescription: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 3,
  },
  listItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  listItemAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  emptySearchResults: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#757575',
  },
});

export default ProductSelector;