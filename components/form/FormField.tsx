// components/form/FormField.tsx
import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FormStyles } from '@/styles/Theme';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder = '',
  error,
  required = false,
  disabled = false,
  multiline = false,
  keyboardType = 'default',
  secureTextEntry = false,
}: FormFieldProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <View style={FormStyles.formGroup}>
      <ThemedText style={FormStyles.label}>
        {label}{required ? ' *' : ''}
      </ThemedText>
      <TextInput
        style={[
          FormStyles.input,
          multiline && FormStyles.textArea,
          error && FormStyles.inputError,
          disabled && FormStyles.disabledContainer,
          { color: Colors[colorScheme].text }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9BA1A6"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
      />
      {error && (
        <ThemedText style={FormStyles.errorText}>{error}</ThemedText>
      )}
    </View>
  );
}