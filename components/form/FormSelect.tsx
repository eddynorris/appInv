// components/form/FormSelect.tsx
import React from 'react';
import { View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ThemedText } from '@/components/ThemedText';
import { FormStyles } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/styles/Theme';

interface Option {
  label: string;
  value: string;
}

interface FormSelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export function FormSelect({
  label,
  value,
  options,
  onChange,
  error,
  required = false,
  disabled = false,
  helperText,
}: FormSelectProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <View style={FormStyles.formGroup}>
      <ThemedText style={FormStyles.label}>
        {label}{required ? ' *' : ''}
      </ThemedText>
      <View style={[
        FormStyles.pickerContainer,
        { backgroundColor: isDark ? Colors.backgroundDark : Colors.lightGray1 },
        disabled && FormStyles.disabledContainer,
        error && FormStyles.inputError
      ]}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          enabled={!disabled}
          style={[
            FormStyles.picker,
            { color: isDark ? Colors.white : Colors.textDark }
          ]}
        >
          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
              color={isDark ? Colors.white : Colors.black}
            />
          ))}
        </Picker>
      </View>
      {error && (
        <ThemedText style={FormStyles.errorText}>{error}</ThemedText>
      )}
      {helperText && !error && (
        <ThemedText style={FormStyles.infoText}>{helperText}</ThemedText>
      )}
    </View>
  );
}