// app/ventas/[id].tsx - Refactorizado
import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useVentaDetail } from '@/hooks/ventas'; // Hook refactorizado
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import ProductDetailsList from '@/components/ProductDetailsList';
import PagosList from '@/components/data/PagosList'; // Componente para mostrar pagos
import { formatCurrency, formatDate, capitalize } from '@/utils/formatters';

export default function VentaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idNumerico = id ? parseInt(id as string) : 0;
  const colorScheme = useColorScheme() ?? 'light';

  // Usar el hook de detalle de venta
  const {
    venta,
    isLoading,
    error,
    refresh,
    handleEdit,
    handleDelete,
  } = useVentaDetail({ id: id || null });

  // Cargar datos de la venta
  useEffect(() => {
    if (idNumerico) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idNumerico]); // No incluir refresh para evitar bucles infinitos

  const handleAddPago = () => {
    // Pasar el ID de la venta al crear pago
    router.push({
      pathname: '/pagos/create',
      params: { ventaId: idNumerico, clienteId: venta?.cliente_id }
    });
  };

  const getEstadoPagoInfo = (estado?: string) => {
    if (!estado) return { color: '#757575', text: 'Desconocido' };
    let color = '#757575';
    switch (estado) {
      case 'pagado': color = Colors.success; break;
      case 'parcial': color = Colors.warning; break;
      case 'pendiente': color = Colors.danger; break;
    }
    return { color, text: capitalize(estado) };
  };

  const tipoPagoText = capitalize(venta?.tipo_pago || '');
  const estadoPagoInfo = getEstadoPagoInfo(venta?.estado_pago);

  return (
    <ScreenContainer
      title={venta ? `Venta #${venta.id}` : 'Detalles de Venta'}
      isLoading={isLoading && !venta} // Mostrar carga solo si aún no hay datos
      error={error}
      loadingMessage="Cargando datos de la venta..."
    >
      <Stack.Screen options={{ 
        title: venta ? `Venta #${venta.id}` : 'Detalles',
        headerShown: true 
      }} />

      {venta && (
        <ScrollView>
          <DetailCard>
            {/* Resumen Principal */}
            <ThemedText type="title" style={styles.totalText}>
              {formatCurrency(venta.total)}
            </ThemedText>
            <ThemedView style={styles.badgeContainer}>
              <ThemedView style={[styles.badge, { backgroundColor: `${estadoPagoInfo.color}20` }]}>
                <ThemedText style={[styles.badgeText, { color: estadoPagoInfo.color }]}>
                  {estadoPagoInfo.text}
                </ThemedText>
              </ThemedView>
              <ThemedView style={[styles.badge, { backgroundColor: `${Colors.light.border}`}]}>
                 <ThemedText style={[styles.badgeText, { color: Colors.light.textSecondary }]}>
                   {tipoPagoText}
                 </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Información General */}
            <DetailSection title="Información General">
              <DetailRow label="Fecha" value={formatDate(venta.fecha)} />
              <DetailRow 
                label="Cliente" 
                value={
                  <TouchableOpacity onPress={() => router.push(`/clientes/${venta.cliente_id}`)}>
                     <ThemedText style={styles.linkText}>{venta.cliente?.nombre || 'N/A'}</ThemedText>
                  </TouchableOpacity>
                }
              />
              <DetailRow label="Almacén" value={venta.almacen?.nombre || 'N/A'} />
              <DetailRow label="Vendedor" value={venta.vendedor?.username || 'N/A'} />
              {venta.consumo_diario_kg && (
                <DetailRow label="Consumo Diario" value={`${venta.consumo_diario_kg} kg`} />
              )}
            </DetailSection>

            {/* Detalles de Productos */} 
            <DetailSection title="Productos Vendidos">
               <ProductDetailsList 
                 details={venta.detalles || []} 
                 isPedido={false} // Indicar que es una venta
                 title="" // Ocultar título interno
               />
            </DetailSection>

            {/* Sección de Pagos */} 
            <DetailSection title="Pagos Recibidos">
              <PagosList 
                pagos={venta?.pagos || []} 
                isLoading={isLoading} // Podría tener su propio loading state si se carga separado
                onAddPago={handleAddPago}
                ventaTotal={parseFloat(venta.total || '0')}
              />
            </DetailSection>

             {/* Botones de Acción */} 
             <ActionButtons
              onSave={handleEdit}
              saveText="Editar Venta"
              // Opcional: Añadir botón para eliminar si se desea
              // onDelete={() => setShowDeleteDialog(true)}
              // showDelete={isAdmin} // Solo si es admin?
            />

          </DetailCard>
        </ScrollView>
      )}
      {/* Opcional: Diálogo de confirmación si se añade borrado 
      <ConfirmationDialog ... /> 
      */} 
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  totalText: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  linkText: {
    color: Colors.primary, 
    textDecorationLine: 'underline',
  },
});