// services/entities/clienteService.ts
import { apiClient } from '../core/apiClient';
import { ApiResponse } from '../core/types';
import { Cliente } from '@/models';

export const clienteService = {
  getClientes: async (page = 1, perPage = 10, filters = {}): Promise<ApiResponse<Cliente>> => {
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
    
    return apiClient.get<ApiResponse<Cliente>>('/clientes', queryParams);
  },

  getCliente: async (id: number): Promise<Cliente> => {
    return apiClient.get<Cliente>(`/clientes/${id}`);
  },

  createCliente: async (cliente: Partial<Cliente>): Promise<Cliente> => {
    return apiClient.post<Cliente>('/clientes', cliente);
  },

  updateCliente: async (id: number, cliente: Partial<Cliente>): Promise<Cliente> => {
    return apiClient.put<Cliente>(`/clientes/${id}`, cliente);
  },

  deleteCliente: async (id: number): Promise<any> => {
    return apiClient.delete<any>(`/clientes/${id}`);
  },
};