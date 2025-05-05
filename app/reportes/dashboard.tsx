// app/dashboard.tsx o donde esté ubicado tu DashboardScreen
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
// Importamos el componente correctamente - asegúrate de que la ruta sea correcta
import { DashboardCharts } from '@/components/DashboardChart';
import { ventaApi, gastoApi } from '@/services/api';

// Interfaces para los datos de las gráficas
interface SalesData {
  month: string;
  amount: number;
}

interface ExpenseData {
  category: string;
  amount: number;
}

export default function DashboardScreen() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [expensesData, setExpensesData] = useState<ExpenseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Obtener datos de ventas (simplificado)
        const ventasResponse = await ventaApi.getVentas(1, 100);
        if (ventasResponse && ventasResponse.data) {
          // Procesamiento de datos para ventas por mes
          const ventasPorMes = procesarVentasPorMes(ventasResponse.data);
          setSalesData(ventasPorMes);
        }
        
        // Obtener datos de gastos (simplificado)
        const gastosResponse = await gastoApi.getGastos(1, 100);
        if (gastosResponse && gastosResponse.data) {
          // Procesamiento de datos para gastos por categoría
          const gastosPorCategoria = procesarGastosPorCategoria(gastosResponse.data);
          setExpensesData(gastosPorCategoria);
        }
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
        setError('No se pudieron cargar los datos del dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Función para procesar ventas por mes
  const procesarVentasPorMes = (ventas) => {
    // Ejemplo simplificado - implementa tu lógica específica aquí
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Objeto para agrupar por mes
    const ventasPorMes = {};
    
    // Inicializar con ceros
    meses.forEach((mes, index) => {
      ventasPorMes[mes] = 0;
    });
    
    // Agrupar ventas por mes
    ventas.forEach(venta => {
      const fecha = new Date(venta.fecha);
      const mes = meses[fecha.getMonth()];
      ventasPorMes[mes] += parseFloat(venta.total);
    });
    
    // Convertir a formato para la gráfica
    return Object.keys(ventasPorMes).map(month => ({
      month,
      amount: Math.round(ventasPorMes[month])
    }));
  };
  
  // Función para procesar gastos por categoría
  const procesarGastosPorCategoria = (gastos) => {
    // Ejemplo simplificado - implementa tu lógica específica aquí
    const gastosPorCategoria = {
      'Servicios': 0,
      'Personal': 0,
      'Otros': 0
    };
    
    // Agrupar gastos por categoría
    gastos.forEach(gasto => {
      const categoria = gasto.categoria || 'Otros';
      if (gastosPorCategoria[categoria] !== undefined) {
        gastosPorCategoria[categoria] += parseFloat(gasto.monto);
      } else {
        gastosPorCategoria['Otros'] += parseFloat(gasto.monto);
      }
    });
    
    // Convertir a formato para la gráfica
    return Object.keys(gastosPorCategoria).map(category => ({
      category,
      amount: Math.round(gastosPorCategoria[category])
    }));
  };

  return (
    <ScreenContainer 
      title="Dashboard" 
      scrollable={true}
    >
      <ThemedText type="title" style={styles.heading}>
        Resumen Operativo
      </ThemedText>
      
      <ThemedView style={styles.statsContainer}>
        {/* Estadísticas rápidas en la parte superior */}
        <ThemedView style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {isLoading ? '-' : ventasTotal(salesData)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Ventas Totales</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {isLoading ? '-' : gastosTotal(expensesData)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Gastos Totales</ThemedText>
        </ThemedView>
      </ThemedView>
      
      {/* Componente de gráficos optimizado */}
      <DashboardCharts 
        salesData={salesData}
        expensesData={expensesData}
        isLoading={isLoading}
        error={error}
      />
    </ScreenContainer>
  );
}

// Funciones auxiliares
function ventasTotal(salesData) {
  return `S/.${salesData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}`;
}

function gastosTotal(expensesData) {
  return `S/.${expensesData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}`;
}

const styles = StyleSheet.create({
  heading: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});