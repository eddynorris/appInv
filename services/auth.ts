// Nombre del archivo: services/auth.ts
// Versión actualizada
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { BASE_URL, DEFAULT_API_HEADERS } from './appBaseConfig';

// Auth Interfaces - Actualizadas para incluir rol y almacen_id
export interface User {
  id: number;
  username: string;
  rol?: string;
  almacen_id?: number;
  almacen_nombre?: string;
}

interface AuthToken {
  access_token: string;
  token_type: string;
  user?: User;
}

interface JwtPayload {
  sub: number | string;
  username: string;
  rol?: string;
  almacen_id?: number;
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
        rol: decoded.rol,
        almacen_id: decoded.almacen_id
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
      // const url = `${API_CONFIG.baseUrl}/auth`; // --- REEMPLAZAR ESTA LÍNEA ---
      const url = `${BASE_URL}/auth`; // +++ CON ESTA LÍNEA +++
      const body = { username, password };
      // const headers = { // --- REEMPLAZAR ESTAS LÍNEAS ---
      //   'Content-Type': 'application/json',
      //   'Accept': 'application/json',
      // };
      const headers = { ...DEFAULT_API_HEADERS }; // +++ CON ESTA LÍNEA +++


      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al iniciar sesión', details: 'Respuesta no JSON o vacía' }));
        throw new Error(errorData.message || 'Error al iniciar sesión');
      }

      const data: AuthToken = await response.json();
      await storage.saveToken(data.access_token);
      
      let user: User;
      if (data.user) {
        user = data.user;
      } else {
        const extractedUser = token.extractUser(data.access_token);
        if (!extractedUser) {
          throw new Error('Token inválido');
        }
        user = extractedUser;
      }
      
      await storage.saveUser(user);
      return user;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error Message:', error.message);
        const errorDetails: any = error;
        if (errorDetails.response) {
          console.error('Error Status:', errorDetails.response.status);
          console.error('Error Data:', errorDetails.response.data);
        } else if (errorDetails.details) {
          console.error('Error Details:', errorDetails.details);
        }
      } else {
        console.error('Unknown error during login:', error);
      }
      throw error instanceof Error ? error : new Error('Error al iniciar sesión');
    }
  },

  async register(username: string, password: string): Promise<void> {
    try {
      // const response = await fetch(`${API_CONFIG.baseUrl}/registrar`, { // --- REEMPLAZAR ESTA LÍNEA ---
      const response = await fetch(`${BASE_URL}/registrar`, { // +++ CON ESTA LÍNEA +++
        method: 'POST',
        // headers: { // --- REEMPLAZAR ESTAS LÍNEAS ---
        //   'Content-Type': 'application/json',
        //   'Accept': 'application/json',
        // },
        headers: { ...DEFAULT_API_HEADERS }, // +++ CON ESTA LÍNEA +++
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al registrarse', details: 'Respuesta no JSON o vacía' }));
        throw new Error(errorData.message || 'Error al registrarse');
      }
    } catch (error) {
       if (error instanceof Error) {
        console.error('Error Message (Register):', error.message);
      } else {
        console.error('Unknown error during registration:', error);
      }
      throw error instanceof Error ? error : new Error('Error al registrarse');
    }
  },

  async logout(): Promise<void> {
    await storage.clearStorage();
  },

  async checkAuth(): Promise<User | null> {
    const tokenValue = await storage.getToken();
    if (!tokenValue || token.isExpired(tokenValue)) {
      await storage.clearStorage(); // Limpiar si el token es inválido o expiró
      return null;
    }
    // Devolver usuario desde el storage si existe y es consistente con el token
    // o extraer del token. Preferiblemente, el usuario guardado.
    const storedUser = await storage.getUser();
    if(storedUser && storedUser.id === token.extractUser(tokenValue)?.id) {
        return storedUser;
    }
    // Si no hay usuario en storage o no es consistente, extraer del token y guardarlo
    const userFromToken = token.extractUser(tokenValue);
    if (userFromToken) {
        await storage.saveUser(userFromToken);
    } else {
        // Si el token es inválido (no se puede extraer el usuario), limpiar storage
        await storage.clearStorage();
    }
    return userFromToken;
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