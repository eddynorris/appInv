// components/dashboard/DashboardCharts.tsx
import React, { memo, useMemo } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SalesData {
  month: string;
  amount: number;
}

interface ExpenseData {
  category: string;
  amount: number;
}

// Separate components for each chart type to allow individual memoization
const SalesLineChart = memo(({ 
  data, 
  width, 
  isDark 
}: { 
  data: SalesData[],
  width: number,
  isDark: boolean
}) => {
  // Prepare chart data from sales data
  const chartData = useMemo(() => ({
    labels: data.map(d => d.month),
    datasets: [
      {
        data: data.map(d => d.amount),
        color: () => isDark ? '#3F51B5' : '#0a7ea4',
        strokeWidth: 2,
      },
    ],
  }), [data, isDark]);
  
  // Chart configuration
  const chartConfig = useMemo(() => ({
    backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFF',
    backgroundGradientTo: isDark ? '#1A1A1A' : '#FFF',
    decimalPlaces: 0,
    color: () => isDark ? '#ECEDEE' : '#333',
    labelColor: () => isDark ? '#ECEDEE' : '#333',
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: isDark ? '#3F51B5' : '#0a7ea4',
    },
  }), [isDark]);
  
  return (
    <LineChart
      data={chartData}
      width={width}
      height={220}
      chartConfig={chartConfig}
      bezier
      style={styles.chart}
    />
  );
});

const ExpensesBarChart = memo(({ 
  data, 
  width, 
  isDark 
}: { 
  data: ExpenseData[],
  width: number,
  isDark: boolean
}) => {
  // Prepare chart data from expense data
  const chartData = useMemo(() => ({
    labels: data.map(d => d.category),
    datasets: [
      {
        data: data.map(d => d.amount),
      },
    ],
  }), [data]);
  
  // Chart configuration
  const chartConfig = useMemo(() => ({
    backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFF',
    backgroundGradientTo: isDark ? '#1A1A1A' : '#FFF',
    decimalPlaces: 0,
    color: () => isDark ? '#FF5252' : '#F44336',
    labelColor: () => isDark ? '#ECEDEE' : '#333',
    barPercentage: 0.5,
  }), [isDark]);
  
  return (
    <BarChart
      data={chartData}
      width={width}
      height={220}
      chartConfig={chartConfig}
      style={styles.chart}
      yAxisLabel="$"
      verticalLabelRotation={30}
    />
  );
});

interface DashboardChartsProps {
  salesData?: SalesData[];
  expensesData?: ExpenseData[];
  isLoading?: boolean;
  error?: string | null;
}

// Main component that uses the memoized chart components
export const DashboardCharts = memo(({ 
  salesData = [], 
  expensesData = [],
  isLoading = false,
  error = null
}: DashboardChartsProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width - 32; // Full width minus padding
  
  // Default data if not provided
  const defaultSalesData: SalesData[] = useMemo(() => [
    { month: 'Ene', amount: 2400 },
    { month: 'Feb', amount: 1398 },
    { month: 'Mar', amount: 9800 },
    { month: 'Abr', amount: 3908 },
    { month: 'May', amount: 4800 },
    { month: 'Jun', amount: 3800 },
  ], []);

  const defaultExpensesData: ExpenseData[] = useMemo(() => [
    { category: 'Servicios', amount: 2500 },
    { category: 'Personal', amount: 5000 },
    { category: 'Alquiler', amount: 3000 },
    { category: 'Marketing', amount: 1500 },
  ], []);
  
  // Use the provided data or the defaults
  const finalSalesData = salesData.length > 0 ? salesData : defaultSalesData;
  const finalExpensesData = expensesData.length > 0 ? expensesData : defaultExpensesData;
  
  // Loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        <ThemedText>Cargando datos de gráficos...</ThemedText>
      </ThemedView>
    );
  }
  
  // Error state
  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.chartCard}>
        <ThemedText type="subtitle" style={styles.chartTitle}>Ventas Mensuales</ThemedText>
        <SalesLineChart 
          data={finalSalesData} 
          width={screenWidth}
          isDark={isDark}
        />
      </ThemedView>
      
      <ThemedView style={styles.chartCard}>
        <ThemedText type="subtitle" style={styles.chartTitle}>Gastos por Categoría</ThemedText>
        <ExpensesBarChart 
          data={finalExpensesData} 
          width={screenWidth}
          isDark={isDark}
        />
      </ThemedView>
    </ThemedView>
  );
});

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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
  }
});