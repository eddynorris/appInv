// components/buttons/ActionButtons.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewProps, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

interface ActionButtonsProps extends ViewProps {
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  saveText?: string;
  cancelText?: string;
  deleteText?: string;
  isSubmitting?: boolean;
  saveDisabled?: boolean;
  showDelete?: boolean;
}

export function ActionButtons({
  onSave,
  onCancel,
  onDelete,
  saveText = 'Guardar',
  cancelText = 'Cancelar',
  deleteText = 'Eliminar',
  isSubmitting = false,
  saveDisabled = false,
  showDelete = false,
  style,
  ...rest
}: ActionButtonsProps) {
  return (
    <ThemedView style={[styles.buttonContainer, style]} {...rest}>
      {onCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <ThemedText style={styles.cancelButtonText}>{cancelText}</ThemedText>
        </TouchableOpacity>
      )}
      
      {showDelete && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          disabled={isSubmitting}
        >
          <ThemedText style={styles.actionButtonText}>{deleteText}</ThemedText>
        </TouchableOpacity>
      )}
      
      {onSave && (
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (isSubmitting || saveDisabled) && styles.disabledButton
          ]}
          onPress={onSave}
          disabled={isSubmitting || saveDisabled}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <ThemedText style={styles.actionButtonText}>{saveText}</ThemedText>
          )}
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});