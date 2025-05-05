import React, { memo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import DateField from '@/components/form/DateField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ImageUploader, FileInfo } from '@/components/form/ImageUploader';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DepositoPayload, AlmacenSimple } from '@/models';
import { FormStyles } from '@/styles/Theme';

interface DepositoFormProps {
  formData: DepositoPayload & { id?: number };
  errors: Record<string, string>;
  isSubmitting: boolean;
  isEditing: boolean;
  almacenes: AlmacenSimple[];
  isAdmin: boolean;
  onChange: (field: keyof DepositoPayload, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  // Props para ImageUploader (solo valor y callbacks)
  comprobante: FileInfo | null;
  setComprobante: (file: FileInfo | null) => void;
  existingComprobanteUrl?: string | null;
  onRemoveExistingComprobante?: () => void;
  onViewExistingComprobante?: () => void;
}

const DepositoForm = ({
  formData,
  errors,
  isSubmitting,
  isEditing,
  almacenes,
  isAdmin,
  onChange,
  onSubmit,
  onCancel,
  comprobante,
  setComprobante,
  existingComprobanteUrl,
  onRemoveExistingComprobante,
  onViewExistingComprobante,
}: DepositoFormProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const almacenOptions = almacenes.map(a => ({ label: a.nombre, value: a.id.toString() }));

  return (
    <ThemedView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <ThemedText type="title" style={styles.heading}>
          {isEditing ? 'Editar Depósito' : 'Registrar Depósito'}
        </ThemedText>

        <ThemedView style={FormStyles.container}>
          <ThemedView style={FormStyles.rowContainer}>
            <ThemedView style={FormStyles.halfWidth}>
              <DateField
                label="Fecha Depósito *"
                value={formData.fecha_deposito}
                onChange={(value) => onChange('fecha_deposito', value)}
                error={errors.fecha_deposito}
                required
              />
            </ThemedView>
            <ThemedView style={FormStyles.halfWidth}>
              <FormField
                label="Monto Depositado *"
                value={formData.monto_depositado}
                onChangeText={(value) => onChange('monto_depositado', value)}
                error={errors.monto_depositado}
                keyboardType="numeric"
                placeholder="0.00"
                required
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={FormStyles.rowContainer}>
            {isAdmin && (
              <ThemedView style={FormStyles.halfWidth}>
                <FormSelect
                  label="Almacén *"
                  value={formData.almacen_id?.toString() || ''}
                  options={almacenOptions}
                  onChange={(value) => onChange('almacen_id', value ? parseInt(value) : null)}
                  error={errors.almacen_id}
                  required
                  disabled={!isAdmin}
                />
              </ThemedView>
            )}
            <ThemedView style={isAdmin ? FormStyles.halfWidth : { flex: 1 }}>
              <FormField
                label="Referencia Bancaria"
                value={formData.referencia_bancaria || ''}
                onChangeText={(value) => onChange('referencia_bancaria', value)}
                error={errors.referencia_bancaria}
                placeholder="Ej: #123456"
              />
            </ThemedView>
          </ThemedView>

          <FormField
            label="Notas"
            value={formData.notas || ''}
            onChangeText={(value) => onChange('notas', value)}
            error={errors.notas}
            multiline
            placeholder="Añadir notas adicionales aquí..."
          />

          <ImageUploader
            label="Comprobante de Depósito"
            value={comprobante}
            onChange={setComprobante}
            existingFile={existingComprobanteUrl}
            onExistingFileRemove={onRemoveExistingComprobante}
            onExistingFileView={onViewExistingComprobante}
            allowedTypes={['image', 'document']}
            maxSize={5 * 1024 * 1024}
            error={errors.comprobante}
          />

          <ActionButtons
            onSave={onSubmit}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            saveText={isEditing ? "Guardar Cambios" : "Registrar Depósito"}
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

export default memo(DepositoForm); 