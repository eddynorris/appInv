// services/core/types.ts - Common API types and interfaces

// Pagination interface
export interface Pagination {
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Generic API response structure
export interface ApiResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Dashboard specific response
export interface DashboardDataResponse {
  alertas_stock_bajo: any[]; // Will be properly typed later
  alertas_lotes_bajos: any[]; // Will be properly typed later
  clientes_con_saldo_pendiente: any[]; // Will be properly typed later
}

// HTTP Error interface
export interface HttpError extends Error {
  response?: {
    status: number;
    data: any;
  };
}

// Common API configuration
export interface ApiConfig {
  baseUrl: string;
  headers: Record<string, string>;
  timeout: number;
  getImageUrl: (path?: string | null) => string;
  isValidImageUrl: (url: string | undefined | null) => boolean;
}