// components/ClienteFormModal.tsx
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { Cliente } from '@/models';
import { useColorScheme } from '@/hooks/useColorScheme';

// Importar el formulario existente o sus componentes clave
import { useForm } from '@/hooks/useForm';
import { clienteApi } from '@/services';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';

interface ClienteFormModalProps {
  visible: boolean;
  onClose: () => void;
  onClienteCreated: (cliente: Cliente) => void;
}

export function ClienteFormModal({ visible, onClose, onClienteCreated }: ClienteFormModalProps) {
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  
  // Usar el mismo hook y lógica que en app/clientes/create.tsx
  const { 
    formData, 
    errors, 
    isSubmitting, 
    handleChange, 
    handleSubmit 
  } = useForm({
    nombre: '',
    telefono: '',
    direccion: '',
    ciudad: '', // Agregar ciudad al estado inicial del formulario
    // Otros campos si son necesarios
  });

  // Las mismas reglas de validación que en app/clientes/create.tsx
  const validationRules = {
    nombre: (value: string) => !value.trim() ? 'El nombre es obligatorio' : null,
    telefono: (value: string) => !value.trim() ? 'El teléfono es obligatorio' : null, // Validación restaurada
    direccion: (value: string) => !value.trim() ? 'La dirección es obligatoria' : null,
    // Ciudad es opcional, no necesita validación
  };

  // Modificar ligeramente la función para manejar el caso del modal
  // Dentro de ClienteFormModal.tsx, en la función que maneja el submit:

  const submitForm = async (data: typeof formData) => {
    try {
      const response = await clienteApi.createCliente(data);
      
      if (response) {
        // Notificar al componente padre pasando el cliente creado
        onClienteCreated(response);
        
        // Cerrar el modal
        onClose();
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      return false;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalOverlay}>
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText type="subtitle">Nuevo Cliente</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={24} color={isDark ? '#FFFFFF' : '#777777'} />
            </TouchableOpacity>
          </ThemedView>
          
          <View style={styles.formContainer}>
            {/* Mismos campos de formulario que en app/clientes/create.tsx */}
            <FormField
              label="Nombre"
              value={formData.nombre}
              onChangeText={(value) => handleChange('nombre', value)}
              placeholder="Ingresa el nombre del cliente"
              error={errors.nombre}
              required
            />

            <FormField
              label="Teléfono"
              value={formData.telefono}
              onChangeText={(value) => handleChange('telefono', value)}
              placeholder="Ingresa el teléfono del cliente"
              error={errors.telefono}
              keyboardType="phone-pad"
              required
            />

            <FormField
              label="Dirección"
              value={formData.direccion}
              onChangeText={(value) => handleChange('direccion', value)}
              placeholder="Ingresa la dirección del cliente"
              error={errors.direccion}
              multiline
              required
            />

            <FormField
              label="Ciudad"
              value={formData.ciudad}
              onChangeText={(value) => handleChange('ciudad', value)}
              placeholder="Ingresa la ciudad"
              error={errors.ciudad}
            />
          </View>
          
          <ThemedView style={styles.modalFooter}>
            <ActionButtons
              onSave={() => handleSubmit(submitForm, validationRules)}
              onCancel={onClose}
              isSubmitting={isSubmitting}
              saveText="Crear Cliente"
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
});