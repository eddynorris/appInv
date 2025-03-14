// services/api.ts
import { Platform } from 'react-native';
import { 
  Cliente, 
  Producto,
  Proveedor,
  Almacen,
  Gasto,
  Movimiento,
  Venta,
  VentaDetalle
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

export const API_CONFIG = {
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
    
    // Verificar si se está enviando FormData
    const isFormData = options.body instanceof FormData;
    
    // No incluir Content-Type para FormData, deja que el navegador lo establezca
    const headers = {
      ...(!isFormData ? API_CONFIG.headers : { 'Accept': 'application/json' }),
      ...(authHeaders || {}),
      ...(options.headers || {}),
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
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

  createCliente: async (cliente: Partial<Cliente>): Promise<Cliente> => {
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
  getProductos: async (page = 1, perPage = 10): Promise<ApiResponse<Producto>> => {
    return fetchApi<ApiResponse<Producto>>(`/productos?page=${page}&per_page=${perPage}`);
  },

  getProducto: async (id: number): Promise<Producto> => {
    return fetchApi<Producto>(`/productos/${id}`);
  },

  createProducto: async (producto: Partial<Producto>): Promise<Producto> => {
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
  getProveedores: async (page = 1, perPage = 10): Promise<ApiResponse<Proveedor>> => {
    return fetchApi<ApiResponse<Proveedor>>(`/proveedores?page=${page}&per_page=${perPage}`);
  },
  
  getProveedor: async (id: number): Promise<Proveedor> => {
    return fetchApi<Proveedor>(`/proveedores/${id}`);
  },

  createProveedor: async (proveedor: Partial<Proveedor>): Promise<Proveedor> => {
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
  getAlmacenes: async (page = 1, perPage = 10): Promise<ApiResponse<Almacen>> => {
    return fetchApi<ApiResponse<Almacen>>(`/almacenes?page=${page}&per_page=${perPage}`);
  },
  
  getAlmacen: async (id: number): Promise<Almacen> => {
    return fetchApi<Almacen>(`/almacenes/${id}`);
  },

  createAlmacen: async (almacen: Partial<Almacen>): Promise<Almacen> => {
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
  getGastos: async (page = 1, perPage = 10): Promise<ApiResponse<Gasto>> => {
    return fetchApi<ApiResponse<Gasto>>(`/gastos?page=${page}&per_page=${perPage}`);
  },
  
  getGasto: async (id: number): Promise<Gasto> => {
    return fetchApi<Gasto>(`/gastos/${id}`);
  },

  createGasto: async (gasto: Partial<Gasto>): Promise<Gasto> => {
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

// API methods for Venta
export const ventaApi = {
  getVentas: async (page = 1, perPage = 10): Promise<ApiResponse<Venta>> => {
    return fetchApi<ApiResponse<Venta>>(`/ventas?page=${page}&per_page=${perPage}`);
  },
  
  getVenta: async (id: number): Promise<Venta> => {
    return fetchApi<Venta>(`/ventas/${id}`);
  },

  createVenta: async (venta: {
    cliente_id: number;
    almacen_id: number;
    fecha?: string;
    tipo_pago: string;
    consumo_diario_kg?: string;
    detalles: {
      presentacion_id: number;
      cantidad: number;
    }[];
  }): Promise<Venta> => {
    return fetchApi<Venta>('/ventas', {
      method: 'POST',
      body: JSON.stringify(venta),
    });
  },

  updateVenta: async (id: number, venta: Partial<Venta>): Promise<Venta> => {
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

// API methods for Inventario
export const inventarioApi = {
  getInventarios: async (page = 1, perPage = 10, almacenId?: number): Promise<ApiResponse<any>> => {
    let endpoint = `/inventarios?page=${page}&per_page=${perPage}`;
    if (almacenId) {
      endpoint += `&almacen_id=${almacenId}`;
    }
    return fetchApi<ApiResponse<any>>(endpoint);
  },
  
  getInventario: async (id: number): Promise<any> => {
    return fetchApi<any>(`/inventarios/${id}`);
  },

  createInventario: async (inventario: any): Promise<any> => {
    return fetchApi<any>('/inventarios', {
      method: 'POST',
      body: JSON.stringify(inventario),
    });
  },

  updateInventario: async (id: number, inventario: any): Promise<any> => {
    return fetchApi<any>(`/inventarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(inventario),
    });
  },

  deleteInventario: async (id: number): Promise<any> => {
    return fetchApi<any>(`/inventarios/${id}`, {
      method: 'DELETE',
    });
  },
};

// API methods for Presentaciones
export const presentacionApi = {
  
  getPresentaciones: async (page = 1, perPage = 10, productoId?: number): Promise<ApiResponse<any>> => {
    let endpoint = `/presentaciones?page=${page}&per_page=${perPage}`;
    if (productoId) {
      endpoint += `&producto_id=${productoId}`;
    }
    return fetchApi<ApiResponse<any>>(endpoint);
  },
  
  getPresentacion: async (id: number): Promise<any> => {
    return fetchApi<any>(`/presentaciones/${id}`);
  },

  createPresentacion: async (presentacion: any): Promise<any> => {
    return fetchApi<any>('/presentaciones', {
      method: 'POST',
      body: JSON.stringify(presentacion),
    });
  },

  updatePresentacion: async (id: number, presentacion: any): Promise<any> => {
    return fetchApi<any>(`/presentaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(presentacion),
    });
  },

  deletePresentacion: async (id: number): Promise<any> => {
    return fetchApi<any>(`/presentaciones/${id}`, {
      method: 'DELETE',
    });
  },
  createPresentacionWithImage: async (presentacion: any, imageUri: string | null): Promise<any> => {
    // Si no hay imagen, usar el método regular
    if (!imageUri) {
      return presentacionApi.createPresentacion(presentacion);
    }
  
    // Crear un FormData para enviar archivos
    const formData = new FormData();
    
    // Agregar todos los campos de la presentación
    Object.keys(presentacion).forEach(key => {
      formData.append(key, presentacion[key]);
    });
    
    // Agregar el archivo de imagen
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // @ts-ignore - FormData espera un tipo específico que TypeScript no reconoce bien en React Native
    formData.append('foto', {
      uri: imageUri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`
    });
    
    return fetchApi<any>('/presentaciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        // Eliminar contentType existente para que el navegador establezca el boundary correcto
        'Accept': 'application/json'
      },
      body: formData as any,
    });
  },

  updatePresentacionWithImage: async (id: number, presentacion: any, imageUri: string | null): Promise<any> => {
    // Si no hay imagen, usar el método regular
    if (!imageUri) {
      return presentacionApi.updatePresentacion(id, presentacion);
    }
  
    // Crear un FormData para enviar archivos
    const formData = new FormData();
    
    // Agregar todos los campos de la presentación
    Object.keys(presentacion).forEach(key => {
      formData.append(key, presentacion[key]);
    });
    
    // Agregar el archivo de imagen
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // @ts-ignore
    formData.append('foto', {
      uri: imageUri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`
    });
    
    return fetchApi<any>(`/presentaciones/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      },
      body: formData as any,
    });
  }
};

// API methods for Pagos
export const pagoApi = {
  getPagos: async (page = 1, perPage = 10, ventaId?: number): Promise<ApiResponse<any>> => {
    let endpoint = `/pagos?page=${page}&per_page=${perPage}`;
    if (ventaId) {
      endpoint += `&venta_id=${ventaId}`;
    }
    return fetchApi<ApiResponse<any>>(endpoint);
  },
  
  getPago: async (id: number): Promise<any> => {
    return fetchApi<any>(`/pagos/${id}`);
  },

  createPago: async (pago: any): Promise<any> => {
    return fetchApi<any>('/pagos', {
      method: 'POST',
      body: JSON.stringify(pago),
    });
  },

  updatePago: async (id: number, pago: any): Promise<any> => {
    return fetchApi<any>(`/pagos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pago),
    });
  },

  deletePago: async (id: number): Promise<any> => {
    return fetchApi<any>(`/pagos/${id}`, {
      method: 'DELETE',
    });
  },
  createPagoWithComprobante: async (pago: any, comprobanteUri: string | null): Promise<any> => {
    // Si no hay comprobante, usar el método regular
    if (!comprobanteUri) {
      return pagoApi.createPago(pago);
    }
  
    // Crear un FormData para enviar archivos
    const formData = new FormData();
    
    // Agregar todos los campos del pago
    Object.keys(pago).forEach(key => {
      formData.append(key, pago[key]);
    });
    
    // Agregar el archivo de comprobante
    const uriParts = comprobanteUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // @ts-ignore
    formData.append('comprobante', {
      uri: comprobanteUri,
      name: `comprobante.${fileType}`,
      type: fileType === 'pdf' ? 'application/pdf' : `image/${fileType}`
    });
    
    return fetchApi<any>('/pagos', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      },
      body: formData as any,
    });
  },
  
  updatePagoWithComprobante: async (id: number, pago: any, comprobanteUri: string | null): Promise<any> => {
    // Si no hay comprobante, usar el método regular
    if (!comprobanteUri) {
      return pagoApi.updatePago(id, pago);
    }
  
    // Crear un FormData para enviar archivos
    const formData = new FormData();
    
    // Agregar todos los campos del pago
    Object.keys(pago).forEach(key => {
      formData.append(key, pago[key]);
    });
    
    // Agregar el archivo de comprobante
    const uriParts = comprobanteUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // @ts-ignore
    formData.append('comprobante', {
      uri: comprobanteUri,
      name: `comprobante.${fileType}`,
      type: fileType === 'pdf' ? 'application/pdf' : `image/${fileType}`
    });
    
    return fetchApi<any>(`/pagos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      },
      body: formData as any,
    });
  }
};