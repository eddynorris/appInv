import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Platform } from 'react-native';

export function ApiTest() {
  const colorScheme = useColorScheme() ?? 'light';
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Prueba directa a la API
  const testApi = async () => {
    setIsLoading(true);
    setError(null);
    setResponse('');
    
    try {
      // Determina la URL base según la plataforma - con tu IP exacta
      let baseUrl = 'http://localhost:5000';
      if (Platform.OS === 'android') {
        baseUrl = 'http://192.168.1.35:5000'; // Tu IP exacta
      }
      
      const url = `${baseUrl}/clientes`;
      console.log('Probando conexión a:', url);
      
      const fetchResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      const text = await fetchResponse.text();
      console.log('Respuesta recibida:', fetchResponse.status);
      
      if (fetchResponse.ok) {
        setResponse(text);
      } else {
        setError(`Error ${fetchResponse.status}: ${text}`);
      }
    } catch (err) {
      console.error('Error en prueba API:', err);
      setError(`Error de conexión: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Prueba de Conexión a API</ThemedText>
      <ThemedText>IP: 192.168.1.35:5000</ThemedText>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={testApi}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <ThemedText style={styles.buttonText}>Probar Conexión</ThemedText>
        )}
      </TouchableOpacity>
      
      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      )}
      
      {response && (
        <ScrollView style={styles.responseContainer}>
          <ThemedText>Respuesta exitosa:</ThemedText>
          <ThemedText style={styles.responseText}>{response.substring(0, 1000)}{response.length > 1000 ? '...' : ''}</ThemedText>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  button: {
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  errorText: {
    color: '#E53935',
  },
  responseContainer: {
    maxHeight: 300,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },
  responseText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    marginTop: 8,
  },
});