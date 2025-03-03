// services/api.ts - Corregido para la estructura de respuesta específica
import { Platform } from 'react-native';
import { 
  Cliente, 
  Producto,
  Proveedor,
  Almacen,
  Gasto,
  Movimiento,
  Venta
} from '@/models';
import { authService } from './auth';

// Interfaces para la estructura de respuesta de la API
export interface Pagination {
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ApiResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Base URL configuration
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://192.168.1.37:5000'; // Usar IP para Android
  }
  return 'http://localhost:5000'; // Para iOS y web
};

const API_CONFIG = {
  baseUrl: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000 // 15 segundos timeout
};

// Simplified error handling
const handleApiError = (error: any): never => {
  let message = 'Error en la solicitud';
  
  if (error.response) {
    if (error.response.status === 401) {
      message = 'Sesión expirada, por favor inicie sesión nuevamente';
    } else {
      message = `Error del servidor (${error.response.status}): ${error.response.data?.message || ''}`;
    }
  } else if (error.request) {
    message = 'Error de red: No se pudo conectar al servidor';
  } else if (error.message) {
    message = error.message;
  }
  
  throw new Error(message);
};

// Función fetch simplificada
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const authHeaders = await authService.getAuthHeader();
    
    const response = await fetch(url, {
      headers: {
        ...API_CONFIG.headers,
        ...(authHeaders || {}),
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { response: { status: response.status, data: errorData } };
    }
    
    // Manejar respuestas vacías
    const text = await response.text();
    if (!text.trim()) {
      return {} as T;
    }
    
    return JSON.parse(text) as T;
  } catch (error) {
    return handleApiError(error);
  }
}

// API methods for Cliente
export const clienteApi = {
  getClientes: async (page = 1, perPage = 10): Promise<ApiResponse<Cliente>> => {
    return fetchApi<ApiResponse<Cliente>>(`/clientes?page=${page}&per_page=${perPage}`);
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

// API methods for Producto (similar structure)
export const productoApi = {
  getProductos: async (page = 1, perPage = 10): Promise<ApiResponse<Producto>> => {
    return fetchApi<ApiResponse<Producto>>(`/productos?page=${page}&per_page=${perPage}`);
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

// Similar methods for other entities
export const proveedorApi = {
  getProveedores: async (page = 1, perPage = 10): Promise<ApiResponse<Proveedor>> => {
    return fetchApi<ApiResponse<Proveedor>>(`/proveedores?page=${page}&per_page=${perPage}`);
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

export const almacenApi = {
  getAlmacenes: async (page = 1, perPage = 10): Promise<ApiResponse<Almacen>> => {
    return fetchApi<ApiResponse<Almacen>>(`/almacenes?page=${page}&per_page=${perPage}`);
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

export const gastoApi = {
  getGastos: async (page = 1, perPage = 10): Promise<ApiResponse<Gasto>> => {
    return fetchApi<ApiResponse<Gasto>>(`/gastos?page=${page}&per_page=${perPage}`);
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

export const ventaApi = {
  getVentas: async (page = 1, perPage = 10): Promise<ApiResponse<Venta>> => {
    return fetchApi<ApiResponse<Venta>>(`/ventas?page=${page}&per_page=${perPage}`);
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