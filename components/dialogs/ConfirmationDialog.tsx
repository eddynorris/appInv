// components/dialogs/ConfirmationDialog.tsx
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
 import { Colors } from '@/styles/Theme';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  icon?: string;
  iconColor?: string;
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmButtonColor = '#F44336', // Red by default for delete confirmations
  cancelButtonColor = '#E0E0E0',
  icon = 'exclamationmark.triangle',
  iconColor = '#FFC107'
}: ConfirmationDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <ThemedView style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            {title}
          </ThemedText>
          
          <IconSymbol name={icon} size={48} color={iconColor} style={styles.warningIcon} />
          
          <ThemedText style={styles.modalText}>{message}</ThemedText>
          
          <ThemedView style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: cancelButtonColor }]}
              onPress={onCancel}
            >
              <ThemedText style={[
                styles.buttonText,
                { color: cancelButtonColor === '#E0E0E0' ? '#424242' : '#FFFFFF' }
              ]}>
                {cancelText}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: confirmButtonColor }]}
              onPress={onConfirm}
            >
              <ThemedText style={styles.buttonText}>{confirmText}</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});