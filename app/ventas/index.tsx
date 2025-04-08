// app/ventas/index.tsx - Modificación para controlar acceso por rol
// Actualiza la pantalla de lista de ventas para controlar las acciones según el rol

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { useVentas } from '@/hooks/crud/useVentas';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/context/AuthContext'; // Importar el contexto de autenticación

export default function VentasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth(); // Obtener el usuario actual
  const isAdmin = user?.rol === 'admin'; // Verificar si es administrador
  
  // Estados para DatePicker
  const [showFechaInicioPicker, setShowFechaInicioPicker] = useState(false);
  const [showFechaFinPicker, setShowFechaFinPicker] = useState(false);
  
  // Bandera para controlar la inicialización
  const isInitialized = useRef(false);
  
  // Usar el hook especializado para ventas
  const { 
    ventas, 
    isLoading, 
    error, 
    pagination, 
    columns,
    fetchData: hookFetchData,
    loadVentas,
    deleteVenta,
    getEstadisticas,
    filters,
    applyFilters,
    clearFilters,
    clientes,
    almacenes,
    loadOptions
  } = useVentas();
  
  // Estado local para filtros
  const [localFilters, setLocalFilters] = useState({
    cliente_id: '',
    almacen_id: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  
  // Crear un fallback para fetchData si no está disponible
  const fetchData = useCallback(() => {
    if (hookFetchData) {
      return hookFetchData();
    }
    if (loadVentas) {
      return loadVentas(pagination.currentPage, pagination.itemsPerPage);
    }
    console.error('No se encontró método fetchData ni loadVentas');
    return Promise.resolve();
  }, [hookFetchData, loadVentas, pagination.currentPage, pagination.itemsPerPage]);
  
  // Cargar datos solo al iniciar la aplicación
  useEffect(() => {
    // Controlar la inicialización para que solo ocurra una vez
    if (!isInitialized.current) {
      console.log('Inicialización: Cargando datos de ventas y opciones...');
      
      // Cargar primero las opciones (antes de las ventas)
      loadOptions().then(() => {
        // Una vez cargadas las opciones, cargar las ventas
        loadVentas(1, 10);
        isInitialized.current = true;
      });
    }
  }, []); 

  // Navegar a la pantalla de creación de venta
  const handleAddVenta = () => {
    router.push('/ventas/create');
  };
  
  // Calcular estadísticas 
  const ventasResumen = getEstadisticas();

  // Manejar cambio en filtros
  const handleFilterChange = (name: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Manejar cambio de fecha inicio
  const handleFechaInicioChange = (event: any, selectedDate?: Date) => {
    setShowFechaInicioPicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleFilterChange('fecha_inicio', formattedDate);
    }
  };
  
  // Manejar cambio de fecha fin
  const handleFechaFinChange = (event: any, selectedDate?: Date) => {
    setShowFechaFinPicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleFilterChange('fecha_fin', formattedDate);
    }
  };
  
  // Aplicar filtros
  const handleApplyFilters = () => {
    applyFilters(localFilters);
  };
  
  // Limpiar filtros
  const handleClearFilters = () => {
    setLocalFilters({
      cliente_id: '',
      almacen_id: '',
      fecha_inicio: '',
      fecha_fin: ''
    });
    clearFilters();
  };

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    loadVentas(page, pagination.itemsPerPage);
  };

  // Manejar cambio de elementos por página
  const handleItemsPerPageChange = (perPage: number) => {
    loadVentas(1, perPage);
  };

  // Determinar qué acciones mostrar según el rol del usuario
  const tableActions = {
    onView: true, // Todos pueden ver detalles
    onEdit: isAdmin, // Solo admin puede editar
    onDelete: isAdmin // Solo admin puede eliminar
  };

  return (
    <ScreenContainer 
      title="Ventas"
      scrollable={false}
    >
      <ThemedView style={styles.container}>
        {/* Barra de herramientas compacta */}
        <ThemedView style={styles.toolbar}>
          <ThemedView style={styles.toolbarSummary}>
            <ThemedView style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Total: </ThemedText>
              <ThemedText style={styles.summaryValue}>{ventasResumen.totalVentas}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Monto: </ThemedText>
              <ThemedText style={styles.summaryValue}>${ventasResumen.totalMonto.toFixed(2)}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Deuda: </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#F44336' }]}>
                ${ventasResumen.deudaTotal.toFixed(2)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        
        {/* Filtro compacto de fechas */}
        <ThemedView style={styles.dateFiltros}>
          <ThemedView style={styles.dateFilterRow}>
            <ThemedView style={styles.dateFilterItem}>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowFechaInicioPicker(true)}
              >
                <ThemedText style={styles.dateInputLabel}>Desde:</ThemedText>
                <ThemedText style={styles.dateInputValue}>
                  {localFilters.fecha_inicio || 'Seleccionar fecha'}
                </ThemedText>
                <IconSymbol name="calendar" size={16} color="#888" />
              </TouchableOpacity>
              {showFechaInicioPicker && (
                <DateTimePicker
                  value={localFilters.fecha_inicio ? new Date(localFilters.fecha_inicio) : new Date()}
                  mode="date"
                  onChange={handleFechaInicioChange}
                />
              )}
            </ThemedView>
            
            <ThemedView style={styles.dateFilterItem}>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowFechaFinPicker(true)}
              >
                <ThemedText style={styles.dateInputLabel}>Hasta:</ThemedText>
                <ThemedText style={styles.dateInputValue}>
                  {localFilters.fecha_fin || 'Seleccionar fecha'}
                </ThemedText>
                <IconSymbol name="calendar" size={16} color="#888" />
              </TouchableOpacity>
              {showFechaFinPicker && (
                <DateTimePicker
                  value={localFilters.fecha_fin ? new Date(localFilters.fecha_fin) : new Date()}
                  mode="date"
                  onChange={handleFechaFinChange}
                />
              )}
            </ThemedView>
          </ThemedView>
          
          <ThemedView style={styles.dateFilterActions}>
            <TouchableOpacity 
              style={[styles.filterButton, styles.applyButton]} 
              onPress={handleApplyFilters}
            >
              <ThemedText style={styles.buttonText}>Buscar</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, styles.clearButton]} 
              onPress={handleClearFilters}
            >
              <ThemedText style={styles.buttonText}>Limpiar</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
        
        <EnhancedDataTable
          data={ventas}
          columns={columns}
          isLoading={isLoading}
          error={error}
          baseRoute="/ventas"
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            itemsPerPage: pagination.itemsPerPage,
            totalItems: pagination.totalItems,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handleItemsPerPageChange
          }}
          sorting={{
            sortColumn: 'fecha',
            sortOrder: 'desc',
            onSort: () => {}
          }}
          actions={tableActions}
          deleteOptions={{
            title: 'Eliminar Venta',
            message: '¿Está seguro que desea eliminar esta venta?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteVenta(Number(id))
          }}
          emptyMessage="No hay ventas registradas"
          onRefresh={fetchData}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddVenta} 
        />
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Estilos existentes, sin cambios
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
  },
  toolbarSummary: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  toolbarButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dateFiltros: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  dateFilterItem: {
    flex: 1,
  },
  dateInput: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  dateInputLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginRight: 6,
  },
  dateInputValue: {
    flex: 1,
    fontSize: 13,
  },
  dateFilterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  applyButton: {
    backgroundColor: Colors.primary,
  },
  clearButton: {
    backgroundColor: Colors.secondary,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});