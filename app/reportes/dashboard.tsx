// app/reportes/dashboard.tsx
import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useDashboardData } from '@/hooks/reportes/useDashboardData';
import { NotificationsBar } from '@/components/dashboard/NotificationsBar';
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector';
import { SalesLineChart } from '@/components/dashboard/SalesLineChart';
// import { PresentationsPieChart } from '@/components/dashboard/PresentationsPieChart'; // Comentado si no se usa
import { useSalesChart } from '@/hooks/reportes/useSalesChart';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Divider } from '@/components/layout/Divider';
// import { formatCurrency } from '@/utils/formatters'; // Descomentar si se usa

// --- Componente Principal ---
export default function DashboardScreen() {
    const colorScheme = useColorScheme() ?? 'light';

    // Hook para datos generales del dashboard (alertas)
    const {
        isLoading: isLoadingDashboard,
        error: dashboardError,
        alertasStockBajo,
        alertasLotesBajos,
        clientesConSaldoPendiente,
        refresh: refreshDashboard
    } = useDashboardData();
    // --- Estados y Lógica para Gráficos ---
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date;
    });
    const [endDate, setEndDate] = useState(new Date());

    // Hook para datos de gráficos
    const {
        chartData: salesChartData,
        isLoading: isLoadingCharts,
        error: chartsError,
        loadSalesData: refreshCharts
    } = useSalesChart();

    // Cargar datos del gráfico
    React.useEffect(() => {
        // Solo cargar si refreshCharts es una función válida
        if (typeof refreshCharts === 'function') {
            refreshCharts({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            });
        }
    }, [startDate, endDate, refreshCharts]);

    // Función para manejar cambios de fechas
    const handleDateChange = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
    };
    // --- Fin Sección Gráficos ---

    // --- Navegación ---
    const navigateToLotes = () => router.push('/lotes');
    const navigateToInventario = () => router.push('/inventarios');
    // const navigateToPedidos = () => router.push('/pedidos');
    // const navigateToVentas = () => router.push('/ventas');
    const navigateToClientes = () => router.push('/clientes');

    // --- Estado Combinado de Carga y Error ---
    const isLoading = isLoadingDashboard || isLoadingCharts;
    const error = dashboardError || chartsError;

    // --- Función de Refresco Combinada ---
    const handleRefresh = React.useCallback(async () => {
        const promises = [];
        if (typeof refreshDashboard === 'function') {
            promises.push(refreshDashboard());
        }
        if (typeof refreshCharts === 'function') {
            promises.push(refreshCharts({
                 startDate: startDate.toISOString().split('T')[0],
                 endDate: endDate.toISOString().split('T')[0],
            }));
        }
        await Promise.all(promises);
    }, [refreshDashboard, refreshCharts, startDate, endDate]);


    // --- Renderizado Condicional ---
    // Simplificar la condición de carga inicial
    if (isLoading && !salesChartData && !alertasStockBajo) { // Mostrar solo en la carga inicial absoluta
        return (
            <ScreenContainer title="Dashboard" scrollable={false}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                    <ThemedText>Cargando datos...</ThemedText>
                </View>
            </ScreenContainer>
        );
    }

    // Mostrar error si existe
    if (error) {
         return (
            <ScreenContainer title="Dashboard" scrollable={false}>
                <View style={styles.centered}>
                    <ThemedText type="defaultSemiBold" style={{ color: 'red' }}>Error:</ThemedText>
                    <ThemedText>{error}</ThemedText>
                    <TouchableOpacity onPress={handleRefresh} style={{ marginTop: 15 }}>
                        <ThemedText style={{ color: Colors.light.tint }}>Reintentar</ThemedText>
                    </TouchableOpacity>
                </View>
            </ScreenContainer>
        );
    }

    // --- Cálculos Seguros para Counts (después de verificar carga/error) ---
    // Estos cálculos son seguros porque usan ?. y ??
    const stockBajoCount = alertasStockBajo?.length ?? 0;
    const lotesBajosCount = alertasLotesBajos?.length ?? 0;
    const clientesPendientesCount = clientesConSaldoPendiente?.length ?? 0;

    // --- Preparar datos para gráficos (si se usan) ---
    const lineChartData = salesChartData ? {
        labels: salesChartData.labels,
        datasets: salesChartData.datasets
    } : { labels: [], datasets: [{ data: [] }] };

    // const pieChartData = { labels: [], datasets: [{ data: [] }] }; // Placeholder

    // --- Renderizado Principal ---
    return (
        <ScreenContainer
            title="Dashboard"
            scrollable={true}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
            }
        >
            <Stack.Screen options={{ title: 'Dashboard' }} />

            <NotificationsBar
                // Pasar los arrays directamente. Si son undefined, pasar array vacío.
                inventarioBajo={alertasStockBajo || []}
                lotesBajos={alertasLotesBajos || []}
                // Mantener los counts si NotificationsBar los usa para los badges
                stockBajoCount={stockBajoCount}
                lotesBajosCount={lotesBajosCount}
                clientesPendientesCount={clientesPendientesCount}
                // Mantener los onPress
                onPressStockBajo={navigateToInventario}
                onPressLotesBajos={navigateToLotes}
                onPressClientesPendientes={navigateToClientes}
            />
             {/* Selector de rango de fechas */}
             <DateRangeSelector
                 startDate={startDate}
                 endDate={endDate}
                 onDateChange={handleDateChange}
             />

             {/* Gráfico de Líneas de Ventas */}
             <ThemedView style={styles.chartContainer}>
                 <SalesLineChart
                     data={lineChartData}
                     title="Ventas por Período"
                 />
             </ThemedView>

             {/* Gráfico Circular de Presentaciones */}
             {/* <ThemedView style={styles.chartContainer}>
                 <PresentationsPieChart
                     data={pieChartData}
                     title="Ventas por Presentación"
                 />
             </ThemedView> */}


            {/* Sección Clientes con Saldo Pendiente */}
            <ThemedView style={[styles.card, styles.reportCard]}>
                <View style={styles.reportHeader}>
                    <IconSymbol name="creditcard.fill" size={22} color={Colors[colorScheme].text} />
                    <ThemedText style={styles.reportTitle}>Clientes con Saldo Pendiente</ThemedText>
                    <TouchableOpacity onPress={navigateToClientes}>
                        <IconSymbol name="chevron.right" size={18} color={Colors[colorScheme].textSecondary} />
                    </TouchableOpacity>
                </View>
                <Divider style={styles.divider} />
                {/* Asegurarse que clientesConSaldoPendiente es un array antes de mapear */}
                {Array.isArray(clientesConSaldoPendiente) && clientesPendientesCount > 0 ? (
                    clientesConSaldoPendiente.map((cliente) => (
                        // Añadir un chequeo por si cliente o cliente.cliente_id es null/undefined
                        cliente?.cliente_id ? (
                            <View key={cliente.cliente_id} style={styles.listItem}>
                                <ThemedText style={styles.listItemText}>• {cliente.nombre || 'Nombre no disponible'}</ThemedText>
                            </View>
                        ) : null // O renderizar algo indicando un dato inválido
                    ))
                ) : (
                    <ThemedText style={styles.reportEmpty}>No hay clientes con saldo pendiente.</ThemedText>
                )}
            </ThemedView>

        </ScreenContainer>
    );
}

// --- Estilos ---
const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: Colors.light.background, // Usar colores del tema si es posible
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    reportCard: {
        marginTop: 16,
        marginHorizontal: 16,
    },
    reportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    reportTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    divider: {
        marginBottom: 10,
    },
    listItem: {
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border, // Usar colores del tema
    },
    listItemText: {
         fontWeight: '500',
    },
    reportEmpty: {
        fontSize: 14,
        color: Colors.light.textSecondary, // Usar colores del tema
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    },
    chartContainer: {
        marginHorizontal: 16,
        backgroundColor: Colors.light.background, // Usar colores del tema
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        padding: 8,
        marginTop: 16,
    },
});