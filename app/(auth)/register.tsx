import React, { useState } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  View
} from 'react-native';
import { Stack, Link, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';

export default function RegisterScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { register, isLoading, error } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    let isValid = true;
    const errors = {
      username: '',
      password: '',
      confirmPassword: '',
    };

    if (!username.trim()) {
      errors.username = 'El nombre de usuario es requerido';
      isValid = false;
    } else if (username.length < 3) {
      errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
      isValid = false;
    }

    if (!password.trim()) {
      errors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register(username, password);
      router.replace('/'); // Redirigir al dashboard después del registro exitoso
    } catch (err) {
      Alert.alert(
        'Error de registro',
        err instanceof Error ? err.message : 'No se pudo completar el registro'
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoid} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ 
        headerShown: false,
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.logoContainer}>
          {/* Placeholder para el logo - reemplaza con tu imagen real */}
          <View style={styles.logoPlaceholder}>
            <ThemedText style={styles.logoText}>MANNGO</ThemedText>
          </View>
          <ThemedText type="title" style={styles.appName}>
            Sistema de Inventario
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.formContainer}>
          <ThemedText type="subtitle" style={styles.registerTitle}>
            Crear Cuenta
          </ThemedText>
          
          {error && (
            <ThemedView style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </ThemedView>
          )}
          
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Usuario</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme].text },
                formErrors.username && styles.inputError
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder="Crea un nombre de usuario"
              placeholderTextColor="#9BA1A6"
              autoCapitalize="none"
            />
            {formErrors.username && (
              <ThemedText style={styles.fieldErrorText}>{formErrors.username}</ThemedText>
            )}
          </ThemedView>
          
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Contraseña</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme].text },
                formErrors.password && styles.inputError
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Crea una contraseña"
              placeholderTextColor="#9BA1A6"
              secureTextEntry
            />
            {formErrors.password && (
              <ThemedText style={styles.fieldErrorText}>{formErrors.password}</ThemedText>
            )}
          </ThemedView>
          
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Confirmar Contraseña</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme].text },
                formErrors.confirmPassword && styles.inputError
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite tu contraseña"
              placeholderTextColor="#9BA1A6"
              secureTextEntry
            />
            {formErrors.confirmPassword && (
              <ThemedText style={styles.fieldErrorText}>{formErrors.confirmPassword}</ThemedText>
            )}
          </ThemedView>
          
          <TouchableOpacity 
            style={[
              styles.registerButton,
              isLoading && styles.registerButtonDisabled
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ThemedText style={styles.registerButtonText}>Registrarse</ThemedText>
            )}
          </TouchableOpacity>
          
          <ThemedView style={styles.loginLink}>
            <ThemedText style={styles.loginText}>¿Ya tienes una cuenta? </ThemedText>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <ThemedText style={styles.loginLinkText}>Iniciar Sesión</ThemedText>
              </TouchableOpacity>
            </Link>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  appName: {
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  registerTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#E53935',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#E53935',
  },
  fieldErrorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#88c8d8',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '600',
  },
});