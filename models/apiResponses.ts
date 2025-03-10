// Interfaces para respuestas de la API

// Para respuestas paginadas
export interface PaginatedResponse<T> {
    total: number;
    pagina: number;
    por_pagina: number;
    total_paginas: number;
    data: T[];
  }
  
  // Para respuestas simples (usado en algunas APIs)
  export interface SimpleResponse<T> {
    data: T;
    message?: string;
    success?: boolean;
  }

/* ver si esto funciona 
models/apiResponses.ts
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
*/