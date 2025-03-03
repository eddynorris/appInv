import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';

// Define API_CONFIG (should match your existing config in api.ts)
const API_CONFIG = {
  baseUrl: Platform.OS === 'android' 
    ? 'http://192.168.1.37:5000' 
    : 'http://localhost:5000'
};

export function ApiTestComponent() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const testEndpoint = async (endpoint: string) => {
    setLoading(true);
    try {
      // Get the token from storage
      const token = await getToken();
      
      console.log(`Testing endpoint: ${endpoint}`);
      console.log(`Token: ${token ? 'Present' : 'Missing'}`);
      
      if (token) {
        console.log(`Token first 20 chars: ${token.substring(0, 20)}...`);
      }
      
      const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      const status = response.status;
      console.log(`Response status: ${status}`);
      
      let data;
      try {
        const text = await response.text();
        console.log('Response text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
        data = text.length ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Error parsing response:', e);
        data = { error: 'Failed to parse response' };
      }
      
      setTestResult(JSON.stringify({ 
        endpoint, 
        status, 
        data,
        authenticated: !!token,
        headers: {
          'Authorization': token ? 'Bearer token-exists' : 'No token'
        }
      }, null, 2));
    } catch (error) {
      console.error('Test error:', error);
      setTestResult(JSON.stringify({ 
        endpoint,
        error: error.message || 'Unknown error',
        authenticated: !!(await getToken())
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to get token (copy from your auth service)
  const getToken = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem('auth_token');
      } else {
        return await SecureStore.getItemAsync('auth_token');
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">API Connection Test</ThemedText>
      <ThemedText>User: {user ? user.username : 'Not logged in'}</ThemedText>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => testEndpoint('/clientes')}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>Test /clientes</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => testEndpoint('/productos')}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>Test /productos</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => testEndpoint('/auth')}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>Test /auth</ThemedText>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ThemedText>Testing API...</ThemedText>
      ) : testResult ? (
        <ScrollView style={styles.resultContainer}>
          <ThemedText style={styles.resultText}>{testResult}</ThemedText>
        </ScrollView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    maxHeight: 300,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },
  resultText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
  },
});