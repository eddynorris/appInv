// services/entities/gastoService.ts
import { apiClient } from '../core/apiClient';
import { ApiResponse } from '../core/types';
import { Gasto } from '@/models';

export const gastoService = {
  getGastos: async (page = 1, perPage = 10, filters = {}): Promise<ApiResponse<Gasto>> => {
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
    
    return apiClient.get<ApiResponse<Gasto>>('/gastos', queryParams);
  },

  getGasto: async (id: number): Promise<Gasto> => {
    return apiClient.get<Gasto>(`/gastos/${id}`);
  },

  createGasto: async (gasto: Partial<Gasto>): Promise<Gasto> => {
    return apiClient.post<Gasto>('/gastos', gasto);
  },

  updateGasto: async (id: number, gasto: Partial<Gasto>): Promise<Gasto> => {
    return apiClient.put<Gasto>(`/gastos/${id}`, gasto);
  },

  deleteGasto: async (id: number): Promise<any> => {
    return apiClient.delete<any>(`/gastos/${id}`);
  },
};