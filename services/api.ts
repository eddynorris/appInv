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

// Base URL configuration
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  } 
  else if (Platform.OS === 'ios') {
    return 'http://localhost:5000';
  }
  else if (Platform.OS === 'android') {
    return 'http://192.168.1.35:5000'; // Usar la IP que ya sabemos que funciona
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
  timeout: 10000 // 10 segundos
};

// Error handling helper
const handleApiError = (error: any): never => {
  console.error('API Error:', error);
  if (error.response) {
    throw new Error(`API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
  } else if (error.request) {
    throw new Error('Network error: No response received from server');
  } else {
    throw new Error(`Request error: ${error.message}`);
  }
};

// Generic fetch function for API requests with authentication
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  // Get auth headers if available
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
    console.log('Fetching:', url);
    
    // Usar fetch con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle auth errors
    if (response.status === 401) {
      // Token expired or invalid
      throw new Error('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { 
        response: { 
          status: response.status, 
          data: errorData 
        }
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en fetch:', error);
    return handleApiError(error);
  }
}

// API methods for Cliente
export const clienteApi = {
  getClientes: async (): Promise<PaginatedResponse<Cliente>> => {
    return fetchApi<PaginatedResponse<Cliente>>(`/clientes`);
  },

  getCliente: async (id: number): Promise<Cliente> => {
    return fetchApi<Cliente>(`/clientes/${id}`);
  },

  createCliente: async (cliente: Omit<Cliente, 'id' | 'created_at' | 'saldo_pendiente'>): Promise<Cliente> => {
    return fetchApi<Cliente>('/clientes', {
      method: 'POST',
      body: JSON.stringify(cliente),
    });
  },

  updateCliente: async (id: number, cliente: Partial<Cliente>): Promise<Cliente> => {
    return fetchApi<Cliente>(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cliente),
    });
  },

  deleteCliente: async (id: number): Promise<any> => {
    return fetchApi<any>(`/clientes/${id}`, {
      method: 'DELETE',
    });
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