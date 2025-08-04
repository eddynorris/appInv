// services/entities/pagoService.ts
import { apiClient } from '../core/apiClient';
import { ApiResponse } from '../core/types';
import { Pago } from '@/models';

export const pagoService = {
  getPagos: async (page = 1, perPage = 10, filters = {}): Promise<ApiResponse<Pago>> => {
    const queryParams: Record<string, any> = {
      page: page.toString(),
      per_page: perPage.toString()
    };
    
    // Add filters if they exist
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = value.toString();
      }
    });
    
    return apiClient.get<ApiResponse<Pago>>('/pagos', queryParams);
  },

  getPago: async (id: number): Promise<Pago> => {
    return apiClient.get<Pago>(`/pagos/${id}`);
  },

  getPagosByVenta: async (ventaId: number): Promise<Pago[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Pago>>('/pagos', { 
        venta_id: ventaId.toString() 
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener pagos por venta:', error);
      return [];
    }
  },

  createPago: async (pago: Partial<Pago>): Promise<Pago> => {
    return apiClient.post<Pago>('/pagos', pago);
  },

  createPagosBatch: async (pagos: Partial<Pago>[]): Promise<Pago[]> => {
    return apiClient.post<Pago[]>('/pagos/batch', { pagos });
  },

  updatePago: async (id: number, pago: Partial<Pago>): Promise<Pago> => {
    return apiClient.put<Pago>(`/pagos/${id}`, pago);
  },

  deletePago: async (id: number): Promise<any> => {
    return apiClient.delete<any>(`/pagos/${id}`);
  },

  createPagoWithComprobante: async (pagoData: FormData): Promise<Pago> => {
    return apiClient.post<Pago>('/pagos/with-comprobante', pagoData);
  },

  updatePagoWithComprobante: async (id: number, pagoData: FormData): Promise<Pago> => {
    return apiClient.put<Pago>(`/pagos/${id}/with-comprobante`, pagoData);
  },

  createPagosBatchWithFormData: async (formData: FormData): Promise<Pago[]> => {
    return apiClient.post<Pago[]>('/pagos/batch', formData);
  },
};