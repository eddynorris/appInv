// app/inventario/[id].tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useInventario } from '@/hooks/crud/useInventario';
import { Inventario } from '@/models';

export default function InventarioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [inventario, setInventario] = useState<Inventario | null>(null);
  
  // Hook de inventario
  const { 
    isLoading, 
    error, 
    getItem,
    deleteInventario
  } = useInventario();
  
  // Cargar datos del inventario
  useEffect(() => {
    const loadInventario = async () => {
      if (!id) return;
      
      try {
        const data = await getItem(parseInt(id));
        if (data) {
          setInventario(data);
        }
      } catch (err) {
        console.error('Error al cargar inventario:', err);
      }
    };
    
    loadInventario();
  }, [id, getItem]);
  
  // Ver historial de movimientos
  const verHistorial = () => {
    // Navegar a una pantalla de historial pasando el ID de la presentación
    router.push({
      pathname: '/movimientos', 
      params: { 
        presentacion_id: inventario?.presentacion_id,
        almacen_id: inventario?.almacen_id
      }
    });
  };
  
  // Navegar a pantalla de ajuste (aumentar)
  const handleAumentar = () => {
    router.push({
      pathname: '/inventario/ajustar',
      params: { id, accion: 'aumentar' }
    });
  };
  
  // Navegar a pantalla de ajuste (disminuir)
  const handleDisminuir = () => {
    router.push({
      pathname: '/inventario/ajustar',
      params: { id, accion: 'disminuir' }
    });
  };
  
  // Eliminar registro de inventario
  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteInventario(parseInt(id));
      router.replace('/inventario');
    } catch (error) {
      console.error('Error al eliminar inventario:', error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <ScreenContainer
      title="Detalle de Inventario"
      isLoading={isLoading}
      error={error}
      loadingMessage="Cargando datos de inventario..."
    >
      {inventario && (
        <DetailCard>
          {/* Encabezado con información del producto */}
          <ThemedText type="title">
            {inventario.presentacion?.nombre || 'Presentación'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {inventario.presentacion?.producto?.nombre || 'Producto'}
          </ThemedText>
          
          {/* Badge de estado de stock */}
          <ThemedView style={[
            styles.stockBadge,
            { 
              backgroundColor: inventario.cantidad <= inventario.stock_minimo 
                ? 'rgba(244, 67, 54, 0.1)' 
                : 'rgba(76, 175, 80, 0.1)'
            }
          ]}>
            <ThemedText style={[
              styles.stockText,
              { 
                color: inventario.cantidad <= inventario.stock_minimo 
                  ? '#F44336' 
                  : '#4CAF50'
              }
            ]}>
              {inventario.cantidad <= inventario.stock_minimo
                ? 'Stock bajo mínimo'
                : 'Stock disponible'}
            </ThemedText>
          </ThemedView>
          
          {/* Información de stock */}
          <ThemedView style={styles.stockCard}>
            <ThemedView style={styles.stockItem}>
              <ThemedText style={styles.stockLabel}>Disponible</ThemedText>
              <ThemedText style={styles.stockValue}>{inventario.cantidad}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.divider} />
            <ThemedView style={styles.stockItem}>
              <ThemedText style={styles.stockLabel}>Mínimo</ThemedText>
              <ThemedText style={styles.stockValue}>{inventario.stock_minimo}</ThemedText>
            </ThemedView>
          </ThemedView>
          
          {/* Información general */}
          <DetailSection title="Información General">
            <DetailRow 
              label="Almacén" 
              value={inventario.almacen?.nombre || 'No especificado'} 
            />
            {inventario.lote_id && (
              <DetailRow 
                label="Lote ID" 
                value={inventario.lote_id.toString()} 
              />
            )}
            <DetailRow 
              label="Última actualización" 
              value={new Date(inventario.ultima_actualizacion).toLocaleString()} 
            />
          </DetailSection>
          
          {/* Botones de acción rápida */}
          <ThemedView style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={handleAumentar}
            >
              <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionText}>Aumentar</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#F44336' }]}
              onPress={handleDisminuir}
            >
              <IconSymbol name="minus.circle.fill" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionText}>Disminuir</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
              onPress={verHistorial}
            >
              <IconSymbol name="clock.fill" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionText}>Historial</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          {/* Botones principales */}
          <ActionButtons
            onSave={() => router.push(`/inventario/edit/${id}`)}
            saveText="Editar"
            onDelete={() => setShowDeleteDialog(true)}
            showDelete={true}
          />
        </DetailCard>
      )}
      
      {/* Diálogo de confirmación para eliminar */}
      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Eliminar Registro de Inventario"
        message="¿Está seguro que desea eliminar este registro de inventario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 16,
  },
  stockBadge: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  stockText: {
    fontWeight: 'bold',
  },
  stockCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginVertical: 16,
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  stockLabel: {
    fontSize: 14,
    color: '#757575',
  },
  stockValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  divider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});