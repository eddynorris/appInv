import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
 import { Colors } from '@/styles/Theme';

interface ButtonProps {
  text: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  text,
  onPress,
  type = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const getButtonStyle = () => {
    switch (type) {
      case 'primary':
        return {
          backgroundColor: disabled ? (isDark ? '#555555' : '#CCCCCC') : '#2196F3',
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDark ? '#555555' : '#CCCCCC',
        };
      case 'danger':
        return {
          backgroundColor: disabled ? (isDark ? '#7F2B29' : '#FFCDD2') : '#E53935',
        };
      default:
        return {
          backgroundColor: '#2196F3',
        };
    }
  };
  
  const getTextStyle = () => {
    switch (type) {
      case 'primary':
        return {
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          color: isDark ? '#FFFFFF' : '#000000',
        };
      case 'danger':
        return {
          color: '#FFFFFF',
        };
      default:
        return {
          color: '#FFFFFF',
        };
    }
  };
  
  return (
    <TouchableOpacity
      onPress={!isLoading && !disabled ? onPress : undefined}
      style={[
        styles.button,
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        style,
        (isLoading || disabled) && styles.disabled,
      ]}
      activeOpacity={0.8}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>{text}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.7,
  },
}); 