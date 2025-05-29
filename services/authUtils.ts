// services/authUtils.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Helper functions for token storage
export const storage = {
  // Token operations
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
      console.error('Error getting token:', error);
      return null;
    }
  },

  async clearToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error clearing token storage:', error);
    }
  },

  // User operations
  async saveUser(user: any): Promise<void> {
    try {
      const userString = JSON.stringify(user);
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(USER_KEY, userString);
      } else {
        await SecureStore.setItemAsync(USER_KEY, userString);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      let userString: string | null = null;
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
      console.error('Error getting user:', error);
      return null;
    }
  },

  async clearUser(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (error) {
      console.error('Error clearing user storage:', error);
    }
  },

  async clearAll(): Promise<void> {
    await this.clearToken();
    await this.clearUser();
  },
};

// Get auth header for API requests
export const getAuthHeader = async (): Promise<Record<string, string> | null> => {
  try {
    const token = await storage.getToken();
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return null;
  } catch (error) {
    console.error('Error getting auth header:', error);
    return null;
  }
};
