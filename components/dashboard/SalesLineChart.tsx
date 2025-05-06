import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/ThemedText';
import { formatCurrency } from '@/utils/formatters';

interface SalesData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

interface SalesLineChartProps {
  data: SalesData;
  title?: string;
}

export function SalesLineChart({ data, title = 'Gráfico de Ventas' }: SalesLineChartProps) {
  const screenWidth = Dimensions.get('window').width - 80; // Menos el padding

  const chartConfig = {
    backgroundGradientFrom: '#1e88e5',
    backgroundGradientTo: '#0a7ea4',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#fff',
    },
  };

  const hasData = data && data.datasets && data.datasets[0]?.data.length > 0;

  if (!hasData) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <View style={styles.noDataContainer}>
          <ThemedText style={styles.noDataText}>No hay datos disponibles</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <LineChart
        data={data}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withDots={true}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        formatYLabel={(value) => `${parseInt(value, 10)}`}
        yAxisInterval={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 8,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
});
