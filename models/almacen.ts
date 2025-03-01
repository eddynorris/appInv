// Define el modelo Almacen basado en el esquema de la API
export interface Almacen {
    id: number;
    nombre: string;
    direccion?: string;
    ciudad?: string;
  }
  
  // Versión simplificada para relaciones anidadas
  export interface AlmacenSimple {
    id: number;
    nombre: string;
  }