// components/inventario/LotePickerDialog.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Lote } from '@/models';

interface LotePickerDialogProps {
  visible: boolean;
  lotes: Lote[];
  selectedLote: string | null;
  onSelect: (lote: Lote) => void;
  onCancel: () => void;
  loading?: boolean;
}

const LotePickerDialog: React.FC<LotePickerDialogProps> = ({
  visible,
  lotes,
  selectedLote,
  onSelect,
  onCancel,
  loading = false
}) => {
  if (loading) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Cargando lotes...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const renderLoteItem = ({ item }: { item: Lote }) => {
    const isSelected = selectedLote === item.id.toString();
    const fechaIngreso = new Date(item.fecha_ingreso).toLocaleDateString();

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isSelected && styles.selectedItem
        ]}
        onPress={() => onSelect(item)}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>Lote #{item.id}</Text>
          <Text style={styles.itemSubtitle}>
            Fecha: {fechaIngreso} • {item.cantidad_disponible_kg}kg Disponibles
          </Text>
          {item.proveedor && (
            <Text style={styles.itemSubtitle}>
              Proveedor: {item.proveedor.nombre}
            </Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.checkIndicator}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.headerTitle}>Seleccionar Lote</Text>
          </View>
          
          {lotes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay lotes disponibles para este producto</Text>
            </View>
          ) : (
            <FlatList
              data={lotes}
              renderItem={renderLoteItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
            />
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  listContent: {
    paddingVertical: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#E8F5E9',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  checkIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    padding: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default LotePickerDialog;