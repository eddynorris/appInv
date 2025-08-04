// services/entities/productoService.ts
import { apiClient } from '../core/apiClient';
import { ApiResponse } from '../core/types';
import { Producto, ProductoSimple } from '@/models';

export const productoService = {
  getProductos: async (page = 1, perPage = 10): Promise<ApiResponse<Producto>> => {
    return apiClient.get<ApiResponse<Producto>>('/productos', { 
      page: page.toString(), 
      per_page: perPage.toString() 
    });
  },

  getProductosSimple: async (): Promise<ProductoSimple[]> => {
    try {
      const response = await apiClient.get<ApiResponse<ProductoSimple>>('/productos', { 
        per_page: '100' 
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return [];
    }
  },

  getProducto: async (id: number): Promise<Producto> => {
    return apiClient.get<Producto>(`/productos/${id}`);
  },

  createProducto: async (producto: Partial<Producto>): Promise<Producto> => {
    return apiClient.post<Producto>('/productos', producto);
  },

  updateProducto: async (id: number, producto: Partial<Producto>): Promise<Producto> => {
    return apiClient.put<Producto>(`/productos/${id}`, producto);
  },

  deleteProducto: async (id: number): Promise<any> => {
    return apiClient.delete<any>(`/productos/${id}`);
  },
};