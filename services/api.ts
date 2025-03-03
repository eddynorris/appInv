import { Platform } from 'react-native';
import { 
  Cliente, 
  Producto,
  Proveedor,
  Almacen,
  Gasto,
  Movimiento,
  Venta,
  PaginatedResponse
} from '@/models';
import { authService } from './auth';

// Cache mechanism for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

// Base URL configuration - optimized
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  } 
  else if (Platform.OS === 'ios') {
    return 'http://localhost:5000';
  }
  else if (Platform.OS === 'android') {
    return 'http://192.168.1.37:5000'; // Use your server IP
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
  timeout: 15000 // 15 seconds - increased for slower connections
};

// Error handling helper - improved with better error messages
const handleApiError = (error: any): never => {
  if (error.response) {
    // Server responded with an error status
    if (error.response.status === 404) {
      throw new Error(`Recurso no encontrado: ${error.response.data?.message || 'La URL solicitada no existe'}`);
    } else if (error.response.status === 401) {
      throw new Error('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
    } else if (error.response.status === 403) {
      throw new Error('No tiene permisos para realizar esta acción.');
    }
    throw new Error(`Error del servidor: ${JSON.stringify(error.response.data)}`);
  } else if (error.request) {
    // Request was made but no response received
    throw new Error('Error de red: No se recibió respuesta del servidor. Verifique su conexión.');
  } else {
    // Error in setting up the request
    throw new Error(`Error en la solicitud: ${error.message}`);
  }
};

// Improved fetch function with caching, retries, and better error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  useCache = true
): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Check cache for GET requests
  if (useCache && options.method === undefined || options.method === 'GET') {
    const cachedResponse = apiCache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_EXPIRY) {
      return cachedResponse.data as T;
    }
  }
  
  // Get auth headers
  const authHeaders = await authService.getAuthHeader();
  
  const defaultOptions: RequestInit = {
    headers: {
      ...API_CONFIG.headers,
      ...(authHeaders || {}),
      ...options.headers,
    },
    ...options,
  };

  try {
    // Use fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle auth errors
    if (response.status === 401) {
      throw { response: { status: 401, data: { message: 'Su sesión ha expirado' } } };
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || `Error ${response.status}` };
      }
      
      throw { 
        response: { 
          status: response.status, 
          data: errorData 
        }
      };
    }
    
    // Process response
    const responseText = await response.text();
    
    // Handle empty response
    if (!responseText.trim()) {
      return {} as T;
    }
    
    // Parse JSON
    try {
      const data = JSON.parse(responseText);
      
      // Cache GET responses
      if (useCache && (options.method === undefined || options.method === 'GET')) {
        apiCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      return data;
    } catch (error) {
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    // Handle network errors
    if (error.name === 'AbortError') {
      throw new Error('La solicitud ha excedido el tiempo de espera');
    }
    
    return handleApiError(error);
  }
}

// Clear the cache for a specific endpoint or all endpoints
export const clearApiCache = (endpoint?: string) => {
  if (endpoint) {
    // Clear cache for a specific endpoint
    const prefix = `${API_CONFIG.baseUrl}${endpoint}`;
    for (const key of apiCache.keys()) {
      if (key.startsWith(prefix)) {
        apiCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    apiCache.clear();
  }
};

// Retry logic for API calls
async function fetchWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3,
  useCache = true
): Promise<T> {
  let lastError;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fetchApi<T>(endpoint, options, useCache);
    } catch (error) {
      lastError = error;
      
      // Only retry on network errors, not server errors
      if (error.message?.includes('Error de red') && attempt < retries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
      
      break;
    }
  }
  
  throw lastError;
}

// Optimized API methods for Cliente
export const clienteApi = {
  getClientes: async (page = 1, perPage = 10, useCache = true): Promise<PaginatedResponse<Cliente>> => {
    return fetchWithRetry<PaginatedResponse<Cliente>>(
      `/clientes?page=${page}&per_page=${perPage}`,
      undefined,
      3,
      useCache
    );
  },

  getCliente: async (id: number): Promise<Cliente> => {
    return fetchWithRetry<Cliente>(`/clientes/${id}`);
  },

  createCliente: async (cliente: Omit<Cliente, 'id' | 'created_at' | 'saldo_pendiente'>): Promise<Cliente> => {
    // Clear cache for clients when creating a new one
    clearApiCache('/clientes');
    
    const response = await fetchWithRetry<Cliente>('/clientes', {
      method: 'POST',
      body: JSON.stringify(cliente),
    }, 3, false);
    
    return response;
  },

  updateCliente: async (id: number, cliente: Partial<Cliente>): Promise<Cliente> => {
    // Clear cache for this client and the clients list
    clearApiCache('/clientes');
    clearApiCache(`/clientes/${id}`);
    
    return fetchWithRetry<Cliente>(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cliente),
    }, 3, false);
  },

  deleteCliente: async (id: number): Promise<any> => {
    // Clear cache for clients when deleting
    clearApiCache('/clientes');
    
    return fetchWithRetry<any>(`/clientes/${id}`, {
      method: 'DELETE',
    }, 3, false);
  },
};

// API methods for Producto
export const productoApi = {
  getProductos: async (): Promise<PaginatedResponse<Producto>> => {
    return fetchApi<PaginatedResponse<Producto>>(`/productos`);
  },

  getProducto: async (id: number): Promise<Producto> => {
    return fetchApi<Producto>(`/productos/${id}`);
  },

  createProducto: async (producto: Omit<Producto, 'id' | 'created_at'>): Promise<Producto> => {
    return fetchApi<Producto>('/productos', {
      method: 'POST',
      body: JSON.stringify(producto),
    });
  },

  updateProducto: async (id: number, producto: Partial<Producto>): Promise<Producto> => {
    return fetchApi<Producto>(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(producto),
    });
  },

  deleteProducto: async (id: number): Promise<any> => {
    return fetchApi<any>(`/productos/${id}`, {
      method: 'DELETE',
    });
  },
};

// API methods for Proveedor
export const proveedorApi = {
  getProveedores: async (): Promise<PaginatedResponse<Proveedor>> => {
    return fetchApi<PaginatedResponse<Proveedor>>(`/proveedores`);
  },

  getProveedor: async (id: number): Promise<Proveedor> => {
    return fetchApi<Proveedor>(`/proveedores/${id}`);
  },

  createProveedor: async (proveedor: Omit<Proveedor, 'id' | 'created_at'>): Promise<Proveedor> => {
    return fetchApi<Proveedor>('/proveedores', {
      method: 'POST',
      body: JSON.stringify(proveedor),
    });
  },

  updateProveedor: async (id: number, proveedor: Partial<Proveedor>): Promise<Proveedor> => {
    return fetchApi<Proveedor>(`/proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proveedor),
    });
  },

  deleteProveedor: async (id: number): Promise<any> => {
    return fetchApi<any>(`/proveedores/${id}`, {
      method: 'DELETE',
    });
  },
};

// API methods for Almacen
export const almacenApi = {
  getAlmacenes: async (): Promise<PaginatedResponse<Almacen>> => {
    return fetchApi<PaginatedResponse<Almacen>>(`/almacenes`);
  },

  getAlmacen: async (id: number): Promise<Almacen> => {
    return fetchApi<Almacen>(`/almacenes/${id}`);
  },

  createAlmacen: async (almacen: Omit<Almacen, 'id'>): Promise<Almacen> => {
    return fetchApi<Almacen>('/almacenes', {
      method: 'POST',
      body: JSON.stringify(almacen),
    });
  },

  updateAlmacen: async (id: number, almacen: Partial<Almacen>): Promise<Almacen> => {
    return fetchApi<Almacen>(`/almacenes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(almacen),
    });
  },

  deleteAlmacen: async (id: number): Promise<any> => {
    return fetchApi<any>(`/almacenes/${id}`, {
      method: 'DELETE',
    });
  },
};

// API methods for Gasto
export const gastoApi = {
  getGastos: async (): Promise<PaginatedResponse<Gasto>> => {
    return fetchApi<PaginatedResponse<Gasto>>(`/gastos`);
  },

  getGasto: async (id: number): Promise<Gasto> => {
    return fetchApi<Gasto>(`/gastos/${id}`);
  },

  createGasto: async (gasto: Omit<Gasto, 'id'>): Promise<Gasto> => {
    return fetchApi<Gasto>('/gastos', {
      method: 'POST',
      body: JSON.stringify(gasto),
    });
  },

  updateGasto: async (id: number, gasto: Partial<Gasto>): Promise<Gasto> => {
    return fetchApi<Gasto>(`/gastos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gasto),
    });
  },

  deleteGasto: async (id: number): Promise<any> => {
    return fetchApi<any>(`/gastos/${id}`, {
      method: 'DELETE',
    });
  },
};

// API methods for Movimiento
export const movimientoApi = {
  getMovimientos: async (): Promise<PaginatedResponse<Movimiento>> => {
    return fetchApi<PaginatedResponse<Movimiento>>(`/movimientos`);
  },

  getMovimiento: async (id: number): Promise<Movimiento> => {
    return fetchApi<Movimiento>(`/movimientos/${id}`);
  },

  createMovimiento: async (movimiento: Omit<Movimiento, 'id' | 'producto' | 'almacen' | 'venta' | 'proveedor'>): Promise<Movimiento> => {
    return fetchApi<Movimiento>('/movimientos', {
      method: 'POST',
      body: JSON.stringify(movimiento),
    });
  },

  updateMovimiento: async (id: number, movimiento: Partial<Omit<Movimiento, 'producto' | 'almacen' | 'venta' | 'proveedor'>>): Promise<Movimiento> => {
    return fetchApi<Movimiento>(`/movimientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(movimiento),
    });
  },

  deleteMovimiento: async (id: number): Promise<any> => {
    return fetchApi<any>(`/movimientos/${id}`, {
      method: 'DELETE',
    });
  },
};

// API methods for Venta
export const ventaApi = {
  getVentas: async (): Promise<PaginatedResponse<Venta>> => {
    return fetchApi<PaginatedResponse<Venta>>(`/ventas`);
  },

  getVenta: async (id: number): Promise<Venta> => {
    return fetchApi<Venta>(`/ventas/${id}`);
  },

  createVenta: async (venta: Omit<Venta, 'id' | 'cliente' | 'almacen' | 'detalles' | 'credito'>): Promise<Venta> => {
    return fetchApi<Venta>('/ventas', {
      method: 'POST',
      body: JSON.stringify(venta),
    });
  },

  updateVenta: async (id: number, venta: Partial<Omit<Venta, 'cliente' | 'almacen' | 'detalles' | 'credito'>>): Promise<Venta> => {
    return fetchApi<Venta>(`/ventas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(venta),
    });
  },

  deleteVenta: async (id: number): Promise<any> => {
    return fetchApi<any>(`/ventas/${id}`, {
      method: 'DELETE',
    });
  },
};