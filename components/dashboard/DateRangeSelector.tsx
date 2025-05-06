import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateRangeSelectorProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
}

export function DateRangeSelector({ startDate, endDate, onDateChange }: DateRangeSelectorProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.label}>Periodo:</ThemedText>
      
      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
        >
          <IconSymbol name="calendar" size={16} color="#0a7ea4" />
          <ThemedText style={styles.dateText}>{formatDate(startDate)}</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.separator}>-</ThemedText>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndPicker(true)}
        >
          <IconSymbol name="calendar" size={16} color="#0a7ea4" />
          <ThemedText style={styles.dateText}>{formatDate(endDate)}</ThemedText>
        </TouchableOpacity>
      </View>
      
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate && selectedDate <= endDate) {
              onDateChange(selectedDate, endDate);
            }
          }}
        />
      )}
      
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          minimumDate={startDate}
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate && selectedDate >= startDate) {
              onDateChange(startDate, selectedDate);
            }
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    marginLeft: 6,
    fontSize: 13,
  },
  separator: {
    marginHorizontal: 8,
  },
});
