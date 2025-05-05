import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DetailCard, DetailSection, DetailRow } from '@/components/data/DetailCard';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { depositoApi } from '@/services/api'; // Usar API directamente para detalle
import { DepositoBancario } from '@/models';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useAuth } from '@/context/AuthContext';

// Helper para abrir URL de comprobante (asumiendo que es pública o pre-firmada)
const viewComprobante = (url?: string | null) => {
    if (!url) {
      Alert.alert("Info", "Este depósito no tiene comprobante asociado.");
      return;
    }
    Linking.openURL(url).catch(err => {
      console.error('Error al abrir el comprobante:', err);
      Alert.alert("Error", "No se pudo abrir el enlace.");
    });
};

export default function DepositoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  const [deposito, setDeposito] = useState<DepositoBancario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchDeposito = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await depositoApi.getDeposito(parseInt(id));
      setDeposito(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el depósito');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDeposito();
  }, [fetchDeposito]);

  const handleEdit = () => {
    router.push(`/depositos/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    setShowDeleteDialog(false); // Cerrar diálogo
    setIsLoading(true); // Mostrar indicador durante eliminación
    try {
      await depositoApi.deleteDeposito(parseInt(id));
      Alert.alert('Éxito', 'Depósito eliminado correctamente');
      router.replace('/depositos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el depósito');
      Alert.alert('Error', error || 'No se pudo eliminar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer
      title={deposito ? `Depósito #${deposito.id}` : 'Detalle Depósito'}
      isLoading={isLoading && !deposito}
      error={error}
    >
      <Stack.Screen options={{ title: 'Detalle Depósito', headerShown: true }} />
      {deposito && (
        <DetailCard>
          <ThemedText type="title" style={styles.montoText}>
            {formatCurrency(deposito.monto_depositado)}
          </ThemedText>

          <DetailSection title="Información General">
            <DetailRow label="Fecha" value={formatDate(deposito.fecha_deposito)} />
            <DetailRow label="Almacén" value={deposito.almacen?.nombre || 'N/A'} />
            <DetailRow label="Usuario" value={deposito.usuario?.username || 'N/A'} />
            {deposito.referencia_bancaria && (
              <DetailRow label="Referencia" value={deposito.referencia_bancaria} />
            )}
             {deposito.notas && (
              <DetailRow label="Notas" value={deposito.notas} />
            )}
          </DetailSection>

          {deposito.url_comprobante_deposito && (
            <DetailSection title="Comprobante">
                 <TouchableOpacity
                   style={styles.comprobanteButton}
                   onPress={() => viewComprobante(deposito.url_comprobante_deposito)}
                 >
                   <IconSymbol name="doc.text.image.fill" size={20} color="#0a7ea4" />
                   <ThemedText style={styles.comprobanteText}>Ver Comprobante</ThemedText>
                 </TouchableOpacity>
            </DetailSection>
          )}

          <ActionButtons
            onSave={handleEdit}
            saveText="Editar"
            onDelete={() => setShowDeleteDialog(true)}
            showDelete={isAdmin}
          />
        </DetailCard>
      )}

      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Eliminar Depósito"
        message="¿Está seguro que desea eliminar este depósito?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  montoText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  comprobanteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
  },
  comprobanteText: {
      color: '#0a7ea4',
      textDecorationLine: 'underline',
      fontSize: 16,
  }
}); 