import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  text: string;
  color: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

/**
 * Badge component para mostrar estados o etiquetas
 * 
 * @param text - Texto a mostrar en el badge
 * @param color - Color del badge (por defecto gris)
 * @param size - Tamaño del badge: small, medium o large
 * @param style - Estilos adicionales para el container
 */
export function Badge({ text, color, size = 'medium', style }: BadgeProps) {
  const getSize = (): { height: number; fontSize: number; paddingHorizontal: number } => {
    switch (size) {
      case 'small':
        return { height: 20, fontSize: 10, paddingHorizontal: 6 };
      case 'large':
        return { height: 28, fontSize: 14, paddingHorizontal: 12 };
      case 'medium':
      default:
        return { height: 24, fontSize: 12, paddingHorizontal: 8 };
    }
  };

  const { height, fontSize, paddingHorizontal } = getSize();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}20`, // 20 es 12.5% de opacidad en hexadecimal
          borderColor: `${color}50`, // 50 es 31.25% de opacidad en hexadecimal
          height,
          paddingHorizontal,
        },
        style,
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          {
            color: color,
            fontSize,
          },
        ]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
}); 