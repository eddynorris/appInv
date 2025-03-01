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