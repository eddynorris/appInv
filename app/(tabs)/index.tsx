import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { DashboardChart } from '@/components/DashboardChart';
import { clienteApi, productoApi, gastoApi, ventaApi, pedidoApi } from '@/services/api';
import { Cliente, Producto, Gasto, Venta, Pedido } from '@/models';

export default function DashboardScreen() {
  const [resumen, setResumen] = useState({
    clientes: 0,
    productos: 0,
    totalVentas: 0,
    totalGastos: 0,
    totalProyecciones: 0,
    ventasPorMes: [],
    gastosPorCategoria: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Cargar datos de clientes, productos, ventas, gastos y pedidos
        const [clientesResponse, productosResponse, ventasResponse, gastosResponse, pedidosResponse] = 
          await Promise.all([
            clienteApi.getClientes(),
            productoApi.getProductos(),
            ventaApi.getVentas(),
            gastoApi.getGastos(),
            pedidoApi.getPedidos(),
          ]);
        
        // Procesar datos para el dashboard
        let totalVentas = 0;
        let totalGastos = 0;
        let ventasPorMes = [];
        let gastosPorCategoria = [];
        
        // Procesar ventas
        if (ventasResponse && ventasResponse.data) {
          totalVentas = ventasResponse.data.reduce(
            (sum, venta) => sum + parseFloat(venta.total), 0
          );
          
          // Agrupar ventas por mes para el gráfico
          const ventasPorMesMap = new Map();
          
          ventasResponse.data.forEach(venta => {
            const fechaVenta = new Date(venta.fecha);
            const mes = fechaVenta.toLocaleString('default', { month: 'short' });
            
            if (!ventasPorMesMap.has(mes)) {
              ventasPorMesMap.set(mes, 0);
            }
            
            ventasPorMesMap.set(mes, ventasPorMesMap.get(mes) + parseFloat(venta.total));
          });
          
          ventasPorMes = Array.from(ventasPorMesMap.entries()).map(([month, amount]) => ({
            month,
            amount,
          }));
        }
        
        // Procesar gastos
        if (gastosResponse && gastosResponse.data) {
          totalGastos = gastosResponse.data.reduce(
            (sum, gasto) => sum + parseFloat(gasto.monto), 0
          );
          
          // Agrupar gastos por categoría para el gráfico
          const gastosPorCategoriaMap = new Map();
          
          gastosResponse.data.forEach(gasto => {
            if (!gastosPorCategoriaMap.has(gasto.categoria)) {
              gastosPorCategoriaMap.set(gasto.categoria, 0);
            }
            
            gastosPorCategoriaMap.set(
              gasto.categoria, 
              gastosPorCategoriaMap.get(gasto.categoria) + parseFloat(gasto.monto)
            );
          });
          
          gastosPorCategoria = Array.from(gastosPorCategoriaMap.entries()).map(([category, amount]) => ({
            category,
            amount,
          }));
        }
        
        // Calcular total de proyecciones activas
        const totalProyecciones = pedidosResponse?.data 
          ? pedidosResponse.data.filter(p => p.estado === 'programado' || p.estado === 'confirmado').length
          : 0;
        
        // Actualizar el estado con todos los datos procesados
        setResumen({
          clientes: clientesResponse?.pagination?.total || 0, 
          productos: productosResponse?.pagination?.total || 0, 
          totalVentas,
          totalGastos,
          totalProyecciones,
          ventasPorMes,
          gastosPorCategoria,
        });
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchDashboardData();
  }, []);

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Dashboard',
        headerShown: true 
      }} />
      
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.heading}>Sistema Manngo</ThemedText>
          
          <ThemedView style={styles.cards}>
            <TouchableOpacity 
              style={[styles.card, styles.clientesCard]}
              onPress={() => router.push('/clientes')}
            >
              <ThemedText style={styles.cardTitle}>Clientes</ThemedText>
              <ThemedText style={styles.cardValue}>
                {isLoading ? 'Cargando...' : resumen.clientes}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.card, styles.productosCard]}
              onPress={() => router.push('/productos')}
            >
              <ThemedText style={styles.cardTitle}>Productos</ThemedText>
              <ThemedText style={styles.cardValue}>
                {isLoading ? 'Cargando...' : resumen.productos}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          <ThemedView style={styles.cards}>
            <TouchableOpacity 
              style={[styles.card, styles.ventasCard]}
              onPress={() => router.push('/ventas')}
            >
              <ThemedText style={styles.cardTitle}>Ventas Totales</ThemedText>
              <ThemedText style={styles.cardValue}>
                {isLoading ? 'Cargando...' : `$${resumen.totalVentas.toFixed(2)}`}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.card, styles.gastosCard]}
              onPress={() => router.push('/gastos')}
            >
              <ThemedText style={styles.cardTitle}>Gastos Totales</ThemedText>
              <ThemedText style={styles.cardValue}>
                {isLoading ? 'Cargando...' : `$${resumen.totalGastos.toFixed(2)}`}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          {/* Nueva tarjeta para proyecciones */}
          <TouchableOpacity 
            style={[styles.card, styles.proyeccionesCard]}
            onPress={() => router.push('/pedidos')}
          >
            <ThemedText style={styles.cardTitle}>Proyecciones Activas</ThemedText>
            <ThemedText style={styles.cardValue}>
              {isLoading ? 'Cargando...' : resumen.totalProyecciones}
            </ThemedText>
          </TouchableOpacity>
          
          {!isLoading && (
            <DashboardChart 
              salesData={resumen.ventasPorMes}
              expensesData={resumen.gastosPorCategoria}
            />
          )}
          
          <ThemedView style={styles.quickActions}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Acciones Rápidas</ThemedText>
            
            <ThemedView style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/ventas/create')}
              >
                <ThemedText style={styles.actionButtonText}>Nueva Venta</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/pedidos/create')}
              >
                <ThemedText style={styles.actionButtonText}>Nueva Proyección</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/clientes/create')}
              >
                <ThemedText style={styles.actionButtonText}>Nuevo Cliente</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    marginBottom: 24,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientesCard: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },
  productosCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  ventasCard: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  gastosCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  proyeccionesCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickActions: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});