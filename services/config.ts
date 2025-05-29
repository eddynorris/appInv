// services/config.ts
export const API_CONFIG = {
  baseUrl: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
};

// Base URL configuration
function getBaseUrl(): string {
  // Usar la variable de entorno si está definida
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (apiUrl) {
    return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  }

  // URL por defecto para desarrollo local
  return 'http://localhost:8000';
}

export const getImageUrl = (path?: string | null): string => {
  if (!path) return '';
  
  // Si ya es una URL completa, devolverla tal cual
  if (path.startsWith('http')) {
    return path;
  }
  
  // Si es una ruta relativa, agregar la URL base
  const baseUrl = API_CONFIG.baseUrl;
  return path.startsWith('/') 
    ? `${baseUrl}${path}`
    : `${baseUrl}/${path}`;
};

export const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
