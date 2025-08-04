// app/movimientos/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { movimientoApi } from '@/services/api';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { IconSymbol } from '@/components/ui/IconSymbol';
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Movimiento } from '@/models';


export default function MovimientosScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting state
  const [sortColumn, setSortColumn] = useState('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Orden descendente por defecto (más recientes primero)

  // Filtro para búsqueda en movimientos
  const [filters, setFilters] = useState({
    tipo: '', // entrada, salida o vacío para todos
    fecha_desde: '',
    fecha_hasta: '',
    motivo: '',
  });

  const loadMovimientos = useCallback(async (page = currentPage, perPage = itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await movimientoApi.getMovimientos(page, perPage, filters);
      
      if (response && response.data) {
        setMovimientos(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
        setItemsPerPage(response.pagination.per_page);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('Error al cargar los movimientos');
      }
    } catch (err) {
      console.error('Error al cargar movimientos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los movimientos');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]);

  // Initial load
  useEffect(() => {
    loadMovimientos();
  }, [loadMovimientos]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadMovimientos(1, itemsPerPage); // Reset to first page on refresh
  }, [loadMovimientos, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    loadMovimientos(page, itemsPerPage);
  }, [loadMovimientos, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    loadMovimientos(1, perPage); // Reset to first page when changing items per page
  }, [loadMovimientos]);

  // Handle sort
  const handleSort = useCallback((column: string) => {
    setSortOrder(prevOrder => 
      column === sortColumn 
        ? prevOrder === 'asc' ? 'desc' : 'asc' 
        : 'asc'
    );
    setSortColumn(column);
    
    // En un entorno real, aquí llamaríamos a la API con los parámetros de ordenación
    console.log(`Ordenando por ${column} en orden ${sortOrder}`);
  }, [sortColumn, sortOrder]);

  // Manejar cambios en los filtros
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Aplicar filtros
  const applyFilters = () => {
    loadMovimientos(1, itemsPerPage); // Reiniciar a primera página al aplicar filtros
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      tipo: '',
      fecha_desde: '',
      fecha_hasta: '',
      motivo: '',
    });
    
    // Recargar después de resetear los filtros
    setTimeout(() => {
      loadMovimientos(1, itemsPerPage);
    }, 0);
  };


  return (
    <>
      <Stack.Screen options={{ 
        title: 'Movimientos de Inventario',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        {/* Sección de filtros */}
        <ThemedView style={styles.filterSection}>
          <ThemedText type="subtitle">Filtros de Búsqueda</ThemedText>
          
          <ThemedView style={styles.filterRow}>
            <ThemedView style={styles.filterColumn}>
              <ThemedText style={styles.filterLabel}>Tipo</ThemedText>
              <View style={[
                styles.pickerContainer,
                { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }
              ]}>
                <Picker
                  selectedValue={filters.tipo}
                  onValueChange={(value) => handleFilterChange('tipo', value)}
                  style={[
                    styles.picker,
                    { color: Colors[colorScheme].text }
                  ]}
                >
                  <Picker.Item label="Todos" value="" />
                  <Picker.Item label="Entradas" value="entrada" />
                  <Picker.Item label="Salidas" value="salida" />
                </Picker>
              </View>
            </ThemedView>

            <ThemedView style={styles.filterColumn}>
              <ThemedText style={styles.filterLabel}>Desde</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text }
                ]}
                value={filters.fecha_desde}
                onChangeText={(value) => handleFilterChange('fecha_desde', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9BA1A6"
              />
            </ThemedView>

            <ThemedView style={styles.filterColumn}>
              <ThemedText style={styles.filterLabel}>Hasta</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text }
                ]}
                value={filters.fecha_hasta}
                onChangeText={(value) => handleFilterChange('fecha_hasta', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9BA1A6"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.filterActions}>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <ThemedText style={styles.clearButtonText}>Limpiar Filtros</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <ThemedText style={styles.applyButtonText}>Aplicar Filtros</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
        
        {/* Resumen */}
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Movimientos:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : totalItems}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        {/* Lista de tarjetas de movimientos */}
        <EnhancedCardList
          data={movimientos}
          isLoading={isLoading}
          error={error}
          baseRoute="/movimientos"
          pagination={{
            currentPage,
            totalPages,
            itemsPerPage,
            totalItems,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handleItemsPerPageChange
          }}
          sorting={{
            sortColumn,
            sortOrder,
            onSort: handleSort
          }}
          actions={{
            onView: false,
            onEdit: false,
            onDelete: false
          }}
          emptyMessage="No hay movimientos registrados con los filtros actuales"
          onRefresh={handleRefresh}
          renderCard={(movimiento) => (
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>
                  {new Date(movimiento.fecha).toLocaleDateString()}
                </ThemedText>
                <View style={styles.badgeContainer}>
                  <ThemedView 
                    style={[
                      styles.badge, 
                      movimiento.tipo === 'entrada' ? styles.entradaBadge : styles.salidaBadge
                    ]}
                  >
                    <ThemedText style={[
                      styles.badgeText, 
                      { color: movimiento.tipo === 'entrada' ? '#4CAF50' : '#F44336' }
                    ]}>
                      {movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                    </ThemedText>
                  </ThemedView>
                </View>
              </View>
              
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <IconSymbol name="cube.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Presentación: {movimiento.presentacion?.nombre || '-'}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="number" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Cantidad: {parseInt(movimiento.cantidad)}
                  </ThemedText>
                </View>
                
                {movimiento.motivo && (
                  <View style={styles.detailRow}>
                    <IconSymbol name="doc.text.fill" size={16} color={Colors.primary} />
                    <ThemedText style={styles.detailText} numberOfLines={2}>
                      Motivo: {movimiento.motivo}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
          numColumns={1}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    padding: 16,
    backgroundColor: '#F5F5F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  filterColumn: {
    flex: 1,
    minWidth: 150,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  clearButtonText: {
    color: '#424242',
  },
  applyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2196F3',
  },
  applyButtonText: {
    color: '#FFFFFF',
  },
  summary: {
    padding: 16,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  tipoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Estilos para las tarjetas
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  entradaBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  salidaBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
});