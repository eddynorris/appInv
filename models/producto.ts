// Define el modelo Producto basado en el esquema de la API
export interface Producto {
    id: number;
    nombre: string;
    descripcion?: string;
    precio_compra: string; // Decimal como string
    activo: boolean;
    created_at: string;
  }
  
  // Versión simplificada para relaciones anidadas
  export interface ProductoSimple {
    id: number;
    nombre: string;
  }