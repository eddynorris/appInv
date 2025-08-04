import React from 'react';
import { StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  style?: StyleProp<ViewStyle>;
  size?: number;
}

export function FloatingActionButton({
  onPress,
  icon,
  style,
  size = 56,
}: FloatingActionButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { 
          backgroundColor: Colors[colorScheme].tint,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <IconSymbol 
        name={icon} 
        size={size * 0.5} 
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});