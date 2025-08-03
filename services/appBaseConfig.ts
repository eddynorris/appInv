// Nombre del archivo: services/appBaseConfig.ts
const getBaseUrl = (): string => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  
    if (apiUrl) {
      // Asegurarse que no termine con /
      return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    }
  
    // Fallback si la variable de entorno no está definida
    const fallbackUrl = 'https://api.manngojk.lat'; // Incluye http:// y sin / al final
    console.warn(`EXPO_PUBLIC_API_URL no está definida. Usando fallback: ${fallbackUrl}`);
    return fallbackUrl;
  };
  
  /**
   * URL base de la API.
   * Ejemplo: 'https://manngojk.lat'
   */
  export const BASE_URL: string = getBaseUrl();
  
  /**
   * Cabeceras por defecto para las solicitudes API de tipo JSON.
   */
  export const DEFAULT_API_HEADERS: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  /**
   * Tiempo de espera máximo para las solicitudes API en milisegundos.
   */
  export const API_TIMEOUT: number = 15000; // 15 segundos