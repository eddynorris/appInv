import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface DashboardChartProps {
  salesData?: { month: string; amount: number }[];
  expensesData?: { category: string; amount: number }[];
}

export const DashboardChart = ({ 
  salesData = [], 
  expensesData = []
}: DashboardChartProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width - 32; // Full width minus padding
  
  // Default data si no se proporciona
  const defaultSalesData = [
    { month: 'Ene', amount: 2400 },
    { month: 'Feb', amount: 1398 },
    { month: 'Mar', amount: 9800 },
    { month: 'Abr', amount: 3908 },
    { month: 'May', amount: 4800 },
    { month: 'Jun', amount: 3800 },
  ];

  const defaultExpensesData = [
    { category: 'Servicios', amount: 2500 },
    { category: 'Personal', amount: 5000 },
    { category: 'Alquiler', amount: 3000 },
    { category: 'Marketing', amount: 1500 },
  ];
  
  // Usar los datos proporcionados o los valores por defecto
  const finalSalesData = salesData.length > 0 ? salesData : defaultSalesData;
  const finalExpensesData = expensesData.length > 0 ? expensesData : defaultExpensesData;
  
  // Configuración para el gráfico de líneas (ventas)
  const lineChartData = {
    labels: finalSalesData.map(d => d.month),
    datasets: [
      {
        data: finalSalesData.map(d => d.amount),
        color: () => Colors[colorScheme].tint,
        strokeWidth: 2,
      },
    ],
  };
  
  // Configuración para el gráfico de barras (gastos)
  const barChartData = {
    labels: finalExpensesData.map(d => d.category),
    datasets: [
      {
        data: finalExpensesData.map(d => d.amount),
      },
    ],
  };
  
  // Configuración común para los gráficos
  const chartConfig = {
    backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFF',
    backgroundGradientTo: isDark ? '#1A1A1A' : '#FFF',
    decimalPlaces: 0,
    color: () => isDark ? '#ECEDEE' : '#333',
    labelColor: () => isDark ? '#ECEDEE' : '#333',
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors[colorScheme].tint,
    },
    barPercentage: 0.5,
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.chartCard}>
        <ThemedText type="subtitle" style={styles.chartTitle}>Ventas Mensuales</ThemedText>
        <LineChart
          data={lineChartData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </ThemedView>
      
      <ThemedView style={styles.chartCard}>
        <ThemedText type="subtitle" style={styles.chartTitle}>Gastos por Categoría</ThemedText>
        <BarChart
          data={barChartData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisLabel="$"
          verticalLabelRotation={30}
        />
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  chartCard: {
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
});