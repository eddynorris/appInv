import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '@/services/api';
import { Lote, Inventario, ClienteSimple } from '@/models';

// --- Hook Principal (Refactorizado) ---
export function useDashboardData() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados basados en la nueva respuesta de la API
    const [alertasStockBajo, setAlertasStockBajo] = useState<Inventario[]>([]);
    const [alertasLotesBajos, setAlertasLotesBajos] = useState<Lote[]>([]);
    const [clientesConSaldoPendiente, setClientesConSaldoPendiente] = useState<ClienteSimple[]>([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Llamar a la nueva función de la API
            const response = await dashboardApi.getDashboardData();
            // Actualizar los estados con los datos recibidos
            setAlertasStockBajo(response.alertas_stock_bajo || []);
            setAlertasLotesBajos(response.alertas_lotes_bajos || []);
            setClientesConSaldoPendiente(response.clientes_con_saldo_pendiente || []);

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError(err instanceof Error ? err.message : "Ocurrió un error al cargar los datos del dashboard");
            // Limpiar estados en caso de error
            setAlertasStockBajo([]);
            setAlertasLotesBajos([]);
            setClientesConSaldoPendiente([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        isLoading,
        error,
        // Exponer los nuevos estados
        alertasStockBajo,
        alertasLotesBajos,
        clientesConSaldoPendiente,
        refresh: fetchData // Función para refrescar manualmente
    };
}