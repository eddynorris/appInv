import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Image, 
  View, 
  ScrollView,
  Platform,
  Text
} from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { API_CONFIG } from '@/services';

const DEFAULT_IMAGE = require('@/assets/images/default/product-placeholder.png');

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
      id?: number;
      nombre?: string;
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
  
  // Estado para controlar si una imagen falló al cargarse
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

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
  
  // Función para intentar construir una URL de imagen alternativa basada en IDs
  const getFallbackImageUrl = (detail: ProductDetail): string | undefined => {
    // Intentar usar el ID de presentación si está disponible
    if (detail.presentacion_id) {
      return `${API_CONFIG.baseUrl}/uploads/presentaciones/${detail.presentacion_id}.jpg`;
    }
    
    // Intentar usar el ID de presentación desde el objeto presentacion
    if (detail.presentacion?.id) {
      return `${API_CONFIG.baseUrl}/uploads/presentaciones/${detail.presentacion.id}.jpg`;
    }
    
    // Intentar usar el ID de producto si está disponible
    if (detail.presentacion?.producto?.id) {
      return `${API_CONFIG.baseUrl}/uploads/productos/${detail.presentacion.producto.id}.jpg`;
    }
    
    return undefined;
  };
  
  // Manejar error de carga de imagen
  const handleImageError = (detailId: number, url?: string) => {
    console.error(`Error al cargar imagen para producto ID: ${detailId}, URL: ${url || 'No URL'}`);
    setFailedImages(prev => ({
      ...prev,
      [detailId]: true
    }));
  };
  
  // Renderizar la imagen del producto
  const renderProductImage = (detail: ProductDetail) => {
    // Verificar si la imagen falló previamente
    if (failedImages[detail.id]) {
      return (
        <Image 
          source={DEFAULT_IMAGE}
          style={styles.productImage}
          resizeMode="contain"
        />
      );
    }

    // Si no hay url_foto en la presentación, ir directamente a la imagen por defecto
    // o si no existe la presentación, mostrar imagen por defecto
    if (!detail.presentacion || !detail.presentacion.url_foto) {
      return (
        <Image 
          source={DEFAULT_IMAGE}
          style={styles.productImage}
          resizeMode="contain"
        />
      );
    }
    
    // Si llegamos aquí, hay una url_foto, intentar cargarla
    try {
      // Obtener la ruta de la foto
      const imageUri = API_CONFIG.getImageUrl(detail.presentacion.url_foto);
      
      // Si la URL resultante contiene 'null' o es vacía, usar imagen por defecto
      if (!imageUri || imageUri.includes('null') || imageUri.includes('undefined')) {
        return (
          <Image 
            source={DEFAULT_IMAGE}
            style={styles.productImage}
            resizeMode="contain"
          />
        );
      }
      
      return (
        <Image 
          source={{ uri: imageUri }} 
          style={styles.productImage} 
          resizeMode="contain"
          onError={() => {
            console.error(`Error al cargar imagen para producto ID: ${detail.id}, URL: ${imageUri}`);
            // Marcar esta imagen como fallida para futuras renderizaciones
            setFailedImages(prev => ({
              ...prev,
              [detail.id]: true
            }));
          }}
        />
      );
    } catch (error) {
      console.error('Error construyendo URL desde url_foto:', error);
      // Mostrar imagen por defecto en caso de error
      return (
        <Image 
          source={DEFAULT_IMAGE}
          style={styles.productImage}
          resizeMode="contain"
        />
      );
    }
  };
  
  // Función para obtener el nombre del producto y capacidad
  const getProductInfo = (detail: ProductDetail): { nombre: string, descripcion: string } => {
    const nombre = detail.presentacion?.nombre || `Presentación #${detail.presentacion_id || detail.id}`;
    
    // Intentar construir una descripción
    let descripcion = '';
    
    // Añadir nombre del producto si está disponible
    if (detail.presentacion?.producto?.nombre) {
      descripcion = detail.presentacion.producto.nombre;
    }
    
    // Añadir capacidad si está disponible
    if (detail.presentacion?.capacidad_kg) {
      const capacidad = formatNumber(detail.presentacion.capacidad_kg);
      descripcion = descripcion 
        ? `${descripcion} - ${capacidad} kg`
        : `${capacidad} kg`;
    }
    
    return { nombre, descripcion };
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
          {details.map((detail) => {
            const { nombre, descripcion } = getProductInfo(detail);
            
            return (
              <ThemedView key={detail.id} style={styles.productCard}>
                {/* Product Image */}
                <View style={styles.productImageContainer}>
                  {renderProductImage(detail)}
                </View>
                
                {/* Product Info */}
                <ThemedView style={styles.productInfo}>
                  <ThemedText style={styles.productName} numberOfLines={2}>
                    {nombre}
                  </ThemedText>
                  
                  {descripcion ? (
                    <ThemedText style={styles.productDescription} numberOfLines={1}>
                      {descripcion}
                    </ThemedText>
                  ) : null}
                  
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
            );
          })}
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
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
  },
  subtotalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  subtotalValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
});

export default ProductDetailsList;