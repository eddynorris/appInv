// services/auth.ts - Versión actualizada
import { jwtDecode } from 'jwt-decode';
import { API_CONFIG } from './config';
import { fetchApi } from './fetchApi';
import { storage } from './authUtils';

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

// Token utilities
const tokenUtils = {
  isExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },

  extractUser(token: string): User | null {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return {
        id: Number(decoded.sub),
        username: decoded.username,
        rol: decoded.rol,
        almacen_id: decoded.almacen_id,
      };
    } catch (error) {
      console.error('Error extracting user from token:', error);
      return null;
    }
  },
};

// Auth API methods
export const authService = {
  async login(username: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al iniciar sesión');
      }

      const data: AuthToken = await response.json();
      
      if (!data.access_token) {
        throw new Error('No se recibió el token de acceso');
      }

      // Save the token
      await storage.saveToken(data.access_token);
      
      // Extract and save user information
      let user: User | null = null;
      
      // First try to get user from response
      if (data.user) {
        user = data.user;
      } 
      // If not in response, try to extract from token
      else if (data.access_token) {
        user = tokenUtils.extractUser(data.access_token);
      }
      
      if (!user) {
        throw new Error('No se pudo obtener la información del usuario');
      }
      
      // Save user information
      await storage.saveUser(user);
      
      return user;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  async register(username: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al registrarse');
      }
      
      // If registration is successful, automatically log in the user
      await this.login(username, password);
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    await storage.clearAll();
  },

  async checkAuth(): Promise<User | null> {
    const token = await storage.getToken();
    if (!token || tokenUtils.isExpired(token)) {
      return null;
    }
    return storage.getUser();
  },

  async getAuthHeader(): Promise<Record<string, string> | null> {
    const token = await storage.getToken();
    if (!token) return null;
    return { 'Authorization': `Bearer ${token}` };
  },

  getUser: storage.getUser,
};