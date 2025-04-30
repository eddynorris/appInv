import { API_CONFIG, fetchApi, ApiResponse } from './api';
import { Venta, VentaDetalle, Pago, ClienteSimple, AlmacenSimple, Presentacion } from '@/models';

// Interfaz para la respuesta de /ventas/form-data
interface VentaFormData {
  clientes: ClienteSimple[];
  almacenes: AlmacenSimple[];
  // Presentaciones con stock específico para el almacén (si se proporcionó ID)
  presentaciones?: Presentacion[]; 
  // Presentaciones con detalle de stock global (si NO se proporcionó ID)
  presentaciones_con_stock_global?: Presentacion[]; 
  // Añadir la nueva propiedad opcional para stock local
  presentaciones_con_stock_local?: Presentacion[]; 
}

// --- NUEVA INTERFAZ para datos de creación ---
interface CreateVentaPayload {
  cliente_id: number;
  almacen_id: number;
  fecha: string; // Formato ISO 8601 con Z
  tipo_pago: 'contado' | 'credito';
  consumo_diario_kg?: string;
  detalles: {
    presentacion_id: number;
    cantidad: number;
    precio_unitario: string; // Asegurar que sea string si la API lo espera así
  }[];
}
// --- FIN NUEVA INTERFAZ ---

export const ventaApi = {
  // Obtener lista paginada de ventas
  async getVentas(page = 1, perPage = 10, filters?: Record<string, any>): Promise<ApiResponse<Venta>> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });
    }
    // Pasar solo el endpoint relativo a fetchApi
    return await fetchApi<ApiResponse<Venta>>(`/ventas?${params.toString()}`);
  },

  // Obtener una venta específica por ID
  async getVenta(id: number): Promise<Venta> {
    // Pasar solo el endpoint relativo a fetchApi
    return await fetchApi<Venta>(`/ventas/${id}`);
  },
  
  // Obtener datos necesarios para el formulario de ventas
  async getFormData(almacenId?: number): Promise<VentaFormData> {
    // CORREGIDO: Construir solo el endpoint relativo
    const endpoint = almacenId
      ? `/ventas/form-data?almacen_id=${almacenId}`
      : `/ventas/form-data`;

    console.log(`ventaApi: Fetching endpoint: ${endpoint}`);

    // Pasar solo el endpoint relativo a fetchApi
    return fetchApi<VentaFormData>(endpoint, { method: 'GET' });
  },

  // Crear una nueva venta
  async createVenta(ventaData: CreateVentaPayload): Promise<Venta> {
    console.log("Enviando para crear venta:", JSON.stringify(ventaData, null, 2));
    // Pasar solo el endpoint relativo a fetchApi
    return await fetchApi<Venta>('/ventas', {
      method: 'POST',
      body: JSON.stringify(ventaData),
    });
  },

  // Actualizar una venta existente
  async updateVenta(id: number, ventaData: Partial<Venta>): Promise<Venta> {
    console.log(`Enviando para actualizar venta ${id}:`, JSON.stringify(ventaData, null, 2));
    // Pasar solo el endpoint relativo a fetchApi
    return await fetchApi<Venta>(`/ventas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ventaData),
    });
  },

  // Eliminar una venta
  async deleteVenta(id: number): Promise<void> {
    // Pasar solo el endpoint relativo a fetchApi
    await fetchApi<void>(`/ventas/${id}`, {
      method: 'DELETE',
    });
  },
}; 