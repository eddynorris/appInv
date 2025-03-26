// components/layout/ScreenContainer.tsx
import React, { ReactNode } from 'react';
import { ScrollView, ActivityIndicator, StyleSheet, ViewProps } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack } from 'expo-router';
import { ScreenStyles } from '@/styles/Theme';

interface ScreenContainerProps extends ViewProps {
  title: string;
  isLoading?: boolean;
  error?: string | null;
  loadingMessage?: string;
  children: ReactNode;
  showBackButton?: boolean;
  scrollable?: boolean;
  headerRight?: ReactNode;
}

export function ScreenContainer({
  title,
  isLoading = false,
  error = null,
  loadingMessage = 'Cargando...',
  children,
  showBackButton = true,
  scrollable = true,
  headerRight,
  style,
  ...rest
}: ScreenContainerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  // Render loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ 
          title: title,
          headerShown: true,
          headerBackVisible: showBackButton
        }} />
        <ThemedView style={ScreenStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText style={ScreenStyles.loadingText}>{loadingMessage}</ThemedText>
        </ThemedView>
      </>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Error',
          headerShown: true,
          headerBackVisible: showBackButton
        }} />
        <ThemedView style={ScreenStyles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={ScreenStyles.errorText}>{error}</ThemedText>
        </ThemedView>
      </>
    );
  }
  
  // Render content with or without scroll
  const Content = (
    <ThemedView style={[ScreenStyles.container, style]} {...rest}>
      {children}
    </ThemedView>
  );
  
  return (
    <>
      <Stack.Screen options={{ 
        title: title,
        headerShown: true,
        headerBackVisible: showBackButton,
        headerRight: headerRight ? () => headerRight : undefined
      }} />
      
      {scrollable ? (
        <ScrollView>
          {Content}
        </ScrollView>
      ) : Content}
    </>
  );
}