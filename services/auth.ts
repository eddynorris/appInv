import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';

// Auth Interfaces
export interface User {
  id: number;
  username: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

interface JwtPayload {
  sub: number;
  username: string;
  exp: number;
}

// Base URL configuration
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  } 
  else if (Platform.OS === 'ios') {
    return 'http://localhost:5000';
  }
  else if (Platform.OS === 'android') {
    return 'http://192.168.1.37:5000'; // Usar la IP conocida
  }
  
  return 'http://localhost:5000';
};

// API configuration
const API_CONFIG = {
  baseUrl: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Token storage key
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Store auth token securely (using SecureStore when possible, falling back to AsyncStorage)
const saveToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error saving token:', error);
    throw new Error('Failed to save authentication token');
  }
};

// Get stored token
const getToken = async (): Promise<string | null> => {
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
};

// Remove stored token
const removeToken = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Store user info
const saveUser = async (user: User): Promise<void> => {
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
};

// Get stored user
const getUser = async (): Promise<User | null> => {
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
};

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true; // If we can't decode the token, treat it as expired
  }
};

// Get user info from token
const getUserFromToken = (token: string): User | null => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return {
      id: decoded.sub,
      username: decoded.username,
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Login (authenticate with API)
const login = async (username: string, password: string): Promise<User> => {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/auth`, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    const data: AuthToken = await response.json();
    
    // Save token
    await saveToken(data.access_token);
    
    // Extract and save user info from token
    const user = getUserFromToken(data.access_token);
    if (!user) {
      throw new Error('Invalid token received');
    }
    
    await saveUser(user);
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register
const register = async (username: string, password: string): Promise<void> => {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/registrar`, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Logout
const logout = async (): Promise<void> => {
  await removeToken();
};

// Check authentication state
const checkAuth = async (): Promise<User | null> => {
  try {
    const token = await getToken();
    if (!token || isTokenExpired(token)) {
      return null;
    }
    
    return getUserFromToken(token);
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
};

// Get authorization header for API requests
const getAuthHeader = async (): Promise<Record<string, string> | null> => {
  const token = await getToken();
  if (!token) {
    return null;
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
};

export const authService = {
  login,
  register,
  logout,
  checkAuth,
  getAuthHeader,
  getUser,
};