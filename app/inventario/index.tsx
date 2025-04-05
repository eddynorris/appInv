// app/inventario/index.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedDataTable } from '@/components/data/EnhancedDataTable';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useInventario } from '@/hooks/crud/useInventario';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function InventarioScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  
  // Usar custom hook para inventario
  const {
    inventarios,
    almacenes,
    selectedAlmacen,
    isLoading,
    isLoadingOptions,
    error,
    pagination,
    columns,
    loadOptions,
    filtrarPorAlmacen,
    refresh,
    handlePageChange,
    handleItemsPerPageChange,
    confirmDelete,
    getEstadisticas
  } = useInventario();
  
  // Cargar datos al montar
  useEffect(() => {
    const initialize = async () => {
      await loadOptions();
      refresh();
    };
    
    initialize();
  }, [loadOptions, refresh]);
  
  // Calcular estadísticas
  const estadisticas = useMemo(() => getEstadisticas(), [getEstadisticas]);
  
  // Crear nuevo registro de inventario
  const handleAddInventario = () => {
    router.push('/inventario/create');
  };
  
  // Agregar funcionalidad de ajuste rápido de stock
  const customActions = [
    {
      icon: "plus.circle",
      color: "#4CAF50",
      onPress: (id: number | string) => {
        router.push({
          pathname: '/inventario/ajustar',
          params: { id, accion: 'aumentar' }
        });
      },
      label: "Agregar"
    },
    {
      icon: "minus.circle",
      color: "#F44336",
      onPress: (id: number | string) => {
        router.push({
          pathname: '/inventario/ajustar',
          params: { id, accion: 'disminuir' }
        });
      },
      label: "Restar"
    }
  ];

  return (
    <ScreenContainer
      title="Inventario"
      scrollable={false}
      isLoading={isLoadingOptions}
      loadingMessage="Cargando datos..."
    >
      <ThemedView style={styles.container}>
        {/* Selector de almacén */}
        <ThemedView style={styles.filterSection}>
          <ThemedText style={styles.filterLabel}>Almacén:</ThemedText>
          <View style={[
            styles.pickerContainer,
            { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }
          ]}>
            <Picker
              selectedValue={selectedAlmacen}
              onValueChange={(value) => filtrarPorAlmacen(value)}
              style={[
                styles.picker,
                { color: Colors[colorScheme].text }
              ]}
            >
              <Picker.Item label="Todos los almacenes" value="" />
              {almacenes.map(almacen => (
                <Picker.Item 
                  key={almacen.id} 
                  label={almacen.nombre} 
                  value={almacen.id.toString()} 
                />
              ))}
            </Picker>
          </View>
        </ThemedView>
        
        {/* Panel de estadísticas */}
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statValue}>{estadisticas.totalRegistros}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Registros</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statValue}>{estadisticas.totalUnidades}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Unidades</ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.statCard, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
            <ThemedText style={[styles.statValue, { color: '#F44336' }]}>
              {estadisticas.bajosStock}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Bajo Mínimo</ThemedText>
          </ThemedView>
        </ThemedView>
        
        {/* Tabla de inventario */}
        <EnhancedDataTable
          data={inventarios}
          columns={columns}
          isLoading={isLoading}
          error={error}
          baseRoute="/inventario"
          pagination={pagination}
          sorting={{
            sortColumn: 'cantidad',
            sortOrder: 'desc',
            onSort: () => {} // Implementar si se necesita ordenación en servidor
          }}
          actions={{
            onView: true,
            onEdit: true,
            onDelete: true,
            customActions
          }}
          deleteOptions={{
            title: 'Eliminar Registro de Inventario',
            message: '¿Está seguro que desea eliminar este registro de inventario?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: confirmDelete
          }}
          emptyMessage="No hay registros de inventario disponibles"
          onRefresh={refresh}
        />
        
        {/* Botón para agregar registro de inventario */}
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddInventario} 
        />
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 10,
    width: 80,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    overflow: 'hidden',
    height: 50,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  }
});