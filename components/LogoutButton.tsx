import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/context/AuthContext';

interface LogoutButtonProps {
  variant?: 'icon' | 'text' | 'full';
  onLogoutSuccess?: () => void;
}

export function LogoutButton({ 
  variant = 'full',
  onLogoutSuccess 
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      
      // Call optional success callback
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }
      
      // Navigate to login screen
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión. Intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Está seguro que desea cerrar sesión?')) {
        handleLogout();
      }
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Está seguro que desea cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar Sesión', onPress: handleLogout, style: 'destructive' }
        ]
      );
    }
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <TouchableOpacity
        style={styles.iconButton}
        onPress={confirmLogout}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <IconSymbol name="paperplane.fill" size={24} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    );
  }

  // Text-only variant (for menu items)
  if (variant === 'text') {
    return (
      <TouchableOpacity
        style={styles.textButton}
        onPress={confirmLogout}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#E53935" />
        ) : (
          <ThemedText style={styles.textButtonLabel}>Cerrar Sesión</ThemedText>
        )}
      </TouchableOpacity>
    );
  }

  // Full button (default)
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={confirmLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
          <ThemedText style={styles.buttonText}>Cerrar Sesión</ThemedText>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#E53935',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    padding: 8,
  },
  textButtonLabel: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '500',
  },
});