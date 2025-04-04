// app/ventas/[id].tsx - Versión refactorizada
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useVentas } from '@/hooks/crud/useVentas';
import { Badge } from '@/components/ui/Badge';
import ProductDetailsList from '@/components/ProductDetailsList';

export default function VentaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Usar el hook de ventas
  const {
    venta,
    pagos,
    isLoading,
    error,
    loadVenta,
    confirmDelete,
    loadPagos
  } = useVentas();
  
  // Control para cargar la venta una sola vez
  const ventaCargada = useRef(false);
  
  // Cargar datos de la venta al iniciar
  useEffect(() => {
    const cargarVenta = async () => {
      if (!id || ventaCargada.current) return;
      
      try {
        const ventaData = await loadVenta(parseInt(id));
        if (ventaData) {
          ventaCargada.current = true;
          
          // Cargar pagos relacionados si es necesario
          if (ventaData.pagos && ventaData.pagos.length > 0) {
            await loadPagos(parseInt(id));
          }
          
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('Error al cargar venta:', err);
      }
    };

    cargarVenta();
  }, [id, loadVenta, loadPagos]);

  // Manejar la edición de la venta
  const handleEdit = () => {
    if (id) {
    router.push(`/ventas/edit/${id}`);
    }
  };

  // Manejar la eliminación de la venta
  const handleDelete = () => {
    if (id) {
      confirmDelete(parseInt(id));
    }
  };
  
  // Manejar la visualización de pagos relacionados
  const handleVerPagos = () => {
    if (id) {
      router.push(`/pagos?ventaId=${id}`);
    }
  };
  
  // Manejar la creación de un nuevo pago
  const handleCrearPago = () => {
    if (id) {
      router.push(`/pagos/create?ventaId=${id}`);
    }
  };
  
  // Formatear fecha para mostrar
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Obtener color del estado de pago
  const getEstadoColor = (estado?: string) => {
    if (!estado) return '#757575'; // Gris por defecto
    
    switch (estado) {
      case 'pagado': return '#4CAF50'; // Verde
      case 'parcial': return '#FFC107'; // Amarillo
      case 'pendiente': return '#F44336'; // Rojo
      default: return '#757575'; // Gris
    }
  };
  
  // Obtener color del tipo de pago
  const getTipoPagoColor = (tipo?: string) => {
    return tipo === 'contado' ? '#4CAF50' : '#2196F3'; // Verde para contado, azul para crédito
  };
  
  // Formatear estado de pago para mostrar con primera letra mayúscula
  const formatEstado = (estado?: string) => {
    if (!estado) return 'Desconocido';
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };
  
  // Calcular total de pagos
  const calcularTotalPagos = () => {
    if (!pagos || pagos.length === 0) return 0;
    
    return pagos.reduce((acc, pago) => {
      return acc + parseFloat(pago.monto);
    }, 0);
  };
  
  // Formatear cantidades monetarias
  const formatMoney = (amount?: string | number) => {
    if (amount === undefined || amount === null) return '$0.00';
    
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${value.toFixed(2)}`;
  };
  
  // Mostrar pantalla de carga
  if (isLoading || !isInitialized) {
    return (
      <>
        <Stack.Screen options={{ 
          title: `Venta #${id}`,
          headerShown: true 
        }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText style={styles.loadingText}>Cargando detalles de la venta...</ThemedText>
        </ThemedView>
      </>
    );
    }
  
  // Mostrar pantalla de error
  if (error || !venta) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Error',
          headerShown: true 
        }} />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={60} color="#F44336" />
          <ThemedText style={styles.errorText}>
            {error || 'No se pudo cargar la venta'}
          </ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Volver</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </>
    );
  }
  
  // Calcular saldo pendiente y estado de pago
  const totalVenta = parseFloat(venta.total || '0');
  const totalPagado = calcularTotalPagos();
  const saldoPendiente = totalVenta - totalPagado;

  return (
    <>
      <Stack.Screen options={{ 
        title: `Venta #${id}`,
        headerShown: true 
      }} />
      
      <ScrollView style={styles.container}>
        <ThemedView style={styles.card}>
          <ThemedView style={styles.headerRow}>
            <ThemedText type="title">Detalles de Venta #{id}</ThemedText>
          
            <ThemedView style={styles.estadoBadges}>
              <Badge 
                text={formatEstado(venta.estado_pago)}
                color={getEstadoColor(venta.estado_pago)}
              />
              
              <Badge 
                text={venta.tipo_pago === 'contado' ? 'Contado' : 'Crédito'}
                color={getTipoPagoColor(venta.tipo_pago)}
              />
            </ThemedView>
          </ThemedView>
          
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Información General</ThemedText>
            
            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.label}>Fecha:</ThemedText>
              <ThemedText>{formatDate(venta.fecha)}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.label}>Cliente:</ThemedText>
              <ThemedText>{venta.cliente?.nombre || 'Sin cliente'}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.label}>Almacén:</ThemedText>
              <ThemedText>{venta.almacen?.nombre || 'Sin almacén'}</ThemedText>
            </ThemedView>
            
            {venta.consumo_diario_kg && (
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.label}>Consumo Diario:</ThemedText>
                <ThemedText>{venta.consumo_diario_kg} kg</ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Resumen Financiero</ThemedText>
            
            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.label}>Total Venta:</ThemedText>
              <ThemedText style={styles.montoTotal}>{formatMoney(venta.total)}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.label}>Total Pagado:</ThemedText>
              <ThemedText style={styles.montoPagado}>{formatMoney(totalPagado)}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.label}>Saldo Pendiente:</ThemedText>
              <ThemedText style={[
                styles.montoPendiente,
                { color: saldoPendiente <= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {formatMoney(saldoPendiente)}
                </ThemedText>
              </ThemedView>
          </ThemedView>
          
          {/* Productos/Detalles de la venta */}
          <ProductDetailsList 
            details={venta.detalles || []} 
            title="Productos en esta venta"
          />
          
          {/* Acciones relacionadas a pagos */}
          {venta.tipo_pago === 'credito' && saldoPendiente > 0 && (
            <ThemedView style={styles.actionSection}>
              <ThemedText type="subtitle">Acciones de Pago</ThemedText>
              
              <ThemedView style={styles.actionButtons}>
            <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleVerPagos}
            >
                  <IconSymbol name="list.bullet" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>Ver Pagos</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={handleCrearPago}
            >
                  <IconSymbol name="plus.circle" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>Registrar Pago</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      )}
      
          {/* Acciones generales */}
          <ThemedView style={styles.actionSection}>
            <ThemedText type="subtitle">Acciones</ThemedText>
            
            <ThemedView style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                onPress={handleEdit}
              >
                <IconSymbol name="square.and.pencil" size={20} color="#FFFFFF" />
                <ThemedText style={styles.actionButtonText}>Editar</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                onPress={handleDelete}
              >
                <IconSymbol name="trash" size={20} color="#FFFFFF" />
                <ThemedText style={styles.actionButtonText}>Eliminar</ThemedText>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  estadoBadges: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  section: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  label: {
    fontWeight: '600',
  },
  montoTotal: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  montoPagado: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4CAF50',
  },
  montoPendiente: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionSection: {
    marginTop: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#0a7ea4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});