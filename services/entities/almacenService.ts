// services/entities/almacenService.ts
import { apiClient } from '../core/apiClient';
import { ApiResponse } from '../core/types';
import { Almacen, AlmacenSimple } from '@/models';

export const almacenService = {
  getAlmacenes: async (page = 1, perPage = 10): Promise<ApiResponse<Almacen>> => {
    return apiClient.get<ApiResponse<Almacen>>('/almacenes', { 
      page: page.toString(), 
      per_page: perPage.toString() 
    });
  },

  getAlmacenesSimple: async (): Promise<AlmacenSimple[]> => {
    try {
      const response = await apiClient.get<ApiResponse<AlmacenSimple>>('/almacenes', { 
        per_page: '100' 
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener almacenes:', error);
      return [];
    }
  },

  getAlmacen: async (id: number): Promise<Almacen> => {
    return apiClient.get<Almacen>(`/almacenes/${id}`);
  },

  createAlmacen: async (almacen: Partial<Almacen>): Promise<Almacen> => {
    return apiClient.post<Almacen>('/almacenes', almacen);
  },

  updateAlmacen: async (id: number, almacen: Partial<Almacen>): Promise<Almacen> => {
    return apiClient.put<Almacen>(`/almacenes/${id}`, almacen);
  },

  deleteAlmacen: async (id: number): Promise<any> => {
    return apiClient.delete<any>(`/almacenes/${id}`);
  },
};