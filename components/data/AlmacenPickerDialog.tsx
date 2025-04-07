// components/inventario/AlmacenPickerDialog.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet
} from 'react-native';
import { Almacen } from '@/models';

interface AlmacenPickerDialogProps {
  visible: boolean;
  almacenes: Almacen[];
  onSelect: (almacen: Almacen) => void;
  onCancel: () => void;
}

const AlmacenPickerDialog: React.FC<AlmacenPickerDialogProps> = ({
  visible,
  almacenes,
  onSelect,
  onCancel
}) => {
  const renderAlmacenItem = ({ item }: { item: Almacen }) => {
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => onSelect(item)}
      >
        <Text style={styles.itemText}>{item.nombre}</Text>
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
            <Text style={styles.headerTitle}>Seleccionar Almacén</Text>
          </View>
          
          <FlatList
            data={almacenes}
            renderItem={renderAlmacenItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
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
  },
  modalContainer: {
    width: '80%',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemText: {
    fontSize: 16,
    color: '#333333',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
});

export default AlmacenPickerDialog;