// app/inventarios/index.tsx - Versión actualizada
import React, { useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AlmacenPickerDialog from '@/components/data/AlmacenPickerDialog';
import { useInventarios } from '@/hooks/crud/useInventarios';
import { Inventario } from '@/models';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Colors } from '@/constants/Colors';

export default function InventarioScreen() {
  // Estados locales de UI
  const [showAlmacenPicker, setShowAlmacenPicker] = React.useState(false);
  
  // Usar el hook personalizado
  const {
    inventarios,
    almacenes,
    selectedAlmacen,
    searchText,
    showOnlyLowStock,
    isLoading,
    error,
    filtrarPorAlmacen,
    filtrarPorTexto,
    toggleStockBajo,
    getInventariosFiltrados,
    getEstadisticas,
    refresh,
    confirmDelete
  } = useInventarios();

  // Cargar datos al montar
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Obtener inventarios filtrados
  const filteredInventarios = getInventariosFiltrados();
  
  // Obtener estadísticas
  const estadisticas = getEstadisticas();

  // Renderizar cada item de inventario
  const renderInventarioItem = ({ item }: { item: Inventario }) => {
    const isLowStock = item.cantidad <= item.stock_minimo;
    
    return (
      <TouchableOpacity 
        style={[styles.itemCard, isLowStock && styles.lowStockCard]}
        onPress={() => router.push(`/inventarios/${item.id}`)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>
            {item.presentacion?.nombre || 'Producto sin nombre'}
          </Text>
          <Text style={styles.itemDescription}>
            {item.presentacion?.producto?.nombre || 'Sin descripción'}
          </Text>
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.almacenText}>
            Almacén: {item.almacen?.nombre || 'No especificado'}
          </Text>
          
          <View style={styles.stockInfo}>
            <View style={styles.stockValue}>
              <Text style={styles.stockLabel}>Stock:</Text>
              <Text style={[
                styles.stockNumber,
                item.cantidad <= item.stock_minimo && styles.lowStockText
              ]}>
                {item.cantidad}
              </Text>
            </View>
            
            <View style={styles.stockValue}>
              <Text style={styles.stockLabel}>Mínimo:</Text>
              <Text style={styles.stockNumber}>{item.stock_minimo}</Text>
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.decreaseButton]}
                onPress={() => router.push({
                  pathname: '/inventarios/ajustar',
                  params: { id: item.id, accion: 'disminuir' }
                })}
              >
                <Text style={styles.actionButtonText}>-</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.increaseButton]}
                onPress={() => router.push({
                  pathname: '/inventarios/ajustar',
                  params: { id: item.id, accion: 'aumentar' }
                })}
              >
                <Text style={styles.actionButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer 
      title="Inventario" 
      scrollable={false}
      error={error}
    >
      <View style={styles.container}>
        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <IconSymbol name="magnifyingglass" size={20} color="#757575" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
              value={searchText}
              onChangeText={(text) => filtrarPorTexto(text)}
              placeholderTextColor="#757575"
            />
          </View>
          
          {/* Filtros */}
          <View style={styles.filtersRow}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowAlmacenPicker(true)}
            >
              <Text style={styles.filterButtonText}>
                Almacén {selectedAlmacen ? `✓ ${almacenes.find(a => a.id.toString() === selectedAlmacen)?.nombre || ''}` : '▼'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                showOnlyLowStock && styles.activeFilterButton
              ]}
              onPress={toggleStockBajo}
            >
              <Text style={styles.filterButtonText}>
                Stock bajo {showOnlyLowStock && '✓'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Resumen */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Total: </Text>
            {estadisticas.totalItems} productos 
            {showOnlyLowStock ? '' : ` | Stock bajo: ${estadisticas.stockBajo} productos`}
          </Text>
        </View>
        
        {/* Lista de productos */}
        <FlatList
          data={filteredInventarios}
          renderItem={renderInventarioItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isLoading 
                  ? 'Cargando inventario...' 
                  : 'No hay productos en este almacén'}
              </Text>
            </View>
          }
        />
        
        {/* Botón flotante para agregar */}
        <FloatingActionButton 
          icon="plus"
          onPress={() => router.push('/inventarios/create')}
        />
      </View>
      
      {/* Selector de almacén */}
      <AlmacenPickerDialog 
        visible={showAlmacenPicker}
        almacenes={almacenes}
        onSelect={(almacen) => {
          filtrarPorAlmacen(almacen.id.toString());
          setShowAlmacenPicker(false);
        }}
        onCancel={() => {
          setShowAlmacenPicker(false);
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#4CAF50',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333333',
  },
  filtersRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  activeFilterButton: {
    backgroundColor: '#E8F5E9',
  },
  filterButtonText: {
    color: '#333333',
    fontSize: 14,
  },
  summaryContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  summaryText: {
    fontSize: 14,
    color: '#333333',
  },
  summaryLabel: {
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80, // Para evitar que el botón flotante tape contenido
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  lowStockCard: {
    backgroundColor: '#FFF8E1', // Color amarillo suave para destacar stock bajo
  },
  itemHeader: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  itemDetails: {
    marginTop: 4,
  },
  almacenText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockValue: {
    marginRight: 16,
  },
  stockLabel: {
    fontSize: 12,
    color: '#666666',
  },
  stockNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  lowStockText: {
    color: '#F44336',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  decreaseButton: {
    backgroundColor: '#F44336',
  },
  increaseButton: {
    backgroundColor: '#4CAF50',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});