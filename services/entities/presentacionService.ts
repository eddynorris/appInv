// services/entities/presentacionService.ts
import { apiClient } from '../core/apiClient';
import { ApiResponse } from '../core/types';
import { Presentacion } from '@/models';

export const presentacionService = {
  getPresentaciones: async (page = 1, perPage = 10, almacenId?: number, includeAllStock = false): Promise<ApiResponse<Presentacion>> => {
    const queryParams: Record<string, any> = {
      page: page.toString(),
      per_page: perPage.toString()
    };
    
    if (almacenId) {
      queryParams.almacen_id = almacenId.toString();
    }
    
    // Add parameter to request stock data for all warehouses
    if (includeAllStock) {
      queryParams.include_all_stock = 'true';
    }
    
    return apiClient.get<ApiResponse<Presentacion>>('/presentaciones', queryParams);
  },

  getPresentacion: async (id: number): Promise<Presentacion> => {
    return apiClient.get<Presentacion>(`/presentaciones/${id}`);
  },

  createPresentacion: async (presentacion: Partial<Presentacion>): Promise<Presentacion> => {
    return apiClient.post<Presentacion>('/presentaciones', presentacion);
  },

  updatePresentacion: async (id: number, presentacion: Partial<Presentacion>): Promise<Presentacion> => {
    return apiClient.put<Presentacion>(`/presentaciones/${id}`, presentacion);
  },

  deletePresentacion: async (id: number): Promise<any> => {
    return apiClient.delete<any>(`/presentaciones/${id}`);
  },
};