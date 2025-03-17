import React from 'react';
import { 
  StyleSheet, 
  Image, 
  View, 
  ScrollView 
} from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { API_CONFIG } from '@/services/api';

// Tipo genérico para cualquier tipo de detalle (puede ser VentaDetalle o PedidoDetalle)
interface ProductDetail {
  id: number;
  presentacion_id: number;
  cantidad: number;
  precio_unitario?: string;
  precio_estimado?: string;
  presentacion?: {
    id: number;
    nombre: string;
    url_foto?: string;
    capacidad_kg?: string;
    producto?: {
      nombre: string;
    };
  };
}

interface ProductDetailsListProps {
  details: ProductDetail[];
  title?: string;
  isPedido?: boolean; // Para determinar si es un pedido (usa precio_estimado) o venta (usa precio_unitario)
}

const ProductDetailsList: React.FC<ProductDetailsListProps> = ({
  details,
  title = "Productos",
  isPedido = false
}) => {
  
  // Función para obtener el precio correcto según el tipo de detalle
  const getPrice = (detail: ProductDetail) => {
    if (isPedido) {
      return detail.precio_estimado || '0';
    }
    return detail.precio_unitario || '0';
  };
  
  // Función para formatear números
  const formatNumber = (num: string | number) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(value) ? '0.00' : value.toFixed(2);
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
      
      {details && details.length > 0 ? (
        <ScrollView 
          nestedScrollEnabled={true} 
          style={styles.scrollView}
          contentContainerStyle={styles.productsList}
        >
          {details.map((detail) => (
            <ThemedView key={detail.id} style={styles.productCard}>
              {/* Product Image */}
              <View style={styles.productImageContainer}>
                {detail.presentacion?.url_foto ? (
                  <Image 
                    source={{ uri: `${API_CONFIG.baseUrl}/uploads/${detail.presentacion.url_foto}` }} 
                    style={styles.productImage} 
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <IconSymbol name="photo" size={24} color="#9BA1A6" />
                  </View>
                )}
              </View>
              
              {/* Product Info */}
              <ThemedView style={styles.productInfo}>
                <ThemedText style={styles.productName} numberOfLines={2}>
                  {detail.presentacion?.nombre || 'Producto'}
                </ThemedText>
                
                <ThemedText style={styles.productDescription} numberOfLines={1}>
                  {detail.presentacion?.producto?.nombre || 'Producto'}
                  {detail.presentacion?.capacidad_kg && ` - ${formatNumber(detail.presentacion.capacidad_kg)} kg`}
                </ThemedText>
                
                <ThemedView style={styles.productDetails}>
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Cantidad:</ThemedText>
                    <ThemedText style={styles.detailValue}>{detail.cantidad}</ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>
                      {isPedido ? 'Precio Est.:' : 'Precio:'}
                    </ThemedText>
                    <ThemedText style={styles.detailValue}>
                      ${formatNumber(getPrice(detail))}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.subtotalRow}>
                    <ThemedText style={styles.subtotalLabel}>Subtotal:</ThemedText>
                    <ThemedText style={styles.subtotalValue}>
                      ${formatNumber(detail.cantidad * parseFloat(getPrice(detail)))}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          ))}
        </ScrollView>
      ) : (
        <ThemedView style={styles.emptyState}>
          <IconSymbol name="exclamationmark.triangle" size={40} color="#9BA1A6" />
          <ThemedText style={styles.emptyStateText}>
            No hay productos para mostrar
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  title: {
    marginBottom: 12,
  },
  scrollView: {
    maxHeight: 400, // Limitar altura para no ocupar toda la pantalla
  },
  productsList: {
    paddingBottom: 10,
  },
  productCard: {
    flexDirection: 'row',
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
  },
  productImageContainer: {
    width: 80,
    height: 80,
    marginRight: 12,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
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
  productDetails: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: '#757575',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
  },
  emptyStateText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#757575',
  },
});

export default ProductDetailsList;