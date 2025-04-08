import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import DashboardScreen from '../reportes/dashboard';


export default function IndexScreen() {
  const router = useRouter();
  const { user } = useAuth();

  if (user?.rol === 'admin') {
    return <DashboardScreen />;
  }

  // Content from sales.tsx for non-admin users
  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/ventas/create')}
        >
          <Text style={styles.buttonText}>Nueva Venta</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.projectionButton]}
          onPress={() => router.push('/pedidos/create')}
        >
          <Text style={styles.buttonText}>Nueva Proyección</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  projectionButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});