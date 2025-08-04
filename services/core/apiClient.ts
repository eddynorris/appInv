// services/core/apiClient.ts - Base API client configuration
import { BASE_URL, DEFAULT_API_HEADERS, API_TIMEOUT } from '../appBaseConfig';
import { authService } from './authService';
import { ApiConfig, HttpError } from './types';

export const API_CONFIG: ApiConfig = {
  baseUrl: BASE_URL, 
  headers: DEFAULT_API_HEADERS,
  timeout: API_TIMEOUT,

  getImageUrl: (path?: string | null): string => {
    if (!path) {
      return ''; 
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    console.warn('getImageUrl recibió una ruta inesperada (no es URL absoluta):', path);
    return ''; 
  },

  isValidImageUrl: (url: string | undefined | null): boolean => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  }
};

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  const authHeaders = await authService.getAuthHeader();
  
  // Verificar si se está enviando FormData
  const isFormData = options.body instanceof FormData;
  
  // No incluir Content-Type para FormData, deja que el navegador lo establezca
  const headers = {
    ...(!isFormData ? API_CONFIG.headers : { 'Accept': 'application/json' }),
    ...(authHeaders || {}),
    ...(options.headers || {}),
  };
    
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Manejar respuestas sin contenido
    if (response.status === 204) {
      return null as T;
    }
    
    // Leer el cuerpo de la respuesta UNA SOLA VEZ
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      console.error('Error parsing response JSON:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Invalid JSON response from server');
    }
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as HttpError;
      error.response = {
        status: response.status,
        data: responseData
      };
      
      // Log para debug
      console.error('API Error:', {
        url,
        status: response.status,
        statusText: response.statusText,
        responseData,
        requestOptions: options
      });
      
      throw error;
    }
    
    return responseData as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error or server unreachable:', url);
      throw new Error('Error de conexión. Verifica tu conexión a internet.');
    }
    
    throw error;
  }
}

// Base API client with common HTTP methods
export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, any>): Promise<T> => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return fetchApi<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  },

  post: <T>(endpoint: string, data: any): Promise<T> => {
    const isFormData = data instanceof FormData;
    
    return fetchApi<T>(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  put: <T>(endpoint: string, data: any): Promise<T> => {
    const isFormData = data instanceof FormData;
    
    return fetchApi<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  delete: <T>(endpoint: string): Promise<T> => {
    return fetchApi<T>(endpoint, {
      method: 'DELETE',
    });
  },

  patch: <T>(endpoint: string, data: any): Promise<T> => {
    const isFormData = data instanceof FormData;
    
    return fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
    });
  },
};