// app/proveedores/index.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Alert, View } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { Proveedor } from '@/models';
import { IconSymbol } from '@/components/ui/IconSymbol';
 import { Colors } from '@/styles/Theme';
import { useProveedoresList } from '@/hooks/crud/useProveedoresList';

export default function ProveedoresScreen() {
  const {
    proveedores,
    isLoading,
    error,
    columns,
    pagination,
    refresh,
    deleteProveedor
  } = useProveedoresList();

  const handleAddProveedor = () => {
    router.push('/proveedores/create');
  };

  const totalItems = useMemo(() => pagination.totalItems, [pagination.totalItems]);

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
          pagination={pagination}
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
            onDelete: async (id) => await deleteProveedor(Number(id))
          }}
          emptyMessage="No hay proveedores disponibles"
          onRefresh={refresh}
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