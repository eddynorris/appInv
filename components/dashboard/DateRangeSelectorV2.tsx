import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type DateRange = 'hoy' | 'semana' | 'mes' | 'personalizado';

interface DateRangeSelectorV2Props {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
}

export function DateRangeSelectorV2({ startDate, endDate, onDateChange }: DateRangeSelectorV2Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>('personalizado');

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Set date range based on selection
  const setDateRange = (range: DateRange) => {
    const today = new Date();
    let newStartDate = new Date();
    let newEndDate = new Date();

    switch (range) {
      case 'hoy':
        // Today
        newStartDate = new Date(today);
        newEndDate = new Date(today);
        break;
      case 'semana':
        // This week (Monday to Sunday)
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        newStartDate = new Date(today.setDate(diff));
        newEndDate = new Date(newStartDate);
        newEndDate.setDate(newStartDate.getDate() + 6);
        break;
      case 'mes':
        // This month
        newStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        newEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      // 'personalizado' will use the existing dates
    }

    if (range !== 'personalizado') {
      onDateChange(newStartDate, newEndDate);
    }
    setSelectedRange(range);
  };

  // Check if current dates match any predefined range
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    const startStr = startDate.toDateString();
    const endStr = endDate.toDateString();

    if (startStr === todayStr && endStr === todayStr) {
      setSelectedRange('hoy');
    } else {
      // Check if it's this week (Monday to Sunday)
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(today.setDate(diff));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      if (startDate >= weekStart && endDate <= weekEnd) {
        setSelectedRange('semana');
      } else {
        // Check if it's this month
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        if (startDate >= firstDayOfMonth && endDate <= lastDayOfMonth) {
          setSelectedRange('mes');
        } else {
          setSelectedRange('personalizado');
        }
      }
    }
  }, [startDate, endDate]);

  const RangeButton = ({ 
    label, 
    value, 
    icon 
  }: { 
    label: string; 
    value: DateRange; 
    icon: string 
  }) => (
    <TouchableOpacity
      style={[
        styles.rangeButton,
        selectedRange === value && styles.rangeButtonSelected,
        { borderColor: Colors[colorScheme].tint }
      ]}
      onPress={() => setDateRange(value)}
    >
      <IconSymbol 
        name={icon} 
        size={16} 
        color={selectedRange === value ? 'white' : Colors[colorScheme].tint} 
      />
      <ThemedText 
        style={[
          styles.rangeButtonText,
          selectedRange === value && styles.rangeButtonTextSelected
        ]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.rangeButtonsContainer}>
        <RangeButton label="Hoy" value="hoy" icon="calendar" />
        <RangeButton label="Esta semana" value="semana" icon="calendar.badge.clock" />
        <RangeButton label="Este mes" value="mes" icon="calendar.circle" />
      </View>
      
      <View style={[
        styles.dateContainer, 
        { borderColor: Colors[colorScheme].border }
      ]}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
        >
          <IconSymbol 
            name="calendar" 
            size={16} 
            color={Colors[colorScheme].tint} 
          />
          <ThemedText style={styles.dateText}>
            {formatDate(startDate)}
          </ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.separator}>-</ThemedText>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndPicker(true)}
        >
          <IconSymbol 
            name="calendar" 
            size={16} 
            color={Colors[colorScheme].tint} 
          />
          <ThemedText style={styles.dateText}>
            {formatDate(endDate)}
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          maximumDate={endDate}
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) {
              setDateRange('personalizado');
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
            if (selectedDate) {
              setDateRange('personalizado');
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
    padding: 12,
    backgroundColor: 'rgba(10, 126, 164, 0.05)',
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
  },
  rangeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rangeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  rangeButtonSelected: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  rangeButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#0a7ea4',
  },
  rangeButtonTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
  },
  separator: {
    marginHorizontal: 8,
    color: '#666',
  },
});
