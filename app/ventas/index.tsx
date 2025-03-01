import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DataTable, Column } from '@/components/DataTable';
import { ventaApi } from '@/services/api';
import { Venta } from '@/models';

export default function VentasScreen() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sorting state
  const [sortColumn, setSortColumn] = useState('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Definimos las columnas de la tabla
  const columns: Column[] = [
    {
      id: 'id',
      label: 'ID',
      width: 0.5,
    },
    {
      id: 'fecha',
      label: 'Fecha',
      width: 1,
      render: (item: Venta) => <ThemedText>{new Date(item.fecha).toLocaleDateString()}</ThemedText>,
    },
    {
      id: 'cliente',
      label: 'Cliente',
      width: 1.5,
      render: (item: Venta) => <ThemedText>{item.cliente?.nombre || '-'}</ThemedText>,
    },
    {
      id: 'total',
      label: 'Total',
      width: 1,
      render: (item: Venta) => <ThemedText>${parseFloat(item.total).toFixed(2)}</ThemedText>,
    },
    {
      id: 'estado_pago',
      label: 'Estado',
      width: 1,
      render: (item: Venta) => {
        let color = '#757575'; // Gris por defecto
        
        switch (item.estado_pago) {
          case 'pagado':
            color = '#4CAF50'; // Verde
            break;
          case 'pendiente':
            color = '#FFC107'; // Amarillo
            break;
          case 'parcial':
            color = '#FF9800'; // Naranja
            break;
        }
        
        return (
          <ThemedText style={{ color, fontWeight: '500', textTransform: 'capitalize' }}>
            {item.estado_pago}
          </ThemedText>
        );
      },
    },
  ];

  const loadVentas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ventaApi.getVentas();
      
      if (response && response.data) {
        setVentas(response.data);
        setTotalPages(response.total_paginas || 1);
        setCurrentPage(response.pagina || 1);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('Error al cargar las ventas');
      }
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las ventas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadVentas();
  }, [loadVentas]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadVentas();
  }, [loadVentas]);

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
  
  const handleAddVenta = () => {
    router.push('/ventas/create');
  };

  // Calcular resumen de ventas
  const ventasResumen = {
    total: ventas.reduce((sum, venta) => sum + parseFloat(venta.total), 0),
    pagadas: ventas.filter(v => v.estado_pago === 'pagado').length,
    pendientes: ventas.filter(v => v.estado_pago === 'pendiente').length,
    parciales: ventas.filter(v => v.estado_pago === 'parcial').length,
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Ventas',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.summary}>
          <ThemedView style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Ventas:</ThemedText>
            <ThemedText style={styles.summaryValue}>${ventasResumen.total.toFixed(2)}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.summaryBadges}>
            <ThemedView style={[styles.badge, styles.badgePagado]}>
              <ThemedText style={styles.badgeText}>{ventasResumen.pagadas} Pagadas</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.badge, styles.badgePendiente]}>
              <ThemedText style={styles.badgeText}>{ventasResumen.pendientes} Pendientes</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.badge, styles.badgeParcial]}>
              <ThemedText style={styles.badgeText}>{ventasResumen.parciales} Parciales</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        
        <DataTable<Venta>
          data={ventas}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          baseRoute="/ventas"
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          currentPage={currentPage}
          totalPages={totalPages}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No hay ventas registradas"
        />
        
        <FloatingActionButton 
          icon="cart.fill" 
          onPress={handleAddVenta} 
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
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    gap: 12,
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
  summaryBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    flex: 1,
    borderRadius: 4,
    padding: 6,
    alignItems: 'center',
  },
  badgePagado: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  badgePendiente: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  badgeParcial: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});