// app/inventario/index.tsx - Versión optimizada usando useInventarios
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, FlatList } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AlmacenPickerDialog from '@/components/data/AlmacenPickerDialog';
import { useInventarios } from '@/hooks/crud/useInventarios';
import { Almacen, Inventario } from '@/models';
import { Colors } from '@/constants/Colors';

export default function InventarioScreen() {
  // Estados locales UI
  const [showAlmacenPicker, setShowAlmacenPicker] = useState(false);
  
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
      <View style={[styles.itemCard, isLowStock && styles.lowStockCard]}>
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
          
          <View style={styles.stockControls}>
            <TouchableOpacity 
              style={styles.decreaseButton}
              onPress={() => router.push({
                pathname: '/inventarios/ajustar',
                params: { id: item.id, accion: 'disminuir' }
              })}
            >
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.stockText}>{item.cantidad}</Text>
            
            <TouchableOpacity 
              style={styles.increaseButton}
              onPress={() => router.push({
                pathname: '/inventarios/ajustar',
                params: { id: item.id, accion: 'aumentar' }
              })}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
            
            <Text style={styles.minStockText}>
              Mín: {item.stock_minimo}
            </Text>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push(`/inventarios/${item.id}`)}
            >
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer title="MANNGOInventario" scrollable={false}>
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
              style={styles.filterButton}
              onPress={() => {/* Implementar filtro por categoría */}}
            >
              <Text style={styles.filterButtonText}>
                Categoría ▼
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
          refreshing={isLoading}
          onRefresh={refresh}
        />
        
        {/* Botón flotante para agregar */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/inventarios/create')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
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
          if (selectedAlmacen) {
            filtrarPorAlmacen('');
          }
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
  stockControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decreaseButton: {
    width: 28,
    height: 28,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: '#333333',
    minWidth: 30,
    textAlign: 'center',
  },
  increaseButton: {
    width: 28,
    height: 28,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
  },
  minStockText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
  },
  editButton: {
    marginLeft: 'auto',
    backgroundColor: '#00BCD4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  addButtonText: {
    fontSize: 30,
    color: '#FFFFFF',
    lineHeight: 50,
  },
});