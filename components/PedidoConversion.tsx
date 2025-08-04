import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { pedidoApi } from '@/services';
import { useColorScheme } from '@/hooks/useColorScheme';

interface PedidoConversionProps {
  pedidoId: number;
  isDisabled?: boolean;
}

export default function PedidoConversion({ pedidoId, isDisabled = false }: PedidoConversionProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  const handleConvertButtonPress = () => {
    if (isDisabled) {
      Alert.alert(
        "No se puede convertir",
        "Este pedido no puede ser convertido a venta porque está cancelado o ya fue entregado."
      );
      return;
    }
    setIsModalVisible(true);
  };

  const handleConfirmConversion = async () => {
    try {
      setIsProcessing(true);
      const result = await pedidoApi.convertirAVenta(pedidoId);
      
      if (result && result.venta) {
        setIsModalVisible(false);
        Alert.alert(
          "Éxito",
          "Pedido convertido a venta exitosamente",
          [
            {
              text: "Ver Venta",
              onPress: () => router.push(`/ventas/${result.venta.id}`)
            },
            {
              text: "OK",
              onPress: () => router.replace('/pedidos')
            }
          ]
        );
      } else {
        throw new Error("No se pudo completar la conversión");
      }
    } catch (error) {
      console.error("Error al convertir:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo convertir el pedido a venta"
      );
      setIsModalVisible(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={[
          styles.convertButton,
          isDisabled && styles.disabledButton
        ]}
        onPress={handleConvertButtonPress}
        disabled={isDisabled || isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <IconSymbol name="arrow.right.circle" size={16} color="white" />
            <ThemedText style={styles.convertButtonText}>Convertir a Venta</ThemedText>
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Convertir a Venta
            </ThemedText>
            
            <IconSymbol name="exclamationmark.triangle" size={48} color="#FFC107" style={styles.warningIcon} />
            
            <ThemedText style={styles.modalText}>
              Esta acción convertirá la proyección en una venta real. Esta operación:
            </ThemedText>
            
            <ThemedView style={styles.infoList}>
              <ThemedView style={styles.infoItem}>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
                <ThemedText style={styles.infoItemText}>
                  Creará una nueva venta basada en esta proyección
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoItem}>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
                <ThemedText style={styles.infoItemText}>
                  Afectará al inventario descontando los productos
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoItem}>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
                <ThemedText style={styles.infoItemText}>
                  Marcará esta proyección como "Entregada"
                </ThemedText>
              </ThemedView>
            </ThemedView>
            
            <ThemedText style={styles.confirmText}>
              ¿Está seguro que desea continuar?
            </ThemedText>
            
            <ThemedView style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
                disabled={isProcessing}
              >
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleConfirmConversion}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <ThemedText style={styles.confirmButtonText}>Convertir</ThemedText>
                )}
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  convertButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
    opacity: 0.7,
  },
  convertButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  warningIcon: {
    marginBottom: 16,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  infoList: {
    width: '100%',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoItemText: {
    flex: 1,
  },
  confirmText: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: 'bold',
    color: '#424242',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});