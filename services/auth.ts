// services/auth.ts - Versión actualizada
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { API_CONFIG } from './api';

// Auth Interfaces - Actualizadas para incluir rol y almacen_id
export interface User {
  id: number;
  username: string;
  rol?: string;           // Añadido
  almacen_id?: number;    // Añadido
  almacen_nombre?: string; // Añadido
}

interface AuthToken {
  access_token: string;
  token_type: string;
  user?: User;            // Añadido para capturar el objeto user de la respuesta
}

interface JwtPayload {
  sub: number | string;
  username: string;
  rol?: string;           // Añadido
  almacen_id?: number;    // Añadido
  exp: number;
}

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Helper functions for token storage
const storage = {
  async saveToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(TOKEN_KEY);
      } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },

  async saveUser(user: User): Promise<void> {
    try {
      const userString = JSON.stringify(user);
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(USER_KEY, userString);
      } else {
        await SecureStore.setItemAsync(USER_KEY, userString);
      }
    } catch (error) {
      console.error('Error saving user info:', error);
    }
  },

  async getUser(): Promise<User | null> {
    try {
      let userString;
      if (Platform.OS === 'web') {
        userString = await AsyncStorage.getItem(USER_KEY);
      } else {
        userString = await SecureStore.getItemAsync(USER_KEY);
      }
      
      if (userString) {
        return JSON.parse(userString);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving user info:', error);
      return null;
    }
  },

  async clearStorage(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};

// Token utilities
const token = {
  isExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp < Date.now() / 1000;
    } catch (error) {
      return true;
    }
  },

  extractUser(token: string): User | null {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return {
        id: typeof decoded.sub === 'string' ? parseInt(decoded.sub, 10) : decoded.sub,
        username: decoded.username,
        rol: decoded.rol,                    // Extraer el rol del token
        almacen_id: decoded.almacen_id       // Extraer el almacen_id del token
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
};

// Auth API methods
export const authService = {
  async login(username: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al iniciar sesión');
      }

      const data: AuthToken = await response.json();
      await storage.saveToken(data.access_token);
      
      // Preferir el objeto user si está presente en la respuesta
      let user: User;
      if (data.user) {
        user = data.user;
      } else {
        // Fallback al método anterior de extraer del token
        const extractedUser = token.extractUser(data.access_token);
        if (!extractedUser) {
          throw new Error('Token inválido');
        }
        user = extractedUser;
      }
      
      await storage.saveUser(user);
      return user;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error al iniciar sesión');
    }
  },

  async register(username: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al registrarse');
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error al registrarse');
    }
  },

  async logout(): Promise<void> {
    await storage.clearStorage();
  },

  async checkAuth(): Promise<User | null> {
    const tokenValue = await storage.getToken();
    if (!tokenValue || token.isExpired(tokenValue)) {
      return null;
    }
    return token.extractUser(tokenValue);
  },

  async getAuthHeader(): Promise<Record<string, string> | null> {
    const tokenValue = await storage.getToken();
    if (!tokenValue || token.isExpired(tokenValue)) {
      return null;
    }
    return { 'Authorization': `Bearer ${tokenValue}` };
  },

  getUser: storage.getUser,
};