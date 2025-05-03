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
  VentaDetalle,
  Pedido,
  PedidoDetalle,
  Pago,
  Lote,
  ProductoSimple,
  ProveedorSimple,
  ClienteSimple,
  AlmacenSimple,
  Presentacion,
  User,
  Inventario
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
  // Usar la variable de entorno si está definida
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (apiUrl) {
    console.log(`Usando API URL desde variable de entorno: ${apiUrl}`);
    // Asegurarse que no termine con /
    return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  }

  // Fallback si la variable de entorno no está definida (menos ideal)
  const fallbackUrl = 'https://manngojk.lat'; // Incluye http:// y sin / al final
  console.warn(`EXPO_PUBLIC_API_URL no está definida. Usando fallback: ${fallbackUrl}`);
  return fallbackUrl;
};

export const API_CONFIG = {
  baseUrl: getBaseUrl(), // Llama a la función corregida
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 segundos timeout

  // --- FUNCIÓN getImageUrl SIMPLIFICADA ---
  getImageUrl: (path?: string | null): string => {
    // Si el path es nulo, indefinido, o una cadena vacía, devuelve vacío.
    if (!path) {
      // console.log('No se proporcionó ruta de imagen o es inválida.');
      return ''; // O devuelve una URL a una imagen placeholder si prefieres
    }

    // Si la API devuelve una URL absoluta (como la pre-firmada de S3), úsala directamente.
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // console.log('Usando URL absoluta (pre-firmada o pública):', path);
      return path;
    }
    // Si llega aquí, el 'path' no es una URL válida que la app pueda usar.
    // Esto no debería pasar si la API siempre devuelve None o una URL pre-firmada.
    console.warn('getImageUrl recibió una ruta inesperada (no es URL absoluta):', path);
    return ''; // O devuelve una URL placeholder
  },

  // --- FUNCIÓN isValidImageUrl SIMPLIFICADA ---
  isValidImageUrl: (url: string | undefined | null): boolean => {
    if (!url) return false;
    // Una URL válida ahora es simplemente una que empieza con http o https
    return url.startsWith('http://') || url.startsWith('https://');
  }
};

// Define una interfaz para errores HTTP estructurados (buena práctica)
interface HttpError extends Error {
  response?: {
    status: number;
    data: any; // El cuerpo de la respuesta parseado
  };
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  console.log(`API request: ${options.method || 'GET'} ${url}`);
  
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
      console.log('API response: 204 No Content');
      return null as T;
    }
    
    // Leer el cuerpo de la respuesta UNA SOLA VEZ
    let responseData: any;
    try {
      // Obtener el texto de la respuesta primero
      const responseText = await response.text();
      
      // Si hay contenido, intentar parsearlo como JSON
      if (responseText.trim()) {
        try {
          responseData = JSON.parse(responseText);
        } catch (jsonError) {
          // Si no es JSON válido, usar el texto en bruto
          responseData = responseText;
          console.warn("API response was not valid JSON:", responseText);
        }
      } else {
        // Respuesta vacía
        console.log('API response: Empty response');
        responseData = {};
      }
    } catch (readError : any) {
      responseData = `Error reading response: ${readError.message}`;
    }

    if (!response.ok) {
      // La respuesta NO fue exitosa (>= 400)
      console.error(`API error: ${response.status}`, responseData);

      // Crear un error que incluya la respuesta
      const error: HttpError = new Error(
        responseData?.error || responseData?.message || `Error HTTP: ${response.status}`
      );
      error.response = {
        status: response.status,
        data: responseData,
      };
      throw error;
    }
    
    console.log('API response success:', typeof responseData === 'object' ? 'Object data' : responseData);
    return responseData as T;
  } catch (error: any) {
    console.error('API fetch error:', error);
    if (error.response) {
      throw error;
    }
    throw new Error(error.message || 'Network error');
  }
}

// API methods for Cliente
export const clienteApi = {
  getClientes: async (page = 1, perPage = 10, filters = {}): Promise<ApiResponse<Cliente>> => {
    // Construir query string con los filtros
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    // Añadir filtros si existen
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    console.log(`Consultando clientes con parámetros: ${queryString}`);
    
    return fetchApi<ApiResponse<Cliente>>(`/clientes?${queryString}`);
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
  getAlmacenes: async (page = 1, perPage = 100): Promise<ApiResponse<Almacen>> => {
    try {
      const response = await fetchApi<ApiResponse<Almacen>>(`/almacenes?page=${page}&per_page=${perPage}`);
      
      // Asegurarse de que la respuesta tiene la estructura esperada
      if (!response || !response.data) {
        console.warn('La API de almacenes devolvió un formato inesperado:', response);
        return {
          data: [],
          pagination: {
            total: 0,
            page: 1,
            per_page: perPage, 
            pages: 0
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error al obtener almacenes:', error);
      // Devolver una estructura de datos válida aunque vacía
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          per_page: perPage,
          pages: 0
        }
      };
    }
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
  getGastos: async (page = 1, perPage = 10, filters = {}): Promise<ApiResponse<Gasto>> => {
    // Construir query string con los filtros
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    // Añadir filtros si existen
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    console.log(`Consultando gastos con parámetros: ${queryString}`);
    
    return fetchApi<ApiResponse<Gasto>>(`/gastos?${queryString}`);
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
  getVentas: async (page = 1, perPage = 10, queryParams = ''): Promise<ApiResponse<Venta>> => {
    let url = `/ventas?page=${page}&per_page=${perPage}`;
    
    // Si hay queryParams, agregarlos a la URL
    if (queryParams && queryParams.length > 0) {
      // Si queryParams ya incluye page y per_page, usamos la cadena directamente
      if (queryParams.includes('page=') && queryParams.includes('per_page=')) {
        url = `/ventas?${queryParams}`;
      } else {
        // Si no los incluye, los agregamos manteniendo los demás parámetros
        url = `/ventas?${queryParams}&page=${page}&per_page=${perPage}`;
      }
    }
    
    return fetchApi<ApiResponse<Venta>>(url);
  },

  getVenta: async (id: number): Promise<Venta> => {
    return fetchApi<Venta>(`/ventas/${id}`);
  },
  
  // Método para obtener TODAS las ventas sin paginación
  getAllVentas: async (queryParams = ''): Promise<Venta[]> => {
    let url = `/ventas?all=true`;
    
    // Si hay queryParams, agregarlos a la URL
    if (queryParams && queryParams.length > 0) {
      url = `${url}&${queryParams}`;
    }
    
    return fetchApi<Venta[]>(url);
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
      precio_unitario: string;  // Campo requerido
    }[];
  }): Promise<Venta> => {
    
    return fetchApi<Venta>('/ventas', {
      method: 'POST',
      body: JSON.stringify(venta),
    }).then(response => {
      return response;
    }).catch(error => {
      console.error('Error al crear venta en la API:', error);
      throw error;
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

// Fixed Inventory API methods in services/api.ts
export const inventarioApi = {
  getInventarios: async (page = 1, perPage = 10, filters?: Record<string, any>): Promise<ApiResponse<Inventario>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            // Asegurarse de no añadir page/per_page dos veces si vienen en filters
            if (key !== 'page' && key !== 'per_page' && value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });
    }

    const endpoint = `/inventarios?${params.toString()}`;
    console.log('Fetching inventarios with endpoint:', endpoint);
    // Especificar el tipo de retorno como Inventario
    return fetchApi<ApiResponse<Inventario>>(endpoint);
  },
  
  getInventario: async (id: number): Promise<Inventario> => {
    console.log(`Obteniendo inventario ID: ${id}`);
    return fetchApi<Inventario>(`/inventarios/${id}`);
  },

  createInventario: async (inventario: {
    presentacion_id: number;
    almacen_id: number;
    cantidad: number;
    stock_minimo: number;
    lote_id?: number;
  }): Promise<any> => {
    // Clean the object to ensure no undefined values are sent
    const cleanedData = {
      presentacion_id: inventario.presentacion_id,
      almacen_id: inventario.almacen_id,
      cantidad: inventario.cantidad,
      stock_minimo: inventario.stock_minimo,
      ...(inventario.lote_id ? { lote_id: inventario.lote_id } : {})
    };
    
    return fetchApi<any>('/inventarios', {
      method: 'POST',
      body: JSON.stringify(cleanedData),
    });
  },

  updateInventario: async (id: number, inventario: any): Promise<any> => {
    // Clean the object to ensure no undefined values are sent
    const cleanedData = Object.entries(inventario).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    console.log('Updating inventory with data:', JSON.stringify(cleanedData, null, 2));
    
    return fetchApi<any>(`/inventarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanedData),
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

  getPagos: async (page = 1, perPage = 10, filters = {}): Promise<ApiResponse<Pago>> => {
    // Construir query string con los filtros
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    // Añadir filtros si existen
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    console.log(`Consultando pagos con parámetros: ${queryString}`);
    
    return fetchApi<ApiResponse<Pago>>(`/pagos?${queryString}`);
  },
  
  getPago: async (id: number): Promise<Pago> => {
    return fetchApi<Pago>(`/pagos/${id}`);
  },

// Método para obtener pagos por venta (Usando endpoint dedicado)
getPagosByVenta: async (ventaId: number): Promise<Pago[]> => {
  // Llamar al endpoint específico (Asegúrate que la ruta sea correcta)
  return fetchApi<Pago[]>(`/pagos/venta/${ventaId}`);
},

  createPago: async (pago: {
    venta_id: number;
    monto: string;
    fecha?: string;
    metodo_pago: string;
    referencia?: string;
  }): Promise<Pago> => {
    // Formatear fecha en el formato que espera la API
    let fechaFormateada = null;
    if (pago.fecha) {
      fechaFormateada = `${pago.fecha}T00:00:00Z`;
    }
    
    // Asegurarnos de que el formato es exactamente como espera el backend
    const formattedPago = {
      venta_id: Number(pago.venta_id),
      monto: String(pago.monto).replace(',', '.'),
      metodo_pago: pago.metodo_pago,
      // Solo incluir campos opcionales si tienen valor
      ...(fechaFormateada && { fecha: fechaFormateada }),
      ...(pago.referencia && { referencia: pago.referencia })
    };
    
    console.log('Enviando datos de pago:', JSON.stringify(formattedPago));
    
    return fetchApi<Pago>('/pagos', {
      method: 'POST',
      body: JSON.stringify(formattedPago),
    });
  },

  updatePago: async (id: number, pago: Partial<Pago>): Promise<Pago> => {
    return fetchApi<Pago>(`/pagos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pago),
    });
  },

  deletePago: async (id: number): Promise<any> => {
    return fetchApi<any>(`/pagos/${id}`, {
      method: 'DELETE',
    });
  },

  createPagoWithComprobante: async (pago: Partial<Pago>, comprobanteUri: string): Promise<Pago> => {
    const formData = new FormData();
    
    if (pago.fecha) {
      const fechaFormateada = `${pago.fecha}T00:00:00Z`;
      pago = { ...pago, fecha: fechaFormateada };
    }
    
    // Usar Object.entries para asegurar tipos
    Object.entries(pago).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Asegurar que value es string antes de añadirlo
        formData.append(key, String(value));
      }
    });
    
    console.log('Preparando pago con comprobante para venta_id:', pago.venta_id);
    
    const uriParts = comprobanteUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // @ts-ignore
    formData.append('comprobante', {
      uri: comprobanteUri,
      name: `comprobante.${fileType}`,
      type: fileType === 'pdf' ? 'application/pdf' : `image/${fileType}`
    });
    
    return fetchApi<Pago>('/pagos', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
  },
  
  updatePagoWithComprobante: async (id: number, pago: Partial<Pago>, comprobanteUri: string | null): Promise<Pago> => {
    if (!comprobanteUri) {
      return pagoApi.updatePago(id, pago);
    }
  
    const formData = new FormData();
    
    // Usar Object.entries para asegurar tipos
    Object.entries(pago).forEach(([key, value]) => {
       if (value !== undefined && value !== null) {
        // Asegurar que value es string antes de añadirlo
        formData.append(key, String(value));
      }
    });
    
    const uriParts = comprobanteUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // @ts-ignore
    formData.append('comprobante', {
      uri: comprobanteUri,
      name: `comprobante.${fileType}`,
      type: fileType === 'pdf' ? 'application/pdf' : `image/${fileType}`
    });
    
    return fetchApi<Pago>(`/pagos/${id}`, {
      method: 'PUT',
      headers: {
        // Dejar que el navegador establezca Content-Type para multipart
        'Accept': 'application/json'
      },
      body: formData,
    });
  }
};


// Servicio API de pedidos actualizado
// services/api.ts - Actualización para el método getPedidos en pedidoApi

// Servicio API de pedidos actualizado
export const pedidoApi = {
  getPedidos: async (page = 1, perPage = 10, filters = {}): Promise<ApiResponse<Pedido>> => {
    // Construir query string con los filtros
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    // Añadir filtros si existen
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    console.log(`Consultando pedidos con parámetros: ${queryString}`);
    
    return fetchApi<ApiResponse<Pedido>>(`/pedidos?${queryString}`);
  },
  
  // Resto de métodos del servicio pedidoApi...
  getPedido: async (id: number): Promise<Pedido> => {
    return fetchApi<Pedido>(`/pedidos/${id}`);
  },

  createPedido: async (pedido: {
    cliente_id: number;
    almacen_id: number;
    fecha_entrega: string;
    estado?: string;
    notas?: string;
    detalles: {
      presentacion_id: number;
      cantidad: number;
      precio_estimado?: string;
    }[];
  }): Promise<Pedido> => {
    try {
      // Validar y formatear los datos
      const formattedPedido = {
        cliente_id: parseInt(String(pedido.cliente_id)),
        almacen_id: parseInt(String(pedido.almacen_id)),
        fecha_entrega: pedido.fecha_entrega,
        estado: pedido.estado || 'programado',
        notas: pedido.notas || '',
        detalles: pedido.detalles.map(d => ({
          presentacion_id: parseInt(String(d.presentacion_id)),
          cantidad: parseInt(String(d.cantidad)),
          precio_estimado: d.precio_estimado ? d.precio_estimado : "0.00"
        }))
      };
      
      console.log('Enviando datos formateados de pedido:', JSON.stringify(formattedPedido));
      
      // Enviar la solicitud
      return fetchApi<Pedido>('/pedidos', {
        method: 'POST',
        body: JSON.stringify(formattedPedido),
      });
    } catch (error) {
      console.error('Error en createPedido:', error);
      throw error;
    }
  },

  updatePedido: async (id: number, pedido: Partial<Pedido>): Promise<Pedido> => {
    try {
      console.log('Actualizando pedido ID:', id, 'Datos:', JSON.stringify(pedido));
      
      // Filtrar solo los campos que pueden actualizarse
      const updatableFields = ['cliente_id', 'almacen_id', 'fecha_entrega', 'estado', 'notas'];
      const filteredData: Record<string, any> = {};
      
      // Agregar solo los campos actualizables
      for (const key of Object.keys(pedido)) {
        if (updatableFields.includes(key)) {
          filteredData[key] = pedido[key as keyof Partial<Pedido>];
        }
      }
      
      return fetchApi<Pedido>(`/pedidos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(filteredData),
      });
    } catch (error) {
      console.error('Error en updatePedido:', error);
      throw error;
    }
  },

  deletePedido: async (id: number): Promise<any> => {
    try {
      return fetchApi<any>(`/pedidos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error en deletePedido:', error);
      throw error;
    }
  },
  
  // Método para convertir un pedido en venta
  convertirAVenta: async (id: number): Promise<any> => {
    try {
      console.log('Solicitando conversión del pedido ID:', id);
      
      return fetchApi<any>(`/pedidos/${id}/convertir`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error en convertirAVenta:', error);
      throw error;
    }
  },

  // --- INICIO: Añadir/Asegurar getFormData ---
  /**
   * Obtiene los datos necesarios para el formulario de creación/edición de pedidos.
   * La respuesta varía según el rol del usuario.
   */
  getFormData: async (): Promise<PedidoFormDataResponse> => {
    return await fetchApi<PedidoFormDataResponse>('/pedidos/form-data');
  },
  // --- FIN: Añadir/Asegurar getFormData ---
};

// API methods for Movimientos
export const movimientoApi = {
  getMovimientos: async (page = 1, perPage = 10, filters = {}): Promise<ApiResponse<Movimiento>> => {
    // Construir query string con los filtros
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    // Añadir filtros si existen
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value.toString());
      }
    });
    
    return fetchApi<ApiResponse<Movimiento>>(`/movimientos?${queryParams.toString()}`);
  },
  // ... otras funciones para movimientos
};

// API methods for Lotes
export const loteApi = {
  getLotes: async (page = 1, perPage = 10, filters = {}): Promise<ApiResponse<Lote>> => {
    // Construir query string con los filtros
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    // Añadir filtros si existen
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value.toString());
      }
    });
    
    return fetchApi<ApiResponse<Lote>>(`/lotes?${queryParams.toString()}`);
  },

  getLote: async (id: number): Promise<Lote> => {
    return fetchApi<Lote>(`/lotes/${id}`);
  },

  createLote: async (lote: {
    producto_id: number;
    proveedor_id?: number | null;
    peso_humedo_kg: number;
    peso_seco_kg?: number | null;
    fecha_ingreso: string;
  }): Promise<Lote> => {
    return fetchApi<Lote>('/lotes', {
      method: 'POST',
      body: JSON.stringify(lote),
    });
  },

  updateLote: async (id: number, lote: Partial<Lote>): Promise<Lote> => {
    return fetchApi<Lote>(`/lotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lote),
    });
  },

  deleteLote: async (id: number): Promise<any> => {
    return fetchApi<any>(`/lotes/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Método para obtener lotes disponibles para un producto específico
  getLotesPorProducto: async (productoId: number): Promise<ApiResponse<Lote>> => {
    return fetchApi<ApiResponse<Lote>>(`/lotes?producto_id=${productoId}&disponible=true`);
  },
  
  // Método para actualizar el peso seco de un lote (funcionalidad común)
  actualizarPesoSeco: async (id: number, pesoSeco: number): Promise<Lote> => {
    return fetchApi<Lote>(`/lotes/${id}/peso-seco`, {
      method: 'PATCH',
      body: JSON.stringify({ peso_seco_kg: pesoSeco }),
    });
  },

  // Añadimos estos dos métodos para obtener productos y proveedores
  getProductos: async (): Promise<ProductoSimple[]> => {
    try {
      const response = await fetchApi<ApiResponse<ProductoSimple>>('/productos?per_page=100');
      return response.data;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return [];
    }
  },
  
  getProveedores: async (): Promise<ProveedorSimple[]> => {
    try {
      const response = await fetchApi<ApiResponse<ProveedorSimple>>('/proveedores?per_page=100');
      return response.data;
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      return [];
    }
  },
};

// --- INICIO: Añadir/Asegurar Tipos para /pedidos/form-data ---
// Tipos de respuesta específicos para el nuevo endpoint
interface PedidoFormDataBaseResponse {
  clientes: ClienteSimple[];
}

interface PedidoFormDataAdminResponse extends PedidoFormDataBaseResponse {
  almacenes: AlmacenSimple[];
  // Usar la clave que devuelve tu API para admin (según el ejemplo JSON es presentaciones_con_stock_global)
  presentaciones_con_stock_global: (Presentacion & { stock_por_almacen?: any[] })[];
}

interface PedidoFormDataUserResponse extends PedidoFormDataBaseResponse {
  // Usar la clave que devuelve tu API para no-admin (según el ejemplo JSON es presentaciones_activas)
  presentaciones_activas: Presentacion[];
}

// Tipo unión para la respuesta
export type PedidoFormDataResponse = PedidoFormDataAdminResponse | PedidoFormDataUserResponse;
// --- FIN: Añadir/Asegurar Tipos ---