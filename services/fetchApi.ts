// services/fetchApi.ts
import { API_CONFIG } from './config';
import { getAuthHeader } from './authUtils';

// Interfaz para errores HTTP estructurados
export interface HttpError extends Error {
  response?: {
    status: number;
    data: any;
  };
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Eliminar la barra inicial si existe para evitar doble barra
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${API_CONFIG.baseUrl}/${normalizedEndpoint}`;

  // Obtener el header de autenticación
  const authHeader = await getAuthHeader();
  
  // Configurar headers por defecto
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(authHeader || {}),
    ...(options.headers || {}),
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si la respuesta no es exitosa, lanzar un error
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }

      const error: HttpError = new Error(errorData.message || 'Error en la solicitud');
      error.response = {
        status: response.status,
        data: errorData,
      };
      throw error;
    }

    // Si la respuesta es exitosa pero no tiene contenido (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    // Procesar la respuesta exitosa
    return await response.json();
  } catch (error) {
    console.error('Error en fetchApi:', error);
    throw error;
  }
}
