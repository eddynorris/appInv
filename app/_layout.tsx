// app/_layout.tsx 
import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Importar esto

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AlertProvider } from '@/context/AlertContext'; // Importamos AlertProvider

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Auth route guard component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('AuthGuard useEffect:', { user: !!user, isLoading, segments }); // Added log
    if (isLoading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user) {
      console.log('AuthGuard: User is null, redirecting to /login'); // Added log
      router.replace('/login');
    } else if (user && inAuthGroup) {
      console.log('AuthGuard: User exists and in auth group, redirecting to /'); // Added log
      // Role-based redirection
      const targetRoute = user.rol === 'admin' ? '/' : '/';
      router.replace(targetRoute);
    }
  }, [user, segments, isLoading, router]);

  if (isLoading || !user) {
    return <Slot />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    // Envolver toda la aplicación con GestureHandlerRootView
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AlertProvider>
          <ThemeProvider value={DefaultTheme}>
            <AuthGuard>
              <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </AuthGuard>
          </ThemeProvider>
        </AlertProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}