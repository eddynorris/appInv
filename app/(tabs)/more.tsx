import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LogoutButton } from '@/components/LogoutButton';

interface MenuItemProps {
  title: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  route: string;
  color?: string;
}

function MenuItem({ title, icon, route, color }: MenuItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const iconColor = color || Colors[colorScheme].tint;

  return (
    <TouchableOpacity 
      style={styles.menuItem}
      onPress={() => router.push(route)}
    >
      <IconSymbol name={icon} size={24} color={iconColor} />
      <ThemedText style={styles.menuText}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  return (
    <>
      <Stack.Screen options={{ 
        title: 'Más opciones',
        headerShown: true 
      }} />
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Gestión de Inventario</ThemedText>
          
          <MenuItem 
            title="Almacenes" 
            icon="house.fill" 
            route="/almacenes" 
          />
          
          <MenuItem 
            title="Movimientos" 
            icon="paperplane.fill" 
            route="/movimientos" 
          />
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Finanzas</ThemedText>
          
          <MenuItem 
            title="Ventas" 
            icon="paperplane.fill" 
            route="/ventas" 
          />
          
          <MenuItem 
            title="Gastos" 
            icon="paperplane.fill" 
            route="/gastos" 
          />
        </ThemedView>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Cuenta</ThemedText>
          
          {/* Use the text variant for a clean menu look */}
          <TouchableOpacity style={styles.menuItem}>
            <IconSymbol name="gear.fill" size={24} color="#757575" />
            <ThemedText style={styles.menuText}>Configuración</ThemedText>
          </TouchableOpacity>
          
          {/* Add LogoutButton */}
          <TouchableOpacity style={styles.menuItem}>
            <IconSymbol name="paperplane.fill" size={24} color="#E53935" />
            <LogoutButton variant="text" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(10, 126, 164, 0.05)',
  },
  menuText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});