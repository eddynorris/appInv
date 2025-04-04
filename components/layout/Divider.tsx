import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface DividerProps {
  style?: ViewStyle;
  color?: string;
  thickness?: number;
}

export function Divider({ style, color, thickness = 1 }: DividerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const dividerColor = color || (isDark ? '#3A3A3C' : '#E1E3E5');
  
  return (
    <View
      style={[
        styles.divider,
        { height: thickness, backgroundColor: dividerColor },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: '100%',
    height: 1,
  },
}); 