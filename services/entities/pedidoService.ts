// services/entities/pedidoService.ts
import { API_CONFIG, fetchApi } from '../core/apiClient';
import { ApiResponse } from '../core/types';
import { Pedido, ClienteSimple, AlmacenSimple, Presentacion } from '@/models';

// Interfaz para la respuesta de /pedidos/form-data según la estructura real del API
export interface PedidoFormData {
  clientes: ClienteSimple[];
  almacenes: AlmacenSimple[];
  presentaciones: Presentacion[];
}

// Normalized interface for use in hooks (same as the direct response)
export interface NormalizedPedidoFormData {
  clientes: ClienteSimple[];
  almacenes: AlmacenSimple[];
  presentaciones: Presentacion[];
}

export const pedidoService = {
  getPedidos: async (page = 1, perPage = 10, filters = {}): Promise<ApiResponse<Pedido>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    // Add filters if they exist
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return await fetchApi<ApiResponse<Pedido>>(`/pedidos?${params.toString()}`);
  },

  getPedido: async (id: number): Promise<Pedido> => {
    return await fetchApi<Pedido>(`/pedidos/${id}`);
  },

  createPedido: async (pedido: {
    cliente_id: number;
    almacen_id: number;
    fecha_entrega: string;
    estado: string;
    notas?: string;
    detalles: Array<{
      presentacion_id: number;
      cantidad: number;
      precio_estimado: number;
    }>;
  }): Promise<Pedido> => {
    try {
      return await fetchApi<Pedido>('/pedidos', {
        method: 'POST',
        body: JSON.stringify(pedido),
      });
    } catch (error) {
      console.error('Error en createPedido:', error);
      throw error;
    }
  },

  updatePedido: async (id: number, pedido: Partial<Pedido>): Promise<Pedido> => {
    try {
      return await fetchApi<Pedido>(`/pedidos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(pedido),
      });
    } catch (error) {
      console.error('Error en updatePedido:', error);
      throw error;
    }
  },

  deletePedido: async (id: number): Promise<any> => {
    try {
      return await fetchApi<any>(`/pedidos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error en deletePedido:', error);
      throw error;
    }
  },

  // Obtener datos necesarios para el formulario de pedidos
  getFormData: async (): Promise<NormalizedPedidoFormData> => {
    // Construir endpoint igual que en ventas
    const endpoint = `/pedidos/form-data`;

    // Usar fetchApi como en ventas
    return await fetchApi<PedidoFormData>(endpoint, { method: 'GET' });
  },

  convertirAVenta: async (pedidoId: number): Promise<{ venta: any }> => {
    try {
      return await fetchApi<{ venta: any }>(`/pedidos/${pedidoId}/convertir-a-venta`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error en convertirAVenta:', error);
      throw error;
    }
  },
};