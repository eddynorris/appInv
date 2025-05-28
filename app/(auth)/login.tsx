import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, Image } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { FormField } from '@/components/form/FormField';

interface InputFieldProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  error?: string;
  isDarkMode: boolean;
}

function InputField({ 
  label, 
  icon, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry, 
  showToggle, 
  onToggle, 
  error, 
  isDarkMode 
}: InputFieldProps) {
  return (
    <ThemedView style={styles.formGroup}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedView style={[styles.inputContainer, isDarkMode ? styles.inputDark : styles.inputLight, error && styles.inputError]}> 
        <Ionicons name={icon} size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
        />
        {showToggle && (
          <TouchableOpacity style={styles.eyeIcon} onPress={onToggle} accessibilityLabel={secureTextEntry ? 'Mostrar contraseña' : 'Ocultar contraseña'}>
            <Ionicons name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        )}
      </ThemedView>
      {error ? (
        <ThemedText style={styles.fieldErrorText}>
          <Ionicons name="information-circle" size={14} color="#EF4444" /> {error}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({ username: '', password: '' });
  const isDarkMode = colorScheme === 'dark';

  const validateForm = () => {
    let isValid = true;
    const errors = { username: '', password: '' };
    if (!username.trim()) {
      errors.username = 'El nombre de usuario es requerido';
      isValid = false;
    }
    if (!password.trim()) {
      errors.password = 'La contraseña es requerida';
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    try {
      await login(username, password);
    } catch (err) {
      Alert.alert('Error de inicio de sesión', err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    }
  };

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.logoContainer}>
            <ThemedView style={[styles.logoCircle, { backgroundColor: '#0284c7' }]}> 
              <Image source={require('@/assets/images/image.png')} style={{ width: 70, height: 70, borderRadius: 35 }} resizeMode="contain" accessibilityLabel="Logo Manngo" />
            </ThemedView>
            <ThemedText type="title" style={styles.appName}>Sistema de Ventas</ThemedText>
            <ThemedText style={styles.appTagline}>MANNGO</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.cardContainer, isDarkMode ? styles.cardDark : styles.cardLight]}>
            {error && (
              <ThemedView style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </ThemedView>
            )}
            <InputField
              label="Usuario"
              icon="person-outline"
              value={username}
              onChangeText={setUsername}
              placeholder="Ingresa tu nombre de usuario"
              error={formErrors.username}
              isDarkMode={isDarkMode}
            />
            <InputField
              label="Contraseña"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              secureTextEntry={!showPassword}
              showToggle={true}
              onToggle={() => setShowPassword(!showPassword)}
              error={formErrors.password}
              isDarkMode={isDarkMode}
            />
            <TouchableOpacity style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} onPress={handleLogin} disabled={isLoading} accessibilityLabel="Botón de iniciar sesión" accessibilityRole="button">
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <ThemedText style={styles.loginButtonText}>Iniciar Sesión</ThemedText>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </ThemedView>
          <ThemedView style={styles.footer}>
            <ThemedText style={styles.footerText}>¿No tienes una cuenta? Contacta a un administrador</ThemedText>
            <ThemedText style={styles.versionText}>Versión 1.0.0</ThemedText>
          </ThemedView>
        </ThemedView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5 },
  appName: { fontSize: 28, fontWeight: 'bold', letterSpacing: 1 },
  appTagline: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  cardContainer: { width: '100%', maxWidth: 400, padding: 24, borderRadius: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2, marginBottom: 16, marginHorizontal: 'auto' },
  cardDark: { backgroundColor: '#111827', shadowColor: '#000000' },
  cardLight: { backgroundColor: '#FFFFFF', shadowColor: '#718096' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#EF4444', marginLeft: 8 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, overflow: 'hidden', height: 56 },
  inputDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  inputLight: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  inputIcon: { paddingHorizontal: 12 },
  input: { flex: 1, height: '100%', fontSize: 16, paddingRight: 12 },
  eyeIcon: { paddingHorizontal: 12 },
  inputError: { borderColor: '#EF4444' },
  fieldErrorText: { color: '#EF4444', fontSize: 14, marginTop: 6, flexDirection: 'row', alignItems: 'center' },
  loginButton: { flexDirection: 'row', backgroundColor: '#0284c7', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 56 },
  loginButtonDisabled: { backgroundColor: '#93c5fd' },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 24, alignItems: 'center' },
  footerText: { color: '#6B7280', fontSize: 14 },
  versionText: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
});