import React, { memo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { UsuarioPayload, AlmacenSimple } from '@/models';
import { FormStyles } from '@/styles/Theme';

interface UsuarioFormProps {
  formData: UsuarioPayload & { id?: number }; // Incluir id opcional
  errors: Record<string, string>;
  isSubmitting: boolean;
  isEditing: boolean;
  almacenes: AlmacenSimple[]; // Para el selector
  roles: { label: string; value: string }[]; // Para el selector
  onChange: (field: keyof (UsuarioPayload & { id?: number }), value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const UsuarioForm = ({
  formData,
  errors,
  isSubmitting,
  isEditing,
  almacenes,
  roles,
  onChange,
  onSubmit,
  onCancel,
}: UsuarioFormProps) => {

  const almacenOptions = almacenes.map(a => ({ label: a.nombre, value: a.id.toString() }));

  return (
    <ThemedView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <ThemedText type="title" style={styles.heading}>
          {isEditing ? 'Editar Usuario' : 'Crear Usuario'}
        </ThemedText>

        <ThemedView style={FormStyles.container}>
          <FormField
            label="Nombre de Usuario *"
            value={formData.username}
            onChangeText={(value) => onChange('username', value)}
            error={errors.username}
            required
          />

          {/* Campo de contraseña solo visible y requerido en creación */}
          {!isEditing && (
            <FormField
              label="Contraseña *"
              value={formData.password || ''}
              onChangeText={(value) => onChange('password', value)}
              error={errors.password}
              secureTextEntry
              required
              placeholder="Ingrese una contraseña segura"
            />
          )}

          {isEditing && (
            <ThemedText style={FormStyles.infoText}>
              Para cambiar la contraseña, use la opción dedicada (funcionalidad pendiente).
            </ThemedText>
          )}

          <FormSelect
            label="Rol *"
            value={formData.rol}
            options={roles}
            onChange={(value) => onChange('rol', value)}
            error={errors.rol}
            required
          />

          {/* Selector de almacén siempre disponible */}
          <FormSelect
            label="Almacén Asignado"
            value={formData.almacen_id?.toString() || ''}
            options={[{ label: 'Ninguno', value: '' }, ...almacenOptions]}
            onChange={(value) => onChange('almacen_id', value ? parseInt(value) : null)}
            error={errors.almacen_id}
          />

          <ActionButtons
            onSave={onSubmit}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            saveText={isEditing ? "Guardar Cambios" : "Crear Usuario"}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heading: {
    marginBottom: 16,
  },
});

export default memo(UsuarioForm); 