import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/ThemedText';

interface PresentationSalesData {
  name: string;
  cantidad: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface PresentationsPieChartProps {
  data: PresentationSalesData[];
  title?: string;
}

export function PresentationsPieChart({ data, title = 'Ventas por Presentación' }: PresentationsPieChartProps) {
  const screenWidth = Dimensions.get('window').width - 32; // Menos el padding

  const chartConfig = {
    backgroundGradientFrom: '#1e88e5',
    backgroundGradientTo: '#0a7ea4',
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
  };

  const hasData = data && data.length > 0;

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
      <PieChart
        data={data}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        accessor="cantidad"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
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
