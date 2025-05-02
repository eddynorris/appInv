// app/proveedores/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Alert, View } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { proveedorApi } from '@/services/api';
import { Proveedor } from '@/models';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

export default function ProveedoresScreen() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting state
  const [sortColumn, setSortColumn] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Definimos las columnas de la tabla
  const columns: Column[] = [
    {
      id: 'id',
      label: 'ID',
      width: 0.5,
    },
    {
      id: 'nombre',
      label: 'Nombre',
      width: 2,
    },
    {
      id: 'telefono',
      label: 'Teléfono',
      width: 1,
      render: (item: Proveedor) => <ThemedText>{item.telefono || '-'}</ThemedText>,
    },
    {
      id: 'direccion',
      label: 'Dirección',
      width: 1.5,
      render: (item: Proveedor) => <ThemedText>{item.direccion || '-'}</ThemedText>,
    },
  ];

  const loadProveedores = useCallback(async (page = currentPage, perPage = itemsPerPage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await proveedorApi.getProveedores(page, perPage);
      
      if (response && response.data) {
        setProveedores(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
        setItemsPerPage(response.pagination.per_page);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('Error al cargar los proveedores');
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los proveedores');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Initial load
  useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadProveedores(1, itemsPerPage); // Reset to first page on refresh
  }, [loadProveedores, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    loadProveedores(page, itemsPerPage);
  }, [loadProveedores, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    loadProveedores(1, perPage); // Reset to first page when changing items per page
  }, [loadProveedores]);

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
  
  const handleAddProveedor = () => {
    router.push('/proveedores/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/proveedores/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await proveedorApi.deleteProveedor(parseInt(id));
      
      // Recargar los datos después de eliminar
      loadProveedores(
        // Si es el último item de la página y hay más de una página, ir a la página anterior
        proveedores.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
        itemsPerPage
      );
      
      Alert.alert('Éxito', 'Proveedor eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      Alert.alert('Error', 'No se pudo eliminar el proveedor');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Proveedores',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Proveedores:</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {isLoading ? 'Cargando...' : totalItems}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <EnhancedCardList
          data={proveedores}
          isLoading={isLoading}
          error={error}
          baseRoute="/proveedores"
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
            onView: true,
            onEdit: true,
            onDelete: true
          }}
          deleteOptions={{
            title: 'Eliminar Proveedor',
            message: '¿Está seguro que desea eliminar este proveedor?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => {
              try {
                await proveedorApi.deleteProveedor(parseInt(id.toString()));
                loadProveedores(
                  proveedores.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
                  itemsPerPage
                );
                return true;
              } catch (error) {
                console.error('Error al eliminar proveedor:', error);
                return false;
              }
            }
          }}
          emptyMessage="No hay proveedores disponibles"
          onRefresh={handleRefresh}
          renderCard={(proveedor) => (
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>{proveedor.nombre}</ThemedText>
              </View>
              
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <IconSymbol name="phone.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>{proveedor.telefono || 'No disponible'}</ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <IconSymbol name="location.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText} numberOfLines={2}>{proveedor.direccion || 'No disponible'}</ThemedText>
                </View>
                
                {proveedor.email && (
                  <View style={styles.detailRow}>
                    <IconSymbol name="envelope.fill" size={16} color={Colors.primary} />
                    <ThemedText style={styles.detailText}>{proveedor.email}</ThemedText>
                  </View>
                )}
                
                {proveedor.contacto && (
                  <View style={styles.detailRow}>
                    <IconSymbol name="person.fill" size={16} color={Colors.primary} />
                    <ThemedText style={styles.detailText}>Contacto: {proveedor.contacto}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
          numColumns={1}
        />
        
        <FloatingActionButton 
          icon="plus.circle.fill" 
          onPress={handleAddProveedor} 
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summary: {
    padding: 16,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
    gap: 8,
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