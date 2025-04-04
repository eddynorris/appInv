import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface FloatingButtonProps {
  icon: string;
  onPress: () => void;
  color?: string;
  size?: number;
  style?: ViewStyle;
  position?: 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft';
}

export function FloatingButton({
  icon,
  onPress,
  color,
  size = 24,
  style,
  position = 'bottomRight',
}: FloatingButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const getPositionStyle = () => {
    switch (position) {
      case 'bottomRight':
        return styles.bottomRight;
      case 'bottomLeft':
        return styles.bottomLeft;
      case 'topRight':
        return styles.topRight;
      case 'topLeft':
        return styles.topLeft;
      default:
        return styles.bottomRight;
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        getPositionStyle(),
        style,
        { backgroundColor: color || '#2196F3' }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <AntDesign
        name={icon}
        size={size}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
  },
  topRight: {
    top: 20,
    right: 20,
  },
  topLeft: {
    top: 20,
    left: 20,
  },
}); 