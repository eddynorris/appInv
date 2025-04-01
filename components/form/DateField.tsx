// components/form/DateField.tsx
import React, { useState, memo } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FormStyles } from '@/styles/Theme';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const DateField = ({ 
  label, 
  value, 
  onChange,
  error,
  required = false,
  disabled = false
}: DateFieldProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Convertir string en fecha
  const getDateValue = () => {
    if (!value) return new Date();
    return new Date(value);
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Seleccionar fecha';
    
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Manejar cambio de fecha
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      onChange(formattedDate);
    }
  };

  return (
    <View style={FormStyles.formGroup}>
      <ThemedText style={FormStyles.label}>
        {label}{required ? ' *' : ''}
      </ThemedText>
      
      <TouchableOpacity 
        style={[
          FormStyles.input,
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
          disabled && FormStyles.disabledContainer,
          error && FormStyles.inputError
        ]}
        onPress={() => !disabled && setShowDatePicker(true)}
        disabled={disabled}
      >
        <ThemedText style={{ color: isDark ? Colors.white : Colors.textDark }}>
          {formatDate(value)}
        </ThemedText>
        <IconSymbol name="calendar" size={20} color={isDark ? Colors.white : "#666666"} />
      </TouchableOpacity>
      
      {error && (
        <ThemedText style={FormStyles.errorText}>{error}</ThemedText>
      )}
      
      {showDatePicker && (
        <DateTimePicker
          value={getDateValue()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date(2020, 0, 1)}
          maximumDate={new Date(2030, 11, 31)}
          textColor={isDark ? Colors.white : Colors.textDark}
        />
      )}
    </View>
  );
};

export default memo(DateField);